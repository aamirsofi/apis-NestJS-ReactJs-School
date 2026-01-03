import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { School } from '../../schools/entities/school.entity';
import { UserRole } from '../../user-roles/entities/user-role.entity';

// Keep enum for backward compatibility during migration
export enum UserRoleEnum {
  SUPER_ADMIN = 'super_admin',
  ADMINISTRATOR = 'administrator',
  ACCOUNTANT = 'accountant',
  STUDENT = 'student',
  PARENT = 'parent',
}

// Export UserRole as the entity for new code
export { UserRole };

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ nullable: true })
  emailVerifiedAt?: Date;

  @Column()
  @Exclude()
  password!: string;

  @Column({ nullable: true })
  roleId?: number;

  @ManyToOne(() => UserRole, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role!: UserRole;

  @Column({ nullable: true })
  rememberToken?: string;

  @Column({ nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, { nullable: true })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @OneToMany(() => School, school => school.createdBy)
  schools!: School[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
