import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { School } from '../../schools/entities/school.entity';
import { FeeCategory } from '../../fee-categories/entities/fee-category.entity';

export enum CategoryHeadStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('category_heads')
export class CategoryHead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CategoryHeadStatus,
    default: CategoryHeadStatus.ACTIVE,
  })
  status!: CategoryHeadStatus;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School, (school) => school.categoryHeads)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => FeeCategory, (feeCategory) => feeCategory.categoryHead)
  feeCategories!: FeeCategory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

