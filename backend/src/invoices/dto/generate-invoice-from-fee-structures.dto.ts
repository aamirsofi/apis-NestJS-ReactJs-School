import { IsNumber, IsEnum, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { InvoiceType } from '../entities/fee-invoice.entity';

export class GenerateInvoiceFromFeeStructuresDto {
  @IsNumber()
  studentId!: number;

  @IsNumber()
  academicYearId!: number;

  @IsEnum(InvoiceType)
  type!: InvoiceType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  periodMonth?: number; // 1-12 for monthly invoices

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  periodQuarter?: number; // 1-4 for quarterly invoices

  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(3000)
  periodYear?: number; // Year for the period

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

