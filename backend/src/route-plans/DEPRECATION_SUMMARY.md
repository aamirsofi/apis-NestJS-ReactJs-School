# Route Plans Deprecation Summary

## What Was Deprecated?

All `route_plans` related features are now marked as **deprecated** in favor of `route_prices`.

## Changes Made

### 1. API Endpoints (All Deprecated)
- ✅ `GET /super-admin/route-plans` → Use `GET /super-admin/route-prices`
- ✅ `GET /super-admin/route-plans/:id` → Use `GET /super-admin/route-prices/:id`
- ✅ `POST /super-admin/route-plans` → Use `POST /super-admin/route-prices`
- ✅ `PATCH /super-admin/route-plans/:id` → Use `PATCH /super-admin/route-prices/:id`
- ✅ `DELETE /super-admin/route-plans/:id` → Use `DELETE /super-admin/route-prices/:id`

**All endpoints:**
- Marked with `@deprecated` JSDoc tags
- Swagger shows `deprecated: true`
- Return deprecation headers:
  - `X-Deprecated: true`
  - `X-Deprecation-Message: <message>`
  - `X-Deprecation-Date: 2025-01-05`

### 2. Student Entity
- ✅ `routePlanId` field marked as deprecated
- ✅ `routePlan` relation marked as deprecated
- ⚠️ Still functional for backward compatibility
- 📝 Use `routeId` directly instead

### 3. Fee Generation Service
- ✅ `routePlanId` usage marked with deprecation warning
- ⚠️ Still functional, logs warning when used
- 📝 Should migrate to use `routeId` with `route_prices`

### 4. Service Methods
- ✅ All `super-admin.service.ts` route plan methods marked as deprecated
- ✅ JSDoc comments added with migration guidance

## Migration Checklist

### For Frontend Developers
- [ ] Update API calls from `/route-plans` to `/route-prices`
- [ ] Remove `routePlanId` from student forms
- [ ] Use `routeId` directly for transport fee queries
- [ ] Update fee breakdown to use `route_prices` API

### For Backend Developers
- [ ] Migrate existing `route_plans` data to `route_prices`
- [ ] Update fee generation to use `route_prices`
- [ ] Remove `routePlanId` from student DTOs
- [ ] Update tests to use `route_prices`

### For Database Administrators
- [ ] Run migration script (see DEPRECATION.md)
- [ ] Verify data migration
- [ ] Plan removal of `route_plans` table (future release)

## Backward Compatibility

✅ **All deprecated code still works** during the deprecation period:
- Old API endpoints respond normally
- Old code paths still functional
- Deprecation warnings in logs/headers only

⚠️ **New features should use `route_prices`**:
- Don't add new code using `route_plans`
- Use `route_prices` for all new transport fee logic

## Timeline

- **Phase 1 (Current)**: Mark as deprecated ✅
- **Phase 2 (Next Release)**: Migrate data and update frontend
- **Phase 3 (Future Release)**: Remove deprecated code and table

## Files Modified

1. `backend/src/super-admin/super-admin.controller.ts` - API endpoints deprecated
2. `backend/src/super-admin/super-admin.service.ts` - Service methods deprecated
3. `backend/src/students/entities/student.entity.ts` - Field/relation deprecated
4. `backend/src/fee-generation/fee-generation.service.ts` - Usage marked with warning
5. `backend/src/route-plans/DEPRECATION.md` - Migration guide created

## Next Steps

1. ✅ Deprecation markers added
2. ⏳ Create route_prices CRUD endpoints (if not exists)
3. ⏳ Migrate existing data
4. ⏳ Update frontend
5. ⏳ Remove deprecated code (future)

## Support

See `DEPRECATION.md` for detailed migration guide and SQL scripts.

