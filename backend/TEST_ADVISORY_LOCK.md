# Test Advisory Lock Implementation

## Please provide:

1. **Full error message** from browser console or backend logs
2. **When does the error occur?**
   - During invoice creation?
   - During invoice finalization?
   - During payment creation?
3. **How quickly are you clicking?**
   - Single click "Pay Now"?
   - Double-clicking?
   - Two browser tabs simultaneously?

## To verify the backend has the new code:

1. Check backend logs for this startup message
2. Try making a payment and check for this log:

```
[AccountingService] Using advisory lock for schoolId=X
```

## Quick test to isolate the issue:

### Test 1: Create invoice only (no payment)
```bash
POST /api/invoices
{
  "studentId": 8,
  "academicYearId": 4,
  "issueDate": "2026-01-06",
  "dueDate": "2026-01-06",
  "type": "one_time",
  "items": [{ "description": "Test Fee", "amount": 10, "sourceType": "FEE", "sourceId": 61 }]
}
```

Does this create journal entries? If yes, which entry number?

### Test 2: Finalize the invoice
```bash
POST /api/invoices/{id}/finalize?schoolId=9
```

Does this fail with duplicate? Or succeed?

### Test 3: Create payment
```bash
POST /api/payments
{
  "studentId": 8,
  "invoiceId": {id from above},
  "amount": 10,
  "paymentDate": "2026-01-06",
  "paymentMethod": "cash",
  "schoolId": 9
}
```

Does THIS fail with duplicate?

## Alternative hypothesis:

The problem might be that **invoice creation** is ALSO creating journal entries (it shouldn't). Let me check...

