# Route Prices CRUD API

## Overview

Route prices provide transport fee pricing based on route, class, and category head. This replaces the deprecated `route_plans` system.

## Database Schema

```sql
CREATE TABLE route_prices (
    id SERIAL PRIMARY KEY,
    schoolId INT NOT NULL,
    routeId INT NOT NULL,
    classId INT NOT NULL,
    categoryHeadId INT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'active',
    createdAt TIMESTAMP NOT NULL DEFAULT now(),
    updatedAt TIMESTAMP NOT NULL DEFAULT now(),
    
    CONSTRAINT uq_route_price
        UNIQUE (schoolId, routeId, classId, categoryHeadId),
    
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE RESTRICT,
    FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE RESTRICT,
    FOREIGN KEY (categoryHeadId) REFERENCES category_heads(id) ON DELETE RESTRICT
);
```

## API Endpoints

All endpoints require Super Admin authentication.

### 1. Get All Route Prices

```
GET /super-admin/route-prices
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `schoolId` (optional): Filter by school ID
- `routeId` (optional): Filter by route ID
- `classId` (optional): Filter by class ID
- `categoryHeadId` (optional): Filter by category head ID

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "schoolId": 1,
      "routeId": 1,
      "route": { "id": 1, "name": "FREE" },
      "classId": 5,
      "class": { "id": 5, "name": "Grade 5" },
      "categoryHeadId": 1,
      "categoryHead": { "id": 1, "name": "General" },
      "amount": "0.00",
      "status": "active",
      "createdAt": "2025-01-05T00:00:00.000Z",
      "updatedAt": "2025-01-05T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 2. Get Route Price by ID

```
GET /super-admin/route-prices/:id
```

**Response:**
```json
{
  "id": 1,
  "schoolId": 1,
  "routeId": 1,
  "route": { "id": 1, "name": "FREE" },
  "classId": 5,
  "class": { "id": 5, "name": "Grade 5" },
  "categoryHeadId": 1,
  "categoryHead": { "id": 1, "name": "General" },
  "amount": "0.00",
  "status": "active",
  "createdAt": "2025-01-05T00:00:00.000Z",
  "updatedAt": "2025-01-05T00:00:00.000Z"
}
```

### 3. Create Route Price

```
POST /super-admin/route-prices?schoolId=1
```

**Request Body:**
```json
{
  "routeId": 2,
  "classId": 5,
  "categoryHeadId": 1,
  "amount": 2000.00,
  "status": "active"
}
```

**Response:** Created route price object (201)

**Validation:**
- Route must exist and belong to the school
- Class must exist and belong to the school
- Category head must exist and belong to the school
- Unique constraint: (schoolId, routeId, classId, categoryHeadId) must be unique

### 4. Update Route Price

```
PATCH /super-admin/route-prices/:id?schoolId=1
```

**Request Body:** (all fields optional)
```json
{
  "routeId": 2,
  "classId": 5,
  "categoryHeadId": 1,
  "amount": 2500.00,
  "status": "inactive"
}
```

**Response:** Updated route price object

**Validation:**
- Route price must exist and belong to the school
- If updating routeId/classId/categoryHeadId, unique constraint is checked
- All foreign keys validated if provided

### 5. Delete Route Price

```
DELETE /super-admin/route-prices/:id?schoolId=1
```

**Response:**
```json
{
  "message": "Route price deleted successfully"
}
```

**Validation:**
- Route price must exist and belong to the school

## Usage Examples

### Example 1: Create FREE Route Price

```bash
POST /super-admin/route-prices?schoolId=1
{
  "routeId": 1,  // FREE route
  "classId": 5,
  "categoryHeadId": 1,
  "amount": 0.00,
  "status": "active"
}
```

### Example 2: Create Paid Route Price

```bash
POST /super-admin/route-prices?schoolId=1
{
  "routeId": 2,  // Route 100
  "classId": 5,
  "categoryHeadId": 1,
  "amount": 2000.00,
  "status": "active"
}
```

### Example 3: Get All Prices for a Route

```bash
GET /super-admin/route-prices?routeId=2&schoolId=1
```

### Example 4: Get All Prices for a Class

```bash
GET /super-admin/route-prices?classId=5&schoolId=1
```

## Integration with Fee Calculation

Route prices are automatically used by the fee calculation service:

```typescript
// Fee calculation service queries route_prices
const routePrice = await routePriceRepository.findOne({
  where: {
    schoolId: student.schoolId,
    routeId: student.routeId,
    classId: student.classId,
    categoryHeadId: student.categoryHeadId,
    status: RoutePriceStatus.ACTIVE,
  },
});

const transportFeeAmount = routePrice.amount; // 0.00 for FREE route
```

## Error Handling

### 404 Not Found
- Route price not found
- Route/Class/Category head not found

### 400 Bad Request
- Validation errors (missing required fields, invalid amounts)
- Unique constraint violation
- Route price doesn't belong to school

## Migration from Route Plans

See `../route-plans/DEPRECATION.md` for migration guide from `route_plans` to `route_prices`.

## Files

- **Entity**: `entities/route-price.entity.ts`
- **DTOs**: `dto/create-route-price.dto.ts`, `dto/update-route-price.dto.ts`
- **Service**: `../super-admin/super-admin.service.ts` (methods: `getAllRoutePrices`, `getRoutePriceById`, `createRoutePrice`, `updateRoutePrice`, `removeRoutePrice`)
- **Controller**: `../super-admin/super-admin.controller.ts` (endpoints: `/super-admin/route-prices`)

