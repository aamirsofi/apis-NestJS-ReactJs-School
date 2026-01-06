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
import { JournalEntryLine } from './journal-entry-line.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Journal Entry Status
 */
export enum JournalEntryStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  REVERSED = 'reversed',
}

/**
 * Journal Entry Type
 * Categorizes the type of transaction
 */
export enum JournalEntryType {
  INVOICE = 'invoice', // Fee invoice generation
  PAYMENT = 'payment', // Payment received
  ADVANCE_PAYMENT = 'advance_payment', // Advance payment before invoice
  ADVANCE_ADJUSTMENT = 'advance_adjustment', // Adjusting advance against invoice
  REFUND = 'refund', // Refund issued
  ADJUSTMENT = 'adjustment', // Manual adjustment
  OPENING_BALANCE = 'opening_balance', // Opening balance entry
  TRANSFER = 'transfer', // Transfer between accounts
}

/**
 * Journal Entry Entity
 * Represents a double-entry accounting transaction
 * Every journal entry must have balanced debits and credits
 */
@Entity('journal_entries')
@Index(['schoolId', 'entryNumber'], { unique: true })
@Index(['schoolId', 'entryDate'])
@Index(['schoolId', 'type'])
@Index(['schoolId', 'status'])
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  schoolId!: number;

  @Column({ length: 50, unique: false })
  entryNumber!: string; // Auto-generated entry number (e.g., "JE-2026-0001")

  @Column({ type: 'date' })
  entryDate!: Date; // Transaction date

  @Column({
    type: 'enum',
    enum: JournalEntryType,
  })
  type!: JournalEntryType; // Type of transaction

  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status!: JournalEntryStatus; // DRAFT, POSTED, REVERSED

  @Column({ type: 'text' })
  description!: string; // Description of the transaction

  @Column({ type: 'text', nullable: true })
  reference?: string; // External reference (e.g., invoice number, payment receipt)

  @Column({ nullable: true })
  referenceId?: number; // ID of related entity (invoice, payment, etc.)

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalDebit!: number; // Total debit amount (must equal totalCredit)

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCredit!: number; // Total credit amount (must equal totalDebit)

  @Column({ nullable: true })
  postedById?: number; // User who posted the entry

  @Column({ type: 'timestamp', nullable: true })
  postedAt?: Date; // When the entry was posted

  @Column({ nullable: true })
  reversedById?: number; // User who reversed the entry

  @Column({ type: 'timestamp', nullable: true })
  reversedAt?: Date; // When the entry was reversed

  @Column({ nullable: true })
  reversedEntryId?: number; // Reference to the reversing entry

  @Column({ type: 'text', nullable: true })
  notes?: string; // Additional notes

  // Relations
  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'postedById' })
  postedBy?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reversedById' })
  reversedBy?: User;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'reversedEntryId' })
  reversedEntry?: JournalEntry;

  @OneToMany(() => JournalEntryLine, line => line.journalEntry, { cascade: true })
  lines!: JournalEntryLine[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

