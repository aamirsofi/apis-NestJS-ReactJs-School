import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { Payment } from '../payments/entities/payment.entity';
import { StudentFeeStructure } from '../student-fee-structures/entities/student-fee-structure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, StudentFeeStructure])],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}

