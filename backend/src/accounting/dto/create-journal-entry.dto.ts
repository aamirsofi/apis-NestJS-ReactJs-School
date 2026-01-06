import { IsString, IsEnum, IsDateString, IsNumber, IsArray, ValidateNested, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalEntryType } from '../entities/journal-entry.entity';

export class CreateJournalEntryLineDto {
  @IsNumber()
  accountId!: number;

  @IsNumber()
  @Min(0)
  debitAmount!: number;

  @IsNumber()
  @Min(0)
  creditAmount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @IsDateString()
  entryDate!: string;

  @IsEnum(JournalEntryType)
  type!: JournalEntryType;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsNumber()
  referenceId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalEntryLineDto)
  lines!: CreateJournalEntryLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

