import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { StudentFeeStructure } from '../student-fee-structures/entities/student-fee-structure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, StudentFeeStructure])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
