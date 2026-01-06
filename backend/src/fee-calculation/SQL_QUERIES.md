# SQL Queries Used in Fee Calculation Service

## Overview

This document shows the exact SQL queries executed by the fee calculation service. These queries follow the strict separation: school fees from `fee_structures`, transport fees from `route_prices`.

---

## Query 1: Fetch Student with Relations

```sql
SELECT 
  s.*,
  c.id as class_id, c.name as class_name,
  ch.id as category_head_id, ch.name as category_head_name,
  r.id as route_id, r.name as route_name
FROM students s
LEFT JOIN classes c ON s.classId = c.id
LEFT JOIN category_heads ch ON s.categoryHeadId = ch.id
LEFT JOIN routes r ON s.routeId = r.id
WHERE s.id = :studentId
  AND s.schoolId = :schoolId;
```

**Purpose**: Get student details with class, category head, and route information.

**Validation**: Ensures `classId`, `categoryHeadId`, and `routeId` are NOT NULL.

---

## Query 2: Fetch All Fee Categories for School

```sql
SELECT fc.*
FROM fee_categories fc
WHERE fc.schoolId = :schoolId
  AND fc.status = 'active';
```

**Purpose**: Get all active fee categories for the school. Each category has a `type` field (`school` or `transport`) that determines which pricing table to query.

---

## Query 3: Fetch School Fee from fee_structures

**Executed for each fee category where `type = 'school'`:**

```sql
SELECT fs.*
FROM fee_structures fs
WHERE fs.schoolId = :schoolId
  AND fs.classId = :classId
  AND fs.categoryHeadId = :categoryHeadId
  AND fs.feeCategoryId = :feeCategoryId
  AND fs.status = 'active'
LIMIT 1;
```

**Purpose**: Get the pricing amount for a school fee.

**Key Points**:
- Only queries `fee_structures` table
- Matches on: `schoolId`, `classId`, `categoryHeadId`, `feeCategoryId`
- Returns single row (or NULL if missing)

**Example**:
```sql
-- Tuition Fee for Grade 5, General category head
SELECT fs.*
FROM fee_structures fs
WHERE fs.schoolId = 1
  AND fs.classId = 5
  AND fs.categoryHeadId = 1
  AND fs.feeCategoryId = 1  -- Tuition Fee category
  AND fs.status = 'active';
-- Returns: { id: 10, amount: 5000.00, ... }
```

---

## Query 4: Fetch Transport Fee from route_prices

**Executed for each fee category where `type = 'transport'`:**

```sql
SELECT rp.*, r.name as route_name
FROM route_prices rp
LEFT JOIN routes r ON rp.routeId = r.id
WHERE rp.schoolId = :schoolId
  AND rp.routeId = :routeId
  AND rp.classId = :classId
  AND rp.categoryHeadId = :categoryHeadId
  AND rp.status = 'active'
LIMIT 1;
```

**Purpose**: Get the pricing amount for a transport fee.

**Key Points**:
- Only queries `route_prices` table
- Matches on: `schoolId`, `routeId`, `classId`, `categoryHeadId`
- Returns single row (or NULL if missing)
- FREE route naturally returns `amount = 0` (no special handling)

**Example 1: FREE Route**:
```sql
-- Transport Fee for FREE route, Grade 5, General category head
SELECT rp.*, r.name as route_name
FROM route_prices rp
LEFT JOIN routes r ON rp.routeId = r.id
WHERE rp.schoolId = 1
  AND rp.routeId = 1  -- FREE route
  AND rp.classId = 5
  AND rp.categoryHeadId = 1
  AND rp.status = 'active';
-- Returns: { id: 1, routeId: 1, amount: 0.00, route_name: 'FREE', ... }
```

**Example 2: Paid Route**:
```sql
-- Transport Fee for Route 100, Grade 5, General category head
SELECT rp.*, r.name as route_name
FROM route_prices rp
LEFT JOIN routes r ON rp.routeId = r.id
WHERE rp.schoolId = 1
  AND rp.routeId = 2  -- Route 100
  AND rp.classId = 5
  AND rp.categoryHeadId = 1
  AND rp.status = 'active';
-- Returns: { id: 2, routeId: 2, amount: 2000.00, route_name: 'Route 100', ... }
```

---

## Query 5: Validation Query (Pre-check)

**Used by `validatePricingConfiguration()` method:**

```sql
-- Check all school fees exist
SELECT COUNT(*) as missing_count
FROM fee_categories fc
LEFT JOIN fee_structures fs ON (
  fs.schoolId = :schoolId
  AND fs.classId = :classId
  AND fs.categoryHeadId = :categoryHeadId
  AND fs.feeCategoryId = fc.id
  AND fs.status = 'active'
)
WHERE fc.schoolId = :schoolId
  AND fc.status = 'active'
  AND fc.type = 'school'
  AND fs.id IS NULL;

-- Check all transport fees exist
SELECT COUNT(*) as missing_count
FROM fee_categories fc
LEFT JOIN route_prices rp ON (
  rp.schoolId = :schoolId
  AND rp.routeId = :routeId
  AND rp.classId = :classId
  AND rp.categoryHeadId = :categoryHeadId
  AND rp.status = 'active'
)
WHERE fc.schoolId = :schoolId
  AND fc.status = 'active'
  AND fc.type = 'transport'
  AND rp.id IS NULL;
```

**Purpose**: Pre-validate that all required pricing rows exist before generating breakdowns.

---

## Complete Example: Student with FREE Route

**Student Data**:
```json
{
  "id": 1,
  "schoolId": 1,
  "classId": 5,
  "categoryHeadId": 1,
  "routeId": 1  // FREE route
}
```

**Fee Categories**:
- Tuition Fee (type: `school`)
- Transport Fee (type: `transport`)

**Query Sequence**:
1. Fetch student → ✅ Found
2. Fetch fee categories → ✅ Found 2 categories
3. For Tuition Fee (school):
   ```sql
   SELECT * FROM fee_structures 
   WHERE schoolId=1 AND classId=5 AND categoryHeadId=1 AND feeCategoryId=1 AND status='active';
   -- Returns: { amount: 5000.00 }
   ```
4. For Transport Fee (transport):
   ```sql
   SELECT * FROM route_prices 
   WHERE schoolId=1 AND routeId=1 AND classId=5 AND categoryHeadId=1 AND status='active';
   -- Returns: { amount: 0.00 }  // FREE route naturally returns 0
   ```

**Result**:
```json
{
  "breakdown": [
    { "feeCategoryName": "Tuition Fee", "amount": 5000, "source": "fee_structures" },
    { "feeCategoryName": "Transport Fee", "amount": 0, "source": "route_prices" }
  ],
  "totalAmount": 5000
}
```

---

## Complete Example: Student with Paid Route

**Student Data**:
```json
{
  "id": 2,
  "schoolId": 1,
  "classId": 5,
  "categoryHeadId": 1,
  "routeId": 2  // Route 100
}
```

**Query Sequence**:
1. Fetch student → ✅ Found
2. Fetch fee categories → ✅ Found 2 categories
3. For Tuition Fee (school):
   ```sql
   SELECT * FROM fee_structures 
   WHERE schoolId=1 AND classId=5 AND categoryHeadId=1 AND feeCategoryId=1 AND status='active';
   -- Returns: { amount: 5000.00 }
   ```
4. For Transport Fee (transport):
   ```sql
   SELECT * FROM route_prices 
   WHERE schoolId=1 AND routeId=2 AND classId=5 AND categoryHeadId=1 AND status='active';
   -- Returns: { amount: 2000.00 }
   ```

**Result**:
```json
{
  "breakdown": [
    { "feeCategoryName": "Tuition Fee", "amount": 5000, "source": "fee_structures" },
    { "feeCategoryName": "Transport Fee", "amount": 2000, "source": "route_prices" }
  ],
  "totalAmount": 7000
}
```

---

## Error Cases

### Missing School Fee Pricing
```sql
-- Query returns NULL
SELECT * FROM fee_structures 
WHERE schoolId=1 AND classId=5 AND categoryHeadId=1 AND feeCategoryId=1 AND status='active';
-- Returns: NULL

-- Error thrown:
"Missing pricing configuration:
School fee: Tuition Fee (categoryId: 1, classId: 5, categoryHeadId: 1)
Please ensure all fee categories have corresponding pricing rows"
```

### Missing Transport Fee Pricing
```sql
-- Query returns NULL
SELECT * FROM route_prices 
WHERE schoolId=1 AND routeId=2 AND classId=5 AND categoryHeadId=1 AND status='active';
-- Returns: NULL

-- Error thrown:
"Missing pricing configuration:
Transport fee: Transport Fee (routeId: 2, classId: 5, categoryHeadId: 1)
Please ensure all fee categories have corresponding pricing rows"
```

### Missing Route
```sql
-- Student has routeId = NULL
SELECT * FROM students WHERE id=3;
-- Returns: { routeId: NULL }

-- Error thrown:
"Student 3 has no route assigned. Every student must have a route."
```

---

## Performance Notes

- All queries use indexed columns (`schoolId`, `classId`, `categoryHeadId`, `routeId`)
- Queries are executed sequentially (one per fee category)
- For batch processing, consider optimizing with JOINs or bulk queries
- Status filters (`status = 'active'`) ensure only active pricing is used

