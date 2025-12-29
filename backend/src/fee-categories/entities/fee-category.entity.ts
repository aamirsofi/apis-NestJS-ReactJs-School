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
import { FeeStructure } from '../../fee-structures/entities/fee-structure.entity';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('fee_categories')
export class FeeCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  status!: CategoryStatus;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School, (school) => school.feeCategories)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => FeeStructure, (feeStructure) => feeStructure.category)
  feeStructures!: FeeStructure[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

