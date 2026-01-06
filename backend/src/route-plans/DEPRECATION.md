# Route Plans Deprecation Guide

## Overview

The `route_plans` table and related features are being **deprecated** in favor of `route_prices`. This document outlines the deprecation strategy and migration path.

## Why Deprecate?

- **Simpler Architecture**: `route_prices` provides a cleaner, more direct pricing model
- **Better Separation**: Pricing is now clearly separated from logistics (`routes` table)
- **Consistency**: All fees follow the same pattern (school fees in `fee_structures`, transport fees in `route_prices`)

## Deprecation Timeline

### Phase 1: Mark as Deprecated (Current)
- ✅ Route plans API endpoints marked as deprecated
- ✅ Code updated to use `route_prices` where possible
- ⚠️ Old code still functional for backward compatibility

### Phase 2: Migration Period (Next Release)
- Migrate existing `route_plans` data to `route_prices`
- Update frontend to use `route_prices` endpoints
- Remove `routePlanId` from students (use `routeId` directly)

### Phase 3: Removal (Future Release)
- Remove `route_plans` table
- Remove deprecated code
- Remove `routePlanId` field from students table

## Migration Guide

### For Developers

#### 1. Students Entity
**Old (Deprecated)**:
```typescript
student.routePlanId  // ❌ Deprecated
```

**New**:
```typescript
student.routeId  // ✅ Use this directly
```

#### 2. Transport Fee Pricing
**Old (Deprecated)**:
```typescript
// Query route_plans
const routePlan = await routePlanRepository.findOne({
  where: { id: student.routePlanId }
});
const amount = routePlan.amount;
```

**New**:
```typescript
// Query route_prices
const routePrice = await routePriceRepository.findOne({
  where: {
    schoolId: student.schoolId,
    routeId: student.routeId,
    classId: student.classId,
    categoryHeadId: student.categoryHeadId,
  }
});
const amount = routePrice.amount;
```

#### 3. API Endpoints
**Old (Deprecated)**:
```
GET    /super-admin/route-plans
GET    /super-admin/route-plans/:id
POST   /super-admin/route-plans
PATCH  /super-admin/route-plans/:id
DELETE /super-admin/route-plans/:id
```

**New**:
```
GET    /super-admin/route-prices
GET    /super-admin/route-prices/:id
POST   /super-admin/route-prices
PATCH  /super-admin/route-prices/:id
DELETE /super-admin/route-prices/:id
```

### For Database Administrators

#### Migration Script (PostgreSQL)

```sql
-- Step 1: Create route_prices entries from route_plans
INSERT INTO route_prices (schoolId, routeId, classId, categoryHeadId, amount, status, createdAt, updatedAt)
SELECT 
  rp.schoolId,
  rp.routeId,
  COALESCE(rp.classId, c.id) as classId,  -- Use route plan's classId or default class
  COALESCE(rp.categoryHeadId, ch.id) as categoryHeadId,  -- Use route plan's categoryHeadId or default
  rp.amount,
  CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END as status,
  rp.createdAt,
  rp.updatedAt
FROM route_plans rp
LEFT JOIN classes c ON c.schoolId = rp.schoolId AND c.name = 'Default'
LEFT JOIN category_heads ch ON ch.schoolId = rp.schoolId AND ch.name = 'General'
WHERE NOT EXISTS (
  SELECT 1 FROM route_prices rp2
  WHERE rp2.schoolId = rp.schoolId
    AND rp2.routeId = rp.routeId
    AND rp2.classId = COALESCE(rp.classId, c.id)
    AND rp2.categoryHeadId = COALESCE(rp.categoryHeadId, ch.id)
);

-- Step 2: Update students to use routeId directly (if routePlanId was set)
UPDATE students s
SET routeId = rp.routeId
FROM route_plans rp
WHERE s.routePlanId = rp.id
  AND s.routeId IS NULL;

-- Step 3: Verify migration
SELECT 
  COUNT(*) as route_plans_count,
  (SELECT COUNT(*) FROM route_prices) as route_prices_count
FROM route_plans;
```

## Breaking Changes

### API Responses
- Route plans endpoints will return deprecation warnings in headers
- Responses include `X-Deprecated: true` header
- Responses include `X-Deprecation-Message` header with migration info

### Database Schema
- `route_plans` table will be removed in future release
- `students.routePlanId` column will be removed
- Foreign key constraints will be updated

## Backward Compatibility

During the deprecation period:
- ✅ Old API endpoints still work
- ✅ Old code paths still functional
- ⚠️ New features should use `route_prices`
- ⚠️ Deprecation warnings logged

## Support

For questions or issues during migration:
1. Check this deprecation guide
2. Review `route_prices` implementation
3. Contact backend team for assistance

## References

- `route_prices` entity: `backend/src/route-prices/entities/route-price.entity.ts`
- Fee calculation service: `backend/src/fee-calculation/fee-calculation.service.ts`
- Route prices API: `/super-admin/route-prices`

