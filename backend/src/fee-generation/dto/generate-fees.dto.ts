import { IsArray, IsNumber, IsOptional, IsString, IsBoolean, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DiscountDto {
  @ApiProperty({ example: 10.5, description: 'Discount percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  percentage?: number;

  @ApiProperty({ example: 500, description: 'Fixed discount amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fixedAmount?: number;
}

export class InstallmentDto {
  @ApiProperty({ example: true, description: 'Whether to split into installments' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: 12, description: 'Number of installments' })
  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  count?: number;

  @ApiProperty({ example: '2024-01-01', description: 'Start date for installments' })
  @IsDateString()
  @IsOptional()
  startDate?: string;
}

export class GenerateFeesDto {
  @ApiProperty({ example: [1, 2, 3], description: 'Student IDs to generate fees for' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  studentIds?: number[];

  @ApiProperty({ example: [1, 2], description: 'Class IDs to generate fees for all students in those classes' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  classIds?: number[];

  @ApiProperty({ example: 1, description: 'School ID (required for super_admin, optional for others)' })
  @IsNumber()
  @IsOptional()
  schoolId?: number;

  @ApiProperty({ example: 1, description: 'Academic Year ID' })
  @IsNumber()
  academicYearId!: number;

  @ApiProperty({ example: [1, 2, 3], description: 'Fee Structure IDs to generate' })
  @IsArray()
  @IsNumber({}, { each: true })
  feeStructureIds!: number[];

  @ApiProperty({ example: '2024-01-01', description: 'Due date for the fees' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ type: DiscountDto, required: false, description: 'Discount to apply' })
  @ValidateNested()
  @Type(() => DiscountDto)
  @IsOptional()
  discount?: DiscountDto;

  @ApiProperty({ type: InstallmentDto, required: false, description: 'Installment configuration' })
  @ValidateNested()
  @Type(() => InstallmentDto)
  @IsOptional()
  installment?: InstallmentDto;

  @ApiProperty({ example: false, description: 'Whether to regenerate existing fees' })
  @IsBoolean()
  @IsOptional()
  regenerateExisting?: boolean;
}


