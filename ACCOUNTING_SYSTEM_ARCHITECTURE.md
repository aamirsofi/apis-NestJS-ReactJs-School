# Payments & Accounting Module - Architecture Documentation

## Overview

This document describes the architecture and implementation of the Payments & Accounting module for the School ERP system. The system implements **strict separation** between payment handling and accounting, following double-entry accounting principles.

## Core Principles

### 1. Separation of Concerns

**CRITICAL**: Payment operations and accounting operations are strictly separated:

- **Payment Service**: Handles payment recording, validation, receipt generation
- **Accounting Service**: Handles all double-entry accounting entries
- **Payment Accounting Service**: Bridge service that creates accounting entries AFTER payments are recorded

**Payment creation does NOT directly touch accounting tables.** All accounting entries are created through the Accounting Service.

### 2. Double-Entry Accounting

Every financial transaction creates balanced debit and credit entries:
- Total Debits = Total Credits (enforced at database and service level)
- Each journal entry must have at least 2 lines
- Journal entries are validated before posting

### 3. Auditability

- All financial records are immutable (no hard deletes)
- Journal entries track who posted/reversed entries and when
- Full audit trail through journal entries and lines

## System Architecture

### Module Structure

```
backend/src/
├── accounting/          # Core accounting engine
│   ├── entities/       # Account, JournalEntry, JournalEntryLine
│   ├── services/       # AccountingService, AccountsService
│   ├── controllers/    # AccountingController, AccountsController
│   └── dto/           # DTOs for accounting operations
├── invoices/           # Fee invoice management
│   ├── entities/      # FeeInvoice, FeeInvoiceItem
│   ├── services/      # InvoicesService
│   └── controllers/   # InvoicesController
├── payments/           # Payment handling (UPDATED)
│   ├── entities/      # Payment entity
│   ├── services/      # PaymentsService, PaymentAccountingService
│   └── controllers/   # PaymentsController
├── receipts/          # Receipt generation
│   ├── services/      # ReceiptsService
│   └── controllers/   # ReceiptsController
└── reports/           # Financial reports
    ├── services/      # ReportsService
    └── controllers/   # ReportsController
```

## Database Schema

### Chart of Accounts (accounts)

```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  schoolId INTEGER NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('asset', 'liability', 'equity', 'income', 'expense') NOT NULL,
  subtype ENUM(...) NULL,
  description TEXT NULL,
  isActive BOOLEAN DEFAULT true,
  isSystemAccount BOOLEAN DEFAULT false,
  parentAccountId INTEGER NULL,
  openingBalance DECIMAL(15,2) DEFAULT 0,
  openingBalanceDate DATE NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_accounts_school_code ON accounts(schoolId, code);
```

### Journal Entries (journal_entries)

```sql
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  schoolId INTEGER NOT NULL,
  entryNumber VARCHAR(50) NOT NULL,
  entryDate DATE NOT NULL,
  type ENUM('invoice', 'payment', 'advance_payment', ...) NOT NULL,
  status ENUM('draft', 'posted', 'reversed') DEFAULT 'draft',
  description TEXT NOT NULL,
  reference VARCHAR(255) NULL,
  referenceId INTEGER NULL,
  totalDebit DECIMAL(15,2) NOT NULL,
  totalCredit DECIMAL(15,2) NOT NULL,
  postedById INTEGER NULL,
  postedAt TIMESTAMP NULL,
  reversedById INTEGER NULL,
  reversedAt TIMESTAMP NULL,
  reversedEntryId INTEGER NULL,
  notes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_journal_entries_school_entry_number 
  ON journal_entries(schoolId, entryNumber);
```

### Journal Entry Lines (journal_entry_lines)

```sql
CREATE TABLE journal_entry_lines (
  id SERIAL PRIMARY KEY,
  journalEntryId INTEGER NOT NULL,
  accountId INTEGER NOT NULL,
  debitAmount DECIMAL(15,2) NOT NULL,
  creditAmount DECIMAL(15,2) NOT NULL,
  description TEXT NULL
);

CREATE INDEX idx_journal_entry_lines_entry_account 
  ON journal_entry_lines(journalEntryId, accountId);
```

### Fee Invoices (fee_invoices)

```sql
CREATE TABLE fee_invoices (
  id SERIAL PRIMARY KEY,
  schoolId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  academicYearId INTEGER NOT NULL,
  invoiceNumber VARCHAR(50) NOT NULL,
  issueDate DATE NOT NULL,
  dueDate DATE NOT NULL,
  type ENUM('monthly', 'quarterly', 'yearly', 'one_time') NOT NULL,
  status ENUM('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  totalAmount DECIMAL(15,2) NOT NULL,
  paidAmount DECIMAL(15,2) DEFAULT 0,
  discountAmount DECIMAL(15,2) DEFAULT 0,
  balanceAmount DECIMAL(15,2) NOT NULL,
  notes TEXT NULL,
  journalEntryId INTEGER NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Fee Invoice Items (fee_invoice_items)

```sql
CREATE TABLE fee_invoice_items (
  id SERIAL PRIMARY KEY,
  invoiceId INTEGER NOT NULL,
  feeStructureId INTEGER NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  discountAmount DECIMAL(15,2) DEFAULT 0,
  dueDate DATE NULL,
  notes TEXT NULL
);
```

## Accounting Scenarios

### 1. Invoice Generation

**Business Event**: Fee invoice is generated for a student

**Accounting Entry**:
```
Debit:  Fees Receivable (Asset)     ₹10,000
Credit: Fee Income (Income)         ₹10,000
```

**Implementation**:
- Invoice is created via `InvoicesService.create()`
- After invoice creation, `createInvoiceAccountingEntry()` is called
- Creates journal entry with type `INVOICE`
- Links journal entry to invoice via `referenceId`

### 2. Payment Against Invoice

**Business Event**: Payment received against an invoice

**Accounting Entry**:
```
Debit:  Cash / Bank (Asset)         ₹5,000
Credit: Fees Receivable (Asset)     ₹5,000
```

**Implementation**:
- Payment is created via `PaymentsService.create()`
- Payment is saved to database
- `PaymentAccountingService.recordPaymentAccounting()` is called
- Creates journal entry with type `PAYMENT`
- Links journal entry to payment via `referenceId`

**Important**: Payment creation succeeds even if accounting entry creation fails (logged for manual correction).

### 3. Advance Payment

**Business Event**: Payment received before invoice generation

**Accounting Entry**:
```
Debit:  Cash / Bank (Asset)         ₹3,000
Credit: Advance Fees (Liability)     ₹3,000
```

**Implementation**:
- Payment is created with special flag or detected as advance
- `PaymentAccountingService.recordAdvancePaymentAccounting()` is called
- Creates journal entry with type `ADVANCE_PAYMENT`

### 4. Advance Adjustment

**Business Event**: Advance payment is applied to an invoice

**Accounting Entry**:
```
Debit:  Advance Fees (Liability)    ₹3,000
Credit: Fee Income (Income)         ₹3,000
```

**Implementation**:
- When invoice is generated and advance exists
- `PaymentAccountingService.recordAdvanceAdjustmentAccounting()` is called
- Creates journal entry with type `ADVANCE_ADJUSTMENT`

### 5. Refund

**Business Event**: Refund issued to student

**Accounting Entry**:
```
Debit:  Fee Income / Advance Fees   ₹1,000
Credit: Cash / Bank (Asset)         ₹1,000
```

**Implementation**:
- Refund payment is created (negative amount or special type)
- `PaymentAccountingService.recordRefundAccounting()` is called
- Creates journal entry with type `REFUND`

## Default Chart of Accounts

When a school is initialized, the following default accounts are created:

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

## API Endpoints

### Accounting

- `POST /accounting/journal-entries` - Create journal entry
- `POST /accounting/journal-entries/:id/post` - Post journal entry
- `POST /accounting/journal-entries/:id/reverse` - Reverse journal entry
- `GET /accounting/accounts` - List accounts
- `POST /accounting/accounts` - Create account
- `POST /accounting/accounts/initialize` - Initialize default chart of accounts
- `GET /accounting/accounts/:id/balance` - Get account balance
- `GET /accounting/accounts/:id/ledger` - Get account ledger

### Invoices

- `POST /invoices` - Create invoice
- `GET /invoices` - List invoices
- `GET /invoices/:id` - Get invoice details
- `PUT /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice (draft only)

### Payments

- `POST /payments` - Record payment
- `GET /payments` - List payments
- `GET /payments/:id` - Get payment details
- `PUT /payments/:id` - Update payment
- `DELETE /payments/:id` - Delete payment

### Receipts

- `GET /receipts/:id` - Get receipt data

### Reports

- `GET /reports/trial-balance` - Trial balance
- `GET /reports/profit-loss` - Profit & Loss statement
- `GET /reports/balance-sheet` - Balance sheet
- `GET /reports/fee-collection` - Fee collection summary
- `GET /reports/outstanding-dues` - Student outstanding dues

## Service Layer Architecture

### AccountingService

**Responsibilities**:
- Create journal entries with balance validation
- Post/unpost journal entries
- Reverse journal entries
- Calculate account balances
- Generate ledger reports

**Key Methods**:
- `createJournalEntry()` - Creates balanced journal entry
- `postJournalEntry()` - Changes status from DRAFT to POSTED
- `reverseJournalEntry()` - Creates reversing entry
- `getAccountBalance()` - Calculates account balance
- `getAccountLedger()` - Gets ledger entries for account

### PaymentAccountingService

**Responsibilities**:
- Create accounting entries for payment operations
- Map payment methods to accounts (Cash/Bank)
- Handle advance payments and adjustments
- Handle refunds

**Key Methods**:
- `recordPaymentAccounting()` - Accounting entry for payment
- `recordAdvancePaymentAccounting()` - Accounting entry for advance
- `recordAdvanceAdjustmentAccounting()` - Accounting entry for advance adjustment
- `recordRefundAccounting()` - Accounting entry for refund

### InvoicesService

**Responsibilities**:
- Create fee invoices with line items
- Generate invoice numbers
- Create accounting entries for invoices
- Track invoice status and payments

### PaymentsService

**Responsibilities**:
- Record payments
- Validate payment amounts
- Generate receipt numbers
- Update fee structure status
- **DOES NOT directly touch accounting tables**

### ReportsService

**Responsibilities**:
- Generate Trial Balance
- Generate Profit & Loss statement
- Generate Balance Sheet
- Generate fee collection summaries
- Generate outstanding dues reports

## Transaction Management

### Invoice Creation Flow

```
1. Start Transaction
2. Create Invoice
3. Create Invoice Items
4. Commit Transaction
5. Create Accounting Entry (separate transaction)
```

### Payment Creation Flow

```
1. Validate Payment
2. Create Payment Record
3. Update Fee Structure Status
4. Create Accounting Entry (async, separate transaction)
```

## Validation Rules

### Journal Entry Validation

1. Must have at least 2 lines
2. Total debits must equal total credits (within 0.01 tolerance)
3. Each line must have either debit OR credit (not both, not neither)
4. All accounts must exist and belong to the school
5. Entry date cannot be in the future (configurable)

### Payment Validation

1. Payment amount must be > 0
2. Payment amount cannot exceed remaining balance
3. Student fee structure must exist and belong to school
4. Receipt number must be unique

### Invoice Validation

1. Must have at least one item
2. Total amount must be > 0
3. Student must exist and belong to school
4. Academic year must exist
5. Invoice number must be unique

## Error Handling

### Accounting Entry Failures

If accounting entry creation fails:
- Payment/Invoice is still recorded
- Error is logged
- Accounting entry can be created manually later
- System continues to function

### Balance Validation Failures

If journal entry is not balanced:
- Transaction is rolled back
- Error is returned to user
- Entry is not created

## Security Considerations

1. **School Isolation**: All queries filter by `schoolId`
2. **Role-Based Access**: JWT authentication required for all endpoints
3. **Audit Trail**: All accounting entries track user who created/posted
4. **Immutable Records**: Financial records cannot be hard-deleted

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Validate balances** before posting journal entries
3. **Log accounting failures** but don't fail payment operations
4. **Use proper account types** for accurate financial reporting
5. **Initialize chart of accounts** before processing transactions
6. **Regular reconciliation** between payment records and accounting entries

## Future Enhancements

1. **Event-Driven Architecture**: Use events for accounting entry creation
2. **Multi-Currency Support**: Add currency fields and conversion
3. **Payment Gateway Integration**: Direct integration with payment gateways
4. **Automated Reconciliation**: Auto-match payments with invoices
5. **Advanced Reporting**: Custom report builder
6. **Budget Management**: Budget vs actual reporting
7. **Financial Year Management**: Support for different financial year periods

## Testing Considerations

1. Test balance validation (debits = credits)
2. Test transaction rollback on errors
3. Test school isolation
4. Test account balance calculations
5. Test report generation accuracy
6. Test concurrent payment processing

## Migration Guide

To initialize the accounting system for an existing school:

1. Run migration: `npm run migration:run`
2. Initialize chart of accounts: `POST /accounting/accounts/initialize`
3. Create opening balance entries for existing balances
4. Verify account balances match actual balances

---

**Last Updated**: 2026-01-04
**Version**: 1.0.0

