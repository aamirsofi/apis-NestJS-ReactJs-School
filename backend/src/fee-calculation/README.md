# Fee Calculation Service

## Overview

This service implements fee breakdown calculation following strict separation of concerns:

- **School fees** are priced ONLY in `fee_structures`
- **Transport fees** are priced ONLY in `route_prices`

## Design Rules

1. **Two Fee Types** (identified by `fee_categories.type`):
   - `school` → fetched from `fee_structures`
   - `transport` → fetched from `route_prices`

2. **Pricing Ownership**:
   - School fees: `fee_structures` table only
   - Transport fees: `route_prices` table only
   - No mixing or cross-referencing

3. **Routes**:
   - `routes` table is logistics only
   - FREE route exists per school with `amount = 0` in `route_prices`
   - Every student MUST have a `routeId` (no NULL allowed)

## SQL Queries Used

### Fetch School Fees

```sql
SELECT fs.*
FROM fee_structures fs
WHERE fs.schoolId = :schoolId
  AND fs.classId = :classId
  AND fs.categoryHeadId = :categoryHeadId
  AND fs.feeCategoryId = :feeCategoryId
  AND fs.status = 'active';
```

### Fetch Transport Fees

```sql
SELECT rp.*
FROM route_prices rp
WHERE rp.schoolId = :schoolId
  AND rp.routeId = :routeId
  AND rp.classId = :classId
  AND rp.categoryHeadId = :categoryHeadId
  AND rp.status = 'active';
```

### Fetch Fee Categories

```sql
SELECT fc.*
FROM fee_categories fc
WHERE fc.schoolId = :schoolId
  AND fc.status = 'active';
```

## Usage Examples

### Example 1: Student with FREE Route

**Input:**

- Student: `{ id: 1, schoolId: 1, classId: 5, categoryHeadId: 1, routeId: 1 }`
- Route: `{ id: 1, name: 'FREE' }`
- Route Price: `{ routeId: 1, classId: 5, categoryHeadId: 1, amount: 0 }`

**Output:**

```json
{
  "studentId": 1,
  "routeId": 1,
  "routeName": "FREE",
  "breakdown": [
    {
      "feeCategoryId": 1,
      "feeCategoryName": "Tuition Fee",
      "feeCategoryType": "school",
      "amount": 5000,
      "source": "fee_structures"
    },
    {
      "feeCategoryId": 2,
      "feeCategoryName": "Transport Fee",
      "feeCategoryType": "transport",
      "amount": 0,
      "source": "route_prices"
    }
  ],
  "totalAmount": 5000
}
```

### Example 2: Student with Paid Route

**Input:**

- Student: `{ id: 2, schoolId: 1, classId: 5, categoryHeadId: 1, routeId: 2 }`
- Route: `{ id: 2, name: 'Route 100' }`
- Route Price: `{ routeId: 2, classId: 5, categoryHeadId: 1, amount: 2000 }`

**Output:**

```json
{
  "studentId": 2,
  "routeId": 2,
  "routeName": "Route 100",
  "breakdown": [
    {
      "feeCategoryId": 1,
      "feeCategoryName": "Tuition Fee",
      "feeCategoryType": "school",
      "amount": 5000,
      "source": "fee_structures"
    },
    {
      "feeCategoryId": 2,
      "feeCategoryName": "Transport Fee",
      "feeCategoryType": "transport",
      "amount": 2000,
      "source": "route_prices"
    }
  ],
  "totalAmount": 7000
}
```

## Validation

The service validates:

1. Student exists and has required fields (`classId`, `categoryHeadId`, `routeId`)
2. All fee categories have corresponding pricing rows
3. Missing pricing throws `BadRequestException` with detailed error message

## API Endpoints

- `GET /fee-calculation/breakdown/:studentId` - Generate breakdown for one student
- `POST /fee-calculation/breakdown/batch` - Generate breakdowns for multiple students
- `GET /fee-calculation/validate-pricing` - Validate pricing configuration

## Error Handling

- **404**: Student not found, no fee categories found
- **400**: Missing pricing configuration, missing required student fields
