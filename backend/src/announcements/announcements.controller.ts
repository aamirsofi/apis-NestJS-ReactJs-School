import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AnnouncementPaginationDto } from './dto/announcement-pagination.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'administrator')
  create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @CurrentUser() user: any,
  ) {
    return this.announcementsService.create(createAnnouncementDto, user.id);
  }

  @Get()
  findAll(
    @Query() paginationDto: AnnouncementPaginationDto,
  ) {
    // Extract schoolId, includeArchived, and target from paginationDto
    const { schoolId, includeArchived, target, ...restPagination } = paginationDto;
    return this.announcementsService.findAll(
      schoolId,
      restPagination,
      includeArchived || false,
      target,
    );
  }

  @Get('published')
  findPublished(
    @Query('schoolId') schoolId?: string,
    @Query('target') target?: string,
  ) {
    const parsedSchoolId = schoolId ? parseInt(schoolId, 10) : undefined;
    return this.announcementsService.findPublished(parsedSchoolId, target);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'administrator')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'administrator')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.publish(id);
  }

  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'administrator')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.archive(id);
  }

  @Post(':id/view')
  incrementViews(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.incrementViews(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'administrator')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }
}

