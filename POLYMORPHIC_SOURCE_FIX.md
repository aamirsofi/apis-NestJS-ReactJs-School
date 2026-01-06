# Polymorphic Source Fields Fix

## Issue

Invoice items were being created with `null` values for `sourceType` and `sourceId`:

```json
{
    "id": 36,
    "invoiceId": 16,
    "feeStructureId": null,
    "sourceType": null,    // ❌ Should be "TRANSPORT"
    "sourceId": null,      // ❌ Should be routePriceId
    "description": "Transport Fee",
    "amount": "3200.00"
}
```

This defeated the purpose of implementing polymorphic sources to track where each invoice item came from.

## Root Cause

The fee breakdown in `FeeRegistry.tsx` was not including the `routePriceId` when adding Transport Fee items:

```typescript
// BEFORE (Line 814-821)
breakdown.push({
  feeHead: "Transport Fee",
  feeStructureId: transportFeeStructureId || 0,
  monthlyAmounts,
  total,
  received: transportReceived,
  balance: total - transportReceived,
  // ⚠️ Missing: routePriceId!
});
```

### Why This Caused the Problem

1. **Fee Breakdown Created** → Transport Fee added without `routePriceId`
2. **prepareFeeAllocation Called** → Tries to get `fee.routePriceId` (undefined!)
3. **createInvoicePayment** → Checks `if (fee.sourceType === 'TRANSPORT' && fee.routePriceId)`
4. **Condition Fails** → Because `fee.routePriceId` is `undefined`
5. **Result** → `sourceType` and `sourceId` never added to invoice item

## The Fix

### 1. Add `routePriceId` to Fee Breakdown

**File:** `frontend/src/pages/super-admin/FeeRegistry.tsx`

```typescript
// AFTER (Line 814-822)
breakdown.push({
  feeHead: "Transport Fee",
  feeStructureId: transportFeeStructureId || 0,
  routePriceId: routePrice.id,  // ✅ Added routePriceId
  monthlyAmounts,
  total,
  received: transportReceived,
  balance: total - transportReceived,
});
```

### 2. Update Parameter to prepareFeeAllocation

**File:** `frontend/src/pages/super-admin/FeeRegistry.tsx`

```typescript
// BEFORE
const allocations = prepareFeeAllocation(
  feeBreakdown,
  selectedFeeHeads,
  paymentAllocation,
  studentDetails.routeId  // ❌ Wrong: routeId, not routePriceId
);

// AFTER
const allocations = prepareFeeAllocation(
  feeBreakdown,
  selectedFeeHeads,
  paymentAllocation,
  undefined  // ✅ routePriceId now in breakdown itself
);
```

## How It Works Now

### Complete Flow

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Generate Fee Breakdown                               │
├──────────────────────────────────────────────────────────────┤
│ - Fetch route price for student's route                     │
│ - Add Transport Fee to breakdown:                           │
│   {                                                          │
│     feeHead: "Transport Fee",                                │
│     feeStructureId: 123,                                     │
│     routePriceId: 45,  ✅ NOW INCLUDED                       │
│     total: 3200,                                             │
│     ...                                                      │
│   }                                                          │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Prepare Fee Allocations                             │
├──────────────────────────────────────────────────────────────┤
│ prepareFeeAllocation() finds Transport Fee:                  │
│                                                              │
│ if (fee.feeHead === 'Transport Fee') {                      │
│   allocation.sourceType = 'TRANSPORT';                      │
│   allocation.routePriceId = fee.routePriceId;  ✅ Found!    │
│   allocation.sourceId = allocation.routePriceId;            │
│ }                                                            │
│                                                              │
│ Result:                                                      │
│ {                                                            │
│   feeHead: "Transport Fee",                                  │
│   feeStructureId: 123,                                       │
│   sourceType: "TRANSPORT",  ✅                               │
│   routePriceId: 45,  ✅                                      │
│   sourceId: 45,  ✅                                          │
│   amount: 3200                                               │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Create Invoice Items                                │
├──────────────────────────────────────────────────────────────┤
│ createInvoicePayment() maps allocations:                     │
│                                                              │
│ if (fee.sourceType === 'TRANSPORT' && fee.routePriceId) {   │
│   item.sourceType = 'TRANSPORT';  ✅ Condition now true     │
│   item.sourceId = fee.routePriceId;  ✅                     │
│ }                                                            │
│                                                              │
│ Invoice item sent to backend:                                │
│ {                                                            │
│   description: "Transport Fee",                              │
│   amount: 3200,                                              │
│   sourceType: "TRANSPORT",  ✅                               │
│   sourceId: 45  ✅                                           │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Save to Database                                    │
├──────────────────────────────────────────────────────────────┤
│ Backend InvoicesService.create():                            │
│                                                              │
│ const item = {                                               │
│   invoiceId: 16,                                             │
│   description: "Transport Fee",                              │
│   amount: 3200,                                              │
│   sourceType: "TRANSPORT",  ✅                               │
│   sourceId: 45  ✅                                           │
│ };                                                           │
│                                                              │
│ Database result:                                             │
│ {                                                            │
│   "id": 36,                                                  │
│   "invoiceId": 16,                                           │
│   "sourceType": "TRANSPORT",  ✅ Now saved!                  │
│   "sourceId": 45,  ✅ Now saved!                             │
│   "description": "Transport Fee",                            │
│   "amount": "3200.00"                                        │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
```

## Expected Result

After this fix, new invoices will have properly populated polymorphic fields:

### For Regular Fees (Tuition, Library, etc.)
```json
{
    "sourceType": "FEE",
    "sourceId": 61,  // feeStructureId
    "description": "Tuition Fee - General (12th)",
    "amount": "1200.00"
}
```

### For Transport Fees
```json
{
    "sourceType": "TRANSPORT",
    "sourceId": 45,  // routePriceId
    "description": "Transport Fee",
    "amount": "3200.00"
}
```

### For Hostel Fees (Future)
```json
{
    "sourceType": "HOSTEL",
    "sourceId": 12,  // hostelPlanId
    "description": "Hostel Fee",
    "amount": "5000.00"
}
```

## Benefits

1. **Full Audit Trail**: Can trace each invoice item back to its source
2. **Flexible Pricing**: Support different pricing for Transport, Hostel, Fines, etc.
3. **Accurate Reports**: Know exactly what type of fee each payment was for
4. **Future-Proof**: Easy to add new fee types (Hostel, Fine, Misc)

## Testing

### Test Case 1: Create Invoice with Transport Fee

1. **Navigate to** Fee Registry
2. **Search student** with transport assigned
3. **Select fees** including Transport Fee
4. **Record payment**
5. **Check database**:
```sql
SELECT id, source_type, source_id, description, amount 
FROM fee_invoice_items 
WHERE description = 'Transport Fee'
ORDER BY id DESC LIMIT 1;
```

**Expected:**
```
id | source_type | source_id | description    | amount
---+-------------+-----------+----------------+--------
36 | TRANSPORT   | 45        | Transport Fee  | 3200.00
```

### Test Case 2: Create Invoice with Regular Fees

1. **Navigate to** Fee Registry
2. **Search student**
3. **Select fees** (Tuition, Library, etc.)
4. **Record payment**
5. **Check database**:
```sql
SELECT id, source_type, source_id, description, amount 
FROM fee_invoice_items 
WHERE source_type = 'FEE'
ORDER BY id DESC LIMIT 2;
```

**Expected:**
```
id | source_type | source_id | description                    | amount
---+-------------+-----------+--------------------------------+--------
35 | FEE         | 60        | Tuition Fee - General (12th)   | 1200.00
34 | FEE         | 61        | Library Fee - General (12th)   | 100.00
```

### Test Case 3: Mixed Invoice

1. **Navigate to** Fee Registry
2. **Search student** with transport
3. **Select multiple fees** (Tuition + Transport)
4. **Record payment**
5. **Verify all items** have correct `sourceType` and `sourceId`

## Migration for Existing Data

Existing invoices with `null` sourceType/sourceId will remain as-is. To backfill them:

```sql
-- Backfill FEE type for items with feeStructureId
UPDATE fee_invoice_items
SET 
  source_type = 'FEE',
  source_id = fee_structure_id
WHERE 
  source_type IS NULL 
  AND fee_structure_id IS NOT NULL;

-- Backfill TRANSPORT type (requires manual mapping)
-- This needs to be done based on your business logic
-- Example: If description contains 'Transport'
UPDATE fee_invoice_items
SET source_type = 'TRANSPORT'
WHERE 
  source_type IS NULL 
  AND description LIKE '%Transport%';

-- Note: sourceId for Transport will need to be set manually
-- based on route_prices table
```

## Summary

✅ **Fixed:** Added `routePriceId` to fee breakdown  
✅ **Fixed:** Updated `prepareFeeAllocation` parameter  
✅ **Result:** Invoice items now save with correct `sourceType` and `sourceId`  
✅ **Benefit:** Full polymorphic source tracking for all invoice items  

---

**Date:** January 6, 2026  
**Status:** ✅ Complete - Ready for Testing

