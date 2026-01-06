# Debugging the Duplicate Key Error

## Current Situation

You're still getting: `duplicate key value violates unique constraint "UQ_c39d78e8744809ece8ca95730e2"`

This constraint is on `journal_entries (schoolId, entryNumber)`.

## What I've Implemented

1. ✅ Advisory lock (`pg_advisory_xact_lock`) to prevent concurrent entry number generation
2. ✅ Idempotent invoice finalization (won't create duplicate entries for same invoice)
3. ✅ Entry number generation inside transaction
4. ✅ Backend restarted with new code

## Why It Might Still Fail

### Possibility 1: Backend Code Not Reloaded
The new code with advisory lock might not be running. Check backend startup logs.

### Possibility 2: Multiple Code Paths Creating Entries
There might be another place creating journal entries that doesn't use the advisory lock.

### Possibility 3: Frontend Calling API Multiple Times
Frontend might be making duplicate API calls (double-click, race condition, etc.)

### Possibility 4: Database Transaction Isolation
Advisory lock might not be working if transactions are not properly isolated.

## URGENT: Please Provide These Details

1. **Exact error with timestamp:**
   ```
   Copy the FULL error from browser console or backend logs including:
   - Time
   - Request URL
   - Full error message
   - Stack trace if available
   ```

2. **What were you doing?**
   - Click "Pay Now" once?
   - Click quickly twice?
   - Open two tabs?
   - Something else?

3. **Check backend logs for:**
   ```
   Search for: "Accounting entry created for"
   Search for: "Journal entry created for invoice"
   
   How many times do these appear for a single payment?
   ```

4. **Run this SQL to see what happened:**
   ```sql
   SELECT 
     id, 
     school_id, 
     entry_number,
     type,
     reference,
     reference_id,
     created_at 
   FROM journal_entries 
   WHERE school_id = 9 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

5. **Also check invoices:**
   ```sql
   SELECT 
     id,
     invoice_number,
     status,
     journal_entry_id,
     created_at,
     updated_at
   FROM fee_invoices
   WHERE school_id = 9
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Temporary Workaround (if urgent)

If you need to keep working, you can temporarily disable the unique constraint:

```sql
-- WARNING: This removes the safety check!
ALTER TABLE journal_entries 
DROP CONSTRAINT IF EXISTS "UQ_c39d78e8744809ece8ca95730e2";

-- Add it back after we fix the root cause:
ALTER TABLE journal_entries 
ADD CONSTRAINT "UQ_c39d78e8744809ece8ca95730e2" 
UNIQUE (school_id, entry_number);
```

**DO NOT DO THIS unless you're stuck!** It will allow duplicates which breaks accounting integrity.

## Next Steps

Please provide the information above so I can:
1. Identify the exact code path causing the issue
2. Verify the advisory lock is actually being executed
3. Fix the root cause properly

The advisory lock solution SHOULD work, so there's something specific about your scenario that's causing it to fail.

