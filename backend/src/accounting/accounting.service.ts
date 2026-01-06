import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, Like } from 'typeorm';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JournalEntryStatus, JournalEntryType } from './entities/journal-entry.entity';

/**
 * Accounting Service
 * 
 * Core service for double-entry accounting operations.
 * Ensures all accounting entries are balanced (debits = credits).
 * 
 * CRITICAL PRINCIPLE:
 * - Payment operations should NOT directly call this service
 * - Accounting entries are created separately via event handlers or explicit calls
 * - This maintains strict separation between payment handling and accounting
 */
@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLineRepository: Repository<JournalEntryLine>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a journal entry with balanced debit/credit lines
   * Enforces double-entry accounting rules
   */
  async createJournalEntry(
    schoolId: number,
    dto: CreateJournalEntryDto,
    userId?: number,
  ): Promise<JournalEntry> {
    // Validate lines
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Journal entry must have at least 2 lines');
    }

    // Calculate totals
    const totalDebit = dto.lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);

    // Validate balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`,
      );
    }

    // Validate each line has either debit OR credit (not both, not neither)
    for (const line of dto.lines) {
      const hasDebit = Number(line.debitAmount) > 0;
      const hasCredit = Number(line.creditAmount) > 0;

      if (hasDebit && hasCredit) {
        throw new BadRequestException('Line cannot have both debit and credit amounts');
      }
      if (!hasDebit && !hasCredit) {
        throw new BadRequestException('Line must have either debit or credit amount');
      }
    }

    // Validate accounts exist and belong to school
    const accountIds = dto.lines.map(line => line.accountId);
    const accounts = await this.accountRepository.find({
      where: accountIds.map(id => ({ id, schoolId })),
    });

    if (accounts.length !== accountIds.length) {
      throw new BadRequestException('One or more accounts not found or do not belong to school');
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Generate entry number INSIDE the transaction with row locking
    // This prevents race conditions when multiple requests come simultaneously
    const entryNumber = await this.generateEntryNumber(schoolId, queryRunner);

    try {
      // Create journal entry
      const journalEntry = queryRunner.manager.create(JournalEntry, {
        schoolId,
        entryNumber,
        entryDate: new Date(dto.entryDate),
        type: dto.type,
        status: JournalEntryStatus.DRAFT,
        description: dto.description,
        reference: dto.reference,
        referenceId: dto.referenceId,
        totalDebit,
        totalCredit,
        notes: dto.notes,
      });

      const savedEntry = await queryRunner.manager.save(JournalEntry, journalEntry);

      // Create journal entry lines
      const lines = dto.lines.map(line =>
        queryRunner.manager.create(JournalEntryLine, {
          journalEntryId: savedEntry.id,
          accountId: line.accountId,
          debitAmount: Number(line.debitAmount),
          creditAmount: Number(line.creditAmount),
          description: line.description,
        }),
      );

      await queryRunner.manager.save(JournalEntryLine, lines);

      // Post the entry immediately (can be made configurable)
      await this.postJournalEntry(savedEntry.id, userId, queryRunner);

      await queryRunner.commitTransaction();

      // Reload with relations
      return this.journalEntryRepository.findOne({
        where: { id: savedEntry.id },
        relations: ['lines', 'lines.account'],
      }) as Promise<JournalEntry>;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error(`Failed to create journal entry: ${err.message}`, err.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Post a journal entry (change status from DRAFT to POSTED)
   */
  async postJournalEntry(
    entryId: number,
    userId?: number,
    queryRunner?: QueryRunner,
  ): Promise<JournalEntry> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    const entry = await manager.findOne(JournalEntry, {
      where: { id: entryId },
      relations: ['lines'],
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException(`Cannot post entry with status: ${entry.status}`);
    }

    // Validate balance again before posting
    const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Journal entry is not balanced and cannot be posted');
    }

    entry.status = JournalEntryStatus.POSTED;
    entry.postedById = userId;
    entry.postedAt = new Date();

    return manager.save(JournalEntry, entry);
  }

  /**
   * Reverse a posted journal entry
   * Creates a reversing entry with opposite debits/credits
   */
  async reverseJournalEntry(
    entryId: number,
    userId?: number,
    reason?: string,
  ): Promise<JournalEntry> {
    const originalEntry = await this.journalEntryRepository.findOne({
      where: { id: entryId },
      relations: ['lines', 'lines.account'],
    });

    if (!originalEntry) {
      throw new NotFoundException('Journal entry not found');
    }

    if (originalEntry.status !== JournalEntryStatus.POSTED) {
      throw new BadRequestException('Can only reverse posted entries');
    }

    // Create reversing entry
    const reversingLines = originalEntry.lines.map(line => ({
      accountId: line.accountId,
      debitAmount: line.creditAmount, // Swap debit and credit
      creditAmount: line.debitAmount,
      description: line.description ? `Reversal: ${line.description}` : 'Reversal entry',
    }));

    const reversingEntry = await this.createJournalEntry(
      originalEntry.schoolId,
      {
        entryDate: new Date().toISOString(),
        type: originalEntry.type,
        description: reason || `Reversal of ${originalEntry.entryNumber}`,
        reference: originalEntry.entryNumber,
        referenceId: originalEntry.id,
        lines: reversingLines,
        notes: `Reversal of entry ${originalEntry.entryNumber}`,
      },
      userId,
    );

    // Mark original entry as reversed
    originalEntry.status = JournalEntryStatus.REVERSED;
    originalEntry.reversedById = userId;
    originalEntry.reversedAt = new Date();
    originalEntry.reversedEntryId = reversingEntry.id;
    await this.journalEntryRepository.save(originalEntry);

    return reversingEntry;
  }

  /**
   * Generate unique journal entry number (transaction-safe with advisory locking)
   * 
   * CRITICAL: This method uses PostgreSQL advisory locks to prevent race conditions
   * when multiple concurrent requests try to generate entry numbers.
   * 
   * Advisory locks work even when no rows exist (unlike pessimistic_write which needs a row).
   * 
   * Without locking, two simultaneous requests could:
   * 1. Both read last entry as null (first entry of year)
   * 2. Both try to create JE-2026-0001
   * 3. Second one fails with duplicate key error
   * 
   * The advisory lock uses schoolId as the lock key, ensuring only ONE transaction
   * per school can generate an entry number at a time.
   */
  private async generateEntryNumber(schoolId: number, queryRunner?: QueryRunner): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    // 🔒 PostgreSQL Advisory Lock
    // This locks on the schoolId, preventing concurrent entry number generation
    // for the same school, even if no journal entries exist yet.
    // 
    // pg_advisory_xact_lock(key) - automatically released when transaction commits
    // We use schoolId as the lock key (unique per school)
    this.logger.debug(`[Advisory Lock] Acquiring lock for schoolId=${schoolId}`);
    await manager.query('SELECT pg_advisory_xact_lock($1)', [schoolId]);
    this.logger.debug(`[Advisory Lock] Lock acquired for schoolId=${schoolId}`);

    // Now safely read and increment
    const lastEntry = await manager
      .createQueryBuilder(JournalEntry, 'entry')
      .where('entry.schoolId = :schoolId', { schoolId })
      .andWhere('entry.entryNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('entry.entryNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastEntry) {
      const lastSequence = parseInt(lastEntry.entryNumber.split('-')[2] || '0', 10);
      sequence = lastSequence + 1;
      this.logger.debug(`[Entry Number] Last entry: ${lastEntry.entryNumber}, generating: ${prefix}${sequence.toString().padStart(4, '0')}`);
    } else {
      this.logger.debug(`[Entry Number] No previous entries, generating first: ${prefix}${sequence.toString().padStart(4, '0')}`);
    }

    const newEntryNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;
    this.logger.log(`Generated entry number: ${newEntryNumber} for schoolId=${schoolId}`);
    return newEntryNumber;
  }

  /**
   * Get account balance
   * Calculates current balance from all journal entry lines
   */
  async getAccountBalance(
    accountId: number,
    asOfDate?: Date,
  ): Promise<{ debit: number; credit: number; balance: number }> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const queryBuilder = this.journalEntryLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.journalEntry', 'entry')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED });

    if (asOfDate) {
      queryBuilder.andWhere('entry.entryDate <= :asOfDate', { asOfDate });
    }

    const result = await queryBuilder
      .select('SUM(line.debitAmount)', 'totalDebit')
      .addSelect('SUM(line.creditAmount)', 'totalCredit')
      .getRawOne();

    const debit = parseFloat(result?.totalDebit || '0');
    const credit = parseFloat(result?.totalCredit || '0');
    const openingBalance = Number(account.openingBalance || 0);

    // Calculate balance based on account type
    let balance = 0;
    if (account.type === 'asset' || account.type === 'expense') {
      // Assets and expenses: Debit increases, Credit decreases
      balance = openingBalance + debit - credit;
    } else {
      // Liabilities, equity, income: Credit increases, Debit decreases
      balance = openingBalance + credit - debit;
    }

    return { debit, credit, balance };
  }

  /**
   * Get ledger for an account
   */
  async getAccountLedger(
    accountId: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<JournalEntryLine[]> {
    const queryBuilder = this.journalEntryLineRepository
      .createQueryBuilder('line')
      .innerJoinAndSelect('line.journalEntry', 'entry')
      .innerJoinAndSelect('line.account', 'account')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED })
      .orderBy('entry.entryDate', 'ASC')
      .addOrderBy('entry.id', 'ASC');

    if (fromDate) {
      queryBuilder.andWhere('entry.entryDate >= :fromDate', { fromDate });
    }
    if (toDate) {
      queryBuilder.andWhere('entry.entryDate <= :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }
}

