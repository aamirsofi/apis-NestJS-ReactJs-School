import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString, MinLength, MaxLength } from 'class-validator';
import { AccountType, AccountSubtype } from '../entities/account.entity';

export class CreateAccountDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsOptional()
  @IsEnum(AccountSubtype)
  subtype?: AccountSubtype;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  parentAccountId?: number;

  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @IsOptional()
  @IsDateString()
  openingBalanceDate?: string;
}

