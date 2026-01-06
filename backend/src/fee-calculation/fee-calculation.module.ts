import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeCalculationService } from './fee-calculation.service';
import { Student } from '../students/entities/student.entity';
import { FeeCategory } from '../fee-categories/entities/fee-category.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { RoutePrice } from '../route-prices/entities/route-price.entity';
import { Route } from '../routes/entities/route.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      FeeCategory,
      FeeStructure,
      RoutePrice,
      Route,
    ]),
  ],
  providers: [FeeCalculationService],
  exports: [FeeCalculationService],
})
export class FeeCalculationModule {}

