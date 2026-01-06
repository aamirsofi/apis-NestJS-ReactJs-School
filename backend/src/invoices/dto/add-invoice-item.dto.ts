import { IsNumber, IsString, IsOptional, IsEnum, IsObject, Min } from 'class-validator';
import { InvoiceSourceType } from '../entities/fee-invoice-item.entity';

/**
 * DTO for adding transport item to invoice
 */
export class AddTransportItemDto {
  @IsNumber()
  routePriceId!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

/**
 * DTO for adding hostel item to invoice
 */
export class AddHostelItemDto {
  @IsNumber()
  hostelPlanId!: number;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for adding fine to invoice
 */
export class AddFineDto {
  @IsNumber()
  fineId!: number;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for adding misc charge to invoice
 */
export class AddMiscItemDto {
  @IsNumber()
  miscChargeId!: number;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

