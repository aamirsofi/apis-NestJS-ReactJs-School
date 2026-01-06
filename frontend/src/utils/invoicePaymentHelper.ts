/**
 * Invoice-Based Payment Helper
 * 
 * This replaces the old payment flow that used studentFeeStructureId
 * with the new invoice-based payment flow.
 */

import { invoicesService, CreateFeeInvoiceData } from '../services/invoices.service';
import { paymentsService } from '../services/payments.service';
import { studentsService } from '../services/students.service';

export interface FeeAllocation {
  feeHead: string;
  feeStructureId: number;
  amount: number;
  sourceType?: 'FEE' | 'TRANSPORT' | 'HOSTEL' | 'FINE' | 'MISC';
  sourceId?: number;
  routePriceId?: number;
  hostelPlanId?: number;
  fineId?: number;
}

export interface PaymentData {
  studentId: number;
  academicYearId: number;
  schoolId: number;
  feeAllocations: FeeAllocation[];
  totalAmount: number;
  discount?: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'online' | 'cheque';
  paymentDate: string;
  transactionId?: string;
  notes?: string;
}

export interface PaymentResult {
  success: boolean;
  invoice?: any;
  payment?: any;
  error?: string;
  message?: string;
}

/**
 * Create invoice-based payment
 * This is the NEW way to process payments
 */
export async function createInvoicePayment(data: PaymentData): Promise<PaymentResult> {
  try {
    console.log('[Invoice Payment] Starting payment process:', data);

    // Validate payment amount
    if (!data.totalAmount || data.totalAmount <= 0) {
      return {
        success: false,
        error: 'Payment amount must be greater than zero',
      };
    }

    // STEP 1: Create invoice with all fee items
    const invoiceItems = data.feeAllocations.map(fee => {
      const item: any = {
        description: fee.feeHead,
        amount: fee.amount,
      };

      // Determine source type and ID
      if (fee.sourceType === 'TRANSPORT' && fee.routePriceId) {
        item.sourceType = 'TRANSPORT';
        item.sourceId = fee.routePriceId;
      } else if (fee.sourceType === 'HOSTEL' && fee.hostelPlanId) {
        item.sourceType = 'HOSTEL';
        item.sourceId = fee.hostelPlanId;
      } else if (fee.sourceType === 'FINE' && fee.fineId) {
        item.sourceType = 'FINE';
        item.sourceId = fee.fineId;
      } else if (fee.sourceType === 'MISC') {
        item.sourceType = 'MISC';
      } else if (fee.feeStructureId && fee.feeStructureId > 0) {
        // Default to FEE type
        item.sourceType = 'FEE';
        item.sourceId = fee.feeStructureId;
      }

      return item;
    });

    const invoiceData: CreateFeeInvoiceData = {
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      issueDate: data.paymentDate,
      dueDate: data.paymentDate, // Same as payment date for immediate payment
      type: 'one_time',
      items: invoiceItems,
      notes: data.notes,
    };

    console.log('[Invoice Payment] Creating invoice:', invoiceData);
    const invoice = await invoicesService.create(invoiceData, data.schoolId);
    console.log('[Invoice Payment] Invoice created:', invoice);

    // STEP 2: Finalize invoice (creates accounting entries)
    console.log('[Invoice Payment] Finalizing invoice:', invoice.id);
    const finalizedInvoice = await invoicesService.finalize(invoice.id, data.schoolId);
    console.log('[Invoice Payment] Invoice finalized:', finalizedInvoice);

    // STEP 3: Create payment against invoice
    const netAmount = data.totalAmount - (data.discount || 0);
    const paymentData = {
      studentId: data.studentId,
      invoiceId: finalizedInvoice.id,
      amount: netAmount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      notes: data.notes,
      schoolId: data.schoolId,
    };

    console.log('[Invoice Payment] Creating payment:', paymentData);
    const payment = await paymentsService.create(paymentData);
    console.log('[Invoice Payment] Payment created:', payment);

    // Note: Opening balance is NOT modified - it remains as a historical record.
    // The current ledger balance is calculated dynamically as:
    // Current Ledger Balance = Opening Balance - Sum of all payments against ledger balance

    return {
      success: true,
      invoice: finalizedInvoice,
      payment,
      message: `Payment of ₹${netAmount.toFixed(2)} recorded successfully. Invoice #${finalizedInvoice.invoiceNumber}, Receipt: ${payment.receiptNumber}`,
    };
  } catch (error: any) {
    console.error('[Invoice Payment] Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to process payment',
    };
  }
}

/**
 * Helper to extract fee allocation from breakdown
 */
export function prepareFeeAllocation(
  feeBreakdown: any[],
  selectedFeeHeads: Set<number>,
  paymentAllocation: Record<number, number>,
  routePriceId?: number
): FeeAllocation[] {
  const allocations: FeeAllocation[] = [];

  for (const [feeIdStr, amount] of Object.entries(paymentAllocation)) {
    const feeId = Number(feeIdStr);
    if (!selectedFeeHeads.has(feeId) || amount <= 0) continue;

    const fee = feeBreakdown.find(f => {
      if (feeId === -1 && f.feeHead === 'Transport Fee') return true;
      if (feeId === 0 && (f.feeHead.includes('Ledger Balance'))) return true;
      return f.feeStructureId === feeId;
    });

    if (!fee) continue;

    const allocation: FeeAllocation = {
      feeHead: fee.feeHead,
      feeStructureId: fee.feeStructureId > 0 ? fee.feeStructureId : 0,
      amount: amount,
    };

    // Detect source type
    if (fee.feeHead === 'Transport Fee' || feeId === -1) {
      allocation.sourceType = 'TRANSPORT';
      allocation.routePriceId = routePriceId || fee.routePriceId;
      allocation.sourceId = allocation.routePriceId;
    } else if (fee.feeHead.toLowerCase().includes('hostel')) {
      allocation.sourceType = 'HOSTEL';
      allocation.hostelPlanId = fee.hostelPlanId;
      allocation.sourceId = allocation.hostelPlanId;
    } else if (fee.feeHead.toLowerCase().includes('fine')) {
      allocation.sourceType = 'FINE';
      allocation.fineId = fee.fineId;
      allocation.sourceId = allocation.fineId;
    } else if (feeId === 0 || fee.feeHead.includes('Ledger Balance')) {
      // Ledger Balance / Opening Balance - no sourceType/sourceId
      // This is intentionally left undefined as ledger balance has no specific source
      allocation.feeStructureId = 0;
    } else if (fee.feeStructureId > 0) {
      allocation.sourceType = 'FEE';
      allocation.sourceId = fee.feeStructureId;
    } else {
      allocation.sourceType = 'MISC';
    }

    allocations.push(allocation);
  }

  return allocations;
}

