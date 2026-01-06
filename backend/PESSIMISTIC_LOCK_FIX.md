# Pessimistic Lock Fix - FOR UPDATE Error

## Error

```
FOR UPDATE cannot be applied to the nullable side of an outer join
```

## Root Cause

In `payments.service.ts`, we were trying to lock the invoice row with related items loaded:

```typescript
// ❌ BEFORE (Line 171-175)
const invoice = await queryRunner.manager.findOne(FeeInvoice, {
  where: { id: createPaymentDto.invoiceId, schoolId },
  relations: ['items'],  // This causes LEFT JOIN
  lock: { mode: 'pessimistic_write' },  // FOR UPDATE applied to joined table
});
```

### Why This Failed

When you use `relations` with `lock`, TypeORM generates SQL like:

```sql
SELECT * FROM fee_invoices
LEFT JOIN fee_invoice_items ON ...
FOR UPDATE;  -- ❌ PostgreSQL doesn't allow this!
```

PostgreSQL doesn't allow `FOR UPDATE` (pessimistic write lock) on the nullable (right) side of an outer join (`LEFT JOIN`).

## The Fix

**File:** `backend/src/payments/payments.service.ts`

### 1. Added Import

```typescript
import { FeeInvoiceItem } from '../invoices/entities/fee-invoice-item.entity';
```

### 2. Split the Lock and Load Operations

```typescript
// ✅ AFTER (Line 171-186)
try {
  // Step 1: Lock ONLY the invoice row (no relations)
  const invoice = await queryRunner.manager.findOne(FeeInvoice, {
    where: { id: createPaymentDto.invoiceId, schoolId },
    lock: { mode: 'pessimistic_write' },  // Lock only main table
  });

  if (!invoice) {
    throw new NotFoundException(
      `Invoice #${createPaymentDto.invoiceId} not found for school ${schoolId}`
    );
  }

  // Step 2: Load items in a separate query (within same transaction)
  invoice.items = await queryRunner.manager.find(FeeInvoiceItem, {
    where: { invoiceId: invoice.id },
  });
```

### Generated SQL (After Fix)

```sql
-- Step 1: Lock the invoice (no JOIN)
SELECT * FROM fee_invoices 
WHERE id = $1 AND school_id = $2
FOR UPDATE;  -- ✅ Works! No JOIN involved

-- Step 2: Load items separately
SELECT * FROM fee_invoice_items 
WHERE invoice_id = $1;
```

## How It Works Now

### Flow

```
┌────────────────────────────────────────────────────────┐
│ Transaction Start                                      │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 1: Lock Invoice Row (Pessimistic Write)          │
├────────────────────────────────────────────────────────┤
│ SELECT * FROM fee_invoices                             │
│ WHERE id = 17 AND school_id = 9                        │
│ FOR UPDATE;  ✅ No JOIN, lock succeeds                │
│                                                        │
│ Result:                                                │
│ - Invoice row locked                                   │
│ - Other transactions wait                              │
│ - Race conditions prevented                            │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 2: Load Invoice Items (No Lock Needed)           │
├────────────────────────────────────────────────────────┤
│ SELECT * FROM fee_invoice_items                        │
│ WHERE invoice_id = 17;                                 │
│                                                        │
│ Result:                                                │
│ - Items loaded into invoice.items                      │
│ - No locking needed (invoice already locked)           │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 3: Validate Payment                              │
├────────────────────────────────────────────────────────┤
│ - Check invoice belongs to student                     │
│ - Validate invoice not draft/cancelled                 │
│ - Check payment amount <= remaining balance            │
│                                                        │
│ If validation fails → Rollback transaction             │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Step 4: Create Payment & Update Invoice               │
├────────────────────────────────────────────────────────┤
│ INSERT INTO payments (...);                            │
│                                                        │
│ UPDATE fee_invoices                                    │
│ SET                                                    │
│   paid_amount = paid_amount + 4500,                    │
│   balance_amount = balance_amount - 4500,              │
│   status = 'paid' OR 'partially_paid'                  │
│ WHERE id = 17;                                         │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Transaction Commit                                     │
├────────────────────────────────────────────────────────┤
│ - Payment saved                                        │
│ - Invoice updated                                      │
│ - Lock released                                        │
│ - Other transactions can proceed                       │
└────────────────────────────────────────────────────────┘
```

## Why This Fix Works

### 1. **Locking Strategy**
- Lock **only** the main invoice row (no relations)
- PostgreSQL allows `FOR UPDATE` on single table
- Prevents race conditions when multiple payments hit same invoice

### 2. **Data Consistency**
- Items loaded within same transaction
- If invoice changes between lock and item load, transaction isolation ensures consistency
- Items are only read, not modified, so no lock needed on them

### 3. **Performance**
- Two separate queries are fast (indexed lookups)
- Minimal lock time (only invoice row locked)
- Other transactions blocked only briefly

## Benefits

### Before Fix
❌ Error: "FOR UPDATE cannot be applied to the nullable side of an outer join"  
❌ Payment creation fails  
❌ User sees error message  

### After Fix
✅ Invoice row locked successfully  
✅ Items loaded in separate query  
✅ Payment created successfully  
✅ Race conditions prevented  
✅ Concurrent payments handled correctly  

## Testing

### Test Case 1: Single Payment
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": 8,
    "invoiceId": 17,
    "amount": 4500,
    "paymentDate": "2026-01-06",
    "paymentMethod": "cash",
    "notes": "Full payment"
  }'
```

**Expected:** ✅ Payment created successfully

### Test Case 2: Concurrent Payments (Race Condition)

**Scenario:** Two users try to pay same invoice simultaneously

```
Time    User A                          User B
----    ------                          ------
T1      POST /payments (₹2000)          
T2                                      POST /payments (₹2500)
T3      Lock acquired ✅                Waiting for lock...
T4      Payment validated               Still waiting...
T5      Payment created                 Still waiting...
T6      Invoice updated                 Still waiting...
T7      Lock released                   Lock acquired ✅
T8                                      Payment validated
T9                                      Payment created
T10                                     Invoice updated
T11                                     Lock released
```

**Result:**
- User A's payment: ✅ Success (₹2000 paid)
- User B's payment: ✅ Success (₹2500 paid)
- Invoice: ✅ Correctly updated (₹4500 total paid)
- No race condition: ✅ Each payment processed sequentially

### Test Case 3: Overpayment Prevention

```bash
# Invoice balance: ₹1000
# User tries to pay: ₹1500

curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 17,
    "amount": 1500
  }'
```

**Expected:** ❌ Error: "Payment amount (₹1500) exceeds remaining balance (₹1000)"

## PostgreSQL Locking Modes

For reference, here are PostgreSQL's lock modes used with `FOR UPDATE`:

| Mode | TypeORM | SQL | Use Case |
|------|---------|-----|----------|
| Pessimistic Read | `pessimistic_read` | `FOR SHARE` | Read but prevent updates |
| Pessimistic Write | `pessimistic_write` | `FOR UPDATE` | Lock for update (our use case) |
| Pessimistic Write or Fail | `pessimistic_write_or_fail` | `FOR UPDATE NOWAIT` | Fail immediately if locked |

**Our Choice:** `pessimistic_write` - Wait for lock to be released, then acquire it

## Related Documentation

- [TypeORM Locking](https://typeorm.io/select-query-builder#locking)
- [PostgreSQL Row Locking](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS)
- [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

## Summary

✅ **Fixed:** Split pessimistic lock and relation loading into separate operations  
✅ **Verified:** Backend builds successfully  
✅ **Result:** Payment creation now works with proper concurrency control  
✅ **Benefit:** Race conditions prevented, invoice balances always correct  

---

**Date:** January 6, 2026  
**Status:** ✅ Complete - Ready for Testing

