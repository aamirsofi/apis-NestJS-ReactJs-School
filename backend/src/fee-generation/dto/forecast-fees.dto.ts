import { IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForecastFeesDto {
  @ApiProperty({ description: 'Student ID' })
  @IsInt()
  studentId!: number;

  @ApiProperty({ description: 'Academic Year ID' })
  @IsInt()
  academicYearId!: number;

  @ApiProperty({ description: 'School ID (required for super_admin, optional for others)' })
  @IsInt()
  @IsOptional()
  schoolId?: number;

  @ApiProperty({ description: 'Forecast up to this date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  forecastUpTo?: string; // If not provided, forecast up to current month

  @ApiProperty({ description: 'Include bus fees', default: true, required: false })
  @IsOptional()
  includeBusFees?: boolean;

  @ApiProperty({ description: 'Include previous balance', default: true, required: false })
  @IsOptional()
  includePreviousBalance?: boolean;
}

export interface ForecastResult {
  studentId: number;
  studentName: string;
  academicYearId: number;
  academicYearName: string;
  className: string;
  forecastUpTo: string;
  totalAmount: number;
  breakdown: {
    classFees: {
      total: number;
      fees: Array<{
        feeStructureId: number;
        feeStructureName: string;
        amount: number;
        dueDate: string;
        status: string;
      }>;
    };
    busFees: {
      total: number;
      monthlyAmount: number;
      months: number;
      fees: Array<{
        month: string;
        amount: number;
        dueDate: string;
      }>;
    };
    previousBalance: {
      amount: number;
    };
    otherFees: {
      total: number;
      fees: Array<{
        feeStructureId: number;
        feeStructureName: string;
        amount: number;
        dueDate: string;
        status: string;
      }>;
    };
  };
  summary: {
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  };
}


