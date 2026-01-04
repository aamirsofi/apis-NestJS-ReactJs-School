import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentFeeStructure } from './entities/student-fee-structure.entity';
import { StudentFeeStructuresService } from './student-fee-structures.service';
import { StudentFeeStructuresController } from './student-fee-structures.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudentFeeStructure])],
  controllers: [StudentFeeStructuresController],
  providers: [StudentFeeStructuresService],
  exports: [TypeOrmModule, StudentFeeStructuresService],
})
export class StudentFeeStructuresModule {}
