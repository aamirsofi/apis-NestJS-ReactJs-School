import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsBoolean, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AnnouncementTarget } from '../entities/announcement.entity';

export class AnnouncementPaginationDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @IsEnum(AnnouncementTarget)
  target?: AnnouncementTarget;
}

