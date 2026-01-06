# Invoice-Based Payment System - Complete Guide

## ✅ Migration Complete!

The payment system now supports **TWO ways** to make payments:

1. **OLD WAY** - Against `student_fee_structures` (backward compatible)
2. **NEW WAY** - Against `fee_invoices` (solves your transport fee problem!)

---

## 🎯 Solution to Your Problem

### **Problem You Had:**
```
Payment of ₹1300.00 recorded successfully across 7 fee(s)
Warning: ₹3200.00 could not be allocated. 
Student fee structures do not exist for: Transport Fee
```

### **Solution: Use Invoice-Based Payments**

---

## 🚀 How to Use Invoice-Based Payments

### **Step 1: Create Invoice with ALL Charges**

```bash
POST /invoices
```

```json
{
  "studentId": 1,
  "academicYearId": 1,
  "issueDate": "2025-01-06",
  "dueDate": "2025-02-06",
  "type": "monthly",
  "items": [
    {
      "sourceType": "FEE",
      "sourceId": 5,
      "description": "Tuition Fee - Grade 10",
      "amount": 1300,
      "sourceMetadata": {
        "feeName": "Tuition Fee",
        "grade": "Grade 10"
      }
    },
    {
      "sourceType": "TRANSPORT",
      "sourceId": 3,
      "description": "Transport Fee - Route A",
      "amount": 3200,
      "sourceMetadata": {
        "routeName": "Route A",
        "routeId": 3
      }
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "invoiceNumber": "INV-2025-0001",
  "studentId": 1,
  "status": "issued",
  "totalAmount": 4500,
  "paidAmount": 0,
  "balanceAmount": 4500,
  "items": [
    { "description": "Tuition Fee", "amount": 1300 },
    { "description": "Transport Fee", "amount": 3200 }
  ]
}
```

### **Step 2: Make Payment Against Invoice**

```bash
POST /payments
```

```json
{
  "studentId": 1,
  "invoiceId": 1,
  "amount": 4500,
  "paymentDate": "2025-01-06",
  "paymentMethod": "cash",
  "notes": "Full payment"
}
```

**Response:**
```json
{
  "id": 1,
  "receiptNumber": "REC-20250106-0001",
  "studentId": 1,
  "invoiceId": 1,
  "amount": 4500,
  "status": "completed",
  "paymentMethod": "cash",
  "invoice": {
    "invoiceNumber": "INV-2025-0001",
    "totalAmount": 4500,
    "paidAmount": 4500,
    "balanceAmount": 0,
    "status": "paid"
  }
}
```

✅ **Result:** Full ₹4500 allocated! No warning!

---

## 📊 Payment Flow Comparison

### **Old Way (Your Current System)**
```
Payment → studentFeeStructureId
         → Must exist in student_fee_structures
         → ❌ Transport fees don't exist there!
```

### **New Way (Invoice-Based)**
```
Invoice → Multiple items (FEE + TRANSPORT + HOSTEL + FINE)
       → Payment against entire invoice
       → ✅ All charges in one place!
```

---

## 🔄 **Both Ways Work!**

### **Option 1: Old Way (Backward Compatible)**

Still works for regular fees:

```json
{
  "studentId": 1,
  "studentFeeStructureId": 5,
  "amount": 1000,
  "paymentDate": "2025-01-06",
  "paymentMethod": "cash"
}
```

### **Option 2: New Way (Recommended)**

For mixed fees (tuition + transport + hostel):

```json
{
  "studentId": 1,
  "invoiceId": 1,
  "amount": 4500,
  "paymentDate": "2025-01-06",
  "paymentMethod": "cash"
}
```

**Note:** You CANNOT provide both `studentFeeStructureId` AND `invoiceId`. Choose one.

---

## 🛡️ Safety Features

### **1. Pessimistic Locking**
Prevents race conditions during payment:
```typescript
// Invoice row is locked during payment processing
lock: { mode: 'pessimistic_write' }
```

### **2. Balance Validation**
```typescript
if (payment.amount > invoice.balanceAmount) {
  throw Error('Payment exceeds balance');
}
```

### **3. Status Updates**
Invoice status automatically updates:
- `issued` → `partially_paid` (after partial payment)
- `partially_paid` → `paid` (after full payment)

### **4. Database Constraints**
```sql
CHECK (
  (studentFeeStructureId IS NOT NULL AND invoiceId IS NULL) OR
  (invoiceId IS NOT NULL AND studentFeeStructureId IS NULL)
)
```

---

## 📝 Complete Example

### **Scenario: Student with Tuition + Transport**

#### **1. Create Invoice**

```bash
POST /invoices
{
  "studentId": 1,
  "academicYearId": 1,
  "issueDate": "2025-01-06",
  "dueDate": "2025-02-06",
  "type": "monthly",
  "items": [
    {
      "sourceType": "FEE",
      "sourceId": 5,
      "description": "Tuition Fee",
      "amount": 2000
    },
    {
      "sourceType": "TRANSPORT",
      "sourceId": 3,
      "description": "Transport Fee",
      "amount": 1200
    },
    {
      "sourceType": "FINE",
      "sourceId": 12,
      "description": "Late Fine",
      "amount": 100
    }
  ]
}
```

**Invoice Total:** ₹3,300

#### **2. Make Partial Payment**

```bash
POST /payments
{
  "studentId": 1,
  "invoiceId": 1,
  "amount": 2000,
  "paymentDate": "2025-01-06",
  "paymentMethod": "cash"
}
```

**Result:**
- Paid: ₹2,000
- Balance: ₹1,300
- Status: `partially_paid`

#### **3. Make Remaining Payment**

```bash
POST /payments
{
  "studentId": 1,
  "invoiceId": 1,
  "amount": 1300,
  "paymentDate": "2025-01-15",
  "paymentMethod": "upi",
  "transactionId": "UPI123456"
}
```

**Result:**
- Paid: ₹3,300
- Balance: ₹0
- Status: `paid`

---

## 🔍 Query Examples

### **Get Invoice with Payments**

```sql
SELECT 
  i.id,
  i."invoiceNumber",
  i."totalAmount",
  i."paidAmount",
  i."balanceAmount",
  i.status,
  json_agg(
    json_build_object(
      'receiptNumber', p."receiptNumber",
      'amount', p.amount,
      'paymentDate', p."paymentDate",
      'paymentMethod', p."paymentMethod"
    )
  ) as payments
FROM fee_invoices i
LEFT JOIN payments p ON p."invoiceId" = i.id
WHERE i.id = 1
GROUP BY i.id;
```

### **Get Student Payment History (Both Ways)**

```sql
-- Old way payments
SELECT 
  p.*,
  sfs."feeStructureId",
  fs.name as fee_name
FROM payments p
LEFT JOIN student_fee_structures sfs ON p."studentFeeStructureId" = sfs.id
LEFT JOIN fee_structures fs ON sfs."feeStructureId" = fs.id
WHERE p."studentId" = 1 AND p."studentFeeStructureId" IS NOT NULL

UNION ALL

-- New way payments
SELECT 
  p.*,
  i."invoiceNumber",
  i."totalAmount" as fee_name
FROM payments p
JOIN fee_invoices i ON p."invoiceId" = i.id
WHERE p."studentId" = 1 AND p."invoiceId" IS NOT NULL

ORDER BY "paymentDate" DESC;
```

---

## 🎯 Migration Strategy

### **Phase 1: Keep Both Systems (Now)**
- ✅ Old system for existing fees
- ✅ New system for transport/hostel/mixed fees
- ✅ No breaking changes

### **Phase 2: Start Using Invoices (Next Week)**
- Create invoices for new students
- Use invoice payments for all new transactions
- Keep old data working

### **Phase 3: Full Migration (Next Month)**
- Gradually convert old payments to invoices
- Unified reporting
- Single payment flow

---

## 📋 Quick Reference

### **Payment DTO Fields**

```typescript
{
  studentId: number;           // Required
  
  // Choose ONE:
  studentFeeStructureId?: number;  // Old way
  invoiceId?: number;              // New way
  
  amount: number;              // Required
  paymentDate: string;         // Required
  paymentMethod?: string;      // Optional (default: 'cash')
  transactionId?: string;      // Optional
  receiptNumber?: string;      // Optional (auto-generated)
  notes?: string;              // Optional
}
```

### **Invoice Creation**

```typescript
{
  studentId: number;
  academicYearId: number;
  issueDate: string;
  dueDate: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  items: [
    {
      sourceType: 'FEE' | 'TRANSPORT' | 'HOSTEL' | 'FINE' | 'MISC';
      sourceId: number;
      description: string;
      amount: number;
      sourceMetadata?: object;
    }
  ]
}
```

---

## ⚡ Key Features

✅ **Unified Invoicing** - All charges in one invoice  
✅ **Backward Compatible** - Old payment system still works  
✅ **Race Condition Safe** - Pessimistic locking  
✅ **Auto Status Updates** - Invoice status changes automatically  
✅ **Complete Audit Trail** - sourceMetadata tracks everything  
✅ **Partial Payments** - Pay in installments  
✅ **Multiple Payment Methods** - Cash, bank, UPI, card  
✅ **Accounting Integration** - Auto journal entries  

---

## 🚨 Important Notes

1. **Cannot mix old and new**
   ```javascript
   // ❌ This will fail:
   {
     studentFeeStructureId: 5,
     invoiceId: 1  // ERROR: Choose one!
   }
   ```

2. **Invoice must be issued**
   ```javascript
   // ❌ Cannot pay draft invoices
   invoice.status === 'draft' // Error!
   ```

3. **Cannot overpay**
   ```javascript
   // ❌ Payment > balance
   payment.amount > invoice.balanceAmount // Error!
   ```

---

## 🎉 Your Problem is Solved!

**Before:**
- ₹1300 allocated ✅
- ₹3200 failed ❌ (Transport fee)

**After:**
- Create invoice with tuition (₹1300) + transport (₹3200)
- Make one payment for ₹4500
- All allocated ✅✅✅

---

## 📞 Need Help?

- Check `REFACTORING_SUMMARY.md` for polymorphic pattern details
- Check API examples in `FEE_MANAGEMENT_DOCUMENTATION.md`
- Test with sample data in migrations

**The invoice-based payment system is live and ready to use!** 🚀

