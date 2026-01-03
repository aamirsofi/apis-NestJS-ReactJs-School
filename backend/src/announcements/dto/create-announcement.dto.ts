import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';
import {
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTarget,
} from '../entities/announcement.entity';

export class AttachmentDto {
  @IsString()
  name!: string;

  @IsString()
  url!: string;

  @IsString()
  type!: string;

  @IsNumber()
  size!: number;
}

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(AnnouncementPriority)
  @IsOptional()
  priority?: AnnouncementPriority;

  @IsEnum(AnnouncementStatus)
  @IsOptional()
  status?: AnnouncementStatus;

  @IsEnum(AnnouncementTarget)
  @IsOptional()
  target?: AnnouncementTarget;

  @IsDateString()
  @IsOptional()
  publishAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  sendSMS?: boolean;

  @IsNumber()
  @IsNotEmpty()
  schoolId!: number;

  @IsArray()
  @IsOptional()
  attachments?: AttachmentDto[];
}

