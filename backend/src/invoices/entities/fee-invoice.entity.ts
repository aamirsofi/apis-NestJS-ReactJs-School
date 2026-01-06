import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { School } from '../../schools/entities/school.entity';
import { Student } from '../../students/entities/student.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';
import { FeeInvoiceItem } from './fee-invoice-item.entity';
import { Payment } from '../../payments/entities/payment.entity';

/**
 * Invoice Status
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

/**
 * Invoice Type
 */
export enum InvoiceType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ONE_TIME = 'one_time',
}

/**
 * Fee Invoice Entity
 * Represents a fee invoice issued to a student
 * Supports multiple line items and multiple due dates
 */
@Entity('fee_invoices')
@Index(['schoolId', 'invoiceNumber'], { unique: true })
@Index(['schoolId', 'studentId'])
@Index(['schoolId', 'status'])
@Index(['schoolId', 'issueDate'])
@Index(['schoolId', 'studentId', 'academicYearId', 'type', 'periodMonth', 'periodQuarter', 'periodYear'], { unique: true, where: 'type IN (\'monthly\', \'quarterly\', \'yearly\')' })
export class FeeInvoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  schoolId!: number;

  @Column()
  studentId!: number;

  @Column()
  academicYearId!: number;

  @Column({ length: 50, unique: false })
  invoiceNumber!: string; // Auto-generated invoice number (e.g., "INV-2026-0001")

  @Column({ type: 'date' })
  issueDate!: Date; // Invoice issue date

  @Column({ type: 'date' })
  dueDate!: Date; // Primary due date

  @Column({
    type: 'enum',
    enum: InvoiceType,
  })
  type!: InvoiceType; // MONTHLY, QUARTERLY, YEARLY, ONE_TIME

  @Column({ type: 'int', nullable: true })
  periodMonth?: number; // 1-12 for monthly invoices (e.g., January = 1)

  @Column({ type: 'int', nullable: true })
  periodQuarter?: number; // 1-4 for quarterly invoices

  @Column({ type: 'int', nullable: true })
  periodYear?: number; // Year for the period (e.g., 2026)

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status!: InvoiceStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount!: number; // Total invoice amount

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount!: number; // Total amount paid against this invoice

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount!: number; // Total discount applied

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balanceAmount!: number; // Remaining balance (totalAmount - paidAmount - discountAmount)

  @Column({ type: 'text', nullable: true })
  notes?: string; // Additional notes

  @Column({ nullable: true })
  journalEntryId?: number; // Reference to accounting journal entry

  // Relations
  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academicYearId' })
  academicYear!: AcademicYear;

  @OneToMany(() => FeeInvoiceItem, item => item.invoice, { cascade: true })
  items!: FeeInvoiceItem[];

  @OneToMany(() => Payment, payment => payment.invoice)
  payments?: Payment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

