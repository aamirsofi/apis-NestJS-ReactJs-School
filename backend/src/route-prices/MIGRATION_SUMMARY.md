# Route Plans to Route Prices Migration - Quick Summary

## What Was Created

### 1. Migration Service Method

**Location:** `backend/src/super-admin/super-admin.service.ts`
**Method:** `migrateRoutePlansToRoutePrices()`

**Features:**

- ✅ Handles NULL `classId` → Creates entries for all classes
- ✅ Handles NULL `categoryHeadId` → Creates entries for all category heads
- ✅ Handles both NULL → Creates entries for all combinations
- ✅ Skips existing route_prices (no duplicates)
- ✅ Dry run mode for preview
- ✅ Detailed error reporting
- ✅ School-specific or all-schools migration

### 2. Migration API Endpoint

**Location:** `backend/src/super-admin/super-admin.controller.ts`
**Endpoint:** `POST /super-admin/migrate/route-plans-to-route-prices`

**Query Parameters:**

- `schoolId` (optional): Filter by school
- `dryRun` (optional): Preview mode (true/false)

**Access:** Super Admin only

### 3. TypeORM Migration

**Location:** `backend/src/migrations/1769200000000-MigrateRoutePlansToRoutePrices.ts`

**Features:**

- ✅ Handles all NULL combinations
- ✅ Prevents duplicates
- ✅ Rollback support

### 4. SQL Script

**Location:** `backend/src/route-prices/MIGRATION.md`

Standalone SQL script for direct database migration.

## Quick Start

### Execute Migration

Run the TypeORM migration script:

```bash
npm run migration:run
```

The migration script handles all route_plans data automatically.

### Step 3: Verify

```sql
SELECT
  (SELECT COUNT(*) FROM route_plans) as route_plans_count,
  (SELECT COUNT(*) FROM route_prices) as route_prices_count;
```

## Migration Logic

### Case 1: Both classId and categoryHeadId Set

```
route_plan: { routeId: 2, classId: 5, categoryHeadId: 1 }
→ Creates: 1 route_price entry
```

### Case 2: classId is NULL

```
route_plan: { routeId: 1, classId: NULL, categoryHeadId: 1 }
→ Creates: route_price for EACH class in the school
```

### Case 3: categoryHeadId is NULL

```
route_plan: { routeId: 1, classId: 5, categoryHeadId: NULL }
→ Creates: route_price for EACH category head in the school
```

### Case 4: Both NULL

```
route_plan: { routeId: 1, classId: NULL, categoryHeadId: NULL }
→ Creates: route_price for ALL class × category head combinations
```

## Response Format

```json
{
  "success": true,
  "migrated": 25, // Number of route_prices created
  "skipped": 3, // Number skipped (already exists)
  "errors": [], // Array of errors
  "details": [
    // Detailed migration log
    {
      "routePlanId": 1,
      "routePriceId": 1,
      "routeId": 2,
      "classId": 5,
      "categoryHeadId": 1,
      "amount": 2000,
      "status": "active"
    }
  ]
}
```

## Important Notes

1. **No Data Loss**: route_plans data is preserved (not deleted)
2. **Idempotent**: Can run multiple times safely (skips duplicates)
3. **Dry Run First**: Always test with dryRun=true
4. **Verification**: Check counts and test fee calculation after migration

## Next Steps After Migration

1. ✅ Verify route_prices data
2. ✅ Update frontend to use route_prices endpoints
3. ✅ Update students.routePlanId → routeId
4. ✅ Test fee calculation
5. ⏳ Remove route_plans (after verification period)

## Support

See `MIGRATION.md` for detailed guide and troubleshooting.
