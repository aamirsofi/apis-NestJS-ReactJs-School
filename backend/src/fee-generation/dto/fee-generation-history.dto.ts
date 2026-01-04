import { IsNumber, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GenerationType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

export enum GenerationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class FeeGenerationHistoryDto {
  @ApiProperty()
  @IsNumber()
  id!: number;

  @ApiProperty({ enum: GenerationType })
  @IsEnum(GenerationType)
  type!: GenerationType;

  @ApiProperty({ enum: GenerationStatus })
  @IsEnum(GenerationStatus)
  status!: GenerationStatus;

  @ApiProperty()
  @IsNumber()
  schoolId!: number;

  @ApiProperty()
  @IsNumber()
  academicYearId!: number;

  @ApiProperty()
  @IsNumber()
  totalStudents!: number;

  @ApiProperty()
  @IsNumber()
  feesGenerated!: number;

  @ApiProperty()
  @IsNumber()
  feesFailed!: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty()
  @IsDateString()
  generatedAt!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  generatedBy?: string;
}


