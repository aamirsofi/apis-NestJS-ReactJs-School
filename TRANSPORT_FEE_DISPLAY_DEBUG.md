# Transport Fee Display Debug Guide

## Current Status

✅ **Database is correct:**
```
Invoice #18 (INV-2026-0001):
- Total: ₹4500
- Paid: ₹4500
- Status: PAID

Items:
- Tuition Fee (FEE/60): ₹1200
- Library Fee (FEE/61): ₹100
- Transport Fee (TRANSPORT/32): ₹3200  ← Has correct sourceType!
```

❌ **Fee Registry showing:**
- Tuition: Received ✅
- Library: Received ✅
- Transport: Received ❌ (showing ₹0)

## Debug Steps

### Step 1: Hard Refresh Browser

**Do this first!**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

Clear all caches.

### Step 2: Check API Response

Open browser DevTools (F12) → Network tab

**Look for:**
```
GET /api/invoices?studentId=8&schoolId=9
```

**Click on it and check Response:**

```json
{
  "id": 18,
  "invoiceNumber": "INV-2026-0001",
  "totalAmount": "4500.00",
  "paidAmount": "4500.00",
  "items": [  // ← Must have items!
    {
      "description": "Tuition Fee - General (12th)",
      "amount": "1200.00",
      "sourceType": "FEE",
      "sourceId": 60
    },
    {
      "description": "Library Fee - General (12th)",
      "amount": "100.00",
      "sourceType": "FEE",
      "sourceId": 61
    },
    {
      "description": "Transport Fee",
      "amount": "3200.00",
      "sourceType": "TRANSPORT",  // ← Check this!
      "sourceId": 32
    }
  ]
}
```

**If `items` is missing or empty:**
- Backend is not loading relations correctly
- Check backend logs

### Step 3: Check Console Logs

In DevTools Console tab, search for student 8.

**You should see:**
```javascript
Existing invoices found: [{id: 18, ...}]

Invoice items detail: [{
  id: 18,
  invoiceNumber: "INV-2026-0001",
  totalAmount: "4500.00",
  paidAmount: "4500.00",
  items: [
    {description: "Transport Fee", amount: "3200.00", sourceType: "TRANSPORT", sourceId: 32}
  ]
}]

[Transport] Invoice INV-2026-0001: {
  totalAmount: "4500.00",
  paidAmount: "4500.00",
  itemsCount: 3,
  transportItemsFound: 1,
  transportItems: [
    {description: "Transport Fee", amount: "3200.00", sourceType: "TRANSPORT", sourceId: 32}
  ]
}

[Transport] Calculated: {
  itemTotal: 3200,
  invoiceTotal: 4500,
  proportion: 0.7111,
  allocatedPayment: 3200
}

[Transport] Total received: ₹3200
```

**If you don't see these logs:**
- Frontend code not updated
- Need to rebuild frontend

### Step 4: Verify Backend Loading Relations

Check if backend is loading items:

```bash
# Test the API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/invoices?studentId=8&schoolId=9"
```

Look for `items` array in response.

### Step 5: Check Backend Code

File: `backend/src/invoices/invoices.service.ts`

Line ~220 should have:
```typescript
return this.invoiceRepository.find({
  where,
  relations: ['items', 'student', 'academicYear'],  // ← Must include 'items'
  order: { issueDate: 'DESC' },
});
```

### Step 6: Rebuild Frontend

If console logs are missing:

```bash
cd frontend
npm run dev
```

Then hard refresh browser.

## Common Issues & Fixes

### Issue 1: API Not Returning Items

**Symptom:** Response has invoice but `items: []` or `items: null`

**Fix:**
```typescript
// Check backend/src/invoices/invoices.service.ts line ~220
return this.invoiceRepository.find({
  where,
  relations: ['items', 'student', 'academicYear'],  // Add 'items'
  order: { issueDate: 'DESC' },
});
```

### Issue 2: Frontend Not Fetching Invoices

**Symptom:** Console shows "Existing invoices found: []"

**Fix:**
```typescript
// Check FeeRegistry.tsx - around line 570
const invoicesResponse = await invoicesService.getAll({
  studentId: studentId,
  schoolId: selectedSchoolId as number,  // Must pass schoolId
});
```

### Issue 3: sourceType is null

**Symptom:** Items exist but `sourceType: null`

**Fix:** Old invoice data. Create a new invoice with the updated code.

### Issue 4: Matching Logic Not Working

**Symptom:** Items have correct sourceType but not matched

**Check FeeRegistry.tsx around line 775:**
```typescript
const transportItems = invoice.items.filter(
  (item: any) => {
    if (item.sourceType === 'TRANSPORT') return true;  // This should match!
    if (item.description?.toLowerCase().includes('transport')) return true;
    return false;
  }
);
```

## Manual Test in Console

Open browser console and run:

```javascript
// Get existing invoices
const invoices = await invoicesService.getAll({
  studentId: 8,
  schoolId: 9
});

console.log('Invoices:', invoices);

// Check first invoice
const invoice = invoices[0];
console.log('Items:', invoice.items);

// Find transport items
const transportItems = invoice.items?.filter(item => 
  item.sourceType === 'TRANSPORT' || 
  item.description?.toLowerCase().includes('transport')
);

console.log('Transport items:', transportItems);

// Calculate received
if (transportItems && transportItems.length > 0) {
  const itemTotal = transportItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const invoiceTotal = parseFloat(invoice.totalAmount);
  const proportion = itemTotal / invoiceTotal;
  const allocatedPayment = parseFloat(invoice.paidAmount) * proportion;
  
  console.log('Should show:', {
    itemTotal,
    invoiceTotal,
    proportion,
    allocatedPayment
  });
}
```

## Expected Output

After fixes, Fee Registry should show:

```
┌─────────────────────────────────────────────────────────┐
│ Fee Head          | Total     | Received  | Balance    │
├─────────────────────────────────────────────────────────┤
│ Tuition Fee       | ₹1,200.00 | ₹1,200.00 | ₹0.00 ✅  │
│ Library Fee       | ₹100.00   | ₹100.00   | ₹0.00 ✅  │
│ Transport Fee     | ₹3,200.00 | ₹3,200.00 | ₹0.00 ✅  │
├─────────────────────────────────────────────────────────┤
│ TOTAL             | ₹4,500.00 | ₹4,500.00 | ₹0.00 ✅  │
└─────────────────────────────────────────────────────────┘
```

## Quick Fix Checklist

- [ ] Backend restarted (`npm run start:dev`)
- [ ] Frontend restarted (`npm run dev`)
- [ ] Browser hard refresh (`Ctrl + Shift + R`)
- [ ] Clear browser cache completely
- [ ] API returns items in invoice response
- [ ] Console shows transport items found
- [ ] Console shows calculated received amount
- [ ] Fee breakdown displays correctly

## If Still Not Working

**Create a new test invoice:**

1. Delete invoice #18 (or mark as test)
2. Create a fresh invoice through Fee Registry
3. Make a payment
4. Check if it displays correctly

New invoices will definitely have correct sourceType/sourceId!

---

**Next Step:** Please do a **hard refresh** (Ctrl+Shift+R) and check the **Network tab** to see if the API is returning items!

