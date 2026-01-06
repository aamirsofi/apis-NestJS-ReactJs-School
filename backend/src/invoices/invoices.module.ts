import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { FeeInvoice } from './entities/fee-invoice.entity';
import { FeeInvoiceItem } from './entities/fee-invoice-item.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { Student } from '../students/entities/student.entity';
import { StudentAcademicRecord } from '../student-academic-records/entities/student-academic-record.entity';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeeInvoice, FeeInvoiceItem, FeeStructure, Student, StudentAcademicRecord]),
    AccountingModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}

