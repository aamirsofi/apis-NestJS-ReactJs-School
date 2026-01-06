import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeGenerationService } from './fee-generation.service';
import { FeeGenerationController } from './fee-generation.controller';
import { FeeGenerationHistory } from './entities/fee-generation-history.entity';
import { StudentFeeStructure } from '../student-fee-structures/entities/student-fee-structure.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { Student } from '../students/entities/student.entity';
import { StudentAcademicRecord } from '../student-academic-records/entities/student-academic-record.entity';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';
import { School } from '../schools/entities/school.entity';
import { RoutePrice } from '../route-prices/entities/route-price.entity';
import { FeeGenerationScheduler } from './fee-generation.scheduler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeGenerationHistory,
      StudentFeeStructure,
      FeeStructure,
      Student,
      StudentAcademicRecord,
      AcademicYear,
      School,
      RoutePrice,
    ]),
    ScheduleModule,
  ],
  controllers: [FeeGenerationController],
  providers: [FeeGenerationService, FeeGenerationScheduler],
  exports: [FeeGenerationService],
})
export class FeeGenerationModule {}

