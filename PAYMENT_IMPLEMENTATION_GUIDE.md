# Student Payment Implementation Guide

## Current State Analysis

### Existing Components

1. **Payment Entity** (`backend/src/payments/entities/payment.entity.ts`)

   - Currently linked to `FeeStructure` (fee plan template)
   - Has basic payment fields: amount, date, method, status, transaction ID

2. **StudentFeeStructure Entity** (`backend/src/student-fee-structures/entities/student-fee-structure.entity.ts`)

   - Represents fees assigned to specific students
   - Has `status` field (PENDING, PAID, OVERDUE)
   - Tracks amount, discount, installments

3. **Payment Service & Controller**
   - Basic CRUD operations exist
   - Not integrated with StudentFeeStructure

### Issues with Current Implementation

- Payments are linked to `FeeStructure` instead of `StudentFeeStructure`
- No automatic status update when payments are made
- No support for partial payments
- No receipt generation
- No payment history per student fee

## Recommended Approach

### Architecture Changes

1. **Update Payment Entity**

   - Link to `StudentFeeStructure` instead of `FeeStructure`
   - Keep `studentId` for quick access
   - Add `receiptNumber` (auto-generated)
   - Track `paidAmount` vs `totalAmount`

2. **Payment Flow**

   ```
   Student Fee Generated (StudentFeeStructure)
   ↓
   Payment Recorded (Payment)
   ↓
   Update StudentFeeStructure Status & Paid Amount
   ↓
   Generate Receipt
   ```

3. **Key Features to Implement**

   **A. Payment Recording**

   - Record payment against a `StudentFeeStructure`
   - Support partial payments
   - Auto-update `StudentFeeStructure.status`
   - Generate unique receipt numbers

   **B. Payment Status Management**

   - Calculate paid amount from all payments
   - Update status: PENDING → PAID (when fully paid)
   - Mark as OVERDUE if past due date

   **C. Payment UI**

   - View student's pending fees
   - Record payments with validation
   - View payment history
   - Print receipts

   **D. Reports**

   - Payment summary by student
   - Outstanding fees report
   - Payment history report
   - Receipt reprint

## Implementation Steps

### Step 1: Update Payment Entity & Migration

**Changes needed:**

- Replace `feeStructureId` with `studentFeeStructureId`
- Add `receiptNumber` field (auto-generated)
- Keep `studentId` for quick queries
- Add relationship to `StudentFeeStructure`

### Step 2: Update Payment DTOs

**CreatePaymentDto should include:**

- `studentFeeStructureId` (required)
- `amount` (required, validated against remaining balance)
- `paymentMethod` (required)
- `paymentDate` (default: today)
- `notes` (optional)
- `transactionId` (optional, for online payments)

### Step 3: Update Payment Service Logic

**Key methods:**

1. `create()` - Record payment and update StudentFeeStructure
2. `calculatePaidAmount()` - Sum all payments for a StudentFeeStructure
3. `updateFeeStatus()` - Update StudentFeeStructure status based on payments
4. `generateReceiptNumber()` - Auto-generate unique receipt numbers

### Step 4: Create Payment UI

**Pages needed:**

1. **Student Fee Payment Page**

   - List all pending fees for a student
   - Show: Fee name, amount, due date, status, paid amount, balance
   - "Pay Now" button for each fee
   - Payment form modal

2. **Payment History Page**

   - List all payments
   - Filter by student, date range, status
   - View receipt option

3. **Payment Form Component**
   - Student fee selection (dropdown)
   - Amount input (with max validation)
   - Payment method selection
   - Receipt number (auto-generated, editable)
   - Notes field

### Step 5: Receipt Generation

**Receipt should include:**

- Receipt number
- Student details (name, ID, class)
- Fee details (name, amount, due date)
- Payment details (amount, method, date)
- School details (name, address, logo)
- Balance (if partial payment)

## Database Schema Changes

### Migration Required

```sql
-- Add studentFeeStructureId column
ALTER TABLE payments
ADD COLUMN studentFeeStructureId INTEGER REFERENCES student_fee_structures(id);

-- Migrate existing data (if any)
UPDATE payments p
SET studentFeeStructureId = (
  SELECT sfs.id
  FROM student_fee_structures sfs
  WHERE sfs.studentId = p.studentId
  AND sfs.feeStructureId = p.feeStructureId
  LIMIT 1
);

-- Add receipt number column
ALTER TABLE payments
ADD COLUMN receiptNumber VARCHAR(50) UNIQUE;

-- Create index for faster queries
CREATE INDEX idx_payments_student_fee_structure ON payments(studentFeeStructureId);
CREATE INDEX idx_payments_student ON payments(studentId);
CREATE INDEX idx_payments_receipt ON payments(receiptNumber);

-- Remove old feeStructureId (after migration)
-- ALTER TABLE payments DROP COLUMN feeStructureId;
```

## API Endpoints Needed

### Payment Endpoints

- `POST /payments` - Create payment
- `GET /payments` - List payments (with filters)
- `GET /payments/:id` - Get payment details
- `GET /payments/receipt/:id` - Get receipt PDF
- `PATCH /payments/:id` - Update payment (limited fields)
- `DELETE /payments/:id` - Delete payment (with validation)

### Student Fee Endpoints (if not exists)

- `GET /student-fee-structures/student/:studentId` - Get all fees for student
- `GET /student-fee-structures/:id/payments` - Get payment history for a fee
- `GET /student-fee-structures/:id/balance` - Get remaining balance

## Frontend Components Structure

```
src/pages/
  ├── Payments/
  │   ├── index.tsx (Payment list/history)
  │   ├── StudentPayments.tsx (Student-specific payments)
  │   └── components/
  │       ├── PaymentForm.tsx
  │       ├── PaymentList.tsx
  │       ├── ReceiptView.tsx
  │       └── FeePaymentCard.tsx
```

## Key Business Rules

1. **Payment Validation**

   - Payment amount cannot exceed remaining balance
   - Payment amount must be > 0
   - Cannot pay for already PAID fees (unless refunding)

2. **Status Updates**

   - If paidAmount >= amount → Status = PAID
   - If paidAmount < amount && dueDate < today → Status = OVERDUE
   - If paidAmount < amount && dueDate >= today → Status = PENDING

3. **Receipt Numbers**

   - Format: `REC-{YYYYMMDD}-{SEQ}`
   - Example: `REC-20240115-001`
   - Auto-increment per day

4. **Partial Payments**
   - Multiple payments allowed per StudentFeeStructure
   - Track cumulative paid amount
   - Update status when fully paid

## Next Steps

1. **Phase 1: Backend Updates**

   - Update Payment entity
   - Create migration
   - Update DTOs and service logic
   - Add receipt number generation

2. **Phase 2: API Integration**

   - Update payment endpoints
   - Add student fee endpoints
   - Add receipt generation endpoint

3. **Phase 3: Frontend UI**

   - Create payment pages
   - Build payment form
   - Add receipt view
   - Implement payment history

4. **Phase 4: Testing & Refinement**
   - Test payment flow
   - Test partial payments
   - Test receipt generation
   - Add error handling

## Example Payment Flow

```
1. User navigates to "Student Payments"
2. Selects a student
3. System shows all pending fees:
   - Tuition Fee: $5000 (Due: 2024-01-15) [Balance: $5000]
   - Bus Fee: $2000 (Due: 2024-01-15) [Balance: $2000]

4. User clicks "Pay" on Tuition Fee
5. Payment form opens:
   - Fee: Tuition Fee (pre-filled)
   - Amount: $5000 (max: $5000)
   - Payment Method: Cash
   - Receipt Number: REC-20240115-001 (auto-generated)

6. User submits payment
7. System:
   - Creates Payment record
   - Updates StudentFeeStructure.paidAmount = $5000
   - Updates StudentFeeStructure.status = PAID
   - Generates receipt

8. User can view receipt or print it
```

## Questions to Consider

1. **Refunds**: How to handle refunds? Create negative payment or separate refund entity?
2. **Late Fees**: Should late fees be automatically added? How to calculate?
3. **Payment Plans**: Support for custom payment schedules?
4. **Online Payments**: Integration with payment gateways?
5. **Notifications**: Send payment confirmations via email/SMS?
