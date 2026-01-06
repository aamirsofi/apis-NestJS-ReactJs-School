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

/**
 * Account Type Enum
 * Categorizes accounts into standard accounting categories
 */
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  INCOME = 'income',
  EXPENSE = 'expense',
}

/**
 * Account Subtype Enum
 * Provides more granular categorization within account types
 */
export enum AccountSubtype {
  // Assets
  CURRENT_ASSET = 'current_asset',
  FIXED_ASSET = 'fixed_asset',
  CASH = 'cash',
  BANK = 'bank',
  RECEIVABLE = 'receivable',
  
  // Liabilities
  CURRENT_LIABILITY = 'current_liability',
  LONG_TERM_LIABILITY = 'long_term_liability',
  UNEARNED_REVENUE = 'unearned_revenue',
  
  // Income
  OPERATING_INCOME = 'operating_income',
  NON_OPERATING_INCOME = 'non_operating_income',
  
  // Expenses
  OPERATING_EXPENSE = 'operating_expense',
  NON_OPERATING_EXPENSE = 'non_operating_expense',
}

/**
 * Chart of Accounts Entity
 * Represents accounts in the double-entry accounting system
 */
@Entity('accounts')
@Index(['schoolId', 'code'], { unique: true })
@Index(['schoolId', 'name'])
export class Account {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  schoolId!: number;

  @Column({ length: 50, unique: false })
  code!: string; // Account code (e.g., "1001", "4001")

  @Column({ length: 255 })
  name!: string; // Account name (e.g., "Cash", "Tuition Fee Income")

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType; // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

  @Column({
    type: 'enum',
    enum: AccountSubtype,
    nullable: true,
  })
  subtype?: AccountSubtype; // More granular categorization

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean; // Can be deactivated but not deleted

  @Column({ default: false })
  isSystemAccount!: boolean; // System accounts cannot be deleted

  @Column({ nullable: true })
  parentAccountId?: number; // For hierarchical account structure

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  openingBalance!: number; // Opening balance for the account

  @Column({ type: 'date', nullable: true })
  openingBalanceDate?: Date; // Date of opening balance

  // Relations
  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'parentAccountId' })
  parentAccount?: Account;

  @OneToMany(() => Account, account => account.parentAccount)
  childAccounts!: Account[];

  @OneToMany(() => JournalEntryLine, line => line.account)
  journalEntryLines!: JournalEntryLine[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

