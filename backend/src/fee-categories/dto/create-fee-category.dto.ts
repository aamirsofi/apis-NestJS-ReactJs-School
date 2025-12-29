import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '../entities/fee-category.entity';

export class CreateFeeCategoryDto {
  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false, example: 'Regular tuition fees' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CategoryStatus, required: false })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;
}

