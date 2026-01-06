import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Account, AccountType } from '../accounting/entities/account.entity';
import { JournalEntry, JournalEntryStatus } from '../accounting/entities/journal-entry.entity';
import { JournalEntryLine } from '../accounting/entities/journal-entry-line.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { FeeInvoice, InvoiceStatus } from '../invoices/entities/fee-invoice.entity';

/**
 * Reports Service
 * Generates accounting and operational reports
 */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLineRepository: Repository<JournalEntryLine>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(FeeInvoice)
    private invoiceRepository: Repository<FeeInvoice>,
  ) {}

  /**
   * Generate Trial Balance
   */
  async getTrialBalance(schoolId: number, asOfDate?: Date): Promise<any[]> {
    const accounts = await this.accountRepository.find({
      where: { schoolId, isActive: true },
      order: { code: 'ASC' },
    });

    const trialBalance = await Promise.all(
      accounts.map(async account => {
        const queryBuilder = this.journalEntryLineRepository
          .createQueryBuilder('line')
          .innerJoin('line.journalEntry', 'entry')
          .where('line.accountId = :accountId', { accountId: account.id })
          .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED })
          .andWhere('entry.schoolId = :schoolId', { schoolId });

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

        // Calculate balance
        let balance = 0;
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          balance = openingBalance + debit - credit;
        } else {
          balance = openingBalance + credit - debit;
        }

        return {
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          openingBalance,
          debit,
          credit,
          balance,
        };
      }),
    );

    return trialBalance;
  }

  /**
   * Generate Profit & Loss Statement
   */
  async getProfitAndLoss(schoolId: number, fromDate: Date, toDate: Date): Promise<any> {
    // Get income accounts
    const incomeAccounts = await this.accountRepository.find({
      where: { schoolId, type: AccountType.INCOME, isActive: true },
    });

    // Get expense accounts
    const expenseAccounts = await this.accountRepository.find({
      where: { schoolId, type: AccountType.EXPENSE, isActive: true },
    });

    const calculateAccountBalance = async (accountId: number) => {
      const result = await this.journalEntryLineRepository
        .createQueryBuilder('line')
        .innerJoin('line.journalEntry', 'entry')
        .where('line.accountId = :accountId', { accountId })
        .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED })
        .andWhere('entry.schoolId = :schoolId', { schoolId })
        .andWhere('entry.entryDate >= :fromDate', { fromDate })
        .andWhere('entry.entryDate <= :toDate', { toDate })
        .select('SUM(line.debitAmount)', 'totalDebit')
        .addSelect('SUM(line.creditAmount)', 'totalCredit')
        .getRawOne();

      const debit = parseFloat(result?.totalDebit || '0');
      const credit = parseFloat(result?.totalCredit || '0');

      if (incomeAccounts.find(a => a.id === accountId)) {
        return credit - debit; // Income: credit increases
      } else {
        return debit - credit; // Expense: debit increases
      }
    };

    const income = await Promise.all(
      incomeAccounts.map(async account => {
        const balance = await calculateAccountBalance(account.id);
        return {
          accountCode: account.code,
          accountName: account.name,
          amount: balance,
        };
      }),
    );

    const expenses = await Promise.all(
      expenseAccounts.map(async account => {
        const balance = await calculateAccountBalance(account.id);
        return {
          accountCode: account.code,
          accountName: account.name,
          amount: balance,
        };
      }),
    );

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      income: {
        items: income,
        total: totalIncome,
      },
      expenses: {
        items: expenses,
        total: totalExpenses,
      },
      netProfit,
    };
  }

  /**
   * Generate Balance Sheet
   */
  async getBalanceSheet(schoolId: number, asOfDate: Date): Promise<any> {
    const accounts = await this.accountRepository.find({
      where: { schoolId, isActive: true },
      order: { code: 'ASC' },
    });

    const calculateAccountBalance = async (account: Account) => {
      const result = await this.journalEntryLineRepository
        .createQueryBuilder('line')
        .innerJoin('line.journalEntry', 'entry')
        .where('line.accountId = :accountId', { accountId: account.id })
        .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED })
        .andWhere('entry.schoolId = :schoolId', { schoolId })
        .andWhere('entry.entryDate <= :asOfDate', { asOfDate })
        .select('SUM(line.debitAmount)', 'totalDebit')
        .addSelect('SUM(line.creditAmount)', 'totalCredit')
        .getRawOne();

      const debit = parseFloat(result?.totalDebit || '0');
      const credit = parseFloat(result?.totalCredit || '0');
      const openingBalance = Number(account.openingBalance || 0);

      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
        return openingBalance + debit - credit;
      } else {
        return openingBalance + credit - debit;
      }
    };

    const assets = await Promise.all(
      accounts
        .filter(a => a.type === AccountType.ASSET)
        .map(async account => ({
          accountCode: account.code,
          accountName: account.name,
          balance: await calculateAccountBalance(account),
        })),
    );

    const liabilities = await Promise.all(
      accounts
        .filter(a => a.type === AccountType.LIABILITY)
        .map(async account => ({
          accountCode: account.code,
          accountName: account.name,
          balance: await calculateAccountBalance(account),
        })),
    );

    const equity = await Promise.all(
      accounts
        .filter(a => a.type === AccountType.EQUITY)
        .map(async account => ({
          accountCode: account.code,
          accountName: account.name,
          balance: await calculateAccountBalance(account),
        })),
    );

    const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

    return {
      asOfDate,
      assets: {
        items: assets,
        total: totalAssets,
      },
      liabilities: {
        items: liabilities,
        total: totalLiabilities,
      },
      equity: {
        items: equity,
        total: totalEquity,
      },
      total: totalAssets,
      balance: totalAssets - (totalLiabilities + totalEquity), // Should be 0 if balanced
    };
  }

  /**
   * Get fee collection summary
   */
  async getFeeCollectionSummary(schoolId: number, fromDate?: Date, toDate?: Date): Promise<any> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.schoolId = :schoolId', { schoolId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (fromDate) {
      queryBuilder.andWhere('payment.paymentDate >= :fromDate', { fromDate });
    }
    if (toDate) {
      queryBuilder.andWhere('payment.paymentDate <= :toDate', { toDate });
    }

    const payments = await queryBuilder.getMany();

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Group by payment method
    const byMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += Number(payment.amount);
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      totalAmount,
      totalCount: payments.length,
      byMethod,
    };
  }

  /**
   * Get student outstanding dues
   */
  async getStudentOutstandingDues(schoolId: number): Promise<any[]> {
    const invoices = await this.invoiceRepository.find({
      where: {
        schoolId,
        status: In([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
      },
      relations: ['student', 'academicYear'],
    });

    return invoices.map(invoice => ({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.student.studentId,
      studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
      academicYear: invoice.academicYear.name,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceAmount: invoice.balanceAmount,
      dueDate: invoice.dueDate,
      status: invoice.status,
    }));
  }
}

import { In } from 'typeorm';

