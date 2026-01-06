# API Usage Examples

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 1. Initialize Chart of Accounts

Before processing any transactions, initialize the default chart of accounts:

```bash
POST /accounting/accounts/initialize
```

**Response**:
```json
[
  {
    "id": 1,
    "code": "1001",
    "name": "Cash",
    "type": "asset",
    "subtype": "cash",
    "isSystemAccount": true
  },
  {
    "id": 2,
    "code": "1002",
    "name": "Bank",
    "type": "asset",
    "subtype": "bank",
    "isSystemAccount": true
  },
  // ... more accounts
]
```

## 2. Create Fee Invoice

```bash
POST /invoices
Content-Type: application/json

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
    },
    {
      "description": "Transport Fee",
      "amount": 2000,
      "discountAmount": 0
    }
  ],
  "notes": "Monthly fee for January 2026"
}
```

**Response**:
```json
{
  "id": 1,
  "invoiceNumber": "INV-2026-0001",
  "studentId": 123,
  "totalAmount": 12000,
  "balanceAmount": 12000,
  "paidAmount": 0,
  "status": "issued",
  "items": [
    {
      "id": 1,
      "description": "Tuition Fee",
      "amount": 10000
    },
    {
      "id": 2,
      "description": "Transport Fee",
      "amount": 2000
    }
  ]
}
```

**Note**: Accounting entry is automatically created:
- Debit: Fees Receivable ₹12,000
- Credit: Fee Income ₹12,000

## 3. Record Payment

```bash
POST /payments
Content-Type: application/json

{
  "studentId": 123,
  "studentFeeStructureId": 456,
  "amount": 5000,
  "paymentMethod": "cash",
  "paymentDate": "2026-01-20",
  "transactionId": "TXN123456",
  "notes": "Partial payment"
}
```

**Response**:
```json
{
  "id": 1,
  "receiptNumber": "REC-20260120-0001",
  "amount": 5000,
  "paymentMethod": "cash",
  "paymentDate": "2026-01-20",
  "status": "completed",
  "student": {
    "id": 123,
    "studentId": "STU001",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Note**: Accounting entry is automatically created:
- Debit: Cash ₹5,000
- Credit: Fees Receivable ₹5,000

## 4. Get Account Balance

```bash
GET /accounting/accounts/1001/balance?asOfDate=2026-01-31
```

**Response**:
```json
{
  "debit": 50000,
  "credit": 20000,
  "balance": 30000
}
```

## 5. Get Account Ledger

```bash
GET /accounting/accounts/1001/ledger?fromDate=2026-01-01&toDate=2026-01-31
```

**Response**:
```json
[
  {
    "id": 1,
    "journalEntry": {
      "entryNumber": "JE-2026-0001",
      "entryDate": "2026-01-15",
      "description": "Invoice INV-2026-0001"
    },
    "debitAmount": 10000,
    "creditAmount": 0,
    "description": "Fees Receivable - Invoice INV-2026-0001"
  },
  {
    "id": 2,
    "journalEntry": {
      "entryNumber": "JE-2026-0002",
      "entryDate": "2026-01-20",
      "description": "Payment received - Receipt REC-20260120-0001"
    },
    "debitAmount": 0,
    "creditAmount": 5000,
    "description": "Fees Receivable - Payment REC-20260120-0001"
  }
]
```

## 6. Create Manual Journal Entry

```bash
POST /accounting/journal-entries
Content-Type: application/json

{
  "entryDate": "2026-01-25",
  "type": "adjustment",
  "description": "Manual adjustment for discount",
  "lines": [
    {
      "accountId": 1101,
      "debitAmount": 0,
      "creditAmount": 500,
      "description": "Discount adjustment"
    },
    {
      "accountId": 4001,
      "debitAmount": 500,
      "creditAmount": 0,
      "description": "Income adjustment"
    }
  ],
  "notes": "Discount applied retroactively"
}
```

**Response**:
```json
{
  "id": 10,
  "entryNumber": "JE-2026-0010",
  "entryDate": "2026-01-25",
  "type": "adjustment",
  "status": "posted",
  "totalDebit": 500,
  "totalCredit": 500,
  "lines": [
    {
      "id": 20,
      "accountId": 1101,
      "debitAmount": 0,
      "creditAmount": 500
    },
    {
      "id": 21,
      "accountId": 4001,
      "debitAmount": 500,
      "creditAmount": 0
    }
  ]
}
```

## 7. Get Trial Balance

```bash
GET /reports/trial-balance?asOfDate=2026-01-31
```

**Response**:
```json
[
  {
    "accountCode": "1001",
    "accountName": "Cash",
    "accountType": "asset",
    "openingBalance": 0,
    "debit": 50000,
    "credit": 20000,
    "balance": 30000
  },
  {
    "accountCode": "1101",
    "accountName": "Fees Receivable",
    "accountType": "asset",
    "openingBalance": 0,
    "debit": 120000,
    "credit": 50000,
    "balance": 70000
  },
  {
    "accountCode": "4001",
    "accountName": "Tuition Fee Income",
    "accountType": "income",
    "openingBalance": 0,
    "debit": 0,
    "credit": 120000,
    "balance": 120000
  }
]
```

## 8. Get Profit & Loss Statement

```bash
GET /reports/profit-loss?fromDate=2026-01-01&toDate=2026-01-31
```

**Response**:
```json
{
  "period": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "income": {
    "items": [
      {
        "accountCode": "4001",
        "accountName": "Tuition Fee Income",
        "amount": 120000
      },
      {
        "accountCode": "4002",
        "accountName": "Transport Fee Income",
        "amount": 24000
      }
    ],
    "total": 144000
  },
  "expenses": {
    "items": [],
    "total": 0
  },
  "netProfit": 144000
}
```

## 9. Get Balance Sheet

```bash
GET /reports/balance-sheet?asOfDate=2026-01-31
```

**Response**:
```json
{
  "asOfDate": "2026-01-31",
  "assets": {
    "items": [
      {
        "accountCode": "1001",
        "accountName": "Cash",
        "balance": 30000
      },
      {
        "accountCode": "1101",
        "accountName": "Fees Receivable",
        "balance": 70000
      }
    ],
    "total": 100000
  },
  "liabilities": {
    "items": [],
    "total": 0
  },
  "equity": {
    "items": [],
    "total": 0
  },
  "total": 100000,
  "balance": 100000
}
```

## 10. Get Fee Collection Summary

```bash
GET /reports/fee-collection?fromDate=2026-01-01&toDate=2026-01-31
```

**Response**:
```json
{
  "period": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "totalAmount": 50000,
  "totalCount": 25,
  "byMethod": {
    "cash": {
      "count": 15,
      "amount": 30000
    },
    "bank_transfer": {
      "count": 8,
      "amount": 15000
    },
    "card": {
      "count": 2,
      "amount": 5000
    }
  }
}
```

## 11. Get Outstanding Dues

```bash
GET /reports/outstanding-dues
```

**Response**:
```json
[
  {
    "invoiceId": 1,
    "invoiceNumber": "INV-2026-0001",
    "studentId": "STU001",
    "studentName": "John Doe",
    "academicYear": "2025-2026",
    "totalAmount": 12000,
    "paidAmount": 5000,
    "balanceAmount": 7000,
    "dueDate": "2026-02-15",
    "status": "partially_paid"
  },
  {
    "invoiceId": 2,
    "invoiceNumber": "INV-2026-0002",
    "studentId": "STU002",
    "studentName": "Jane Smith",
    "academicYear": "2025-2026",
    "totalAmount": 10000,
    "paidAmount": 0,
    "balanceAmount": 10000,
    "dueDate": "2026-02-15",
    "status": "issued"
  }
]
```

## 12. Get Receipt Data

```bash
GET /receipts/1
```

**Response**:
```json
{
  "receiptNumber": "REC-20260120-0001",
  "receiptDate": "2026-01-20",
  "payment": {
    "id": 1,
    "amount": 5000,
    "paymentMethod": "cash",
    "paymentDate": "2026-01-20",
    "transactionId": "TXN123456"
  },
  "student": {
    "id": 123,
    "studentId": "STU001",
    "name": "John Doe",
    "class": "2025-2026"
  },
  "fee": {
    "name": "Tuition Fee",
    "totalAmount": 10000,
    "paidAmount": 5000,
    "remainingBalance": 5000,
    "dueDate": "2026-02-15"
  },
  "school": {
    "name": "ABC School",
    "address": "123 Main St",
    "phone": "+1234567890",
    "email": "info@abcschool.com"
  }
}
```

## Error Responses

### Validation Error
```json
{
  "statusCode": 400,
  "message": "Journal entry is not balanced. Debits: 1000, Credits: 500",
  "error": "Bad Request"
}
```

### Not Found Error
```json
{
  "statusCode": 404,
  "message": "Account not found",
  "error": "Not Found"
}
```

### Unauthorized Error
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

**Note**: All dates should be in ISO 8601 format (YYYY-MM-DD).
All amounts are in the base currency (e.g., INR, USD, etc.).

