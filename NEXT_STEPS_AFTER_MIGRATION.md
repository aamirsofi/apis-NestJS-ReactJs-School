# Next Steps After Migration

## ✅ Step 1: Initialize Chart of Accounts

Before you can process any accounting transactions, you need to initialize the default Chart of Accounts for each school.

### Using API (Recommended)

```bash
# Make sure you're authenticated and have a JWT token
# Replace <your-jwt-token> with your actual token
# Replace <school-id> with your school ID (usually comes from the authenticated user)

POST http://localhost:3000/accounting/accounts/initialize
Authorization: Bearer <your-jwt-token>
```

**Response**: Returns array of created accounts (Cash, Bank, Fees Receivable, Advance Fees, Income accounts, etc.)

### Using Database Directly (Alternative)

If you prefer to initialize manually or need custom accounts:

```sql
-- Example: Insert default accounts for school ID 1
INSERT INTO accounts (schoolId, code, name, type, subtype, "isActive", "isSystemAccount", "openingBalance")
VALUES
  (1, '1001', 'Cash', 'asset', 'cash', true, true, 0),
  (1, '1002', 'Bank', 'asset', 'bank', true, true, 0),
  (1, '1101', 'Fees Receivable', 'asset', 'receivable', true, true, 0),
  (1, '2001', 'Advance Fees', 'liability', 'unearned_revenue', true, true, 0),
  (1, '4001', 'Tuition Fee Income', 'income', 'operating_income', true, true, 0),
  (1, '4002', 'Transport Fee Income', 'income', 'operating_income', true, true, 0),
  (1, '4003', 'Lab Fee Income', 'income', 'operating_income', true, true, 0),
  (1, '4004', 'Library Fee Income', 'income', 'operating_income', true, true, 0),
  (1, '4005', 'Other Fee Income', 'income', 'operating_income', true, true, 0);
```

---

## ✅ Step 2: Verify Accounts Were Created

```bash
GET http://localhost:3000/accounting/accounts
Authorization: Bearer <your-jwt-token>
```

You should see all the default accounts listed.

---

## ✅ Step 3: Test Invoice Creation

Create a test invoice to verify the accounting system is working:

```bash
POST http://localhost:3000/invoices
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "studentId": 1,
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

**Expected Result**:

- Invoice is created with status "issued"
- Accounting entry is automatically created:
  - Debit: Fees Receivable ₹10,000
  - Credit: Fee Income ₹10,000

---

## ✅ Step 4: Test Payment Recording

Record a payment against the invoice:

```bash
POST http://localhost:3000/payments
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "studentId": 1,
  "studentFeeStructureId": <fee-structure-id>,
  "amount": 5000,
  "paymentMethod": "cash",
  "paymentDate": "2026-01-20"
}
```

**Expected Result**:

- Payment is recorded with receipt number
- Accounting entry is automatically created:
  - Debit: Cash ₹5,000
  - Credit: Fees Receivable ₹5,000

---

## ✅ Step 5: Verify Accounting Entries

Check that journal entries were created:

```bash
# Get account balance for Fees Receivable
GET http://localhost:3000/accounting/accounts/<fees-receivable-account-id>/balance
Authorization: Bearer <your-jwt-token>

# Get account ledger
GET http://localhost:3000/accounting/accounts/<fees-receivable-account-id>/ledger
Authorization: Bearer <your-jwt-token>
```

---

## ✅ Step 6: Test Reports

Verify reports are working:

```bash
# Trial Balance
GET http://localhost:3000/reports/trial-balance?asOfDate=2026-01-31
Authorization: Bearer <your-jwt-token>

# Profit & Loss
GET http://localhost:3000/reports/profit-loss?fromDate=2026-01-01&toDate=2026-01-31
Authorization: Bearer <your-jwt-token>

# Balance Sheet
GET http://localhost:3000/reports/balance-sheet?asOfDate=2026-01-31
Authorization: Bearer <your-jwt-token>

# Fee Collection Summary
GET http://localhost:3000/reports/fee-collection?fromDate=2026-01-01&toDate=2026-01-31
Authorization: Bearer <your-jwt-token>

# Outstanding Dues
GET http://localhost:3000/reports/outstanding-dues
Authorization: Bearer <your-jwt-token>
```

---

## ✅ Step 7: Verify Database Tables

Check that all tables were created correctly:

```sql
-- Check accounts table
SELECT COUNT(*) FROM accounts;

-- Check journal entries
SELECT COUNT(*) FROM journal_entries;

-- Check journal entry lines
SELECT COUNT(*) FROM journal_entry_lines;

-- Check fee invoices
SELECT COUNT(*) FROM fee_invoices;

-- Check fee invoice items
SELECT COUNT(*) FROM fee_invoice_items;
```

---

## 🔍 Troubleshooting

### Issue: "Account not found" error

**Solution**: Run Step 1 to initialize Chart of Accounts

### Issue: "Journal entry is not balanced"

**Solution**: This shouldn't happen automatically, but if creating manual entries, ensure:

- Total debits = Total credits
- Each line has either debit OR credit (not both, not neither)

### Issue: Accounting entry not created for payment/invoice

**Solution**:

1. Check server logs for errors
2. Verify accounts exist (Step 2)
3. Check that payment/invoice was created successfully
4. Accounting entries are created asynchronously - check logs

### Issue: Reports return empty data

**Solution**:

1. Verify you have journal entries: `SELECT * FROM journal_entries WHERE status = 'posted'`
2. Check date ranges in report queries
3. Verify accounts exist

---

## 📋 Quick Checklist

- [ ] Migration completed successfully
- [ ] Chart of Accounts initialized for all schools
- [ ] Test invoice created successfully
- [ ] Test payment recorded successfully
- [ ] Accounting entries created automatically
- [ ] Reports working correctly
- [ ] Database tables verified

---

## 🚀 Next: Frontend Implementation

Once backend is verified working:

1. **Invoice Management UI**

   - List invoices
   - Create invoice form
   - Invoice detail view

2. **Payment Entry UI**

   - Payment form
   - Payment history
   - Receipt view/print

3. **Reports Dashboard**

   - Trial Balance view
   - Profit & Loss view
   - Balance Sheet view
   - Fee collection dashboard

4. **Accounting UI**
   - Chart of Accounts management
   - Journal Entry form
   - Account ledger view

---

## 📚 Documentation Reference

- **Architecture**: See `ACCOUNTING_SYSTEM_ARCHITECTURE.md`
- **Quick Reference**: See `ACCOUNTING_QUICK_REFERENCE.md`
- **API Examples**: See `API_EXAMPLES.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`

---

**Need Help?** Check the documentation files or review the API examples for detailed usage.
