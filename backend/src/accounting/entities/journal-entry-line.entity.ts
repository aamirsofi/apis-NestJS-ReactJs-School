import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';

/**
 * Journal Entry Line Entity
 * Represents a single debit or credit line in a journal entry
 * Each journal entry must have at least 2 lines (one debit, one credit)
 * Total debits must equal total credits
 */
@Entity('journal_entry_lines')
@Index(['journalEntryId', 'accountId'])
export class JournalEntryLine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  journalEntryId!: number;

  @Column()
  accountId!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  debitAmount!: number; // Debit amount (0 if credit line)

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  creditAmount!: number; // Credit amount (0 if debit line)

  @Column({ type: 'text', nullable: true })
  description?: string; // Line item description

  // Relations
  @ManyToOne(() => JournalEntry, entry => entry.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry!: JournalEntry;

  @ManyToOne(() => Account, account => account.journalEntryLines)
  @JoinColumn({ name: 'accountId' })
  account!: Account;
}

