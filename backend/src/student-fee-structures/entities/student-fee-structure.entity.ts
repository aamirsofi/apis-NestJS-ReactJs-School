import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { FeeStructure } from '../../fee-structures/entities/fee-structure.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';
import { StudentAcademicRecord } from '../../student-academic-records/entities/student-academic-record.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('student_fee_structures')
// Note: Removed unique constraint to allow multiple installments per fee structure
export class StudentFeeStructure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number;

  @Column()
  feeStructureId!: number;

  @Column()
  academicYearId!: number; // Link to academic year

  @Column({ nullable: true })
  academicRecordId?: number; // Link to student's academic record for that year

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalAmount?: number; // Original amount before discount

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount!: number; // Discount amount (calculated from percentage or fixed)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage?: number; // Discount percentage (if applicable)

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column({ type: 'date', nullable: true })
  installmentStartDate?: Date; // For installment-based fees

  @Column({ nullable: true })
  installmentCount?: number; // Number of installments (e.g., 12 for monthly)

  @Column({ nullable: true })
  installmentNumber?: number; // Current installment number (1, 2, 3, etc.)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  installmentAmount?: number; // Amount per installment

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @ManyToOne(() => Student, student => student.feeStructures)
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @ManyToOne(() => FeeStructure, feeStructure => feeStructure.studentStructures)
  @JoinColumn({ name: 'feeStructureId' })
  feeStructure!: FeeStructure;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academicYearId' })
  academicYear!: AcademicYear;

  @ManyToOne(() => StudentAcademicRecord, { nullable: true })
  @JoinColumn({ name: 'academicRecordId' })
  academicRecord?: StudentAcademicRecord;

  // Payments relationship - using forward reference to avoid circular dependency
  @OneToMany('Payment', 'studentFeeStructure')
  payments!: any[]; // Type will be Payment[] but using any to avoid circular import

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
