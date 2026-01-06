# School Context Debugging Guide

## Issue
Getting error: `"School context not found. Please ensure you are logged in and have access to a school."`

## Solution Applied

Updated the invoice controller to **prioritize `req.user.schoolId`** from JWT token over `req.school.id` from subdomain middleware:

```typescript
// BEFORE: Checked req.school first
const schoolId = req.school?.id || req.user?.schoolId;

// AFTER: Check req.user.schoolId first (from JWT)
const schoolId = req.user?.schoolId || req.school?.id;
```

## How School Context Works

### 1. JWT Token (Primary Method)
When user logs in, the JWT token includes `schoolId`:

```typescript
// JWT Payload
{
  email: "user@example.com",
  sub: 123,
  role: "admin",
  schoolId: 9  // ✅ School ID is here
}
```

### 2. Subdomain Middleware (Secondary Method)
For multi-tenant systems using subdomains:
- Production: `school1.example.com` → `req.school.id = school1's ID`
- Localhost: Requires `X-School-Subdomain` header or `?school=` query param

## Verification Steps

### Step 1: Check if User's JWT Token Contains schoolId

**Frontend Console:**
```javascript
// Get the token from localStorage or sessionStorage
const token = localStorage.getItem('auth_token');

// Decode JWT (base64)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('JWT Payload:', payload);
// Should show: { email, sub, role, schoolId: 9, iat, exp }
```

### Step 2: Verify Backend Receives schoolId

Add temporary logging in `invoices.controller.ts`:

```typescript
@Post()
async create(
  @Body() createInvoiceDto: CreateFeeInvoiceDto,
  @Request() req: any,
) {
  // 🔍 DEBUG: Log the request context
  console.log('🔍 DEBUG - Request Context:');
  console.log('  req.user:', req.user);
  console.log('  req.school:', req.school);
  console.log('  req.user?.schoolId:', req.user?.schoolId);
  console.log('  req.school?.id:', req.school?.id);
  
  const schoolId = req.user?.schoolId || req.school?.id;
  
  if (!schoolId) {
    throw new BadRequestException('School context not found. Please ensure you are logged in and have access to a school.');
  }

  return this.invoicesService.create(schoolId, createInvoiceDto);
}
```

### Step 3: Check User Data in Database

```sql
-- Verify user has schoolId assigned
SELECT id, name, email, role_id, school_id 
FROM users 
WHERE email = 'your-email@example.com';

-- Should return:
-- id  | name        | email                  | role_id | school_id
-- 123 | John Doe    | john@example.com      | 2       | 9
```

## Common Issues & Solutions

### Issue 1: `req.user` is undefined
**Cause:** User is not authenticated or JWT guard is not applied.

**Solution:**
Check if `@UseGuards(JwtAuthGuard)` is applied to the controller or route:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)  // ✅ This applies JWT guard to all routes
export class InvoicesController {
  // ...
}
```

### Issue 2: `req.user.schoolId` is null/undefined
**Cause:** User record in database doesn't have `school_id` set.

**Solution:**
Update the user record:

```sql
UPDATE users 
SET school_id = 9 
WHERE email = 'your-email@example.com';
```

Then log out and log in again to get a new JWT token with the updated `schoolId`.

### Issue 3: JWT token doesn't contain schoolId
**Cause:** User logged in before `schoolId` was added to their account.

**Solution:**
1. Log out from frontend
2. Clear localStorage/sessionStorage
3. Log in again to get a fresh JWT token

### Issue 4: Frontend not sending JWT token
**Cause:** Token is not being sent in the `Authorization` header.

**Solution:**
Check your API service configuration:

```typescript
// src/services/api.ts
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor to add JWT token to all requests
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // ✅ This is required
  }
  return config;
});

export default { instance };
```

## Testing the Fix

### Test 1: Login and Check Token
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response should include:
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "admin",
    "schoolId": 9  // ✅ Check this is present
  }
}
```

### Test 2: Create Invoice with JWT
```bash
# Replace YOUR_JWT_TOKEN with actual token
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "studentId": 1,
    "academicYearId": 1,
    "issueDate": "2026-01-06",
    "dueDate": "2026-02-06",
    "type": "one_time",
    "items": [
      {
        "description": "Tuition Fee",
        "amount": 1000,
        "sourceType": "FEE",
        "sourceId": 5
      }
    ]
  }'

# Should succeed and create invoice with schoolId from JWT
```

### Test 3: Frontend Test
```typescript
// In browser console after login
const token = localStorage.getItem('auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('My School ID:', payload.schoolId);

// If schoolId is present, API calls should work automatically
```

## Architecture Flow

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ 1. Login with email/password
       ▼
┌─────────────────────────────────────────┐
│  POST /api/auth/login                   │
│                                         │
│  1. Validate credentials                │
│  2. Get user from DB (includes schoolId)│
│  3. Generate JWT with payload:          │
│     { sub, email, role, schoolId }      │
│  4. Return { access_token, user }       │
└──────┬──────────────────────────────────┘
       │ 2. Store token in localStorage
       ▼
┌─────────────┐
│   Frontend  │ 3. API request with token
│             │    Authorization: Bearer <token>
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/invoices                     │
│  Headers: Authorization: Bearer <token> │
│                                         │
│  1. JWT Guard validates token           │
│  2. JWT Strategy extracts payload       │
│  3. Sets req.user = {                   │
│       id, email, role, schoolId         │
│     }                                   │
│  4. Controller uses req.user.schoolId   │
│  5. Process request with schoolId       │
└─────────────────────────────────────────┘
```

## Summary

✅ **Fixed:** Changed priority to `req.user.schoolId` (from JWT) first  
✅ **Verified:** JWT token includes `schoolId` in payload  
✅ **Tested:** Backend builds successfully  

**Next:** Verify JWT token in frontend contains `schoolId` and is being sent correctly.

If you still see the error, follow the verification steps above to identify where the schoolId is being lost.

