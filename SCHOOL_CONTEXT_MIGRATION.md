# School Context Migration

## Summary

We've migrated the invoice and payment system to use **global school context** from the authenticated user's session instead of requiring `schoolId` as a query parameter in API calls.

## Changes Made

### Backend Changes

#### `src/invoices/invoices.controller.ts`

**Before:**
```typescript
@Get()
async findAll(
  @Request() req: any,
  @Query('studentId') studentId?: string,
  @Query('status') status?: string,
  @Query('schoolId') schoolId?: string,  // ❌ Required as query param
) {
  // Complex logic to extract schoolId from query or user context
  let targetSchoolId: number | undefined;
  
  if (req.user?.role === 'super_admin') {
    if (schoolId) {
      targetSchoolId = parseInt(schoolId, 10);
      // ... validation
    } else if (req.school?.id) {
      targetSchoolId = req.school.id;
    } else {
      throw new BadRequestException('School ID is required for super admin. Provide ?schoolId= parameter.');
    }
  } else {
    targetSchoolId = req.user?.schoolId || req.school?.id;
  }
  
  return this.invoicesService.findAll(targetSchoolId, ...);
}
```

**After:**
```typescript
@Get()
async findAll(
  @Request() req: any,
  @Query('studentId') studentId?: string,
  @Query('status') status?: string,
  // ✅ No schoolId parameter needed
) {
  // Use school context from authenticated user
  const schoolId = req.school?.id || req.user?.schoolId;
  
  if (!schoolId) {
    throw new BadRequestException('School context not found. Please ensure you are logged in and have access to a school.');
  }

  return this.invoicesService.findAll(schoolId, ...);
}
```

**Updated Endpoints:**
- `POST /invoices` - Create invoice
- `GET /invoices` - Get all invoices
- `GET /invoices/:id` - Get invoice by ID
- `POST /invoices/:id/finalize` - Finalize invoice
- `POST /invoices/generate-from-fee-structures` - Generate invoice from fee structures
- `PATCH /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice

### Frontend Changes

#### `src/services/invoices.service.ts`

**Before:**
```typescript
async create(data: CreateFeeInvoiceData, schoolId?: number): Promise<FeeInvoice> {
  const response = await api.instance.post('/invoices', data, {
    params: schoolId ? { schoolId } : undefined,  // ❌ Passing schoolId
  });
  return response.data;
}

async getAll(params: { studentId?: number; academicYearId?: number; schoolId?: number } = {}) {
  const response = await api.instance.get('/invoices', { params });
  return response.data;
}
```

**After:**
```typescript
async create(data: CreateFeeInvoiceData): Promise<FeeInvoice> {
  const response = await api.instance.post('/invoices', data);  // ✅ No schoolId
  return response.data;
}

async getAll(params: { studentId?: number; academicYearId?: number } = {}) {
  const response = await api.instance.get('/invoices', { params });  // ✅ No schoolId
  return response.data;
}
```

**Updated Methods:**
- `create()` - No longer requires `schoolId` parameter
- `finalize()` - No longer requires `schoolId` parameter
- `getAll()` - No longer accepts `schoolId` in params
- `getById()` - No longer requires `schoolId` parameter
- `addFeeItem()` - No longer requires `schoolId` parameter
- `addTransportItem()` - No longer requires `schoolId` parameter
- `addHostelItem()` - No longer requires `schoolId` parameter
- `addFineItem()` - No longer requires `schoolId` parameter
- `addMiscItem()` - No longer requires `schoolId` parameter
- `recalculateTotals()` - No longer requires `schoolId` parameter

#### `src/utils/invoicePaymentHelper.ts`

**Before:**
```typescript
const invoice = await invoicesService.create(invoiceData, data.schoolId);
const finalizedInvoice = await invoicesService.finalize(invoice.id, data.schoolId);
```

**After:**
```typescript
const invoice = await invoicesService.create(invoiceData);
const finalizedInvoice = await invoicesService.finalize(invoice.id);
```

#### Updated Pages:

1. **`src/pages/super-admin/FeeRegistry.tsx`**
   - Removed `schoolId` from `invoicesService.create()`
   - Changed `invoicesService.getAll()` to use object parameter

2. **`src/pages/Invoices.tsx`**
   - Removed `schoolId` from query key
   - Simplified `invoicesService.getAll()` call

3. **`src/pages/InvoiceDetail.tsx`**
   - Removed `schoolId` from query key
   - Removed `schoolId` from `invoicesService.getById()`

4. **`src/pages/CreateInvoice.tsx`**
   - Removed `schoolId` from `invoicesService.create()`

## Benefits

### 1. **Simplified API Calls**
- Frontend no longer needs to pass `schoolId` in every API call
- Reduces code duplication and potential for errors

### 2. **Better Security**
- School context is enforced at the authentication layer
- Users can only access data from their school
- Prevents potential security issues from manipulating `schoolId` query parameters

### 3. **Cleaner Code**
- Removed repetitive school ID validation logic
- Consistent error handling across all endpoints
- Easier to maintain and extend

### 4. **Better UX**
- Frontend code is simpler and more readable
- Fewer parameters to track and pass around
- Less cognitive load for developers

## How It Works

### Authentication Flow

1. **User logs in** → JWT token is issued with `schoolId` in payload
2. **Frontend makes API call** → Token is sent in `Authorization` header
3. **Backend validates token** → Extracts user and school context from JWT
4. **Controller uses context** → `req.school.id` or `req.user.schoolId` is automatically available
5. **Service processes request** → Uses the authenticated user's school context

### Example Flow

```
Frontend                     Backend                      Database
--------                     -------                      --------
                              
[User Login]
  |
  |-- POST /auth/login ---->  Validate credentials
  |                           Generate JWT token
  |<-- JWT Token ----------   (contains schoolId: 9)
  |
  |
[Create Invoice]
  |
  |-- POST /invoices ------->  Extract JWT token
  |    (No schoolId param)    req.school.id = 9
  |                           invoicesService.create(9, data)
  |                                                    |
  |                                                    |-- INSERT INTO invoices
  |                                                    |   (schoolId=9, ...)
  |<-- Invoice Created ----   Return invoice          |
                              
```

## Migration Checklist

- [x] Update backend `invoices.controller.ts` to use school context
- [x] Update frontend `invoices.service.ts` to remove schoolId parameters
- [x] Update `invoicePaymentHelper.ts` to remove schoolId parameters
- [x] Update `FeeRegistry.tsx` to remove schoolId parameters
- [x] Update `Invoices.tsx` to remove schoolId parameters
- [x] Update `InvoiceDetail.tsx` to remove schoolId parameters
- [x] Update `CreateInvoice.tsx` to remove schoolId parameters
- [x] Build backend successfully
- [ ] Build frontend successfully
- [ ] Test invoice creation flow
- [ ] Test payment flow
- [ ] Test invoice finalization flow

## Testing

After this migration, test the following scenarios:

1. **Create Invoice**: Ensure invoices are created with correct `schoolId`
2. **List Invoices**: Ensure only invoices from user's school are visible
3. **View Invoice**: Ensure invoice details load correctly
4. **Finalize Invoice**: Ensure finalization works without schoolId parameter
5. **Create Payment**: Ensure payment flow works with new invoice system
6. **Multi-School Access** (if applicable): Ensure super_admin can switch schools

## Rollback Plan

If issues arise, you can temporarily revert by:

1. Revert backend controller changes
2. Revert frontend service changes
3. Add back `schoolId` query parameters
4. Re-deploy previous version

However, this should not be necessary as the changes are backward-compatible with the authentication system.

---

**Date:** January 6, 2026  
**Status:** ✅ Backend Complete | ⏳ Frontend Pending Test

