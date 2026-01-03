import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { School } from '../../schools/entities/school.entity';

export enum AnnouncementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AnnouncementStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum AnnouncementTarget {
  ALL = 'all',
  STUDENTS = 'students',
  PARENTS = 'parents',
  TEACHERS = 'teachers',
  ADMINISTRATORS = 'administrators',
}

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: AnnouncementPriority,
    default: AnnouncementPriority.MEDIUM,
  })
  priority!: AnnouncementPriority;

  @Column({
    type: 'enum',
    enum: AnnouncementStatus,
    default: AnnouncementStatus.DRAFT,
  })
  status!: AnnouncementStatus;

  @Column({
    type: 'enum',
    enum: AnnouncementTarget,
    default: AnnouncementTarget.ALL,
  })
  target!: AnnouncementTarget;

  @Column({ type: 'timestamp', nullable: true })
  publishAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ default: false })
  sendEmail!: boolean;

  @Column({ default: false })
  sendSMS!: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column()
  createdById!: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column()
  schoolId!: number;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;

  @Column({ default: 0 })
  views!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

