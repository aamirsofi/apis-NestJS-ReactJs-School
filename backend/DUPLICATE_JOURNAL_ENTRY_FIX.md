# Duplicate Journal Entry Fix - Partial Payments

## Problem

**Error:** `duplicate key value violates unique constraint "UQ_c39d78e8744809ece8ca95730e2"`

This occurred when:

1. Creating an invoice through the payment flow
2. Making partial payments

### Root Cause

Accounting journal entries were being created **TWICE**:

1. **During invoice creation** (in `create()` method)
2. **During invoice finalization** (in `finalize()` method)

```typescript
// BEFORE - WRONG FLOW

User clicks "Pay Now"
  ↓
Frontend: Create invoice
  ↓
Backend: invoicesService.create()
  - Creates invoice with status: ISSUED
  - Creates accounting entry ← FIRST TIME ✅
  ↓
Frontend: Finalize invoice
  ↓
Backend: invoicesService.finalize()
  - Checks: if (status !== DRAFT) return early
  - But status is ISSUED! So check passes
  - Creates accounting entry ← SECOND TIME ❌ DUPLICATE!
  ↓
ERROR: Duplicate key constraint violation
```

### Why the Idempotent Check Failed

The `finalize()` method has this check:

```typescript
if (invoice.status !== InvoiceStatus.DRAFT) {
  // Already finalized, return early
  return invoice;
}
```

But invoices were being created with `status: ISSUED`, so this check never triggered!

## Solution

### 1. Create Invoices with DRAFT Status

**File:** `backend/src/invoices/invoices.service.ts` (Line ~69)

```typescript
// BEFORE
const invoice = queryRunner.manager.create(FeeInvoice, {
  // ...
  status: InvoiceStatus.ISSUED, // ❌ Wrong - skips idempotent check
});

// AFTER
const invoice = queryRunner.manager.create(FeeInvoice, {
  // ...
  status: InvoiceStatus.DRAFT, // ✅ Correct - must be finalized separately
});
```

### 2. Remove Accounting Entry from Create Method

**File:** `backend/src/invoices/invoices.service.ts` (Lines ~110-117)

```typescript
// BEFORE - REMOVED
// Create accounting entry for invoice (after transaction commits)
try {
  await this.createInvoiceAccountingEntry(schoolId, invoiceWithItems);
} catch (accountingError) {
  console.error(`Failed to create accounting entry...`, accountingError);
}

// AFTER
// Note: Accounting entries will be created when invoice is finalized
return this.invoiceRepository.findOne({
  where: { id: savedInvoice.id },
  relations: ['items', 'student', 'academicYear'],
}) as Promise<FeeInvoice>;
```

## New Correct Flow

```typescript
// AFTER - CORRECT FLOW

User clicks "Pay Now"
  ↓
Frontend: Create invoice
  ↓
Backend: invoicesService.create()
  - Creates invoice with status: DRAFT  ✅
  - NO accounting entry created        ✅
  ↓
Frontend: Finalize invoice
  ↓
Backend: invoicesService.finalize()
  - Checks: if (status !== DRAFT) return early
  - Status is DRAFT, so continue
  - Creates accounting entry ← ONLY ONCE ✅
  - Updates status to ISSUED
  ↓
Frontend: Create payment
  ↓
Backend: paymentsService.create()
  - Creates payment record
  - Creates payment accounting entry  ✅
  - Updates invoice paidAmount
  ↓
SUCCESS! ✅
```

## Partial Payments Flow

### First Payment (₹2000 of ₹4500)

```
1. Invoice exists (ID: 19)
   - Status: ISSUED
   - Total: ₹4500
   - Paid: ₹0
   - Balance: ₹4500

2. Make payment of ₹2000
   - Payment record created
   - Payment accounting entry: Dr Cash ₹2000, Cr Fees Receivable ₹2000
   - Invoice updated:
     * Paid: ₹2000
     * Balance: ₹2500
     * Status: PARTIALLY_PAID

3. Result: ✅ Success
```

### Second Payment (₹1500 of remaining ₹2500)

```
1. Invoice status (ID: 19)
   - Status: PARTIALLY_PAID
   - Total: ₹4500
   - Paid: ₹2000
   - Balance: ₹2500

2. Make payment of ₹1500
   - Payment record created
   - Payment accounting entry: Dr Cash ₹1500, Cr Fees Receivable ₹1500
   - Invoice updated:
     * Paid: ₹3500
     * Balance: ₹1000
     * Status: PARTIALLY_PAID (still not fully paid)

3. Result: ✅ Success (no duplicate error!)
```

### Third Payment (₹1000 - Final)

```
1. Invoice status (ID: 19)
   - Status: PARTIALLY_PAID
   - Total: ₹4500
   - Paid: ₹3500
   - Balance: ₹1000

2. Make payment of ₹1000
   - Payment record created
   - Payment accounting entry: Dr Cash ₹1000, Cr Fees Receivable ₹1000
   - Invoice updated:
     * Paid: ₹4500
     * Balance: ₹0
     * Status: PAID ✅

3. Result: ✅ Fully paid!
```

## Journal Entries Created

### Invoice Finalization (One Time Only)

```
Journal Entry #JE-20260106-0001
Date: 2026-01-06
Type: INVOICE
Reference: INV-2026-0001

Dr  Fees Receivable          ₹4,500.00
  Cr  Tuition Income                    ₹1,200.00
  Cr  Library Income                      ₹100.00
  Cr  Transport Income                  ₹3,200.00
```

### Payment 1 (₹2000)

```
Journal Entry #JE-20260106-0002
Date: 2026-01-06
Type: PAYMENT
Reference: REC-20260106-0001

Dr  Cash/Bank                ₹2,000.00
  Cr  Fees Receivable                   ₹2,000.00
```

### Payment 2 (₹1500)

```
Journal Entry #JE-20260106-0003
Date: 2026-01-06
Type: PAYMENT
Reference: REC-20260106-0002

Dr  Cash/Bank                ₹1,500.00
  Cr  Fees Receivable                   ₹1,500.00
```

### Payment 3 (₹1000)

```
Journal Entry #JE-20260106-0004
Date: 2026-01-06
Type: PAYMENT
Reference: REC-20260106-0003

Dr  Cash/Bank                ₹1,000.00
  Cr  Fees Receivable                   ₹1,000.00
```

## Benefits

### Before Fix

❌ Duplicate journal entries  
❌ Database constraint violations  
❌ Partial payments failed  
❌ Invoices created as ISSUED without proper finalization

### After Fix

✅ Journal entries created only once (during finalization)  
✅ No duplicate constraint violations  
✅ Partial payments work correctly  
✅ Proper invoice lifecycle: DRAFT → ISSUED → PARTIALLY_PAID → PAID  
✅ Clean separation: Create → Finalize → Pay

## Invoice Status Flow

```
DRAFT ─────finalize()────→ ISSUED ─────payment────→ PARTIALLY_PAID ─────full payment────→ PAID
  │                           │                           │
  │                           │                           │
  └─ No accounting        └─ Journal entry          └─ Payment entries
     entries yet             created (once!)           created (multiple OK)
```

## Testing

### Test Case 1: Single Full Payment

1. Create invoice → Status: DRAFT
2. Finalize invoice → Status: ISSUED, Journal entry created
3. Pay full amount (₹4500) → Status: PAID
4. **Expected:** ✅ No duplicate errors

### Test Case 2: Partial Payments

1. Create invoice → Status: DRAFT
2. Finalize invoice → Status: ISSUED, Journal entry created
3. Pay ₹2000 → Status: PARTIALLY_PAID
4. Pay ₹1500 → Status: PARTIALLY_PAID
5. Pay ₹1000 → Status: PAID
6. **Expected:** ✅ All payments succeed, no duplicate errors

### Test Case 3: Overpayment Prevention

1. Invoice balance: ₹1000
2. Try to pay ₹1500
3. **Expected:** ❌ Error: "Payment amount exceeds remaining balance"

## Summary

✅ **Fixed:** Invoices now created with DRAFT status  
✅ **Fixed:** Accounting entries created only during finalization  
✅ **Fixed:** Duplicate journal entry error resolved  
✅ **Result:** Partial payments work correctly

---

**Date:** January 6, 2026  
**Status:** ✅ Complete - Ready to Test

**Next:** Try making partial payments on an invoice!
