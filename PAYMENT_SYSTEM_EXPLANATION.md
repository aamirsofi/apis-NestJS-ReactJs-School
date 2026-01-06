# Payment System Explanation

## Overview

The payment system allows you to record payments against student fees that have been generated. This document explains how the payment system works and how to use it.

## How Payments Work

### 1. Fee Generation → Payment Flow

**Step 1: Generate Fees**
- Go to **Fee Generation** page
- Search for a student by Student ID
- Review the fee breakdown
- Click **"Generate Fees"** to create fee structures for the student

**Step 2: Record Payment**
- After generating fees, click **"Pay Now"** button (appears in success message and next to Generate Fees button)
- This navigates to the **Payments** page with the student pre-filled
- Alternatively, go to **Payments** page directly and search for the student

### 2. Payment Recording Process

**On the Payments Page:**

1. **Select Academic Year**
   - Choose the academic year for which you want to record payments
   - Defaults to the current academic year

2. **Search Student**
   - Enter the Student ID (unique identifier, not database ID)
   - Click "Search" or press Enter
   - Student details and fees will be displayed

3. **View Student Fees**
   - The page shows all fee structures assigned to the student for the selected academic year
   - Each fee shows:
     - **Fee Name**: Name of the fee (e.g., "Tuition Fee", "Library Fee", "Transport Fee")
     - **Total Amount**: Full amount due for this fee
     - **Paid**: Amount already paid
     - **Balance**: Remaining amount to be paid
     - **Due Date**: When the payment is due
     - **Status**: PENDING, PAID, or OVERDUE

4. **Record Payment**
   - Click **"Pay"** button on any fee row
   - Fill in the payment form:
     - **Amount**: Payment amount (can be partial payment)
     - **Payment Method**: Cash, Bank Transfer, Card, Online, or Cheque
     - **Payment Date**: Date of payment
     - **Transaction ID**: Optional (for bank transfers, card payments, etc.)
     - **Notes**: Optional additional notes
   - Click **"Record Payment"**

5. **Payment Processing**
   - System validates payment amount (cannot exceed remaining balance)
   - Auto-generates receipt number (format: REC-YYYYMMDD-XXXX)
   - Updates fee status automatically:
     - If full payment → Status changes to PAID
     - If partial payment → Status remains PENDING
     - If overdue → Status changes to OVERDUE
   - Payment is recorded and linked to the specific fee structure

### 3. Payment Features

#### Partial Payments
- You can record partial payments for any fee
- Multiple payments can be made against the same fee
- System tracks total paid amount automatically
- Status updates when full amount is paid

#### Payment History
- All payments are displayed in the "Payment History" table
- Shows:
  - Receipt Number
  - Payment Date
  - Amount
  - Payment Method
  - Status
  - Transaction ID (if provided)

#### Summary Totals
- **Total Fees**: Sum of all fee amounts
- **Total Paid**: Sum of all payments made
- **Total Balance**: Remaining amount to be paid

### 4. Payment Status Flow

```
PENDING → (Payment Recorded) → PAID (if full amount)
         → (Partial Payment) → PENDING (until full amount paid)
         → (Overdue) → OVERDUE
```

### 5. Integration Points

#### From Fee Generation Page
- **"Pay Now" Button**: 
  - Appears after successful fee generation
  - Also available next to "Generate Fees" button
  - Navigates to Payments page with student ID and academic year pre-filled
  - Automatically searches for the student

#### Direct Access
- Navigate to **Payments** page from main menu
- Search for any student manually
- View and record payments for any student

### 6. Database Structure

**Payment Entity:**
- Links to `StudentFeeStructure` (the actual fee assigned to student)
- Stores `studentId` for quick queries
- Auto-generates `receiptNumber`
- Tracks `amount`, `paymentDate`, `paymentMethod`, `status`
- Stores `transactionId` and `notes` for reference

**StudentFeeStructure Entity:**
- Represents a fee assigned to a specific student
- Links to `FeeStructure` (template)
- Tracks `amount`, `paidAmount`, `dueDate`, `status`
- Has one-to-many relationship with `Payment`

### 7. Payment Validation

**Before Recording Payment:**
- Validates student fee structure exists
- Validates student belongs to the correct school
- Validates payment amount doesn't exceed remaining balance
- Validates school context matches

**After Recording Payment:**
- Updates `paidAmount` on `StudentFeeStructure`
- Calculates new `remainingBalance`
- Updates `status` based on payment amount
- Creates `Payment` record with receipt number

### 8. Receipt Number Format

Receipt numbers are auto-generated in the format:
```
REC-YYYYMMDD-XXXX
```

Example: `REC-20260104-0001`
- `REC`: Prefix
- `20260104`: Date (YYYYMMDD)
- `0001`: Sequential number for that day

### 9. Common Scenarios

#### Scenario 1: Full Payment
1. Student has ₹10,000 fee
2. Record payment of ₹10,000
3. Status changes to PAID
4. Balance becomes ₹0

#### Scenario 2: Partial Payment
1. Student has ₹10,000 fee
2. Record payment of ₹5,000
3. Status remains PENDING
4. Balance becomes ₹5,000
5. Can record another payment later

#### Scenario 3: Multiple Fees
1. Student has:
   - Tuition Fee: ₹5,000 (Balance: ₹5,000)
   - Library Fee: ₹1,000 (Balance: ₹1,000)
   - Transport Fee: ₹2,000 (Balance: ₹2,000)
2. Record payment of ₹3,000 against Tuition Fee
3. Tuition Fee: Balance becomes ₹2,000
4. Other fees remain unchanged
5. Total Balance: ₹5,000 (₹2,000 + ₹1,000 + ₹2,000)

### 10. Error Handling

**Common Errors:**
- **"Student fee structure does not belong to the specified school"**
  - Ensure you're logged in with the correct school context
  - Verify student belongs to the selected school

- **"Payment amount exceeds remaining balance"**
  - Check the balance amount
  - Record payment for the correct amount

- **"Student not found"**
  - Verify Student ID is correct
  - Ensure student exists in the selected school

### 11. Best Practices

1. **Always verify student details** before recording payment
2. **Use Transaction ID** for bank transfers and card payments for tracking
3. **Add notes** for any special circumstances
4. **Record payments promptly** after receiving them
5. **Review payment history** regularly for accuracy
6. **Use correct academic year** when searching for fees

### 12. Permissions

- **Administrator**: Can record and view all payments
- **Accountant**: Can record and view all payments
- **Super Admin**: Can record and view payments for all schools

---

## Quick Reference

**To Record Payment After Fee Generation:**
1. Generate fees for student
2. Click **"Pay Now"** button
3. Select fee to pay
4. Fill payment form
5. Click **"Record Payment"**

**To Record Payment Directly:**
1. Go to **Payments** page
2. Select Academic Year
3. Search Student by ID
4. Click **"Pay"** on desired fee
5. Fill payment form
6. Click **"Record Payment"**

**To View Payment History:**
- Payment history is automatically displayed below student fees
- Shows all payments for the selected student and academic year




