import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Account } from '../accounting/entities/account.entity';
import { JournalEntry } from '../accounting/entities/journal-entry.entity';
import { JournalEntryLine } from '../accounting/entities/journal-entry-line.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FeeInvoice } from '../invoices/entities/fee-invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      JournalEntry,
      JournalEntryLine,
      Payment,
      FeeInvoice,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

