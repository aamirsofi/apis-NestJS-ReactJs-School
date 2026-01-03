import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async findAll(
    userId?: number,
    schoolId?: number,
    paginationDto?: PaginationDto,
  ): Promise<{ data: Notification[]; meta: any }> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository.createQueryBuilder('notification');

    if (userId) {
      queryBuilder.where('(notification.userId = :userId OR notification.isBroadcast = true)', { userId });
    } else if (schoolId) {
      queryBuilder.where('(notification.schoolId = :schoolId OR notification.isBroadcast = true)', { schoolId });
    }

    queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId?: number): Promise<Notification> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.id = :id', { id });

    if (userId) {
      queryBuilder.andWhere(
        '(notification.userId = :userId OR notification.isBroadcast = true)',
        { userId },
      );
    }

    const notification = await queryBuilder.getOne();

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async update(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async markAsRead(id: number, userId?: number): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    notification.status = NotificationStatus.READ;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number, schoolId?: number): Promise<void> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ status: NotificationStatus.READ })
      .where('status = :status', { status: NotificationStatus.UNREAD });

    if (userId) {
      queryBuilder.andWhere('(userId = :userId OR isBroadcast = true)', { userId });
    }

    if (schoolId) {
      queryBuilder.andWhere('(schoolId = :schoolId OR isBroadcast = true)', { schoolId });
    }

    await queryBuilder.execute();
  }

  async getUnreadCount(userId?: number, schoolId?: number): Promise<number> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.status = :status', { status: NotificationStatus.UNREAD });

    if (userId) {
      queryBuilder.andWhere(
        '(notification.userId = :userId OR notification.isBroadcast = true)',
        { userId },
      );
    } else if (schoolId) {
      queryBuilder.andWhere(
        '(notification.schoolId = :schoolId OR notification.isBroadcast = true)',
        { schoolId },
      );
    }

    return await queryBuilder.getCount();
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async createBroadcast(
    createNotificationDto: CreateNotificationDto,
    schoolId?: number,
  ): Promise<Notification[]> {
    if (!createNotificationDto.isBroadcast) {
      throw new BadRequestException('This method is for broadcast notifications only');
    }

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      isBroadcast: true,
      schoolId,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    return [savedNotification];
  }
}


