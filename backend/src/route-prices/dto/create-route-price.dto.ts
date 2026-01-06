import { IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoutePriceStatus } from '../entities/route-price.entity';

export class CreateRoutePriceDto {
  @ApiProperty({ example: 1, description: 'Route ID' })
  @IsNumber()
  routeId!: number;

  @ApiProperty({ example: 1, description: 'Class ID' })
  @IsNumber()
  classId!: number;

  @ApiProperty({ example: 1, description: 'Category Head ID' })
  @IsNumber()
  categoryHeadId!: number;

  @ApiProperty({ example: 2000.00, description: 'Transport fee amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: RoutePriceStatus, required: false, default: RoutePriceStatus.ACTIVE })
  @IsEnum(RoutePriceStatus)
  status?: RoutePriceStatus;
}

