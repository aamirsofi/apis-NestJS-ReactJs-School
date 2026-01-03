import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Announcement,
  AnnouncementStatus,
} from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
  ) {}

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    createdById: number,
  ): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      ...createAnnouncementDto,
      createdById,
      // Convert date strings to Date objects if provided
      publishAt: createAnnouncementDto.publishAt
        ? new Date(createAnnouncementDto.publishAt)
        : undefined,
      expiresAt: createAnnouncementDto.expiresAt
        ? new Date(createAnnouncementDto.expiresAt)
        : undefined,
    });

    // If status is published and publishAt is not set, set it to now
    if (
      announcement.status === AnnouncementStatus.PUBLISHED &&
      !announcement.publishAt
    ) {
      announcement.publishAt = new Date();
    }

    return await this.announcementRepository.save(announcement);
  }

  async findAll(
    schoolId?: number,
    paginationDto?: PaginationDto,
    includeArchived: boolean = false,
    target?: string,
  ): Promise<{ data: Announcement[]; meta: any }> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.announcementRepository.createQueryBuilder('announcement');

    if (schoolId) {
      queryBuilder.where('announcement.schoolId = :schoolId', { schoolId });
    }

    if (!includeArchived) {
      queryBuilder.andWhere('announcement.status != :archived', {
        archived: AnnouncementStatus.ARCHIVED,
      });
      // Filter out expired announcements when not including archived
      queryBuilder.andWhere(
        '(announcement.expiresAt IS NULL OR announcement.expiresAt > :now)',
        { now: new Date() },
      );
    } else {
      // When including archived, show archived announcements even if expired
      // but still filter out expired non-archived announcements
      queryBuilder.andWhere(
        '(announcement.status = :archived OR announcement.expiresAt IS NULL OR announcement.expiresAt > :now)',
        { archived: AnnouncementStatus.ARCHIVED, now: new Date() },
      );
    }

    // Filter by target audience
    if (target) {
      queryBuilder.andWhere(
        '(announcement.target = :target OR announcement.target = :all)',
        { target, all: 'all' },
      );
    }

    queryBuilder
      .orderBy('announcement.priority', 'DESC')
      .addOrderBy('announcement.createdAt', 'DESC')
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

  async findPublished(
    schoolId?: number,
    target?: string,
  ): Promise<Announcement[]> {
    const queryBuilder = this.announcementRepository
      .createQueryBuilder('announcement')
      .where('announcement.status = :status', {
        status: AnnouncementStatus.PUBLISHED,
      })
      .andWhere('(announcement.publishAt IS NULL OR announcement.publishAt <= :now)', {
        now: new Date(),
      })
      .andWhere(
        '(announcement.expiresAt IS NULL OR announcement.expiresAt > :now)',
        { now: new Date() },
      );

    if (schoolId) {
      queryBuilder.andWhere('announcement.schoolId = :schoolId', { schoolId });
    }

    if (target) {
      queryBuilder.andWhere(
        '(announcement.target = :target OR announcement.target = :all)',
        { target, all: 'all' },
      );
    }

    queryBuilder
      .orderBy('announcement.priority', 'DESC')
      .addOrderBy('announcement.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['createdBy', 'school'],
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  async update(
    id: number,
    updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = await this.findOne(id);

    // Convert date strings to Date objects if provided
    const updateData: any = { ...updateAnnouncementDto };
    if (updateAnnouncementDto.publishAt) {
      updateData.publishAt = new Date(updateAnnouncementDto.publishAt);
    }
    if (updateAnnouncementDto.expiresAt) {
      updateData.expiresAt = new Date(updateAnnouncementDto.expiresAt);
    }

    // If status is being changed to published and publishAt is not set, set it to now
    if (
      updateData.status === AnnouncementStatus.PUBLISHED &&
      !announcement.publishAt &&
      !updateData.publishAt
    ) {
      updateData.publishAt = new Date();
    }

    Object.assign(announcement, updateData);
    return await this.announcementRepository.save(announcement);
  }

  async publish(id: number): Promise<Announcement> {
    const announcement = await this.findOne(id);
    announcement.status = AnnouncementStatus.PUBLISHED;
    if (!announcement.publishAt) {
      announcement.publishAt = new Date();
    }
    return await this.announcementRepository.save(announcement);
  }

  async archive(id: number): Promise<Announcement> {
    const announcement = await this.findOne(id);
    announcement.status = AnnouncementStatus.ARCHIVED;
    return await this.announcementRepository.save(announcement);
  }

  async incrementViews(id: number): Promise<void> {
    await this.announcementRepository.increment({ id }, 'views', 1);
  }

  async remove(id: number): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementRepository.remove(announcement);
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.announcementRepository.update(
      {
        expiresAt: LessThan(new Date()),
        status: AnnouncementStatus.PUBLISHED,
      },
      {
        status: AnnouncementStatus.ARCHIVED,
      },
    );
    return result.affected || 0;
  }
}


