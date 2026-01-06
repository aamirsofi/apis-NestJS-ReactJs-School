import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { School } from '../../schools/entities/school.entity';
import { Route } from '../../routes/entities/route.entity';
import { Class } from '../../classes/entities/class.entity';
import { CategoryHead } from '../../category-heads/entities/category-head.entity';

export enum RoutePriceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('route_prices')
@Unique(['schoolId', 'routeId', 'classId', 'categoryHeadId'])
export class RoutePrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  schoolId!: number;

  @Column()
  routeId!: number;

  @Column()
  classId!: number;

  @Column()
  categoryHeadId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: RoutePriceStatus,
    default: RoutePriceStatus.ACTIVE,
  })
  status!: RoutePriceStatus;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => Route)
  @JoinColumn({ name: 'routeId' })
  route!: Route;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class!: Class;

  @ManyToOne(() => CategoryHead)
  @JoinColumn({ name: 'categoryHeadId' })
  categoryHead!: CategoryHead;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

