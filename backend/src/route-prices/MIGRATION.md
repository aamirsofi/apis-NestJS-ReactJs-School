# Route Plans to Route Prices Migration Guide

## Overview

This guide explains how to migrate data from the deprecated `route_plans` table to the new `route_prices` table.

## Key Differences

### route_plans (Old)

- `classId` - **nullable** (can be NULL for all classes)
- `categoryHeadId` - **nullable** (can be NULL for all category heads)
- `feeCategoryId` - required (not needed in route_prices)
- `name` - required (not in route_prices)
- `description` - optional (not in route_prices)

### route_prices (New)

- `classId` - **required** (must be specific)
- `categoryHeadId` - **required** (must be specific)
- No `feeCategoryId` (transport fees are identified by category type)
- No `name` or `description`

## Migration Strategy

When a `route_plan` has NULL `classId` or `categoryHeadId`, the migration creates `route_price` entries for **all combinations**:

- **NULL classId** → Creates entries for all active classes in the school
- **NULL categoryHeadId** → Creates entries for all active category heads in the school
- **Both NULL** → Creates entries for all class × category head combinations

## Migration Method

### TypeORM Migration Script (Recommended)

Use the TypeORM migration script to migrate data:

```bash
# Run migration
npm run migration:run

# Or using TypeORM CLI
npx typeorm migration:run -d src/database/data-source.ts
```

The migration script is located at:
`backend/src/migrations/1769200000000-MigrateRoutePlansToRoutePrices.ts`

### Alternative: SQL Script (Direct Database)

For direct database migration, use this SQL script:

```sql
-- Migration script: route_plans → route_prices
-- Handles NULL classId and categoryHeadId by creating entries for all combinations

-- Step 1: Migrate route_plans with both classId and categoryHeadId set
INSERT INTO route_prices (schoolId, routeId, classId, categoryHeadId, amount, status, createdAt, updatedAt)
SELECT
  rp.schoolId,
  rp.routeId,
  rp.classId,
  rp.categoryHeadId,
  rp.amount,
  CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END,
  rp.createdAt,
  rp.updatedAt
FROM route_plans rp
WHERE rp.classId IS NOT NULL
  AND rp.categoryHeadId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM route_prices rp2
    WHERE rp2.schoolId = rp.schoolId
      AND rp2.routeId = rp.routeId
      AND rp2.classId = rp.classId
      AND rp2.categoryHeadId = rp.categoryHeadId
  );

-- Step 2: Migrate route_plans with NULL classId (create for all classes)
INSERT INTO route_prices (schoolId, routeId, classId, categoryHeadId, amount, status, createdAt, updatedAt)
SELECT DISTINCT
  rp.schoolId,
  rp.routeId,
  c.id as classId,
  rp.categoryHeadId,
  rp.amount,
  CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END,
  rp.createdAt,
  rp.updatedAt
FROM route_plans rp
CROSS JOIN classes c
WHERE rp.classId IS NULL
  AND rp.categoryHeadId IS NOT NULL
  AND c.schoolId = rp.schoolId
  AND c.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM route_prices rp2
    WHERE rp2.schoolId = rp.schoolId
      AND rp2.routeId = rp.routeId
      AND rp2.classId = c.id
      AND rp2.categoryHeadId = rp.categoryHeadId
  );

-- Step 3: Migrate route_plans with NULL categoryHeadId (create for all category heads)
INSERT INTO route_prices (schoolId, routeId, classId, categoryHeadId, amount, status, createdAt, updatedAt)
SELECT DISTINCT
  rp.schoolId,
  rp.routeId,
  rp.classId,
  ch.id as categoryHeadId,
  rp.amount,
  CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END,
  rp.createdAt,
  rp.updatedAt
FROM route_plans rp
CROSS JOIN category_heads ch
WHERE rp.classId IS NOT NULL
  AND rp.categoryHeadId IS NULL
  AND ch.schoolId = rp.schoolId
  AND ch.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM route_prices rp2
    WHERE rp2.schoolId = rp.schoolId
      AND rp2.routeId = rp.routeId
      AND rp2.classId = rp.classId
      AND rp2.categoryHeadId = ch.id
  );

-- Step 4: Migrate route_plans with both NULL (create for all class × category head combinations)
INSERT INTO route_prices (schoolId, routeId, classId, categoryHeadId, amount, status, createdAt, updatedAt)
SELECT DISTINCT
  rp.schoolId,
  rp.routeId,
  c.id as classId,
  ch.id as categoryHeadId,
  rp.amount,
  CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END,
  rp.createdAt,
  rp.updatedAt
FROM route_plans rp
CROSS JOIN classes c
CROSS JOIN category_heads ch
WHERE rp.classId IS NULL
  AND rp.categoryHeadId IS NULL
  AND c.schoolId = rp.schoolId
  AND c.status = 'active'
  AND ch.schoolId = rp.schoolId
  AND ch.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM route_prices rp2
    WHERE rp2.schoolId = rp.schoolId
      AND rp2.routeId = rp.routeId
      AND rp2.classId = c.id
      AND rp2.categoryHeadId = ch.id
  );

-- Step 5: Verify migration
SELECT
  (SELECT COUNT(*) FROM route_plans) as route_plans_count,
  (SELECT COUNT(*) FROM route_prices) as route_prices_count,
  (SELECT COUNT(DISTINCT CONCAT(schoolId, '-', routeId, '-', COALESCE(classId, 'NULL'), '-', COALESCE(categoryHeadId, 'NULL'))) FROM route_plans) as unique_route_plans,
  (SELECT COUNT(*) FROM route_prices) as migrated_route_prices;
```

## Migration Steps

### 1. Pre-Migration Checklist

- [ ] Backup database
- [ ] Verify `route_prices` table exists
- [ ] Check for existing `route_prices` data (may conflict)
- [ ] Review route_plans data structure

### 2. Execute Migration

Run the TypeORM migration:

```bash
npm run migration:run
```

Or using TypeORM CLI directly:

```bash
npx typeorm migration:run -d src/database/data-source.ts
```

### 4. Verify Migration

```sql
-- Check counts
SELECT
  (SELECT COUNT(*) FROM route_plans) as route_plans_count,
  (SELECT COUNT(*) FROM route_prices) as route_prices_count;

-- Check for missing combinations
SELECT DISTINCT
  rp.schoolId,
  rp.routeId,
  rp.classId,
  rp.categoryHeadId
FROM route_plans rp
LEFT JOIN route_prices rp2 ON (
  rp2.schoolId = rp.schoolId
  AND rp2.routeId = rp.routeId
  AND rp2.classId = COALESCE(rp.classId, (SELECT id FROM classes WHERE schoolId = rp.schoolId LIMIT 1))
  AND rp2.categoryHeadId = COALESCE(rp.categoryHeadId, (SELECT id FROM category_heads WHERE schoolId = rp.schoolId LIMIT 1))
)
WHERE rp2.id IS NULL;
```

### 5. Update Students

After migration, update students to use `routeId` directly instead of `routePlanId`:

```sql
-- Update students that have routePlanId to use routeId from route_plan
UPDATE students s
SET routeId = rp.routeId
FROM route_plans rp
WHERE s.routePlanId = rp.id
  AND s.routeId IS NULL;
```

## Example Scenarios

### Scenario 1: Route Plan with Specific Class and Category Head

**route_plan:**

```json
{
  "id": 1,
  "schoolId": 1,
  "routeId": 2,
  "classId": 5,
  "categoryHeadId": 1,
  "amount": 2000
}
```

**Result:** Creates 1 route_price entry

### Scenario 2: Route Plan with NULL ClassId

**route_plan:**

```json
{
  "id": 2,
  "schoolId": 1,
  "routeId": 1,
  "classId": null,
  "categoryHeadId": 1,
  "amount": 0
}
```

**Result:** Creates route_price entries for ALL classes in school 1 with categoryHeadId 1

- If school has 10 classes → Creates 10 route_price entries

### Scenario 3: Route Plan with Both NULL

**route_plan:**

```json
{
  "id": 3,
  "schoolId": 1,
  "routeId": 1,
  "classId": null,
  "categoryHeadId": null,
  "amount": 0
}
```

**Result:** Creates route_price entries for ALL combinations

- If school has 10 classes and 3 category heads → Creates 30 route_price entries

## Troubleshooting

### Error: "Route price already exists"

This means a route_price with the same (schoolId, routeId, classId, categoryHeadId) already exists. The migration skips these entries.

**Solution:** Review skipped entries in the response. If needed, delete conflicting route_prices first.

### Error: "Class not found" or "Category head not found"

The route_plan references a class or category head that doesn't exist.

**Solution:**

1. Check if the class/category head was deleted
2. Update the route_plan to use valid IDs
3. Re-run migration

### Migration creates too many entries

If a route_plan has NULL values, it creates entries for all combinations. This is expected behavior.

**Solution:**

1. Review route_plans and update NULL values to specific IDs if needed
2. Delete unwanted route_price entries after migration
3. Use dry run to preview before executing

## Post-Migration

After successful migration:

1. ✅ Verify route_prices data
2. ✅ Update frontend to use route_prices endpoints
3. ✅ Update students to use routeId directly
4. ✅ Test fee calculation with route_prices
5. ⏳ Remove route_plans data (after verification period)

## Rollback

If migration fails or needs to be rolled back:

```sql
-- Delete migrated route_prices (be careful!)
DELETE FROM route_prices
WHERE createdAt >= '2025-01-05'  -- Adjust date as needed
  AND id IN (
    -- List of IDs from migration details
  );
```

**Note:** Keep route_plans data until migration is verified and frontend is updated.
