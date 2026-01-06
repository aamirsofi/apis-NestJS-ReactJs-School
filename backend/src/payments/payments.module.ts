import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { FeeInvoice } from '../invoices/entities/fee-invoice.entity';
import { PaymentAccountingService } from './payment-accounting.service';
import { AccountingModule } from '../accounting/accounting.module';
import { Account } from '../accounting/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, FeeInvoice, Account]),
    AccountingModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentAccountingService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
