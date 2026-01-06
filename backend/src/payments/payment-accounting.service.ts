import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AccountingService } from '../accounting/accounting.service';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { AccountType, AccountSubtype } from '../accounting/entities/account.entity';
import { JournalEntryType } from '../accounting/entities/journal-entry.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounting/entities/account.entity';

/**
 * Payment Accounting Service
 * 
 * Handles accounting entries for payment operations.
 * This service is called AFTER payment is successfully created.
 * 
 * CRITICAL: Payment service does NOT directly touch accounting tables.
 * All accounting operations go through this service which uses AccountingService.
 */
@Injectable()
export class PaymentAccountingService {
  private readonly logger = new Logger(PaymentAccountingService.name);

  constructor(
    private accountingService: AccountingService,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /**
   * Create accounting entry for payment against invoice
   * Debit: Cash / Bank (based on payment method)
   * Credit: Fees Receivable
   */
  async recordPaymentAccounting(
    schoolId: number,
    payment: Payment,
    userId?: number,
  ): Promise<void> {
    if (payment.status !== PaymentStatus.COMPLETED) {
      this.logger.debug(`Skipping accounting entry for payment ${payment.id} with status ${payment.status}`);
      return; // Only record accounting for completed payments
    }

    try {
      // Get payment account (Cash or Bank)
      const paymentAccount = await this.getPaymentAccount(schoolId, payment.paymentMethod);
      if (!paymentAccount) {
        throw new BadRequestException(
          `Payment account not found for method: ${payment.paymentMethod}. Please initialize chart of accounts.`,
        );
      }

      // Get Fees Receivable account
      const feesReceivableAccount = await this.accountRepository.findOne({
        where: {
          schoolId,
          type: AccountType.ASSET,
          subtype: AccountSubtype.RECEIVABLE,
        },
      });

      if (!feesReceivableAccount) {
        throw new BadRequestException(
          'Fees Receivable account not found. Please initialize chart of accounts.',
        );
      }

      // Create journal entry
      await this.accountingService.createJournalEntry(
        schoolId,
        {
          entryDate: payment.paymentDate.toISOString(),
          type: JournalEntryType.PAYMENT,
          description: `Payment received - Receipt ${payment.receiptNumber}`,
          reference: payment.receiptNumber,
          referenceId: payment.id,
          lines: [
            {
              accountId: paymentAccount.id,
              debitAmount: Number(payment.amount),
              creditAmount: 0,
              description: `Payment received via ${payment.paymentMethod} - ${payment.receiptNumber}`,
            },
            {
              accountId: feesReceivableAccount.id,
              debitAmount: 0,
              creditAmount: Number(payment.amount),
              description: `Fees Receivable - Payment ${payment.receiptNumber}`,
            },
          ],
          notes: payment.notes || `Payment for student ${payment.studentId}`,
        },
        userId,
      );

      this.logger.log(`Accounting entry created for payment ${payment.id}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create accounting entry for payment ${payment.id}: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Create accounting entry for advance payment
   * Debit: Cash / Bank
   * Credit: Advance Fees (Unearned Revenue)
   */
  async recordAdvancePaymentAccounting(
    schoolId: number,
    payment: Payment,
    userId?: number,
  ): Promise<void> {
    if (payment.status !== PaymentStatus.COMPLETED) {
      return;
    }

    try {
      // Get payment account
      const paymentAccount = await this.getPaymentAccount(schoolId, payment.paymentMethod);
      if (!paymentAccount) {
        throw new BadRequestException('Payment account not found. Please initialize chart of accounts.');
      }

      // Get Advance Fees account
      const advanceFeesAccount = await this.accountRepository.findOne({
        where: {
          schoolId,
          type: AccountType.LIABILITY,
          subtype: AccountSubtype.UNEARNED_REVENUE,
        },
      });

      if (!advanceFeesAccount) {
        throw new BadRequestException('Advance Fees account not found. Please initialize chart of accounts.');
      }

      // Create journal entry
      await this.accountingService.createJournalEntry(
        schoolId,
        {
          entryDate: payment.paymentDate.toISOString(),
          type: JournalEntryType.ADVANCE_PAYMENT,
          description: `Advance payment received - Receipt ${payment.receiptNumber}`,
          reference: payment.receiptNumber,
          referenceId: payment.id,
          lines: [
            {
              accountId: paymentAccount.id,
              debitAmount: Number(payment.amount),
              creditAmount: 0,
              description: `Advance payment via ${payment.paymentMethod} - ${payment.receiptNumber}`,
            },
            {
              accountId: advanceFeesAccount.id,
              debitAmount: 0,
              creditAmount: Number(payment.amount),
              description: `Advance Fees - Payment ${payment.receiptNumber}`,
            },
          ],
          notes: payment.notes || `Advance payment for student ${payment.studentId}`,
        },
        userId,
      );

      this.logger.log(`Accounting entry created for advance payment ${payment.id}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create accounting entry for advance payment ${payment.id}: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Create accounting entry for advance adjustment (when advance is applied to invoice)
   * Debit: Advance Fees
   * Credit: Fee Income
   */
  async recordAdvanceAdjustmentAccounting(
    schoolId: number,
    amount: number,
    reference: string,
    referenceId: number,
    userId?: number,
  ): Promise<void> {
    try {
      // Get Advance Fees account
      const advanceFeesAccount = await this.accountRepository.findOne({
        where: {
          schoolId,
          type: AccountType.LIABILITY,
          subtype: AccountSubtype.UNEARNED_REVENUE,
        },
      });

      if (!advanceFeesAccount) {
        throw new BadRequestException('Advance Fees account not found. Please initialize chart of accounts.');
      }

      // Get Fee Income account
      const feeIncomeAccount = await this.accountRepository.findOne({
        where: {
          schoolId,
          type: AccountType.INCOME,
          subtype: AccountSubtype.OPERATING_INCOME,
        },
      });

      if (!feeIncomeAccount) {
        throw new BadRequestException('Fee Income account not found. Please initialize chart of accounts.');
      }

      // Create journal entry
      await this.accountingService.createJournalEntry(
        schoolId,
        {
          entryDate: new Date().toISOString(),
          type: JournalEntryType.ADVANCE_ADJUSTMENT,
          description: `Advance adjustment - ${reference}`,
          reference,
          referenceId,
          lines: [
            {
              accountId: advanceFeesAccount.id,
              debitAmount: amount,
              creditAmount: 0,
              description: `Advance Fees adjustment - ${reference}`,
            },
            {
              accountId: feeIncomeAccount.id,
              debitAmount: 0,
              creditAmount: amount,
              description: `Fee Income from advance - ${reference}`,
            },
          ],
          notes: `Advance adjustment for ${reference}`,
        },
        userId,
      );

      this.logger.log(`Accounting entry created for advance adjustment ${reference}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create accounting entry for advance adjustment: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Create accounting entry for refund
   * Debit: Fee Income / Advance Fees (depending on source)
   * Credit: Cash / Bank
   */
  async recordRefundAccounting(
    schoolId: number,
    amount: number,
    paymentMethod: PaymentMethod,
    sourceAccount: 'income' | 'advance',
    reference: string,
    referenceId: number,
    userId?: number,
  ): Promise<void> {
    try {
      // Get payment account (Cash or Bank)
      const paymentAccount = await this.getPaymentAccount(schoolId, paymentMethod);
      if (!paymentAccount) {
        throw new BadRequestException('Payment account not found. Please initialize chart of accounts.');
      }

      // Get source account (Fee Income or Advance Fees)
      let sourceAccountEntity: Account;
      if (sourceAccount === 'income') {
        sourceAccountEntity = await this.accountRepository.findOneOrFail({
          where: {
            schoolId,
            type: AccountType.INCOME,
            subtype: AccountSubtype.OPERATING_INCOME,
          },
        });
      } else {
        sourceAccountEntity = await this.accountRepository.findOneOrFail({
          where: {
            schoolId,
            type: AccountType.LIABILITY,
            subtype: AccountSubtype.UNEARNED_REVENUE,
          },
        });
      }

      // Create journal entry
      await this.accountingService.createJournalEntry(
        schoolId,
        {
          entryDate: new Date().toISOString(),
          type: JournalEntryType.REFUND,
          description: `Refund issued - ${reference}`,
          reference,
          referenceId,
          lines: [
            {
              accountId: sourceAccountEntity.id,
              debitAmount: amount,
              creditAmount: 0,
              description: `Refund from ${sourceAccount} - ${reference}`,
            },
            {
              accountId: paymentAccount.id,
              debitAmount: 0,
              creditAmount: amount,
              description: `Refund via ${paymentMethod} - ${reference}`,
            },
          ],
          notes: `Refund for ${reference}`,
        },
        userId,
      );

      this.logger.log(`Accounting entry created for refund ${reference}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create accounting entry for refund: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Get the appropriate account for payment method
   */
  private async getPaymentAccount(schoolId: number, paymentMethod: PaymentMethod): Promise<Account | null> {
    if (paymentMethod === PaymentMethod.CASH) {
      return this.accountRepository.findOne({
        where: {
          schoolId,
          type: AccountType.ASSET,
          subtype: AccountSubtype.CASH,
        },
      });
    } else if (
      paymentMethod === PaymentMethod.BANK_TRANSFER ||
      paymentMethod === PaymentMethod.CARD ||
      paymentMethod === PaymentMethod.ONLINE ||
      paymentMethod === PaymentMethod.CHEQUE
    ) {
      return this.accountRepository.findOne({
        where: {
          schoolId,
          type: AccountType.ASSET,
          subtype: AccountSubtype.BANK,
        },
      });
    }

    return null;
  }
}

