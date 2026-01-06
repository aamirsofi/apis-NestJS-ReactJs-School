import { IsNumber, IsDateString, IsEnum, IsArray, ValidateNested, IsOptional, IsString, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType } from '../entities/fee-invoice.entity';
import { InvoiceSourceType } from '../entities/fee-invoice-item.entity';

export class CreateFeeInvoiceItemDto {
  // ====== POLYMORPHIC FIELDS ======
  // When sourceType='FEE', sourceId points to fee_structures.id
  
  @IsOptional()
  @IsEnum(InvoiceSourceType)
  sourceType?: InvoiceSourceType; // FEE, TRANSPORT, HOSTEL, FINE, MISC

  @IsOptional()
  @IsNumber()
  sourceId?: number; // ID in the source table (e.g., fee_structures.id, route_prices.id, etc.)

  @IsOptional()
  @IsObject()
  sourceMetadata?: Record<string, any>; // Audit trail snapshot

  // ====== END POLYMORPHIC FIELDS ======

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFeeInvoiceDto {
  @IsNumber()
  studentId!: number;

  @IsNumber()
  academicYearId!: number;

  @IsDateString()
  issueDate!: string;

  @IsDateString()
  dueDate!: string;

  @IsEnum(InvoiceType)
  type!: InvoiceType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeeInvoiceItemDto)
  items!: CreateFeeInvoiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

