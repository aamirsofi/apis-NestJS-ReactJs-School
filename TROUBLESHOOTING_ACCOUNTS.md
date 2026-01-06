# Troubleshooting: Accounts Not Showing

## Issue: Accounts created manually are not showing

### Possible Causes:

1. **Accounts don't have `isActive: true`**
2. **Accounts don't have the correct `schoolId`**
3. **Accounts are missing required fields**

### Solution 1: Check Your Accounts in Database

Run this SQL query to check your accounts:

```sql
-- Check all accounts for your school (replace SCHOOL_ID with your actual school ID)
SELECT id, code, name, type, "isActive", "schoolId", "isSystemAccount"
FROM accounts
WHERE "schoolId" = YOUR_SCHOOL_ID;
```

### Solution 2: Update Manually Created Accounts

If accounts exist but aren't showing, update them:

```sql
-- Set isActive to true for all accounts
UPDATE accounts
SET "isActive" = true
WHERE "schoolId" = YOUR_SCHOOL_ID AND "isActive" IS NULL OR "isActive" = false;

-- Verify the update
SELECT id, code, name, "isActive" FROM accounts WHERE "schoolId" = YOUR_SCHOOL_ID;
```

### Solution 3: Use Initialize Endpoint

The easiest way is to use the initialize endpoint which will:
- Create missing default accounts
- Skip accounts that already exist
- Return all accounts (existing + newly created)

**API Call:**
```bash
POST http://localhost:3000/accounting/accounts/initialize
Authorization: Bearer <your-token>
```

### Solution 4: View All Accounts (Including Inactive)

The frontend now supports viewing inactive accounts. You can modify the query to include them:

**API Call:**
```bash
GET http://localhost:3000/accounting/accounts?includeInactive=true
Authorization: Bearer <your-token>
```

### Solution 5: Verify School ID

Make sure your accounts have the correct `schoolId`. Check what school ID you're logged in as:

```sql
-- Check your user's school ID
SELECT id, "schoolId" FROM users WHERE id = YOUR_USER_ID;

-- Then check if accounts match
SELECT id, code, name, "schoolId" FROM accounts WHERE "schoolId" = YOUR_SCHOOL_ID;
```

## Default Accounts That Should Exist

After initialization, you should have these accounts:

- **1001** - Cash (asset)
- **1002** - Bank (asset)
- **1101** - Fees Receivable (asset)
- **2001** - Advance Fees (liability)
- **4001** - Tuition Fee Income (income)
- **4002** - Transport Fee Income (income)
- **4003** - Lab Fee Income (income)
- **4004** - Library Fee Income (income)
- **4005** - Other Fee Income (income)

## Quick Fix Script

If you want to quickly fix manually created accounts:

```sql
-- Update all accounts for a school to be active
UPDATE accounts
SET 
  "isActive" = COALESCE("isActive", true),
  "isSystemAccount" = COALESCE("isSystemAccount", false),
  "openingBalance" = COALESCE("openingBalance", 0)
WHERE "schoolId" = YOUR_SCHOOL_ID;
```

## Testing the Fix

After fixing, test by:

1. **Call the API:**
   ```bash
   GET http://localhost:3000/accounting/accounts
   Authorization: Bearer <your-token>
   ```

2. **Check the response** - should return all active accounts

3. **Try initialize again** - should return existing accounts without errors

---

**Note**: The backend now properly handles the initialization and will not create duplicate accounts if they already exist.

