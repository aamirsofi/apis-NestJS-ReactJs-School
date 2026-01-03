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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'administrator')
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'administrator')
  createBroadcast(
    @Body() createNotificationDto: CreateNotificationDto,
    @Query('schoolId') schoolId?: string,
  ) {
    const parsedSchoolId = schoolId ? parseInt(schoolId, 10) : undefined;
    return this.notificationsService.createBroadcast(createNotificationDto, parsedSchoolId);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
    @Query('schoolId') schoolId?: string,
  ) {
    const parsedSchoolId = schoolId ? parseInt(schoolId, 10) : undefined;
    return this.notificationsService.findAll(
      user.id,
      parsedSchoolId || user.schoolId,
      paginationDto,
    );
  }

  @Get('unread-count')
  getUnreadCount(
    @CurrentUser() user: any,
    @Query('schoolId') schoolId?: string,
  ) {
    const parsedSchoolId = schoolId ? parseInt(schoolId, 10) : undefined;
    return this.notificationsService.getUnreadCount(
      user.id,
      parsedSchoolId || user.schoolId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificationsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('mark-all-read')
  markAllAsRead(
    @CurrentUser() user: any,
    @Query('schoolId') schoolId?: string,
  ) {
    const parsedSchoolId = schoolId ? parseInt(schoolId, 10) : undefined;
    return this.notificationsService.markAllAsRead(user.id, parsedSchoolId || user.schoolId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }
}

