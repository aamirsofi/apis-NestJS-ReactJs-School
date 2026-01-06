import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async create(schoolId: number, createAccountDto: CreateAccountDto): Promise<Account> {
    // Check if code already exists for this school
    const existing = await this.accountRepository.findOne({
      where: { schoolId, code: createAccountDto.code },
    });

    if (existing) {
      throw new BadRequestException(`Account with code ${createAccountDto.code} already exists`);
    }

    const account = this.accountRepository.create({
      ...createAccountDto,
      schoolId,
      openingBalance: createAccountDto.openingBalance || 0,
    });

    return this.accountRepository.save(account);
  }

  async findAll(schoolId: number, type?: string, includeInactive: boolean = false): Promise<Account[]> {
    try {
      this.logger.debug(`Fetching accounts for school ${schoolId}, type: ${type}, includeInactive: ${includeInactive}`);
      
      const where: any = { schoolId };
      if (!includeInactive) {
        where.isActive = true;
      }
      if (type) {
        where.type = type;
      }

      this.logger.debug(`Query where clause: ${JSON.stringify(where)}`);

      const accounts = await this.accountRepository.find({
        where,
        order: { code: 'ASC' },
      });

      this.logger.debug(`Found ${accounts.length} accounts for school ${schoolId}`);
      return accounts;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching accounts for school ${schoolId}: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to fetch accounts: ${err.message}`);
    }
  }

  async findOne(id: number, schoolId: number): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, schoolId },
      relations: ['parentAccount', 'childAccounts'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async update(id: number, schoolId: number, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id, schoolId);

    if (account.isSystemAccount && (updateAccountDto.code || updateAccountDto.type)) {
      throw new BadRequestException('Cannot modify code or type of system accounts');
    }

    Object.assign(account, updateAccountDto);
    return this.accountRepository.save(account);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    const account = await this.findOne(id, schoolId);

    if (account.isSystemAccount) {
      throw new BadRequestException('Cannot delete system accounts');
    }

    // Check if account has journal entries
    const hasEntries = await this.accountRepository
      .createQueryBuilder('account')
      .innerJoin('account.journalEntryLines', 'line')
      .where('account.id = :id', { id })
      .getCount() > 0;

    if (hasEntries) {
      // Soft delete by deactivating
      account.isActive = false;
      await this.accountRepository.save(account);
    } else {
      await this.accountRepository.remove(account);
    }
  }

  /**
   * Initialize default chart of accounts for a school
   */
  async initializeDefaultAccounts(schoolId: number): Promise<Account[]> {
    const defaultAccounts = [
      // Assets
      { code: '1001', name: 'Cash', type: 'asset' as const, subtype: 'cash' as const },
      { code: '1002', name: 'Bank', type: 'asset' as const, subtype: 'bank' as const },
      { code: '1101', name: 'Fees Receivable', type: 'asset' as const, subtype: 'receivable' as const },
      
      // Liabilities
      { code: '2001', name: 'Advance Fees', type: 'liability' as const, subtype: 'unearned_revenue' as const },
      
      // Income
      { code: '4001', name: 'Tuition Fee Income', type: 'income' as const, subtype: 'operating_income' as const },
      { code: '4002', name: 'Transport Fee Income', type: 'income' as const, subtype: 'operating_income' as const },
      { code: '4003', name: 'Lab Fee Income', type: 'income' as const, subtype: 'operating_income' as const },
      { code: '4004', name: 'Library Fee Income', type: 'income' as const, subtype: 'operating_income' as const },
      { code: '4005', name: 'Other Fee Income', type: 'income' as const, subtype: 'operating_income' as const },
    ];

    const accounts: Account[] = [];

    for (const accountData of defaultAccounts) {
      const existing = await this.accountRepository.findOne({
        where: { schoolId, code: accountData.code },
      });

      if (!existing) {
        const account = this.accountRepository.create({
          code: accountData.code,
          name: accountData.name,
          type: accountData.type,
          subtype: accountData.subtype,
          schoolId,
          isSystemAccount: true,
          isActive: true,
          openingBalance: 0,
        } as Account);
        const saved = await this.accountRepository.save(account);
        accounts.push(saved);
      } else {
        accounts.push(existing);
      }
    }

    return accounts;
  }
}

