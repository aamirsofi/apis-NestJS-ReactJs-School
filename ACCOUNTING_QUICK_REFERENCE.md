# Accounting System - Quick Reference Guide

## Accounting Scenarios & Journal Entries

### Scenario 1: Invoice Generation

**When**: Fee invoice is generated for a student

**Journal Entry**:
```
Entry Type: INVOICE
Description: Invoice INV-2026-0001 - Tuition Fee, Transport Fee

Line 1:
  Account: Fees Receivable (1101)
  Debit:  ₹10,000
  Credit: ₹0

Line 2:
  Account: Tuition Fee Income (4001)
  Debit:  ₹0
  Credit: ₹10,000
```

**API Call**:
```typescript
POST /invoices
{
  "studentId": 123,
  "academicYearId": 1,
  "issueDate": "2026-01-15",
  "dueDate": "2026-02-15",
  "type": "monthly",
  "items": [
    {
      "description": "Tuition Fee",
      "amount": 10000,
      "discountAmount": 0
    }
  ]
}
```

---

### Scenario 2: Payment Against Invoice

**When**: Payment received against an invoice

**Journal Entry**:
```
Entry Type: PAYMENT
Description: Payment received - Receipt REC-20260115-0001

Line 1:
  Account: Cash (1001) or Bank (1002)
  Debit:  ₹5,000
  Credit: ₹0

Line 2:
  Account: Fees Receivable (1101)
  Debit:  ₹0
  Credit: ₹5,000
```

**API Call**:
```typescript
POST /payments
{
  "studentId": 123,
  "studentFeeStructureId": 456,
  "amount": 5000,
  "paymentMethod": "cash",
  "paymentDate": "2026-01-15"
}
```

---

### Scenario 3: Advance Payment

**When**: Payment received before invoice generation

**Journal Entry**:
```
Entry Type: ADVANCE_PAYMENT
Description: Advance payment received - Receipt REC-20260115-0002

Line 1:
  Account: Cash (1001)
  Debit:  ₹3,000
  Credit: ₹0

Line 2:
  Account: Advance Fees (2001)
  Debit:  ₹0
  Credit: ₹3,000
```

**API Call**:
```typescript
POST /payments
{
  "studentId": 123,
  "amount": 3000,
  "paymentMethod": "cash",
  "paymentDate": "2026-01-10",
  "notes": "Advance payment"
}
// Then call PaymentAccountingService.recordAdvancePaymentAccounting()
```

---

### Scenario 4: Advance Adjustment

**When**: Advance payment is applied to an invoice

**Journal Entry**:
```
Entry Type: ADVANCE_ADJUSTMENT
Description: Advance adjustment - Invoice INV-2026-0001

Line 1:
  Account: Advance Fees (2001)
  Debit:  ₹3,000
  Credit: ₹0

Line 2:
  Account: Tuition Fee Income (4001)
  Debit:  ₹0
  Credit: ₹3,000
```

**API Call**:
```typescript
// Called automatically when invoice is generated and advance exists
// Or manually:
POST /accounting/journal-entries
{
  "entryDate": "2026-01-15",
  "type": "advance_adjustment",
  "description": "Advance adjustment - Invoice INV-2026-0001",
  "reference": "INV-2026-0001",
  "referenceId": 1,
  "lines": [
    {
      "accountId": 2001, // Advance Fees
      "debitAmount": 3000,
      "creditAmount": 0
    },
    {
      "accountId": 4001, // Fee Income
      "debitAmount": 0,
      "creditAmount": 3000
    }
  ]
}
```

---

### Scenario 5: Refund

**When**: Refund issued to student

**Journal Entry**:
```
Entry Type: REFUND
Description: Refund issued - Receipt REC-20260115-0003

Line 1:
  Account: Tuition Fee Income (4001) or Advance Fees (2001)
  Debit:  ₹1,000
  Credit: ₹0

Line 2:
  Account: Cash (1001)
  Debit:  ₹0
  Credit: ₹1,000
```

**API Call**:
```typescript
// Create refund payment
POST /payments
{
  "studentId": 123,
  "amount": -1000, // Negative amount or use refund flag
  "paymentMethod": "cash",
  "paymentDate": "2026-01-20",
  "notes": "Refund"
}
// Then call PaymentAccountingService.recordRefundAccounting()
```

---

## Account Codes Reference

### Assets (1000-1999)
- **1001** - Cash
- **1002** - Bank
- **1101** - Fees Receivable

### Liabilities (2000-2999)
- **2001** - Advance Fees (Unearned Revenue)

### Income (4000-4999)
- **4001** - Tuition Fee Income
- **4002** - Transport Fee Income
- **4003** - Lab Fee Income
- **4004** - Library Fee Income
- **4005** - Other Fee Income

---

## Common API Operations

### Initialize Chart of Accounts

```typescript
POST /accounting/accounts/initialize
// Creates default accounts for the school
```

### Create Manual Journal Entry

```typescript
POST /accounting/journal-entries
{
  "entryDate": "2026-01-15",
  "type": "adjustment",
  "description": "Manual adjustment",
  "lines": [
    {
      "accountId": 1001,
      "debitAmount": 1000,
      "creditAmount": 0,
      "description": "Cash adjustment"
    },
    {
      "accountId": 4001,
      "debitAmount": 0,
      "creditAmount": 1000,
      "description": "Income adjustment"
    }
  ]
}
```

### Get Account Balance

```typescript
GET /accounting/accounts/1001/balance?asOfDate=2026-01-31
```

### Get Account Ledger

```typescript
GET /accounting/accounts/1001/ledger?fromDate=2026-01-01&toDate=2026-01-31
```

### Get Trial Balance

```typescript
GET /reports/trial-balance?asOfDate=2026-01-31
```

### Get Profit & Loss

```typescript
GET /reports/profit-loss?fromDate=2026-01-01&toDate=2026-01-31
```

### Get Balance Sheet

```typescript
GET /reports/balance-sheet?asOfDate=2026-01-31
```

---

## Validation Rules

### Journal Entry Balance
- Total Debits MUST equal Total Credits
- Tolerance: 0.01 (for rounding)
- Each line must have EITHER debit OR credit (not both, not neither)

### Payment Amount
- Must be > 0
- Cannot exceed remaining balance
- Validated before payment creation

### Invoice
- Must have at least one item
- Total amount must be > 0
- Invoice number must be unique per school

---

## Error Handling

### Accounting Entry Fails
- Payment/Invoice is still recorded
- Error is logged
- Can be created manually later
- System continues to function

### Balance Validation Fails
- Transaction is rolled back
- Error returned to user
- Entry is not created

---

## Best Practices

1. **Always initialize chart of accounts** before processing transactions
2. **Verify account balances** regularly
3. **Use proper account types** for accurate reporting
4. **Post journal entries** immediately (default behavior)
5. **Review trial balance** monthly
6. **Reconcile payments** with accounting entries
7. **Use transactions** for multi-step operations
8. **Log accounting failures** for manual correction

---

## Troubleshooting

### Issue: "Account not found"
**Solution**: Initialize chart of accounts: `POST /accounting/accounts/initialize`

### Issue: "Journal entry is not balanced"
**Solution**: Check that total debits = total credits. Each line must have either debit OR credit.

### Issue: "Payment recorded but no accounting entry"
**Solution**: Check logs for accounting errors. Create accounting entry manually if needed.

### Issue: "Trial balance doesn't balance"
**Solution**: 
1. Check for unposted journal entries
2. Verify opening balances
3. Check for missing accounting entries
4. Review journal entries for errors

---

**Last Updated**: 2026-01-04

