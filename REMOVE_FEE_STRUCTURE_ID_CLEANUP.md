# Remove feeStructureId - Database Cleanup

## Why Remove It?

The `feeStructureId` column in `fee_invoice_items` has become **redundant** after implementing polymorphic sources:

### Before (Redundant)
```
feeStructureId | sourceType | sourceId
---------------|------------|----------
60             | FEE        | 60        ← Duplicate!
61             | FEE        | 61        ← Duplicate!
NULL           | TRANSPORT  | 32
```

### After (Clean)
```
sourceType | sourceId
-----------|----------
FEE        | 60       ← Points to fee_structures.id
FEE        | 61       ← Points to fee_structures.id
TRANSPORT  | 32       ← Points to route_prices.id
```

**When `sourceType = 'FEE'`, the `sourceId` already contains the fee structure ID!**

## Changes Made

### 1. Database Migration

**File:** `src/migrations/1770200000000-RemoveFeeStructureIdFromInvoiceItems.ts`

The migration:
1. ✅ Migrates any existing data (sets `sourceType='FEE'` and copies `feeStructureId` to `sourceId`)
2. ✅ Drops the foreign key constraint
3. ✅ Removes the `fee_structure_id` column
4. ✅ Adds helpful comments
5. ✅ Supports rollback (can restore the column if needed)

```typescript
// Step 1: Migrate existing data
UPDATE fee_invoice_items
SET 
    source_type = 'FEE',
    source_id = fee_structure_id
WHERE 
    fee_structure_id IS NOT NULL 
    AND source_type IS NULL;

// Step 2: Drop foreign key
ALTER TABLE "fee_invoice_items" DROP CONSTRAINT "FK_fee_invoice_items_fee_structure";

// Step 3: Drop column
ALTER TABLE "fee_invoice_items" DROP COLUMN "fee_structure_id";
```

### 2. Entity Changes

**File:** `src/invoices/entities/fee-invoice-item.entity.ts`

**Removed:**
```typescript
@Column({ nullable: true })
feeStructureId?: number; // ❌ Removed - redundant with sourceType/sourceId

@ManyToOne(() => FeeStructure, { nullable: true })
@JoinColumn({ name: 'feeStructureId' })
feeStructure?: FeeStructure; // ❌ Removed - no longer needed
```

**Kept:**
```typescript
@Column({
  type: 'enum',
  enum: InvoiceSourceType,
  nullable: true,
})
sourceType?: InvoiceSourceType; // ✅ FEE, TRANSPORT, HOSTEL, FINE, MISC

@Column({ nullable: true })
sourceId?: number; // ✅ Points to the respective source table
```

### 3. DTO Changes

**File:** `src/invoices/dto/create-fee-invoice.dto.ts`

**Removed:**
```typescript
@IsOptional()
@IsNumber()
feeStructureId?: number; // ❌ Removed
```

**Kept:**
```typescript
@IsOptional()
@IsEnum(InvoiceSourceType)
sourceType?: InvoiceSourceType; // ✅ Required

@IsOptional()
@IsNumber()
sourceId?: number; // ✅ Required
```

### 4. Service Changes

**File:** `src/invoices/invoices.service.ts`

**Before:**
```typescript
queryRunner.manager.create(FeeInvoiceItem, {
  invoiceId: savedInvoice.id,
  feeStructureId: item.feeStructureId, // ❌ Removed
  sourceType: item.sourceType,
  sourceId: item.sourceId,
  // ...
});
```

**After:**
```typescript
queryRunner.manager.create(FeeInvoiceItem, {
  invoiceId: savedInvoice.id,
  sourceType: item.sourceType, // ✅ Clean polymorphic approach
  sourceId: item.sourceId,
  // ...
});
```

### 5. Frontend Changes

**Files Updated:**
- `frontend/src/services/invoices.service.ts` - Removed `feeStructureId` from interface
- `frontend/src/utils/invoicePaymentHelper.ts` - Removed `feeStructureId` assignment
- `frontend/src/pages/super-admin/FeeRegistry.tsx` - Removed `feeStructureId` checks

**Before:**
```typescript
const relevantItems = invoice.items.filter(
  (item: any) => 
    (item.sourceType === 'FEE' && item.sourceId === feeStructure.id) ||
    (item.feeStructureId === feeStructure.id) // ❌ Removed - fallback no longer needed
);
```

**After:**
```typescript
const relevantItems = invoice.items.filter(
  (item: any) => 
    item.sourceType === 'FEE' && item.sourceId === feeStructure.id // ✅ Clean check
);
```

## How to Apply the Migration

### Step 1: Run the Migration

```bash
cd backend
npm run migration:run
```

**Expected Output:**
```
query: UPDATE fee_invoice_items SET source_type = 'FEE', source_id = fee_structure_id WHERE fee_structure_id IS NOT NULL AND source_type IS NULL
query: ALTER TABLE "fee_invoice_items" DROP CONSTRAINT "FK_fee_invoice_items_fee_structure"
query: ALTER TABLE "fee_invoice_items" DROP COLUMN "fee_structure_id"
Migration RemoveFeeStructureIdFromInvoiceItems1770200000000 has been executed successfully.
```

### Step 2: Verify the Database

```sql
-- Check the table structure
\d fee_invoice_items;

-- Should NOT see fee_structure_id column
-- Should see: source_type, source_id

-- Check existing data
SELECT id, description, source_type, source_id, amount 
FROM fee_invoice_items 
LIMIT 10;

-- Expected results:
-- description          | source_type | source_id | amount
-- ---------------------|-------------|-----------|--------
-- Tuition Fee          | FEE         | 60        | 1200.00
-- Library Fee          | FEE         | 61        | 100.00
-- Transport Fee        | TRANSPORT   | 32        | 3200.00
```

### Step 3: Restart Backend

```bash
npm run start:dev
```

### Step 4: Test Invoice Creation

Create a new invoice with mixed fees:

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": 8,
    "academicYearId": 4,
    "issueDate": "2026-01-06",
    "dueDate": "2026-02-06",
    "type": "one_time",
    "items": [
      {
        "description": "Tuition Fee",
        "sourceType": "FEE",
        "sourceId": 60,
        "amount": 1200
      },
      {
        "description": "Transport Fee",
        "sourceType": "TRANSPORT",
        "sourceId": 32,
        "amount": 3200
      }
    ]
  }'
```

**Verify:**
- ✅ Invoice created successfully
- ✅ No `feeStructureId` in request
- ✅ Only `sourceType` and `sourceId` used

## Benefits

### 1. **Cleaner Data Model**
❌ **Before:** Three fields to track one relationship  
✅ **After:** Two fields that cover all fee types  

### 2. **Less Confusion**
❌ **Before:** "Which field do I use? `feeStructureId` or `sourceId`?"  
✅ **After:** "Always use `sourceType` + `sourceId`"  

### 3. **Consistent Pattern**
❌ **Before:** Mixed approach (legacy + new)  
✅ **After:** Single polymorphic pattern for all  

### 4. **Easier Queries**
```sql
-- ❌ BEFORE: Need to check multiple fields
SELECT * FROM fee_invoice_items
WHERE feeStructureId = 60 OR (sourceType = 'FEE' AND sourceId = 60);

-- ✅ AFTER: Single check
SELECT * FROM fee_invoice_items
WHERE sourceType = 'FEE' AND sourceId = 60;
```

### 5. **Future-Proof**
Adding new fee types (HOSTEL, FINE, MISC) only requires:
- ✅ Setting `sourceType` = new type
- ✅ Setting `sourceId` = source ID
- ❌ No need to add more columns!

## Rollback Plan

If you need to rollback:

```bash
cd backend
npm run migration:revert
```

This will:
1. Restore the `fee_structure_id` column
2. Copy data back from `sourceId` where `sourceType='FEE'`
3. Restore the foreign key constraint

## Data Mapping Reference

### Fee Types and Their Sources

| sourceType | sourceId Points To | Example |
|------------|-------------------|---------|
| `FEE` | `fee_structures.id` | Tuition, Library, Lab fees |
| `TRANSPORT` | `route_prices.id` | Bus fees by route |
| `HOSTEL` | `hostel_plans.id` | Hostel accommodation |
| `FINE` | `fines.id` | Late payment, disciplinary fines |
| `MISC` | `misc_charges.id` | Other one-time charges |

### Example Queries

**Get all fee items for a specific fee structure:**
```sql
SELECT * FROM fee_invoice_items
WHERE sourceType = 'FEE' AND sourceId = 60;
```

**Get all transport fee items:**
```sql
SELECT * FROM fee_invoice_items
WHERE sourceType = 'TRANSPORT';
```

**Get breakdown by source type:**
```sql
SELECT 
  source_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM fee_invoice_items
GROUP BY source_type;

-- Result:
-- source_type | count | total_amount
-- ------------|-------|-------------
-- FEE         | 150   | 180000.00
-- TRANSPORT   | 75    | 240000.00
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] No `fee_structure_id` column in database
- [ ] Existing invoices still display correctly
- [ ] New invoices can be created
- [ ] Fee Registry shows correct breakdown
- [ ] Payments allocate correctly
- [ ] Backend builds without errors
- [ ] Frontend compiles without errors
- [ ] API responses don't include `feeStructureId`

## Summary

✅ **Removed:** Redundant `feeStructureId` column and field  
✅ **Migrated:** Existing data to `sourceType`/`sourceId`  
✅ **Cleaned:** Entity, DTO, services, and frontend code  
✅ **Verified:** Backend builds successfully  
✅ **Result:** Cleaner, more consistent polymorphic data model  

---

**Date:** January 6, 2026  
**Status:** ✅ Ready to Run Migration  

**Next Step:** Run `npm run migration:run` in the backend directory!

