import { IsNumber, IsDateString, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'Student ID' })
  @IsNumber()
  studentId!: number;

  @ApiProperty({ 
    example: 101, 
    description: 'Invoice ID (required - create invoice first using POST /invoices)'
  })
  @IsNumber()
  invoiceId!: number;

  @ApiProperty({ example: 5000.0, description: 'Payment amount (can be partial)' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: '2024-12-29' })
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false, example: 'TXN123456' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ required: false, example: 'REC-20260103-0001', description: 'Receipt number (auto-generated if not provided)' })
  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false, description: 'School ID (for super_admin or when school context is not available)' })
  @IsNumber()
  @IsOptional()
  schoolId?: number;
}
