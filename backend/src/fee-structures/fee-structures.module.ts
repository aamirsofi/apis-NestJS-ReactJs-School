import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeStructuresService } from './fee-structures.service';
import { FeeStructuresController } from './fee-structures.controller';
import { FeeStructure } from './entities/fee-structure.entity';
import { RoutePrice } from '../route-prices/entities/route-price.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeStructure, RoutePrice])],
  controllers: [FeeStructuresController],
  providers: [FeeStructuresService],
  exports: [FeeStructuresService],
})
export class FeeStructuresModule {}
