import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FeeInvoice } from './fee-invoice.entity';

/**
 * Invoice Source Type Enum
 * Determines which entity the sourceId points to
 */
export enum InvoiceSourceType {
  FEE = 'FEE',           // Points to fee_structure table
  TRANSPORT = 'TRANSPORT', // Points to route_price table
  HOSTEL = 'HOSTEL',     // Points to hostel_plan table (if you have one)
  FINE = 'FINE',         // Points to fine table (if you have one)
  MISC = 'MISC',         // Points to misc_charge table (if you have one)
}

/**
 * Fee Invoice Item Entity
 * Represents a line item in a fee invoice
 * Each invoice can have multiple items (tuition, transport, lab fee, etc.)
 * 
 * **Polymorphic Pattern:**
 * - Uses sourceType + sourceId to reference different entities
 * - sourceMetadata stores a snapshot for audit trail
 */
@Entity('fee_invoice_items')
@Index(['invoiceId'])
@Index(['sourceType', 'sourceId']) // New polymorphic index
export class FeeInvoiceItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  invoiceId!: number;

  // ====== POLYMORPHIC FIELDS ======
  // Note: When sourceType='FEE', sourceId points to fee_structures.id
  
  @Column({
    type: 'enum',
    enum: InvoiceSourceType,
    nullable: true,
  })
  sourceType?: InvoiceSourceType; // NEW: Type of source entity

  @Column({ nullable: true })
  sourceId?: number; // NEW: ID in the source table

  @Column({ type: 'jsonb', nullable: true })
  sourceMetadata?: Record<string, any>; // NEW: Snapshot of source data for audit trail

  // ====== END POLYMORPHIC FIELDS ======

  @Column({ length: 255 })
  description!: string; // Fee head name (e.g., "Tuition Fee", "Transport Fee")

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number; // Amount for this line item

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount!: number; // Discount applied to this item

  @Column({ type: 'date', nullable: true })
  dueDate?: Date; // Item-specific due date (if different from invoice due date)

  @Column({ type: 'text', nullable: true })
  notes?: string; // Item-specific notes

  // Relations
  @ManyToOne(() => FeeInvoice, invoice => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice!: FeeInvoice;
}

