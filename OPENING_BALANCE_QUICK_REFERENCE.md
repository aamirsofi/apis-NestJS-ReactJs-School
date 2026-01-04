# Opening Balance - Quick Reference Guide

## Quick Decision Tree

```
Is openingBalance set?
├─ No (null/undefined) → Not shown, treated as ₹0
└─ Yes
   ├─ Is it ₹0? → Not shown
   └─ Is it non-zero?
      ├─ Positive (e.g., ₹300) → Shows as "Ledger Balance (Outstanding)" in RED
      └─ Negative (e.g., -₹500) → Shows as "Ledger Balance (Credit)" in GREEN
```

## Visual Examples

### Case 1: ₹300 Outstanding
```
┌─────────────────────────────────────┐
│ Ledger Balance (Outstanding)       │
│ Total: ₹300 | Balance: ₹300        │ ← RED
└─────────────────────────────────────┘
+ Regular Fees: ₹62,400
───────────────────────────────────────
= Total Due: ₹62,700
```

### Case 2: -₹500 Credit
```
┌─────────────────────────────────────┐
│ Ledger Balance (Credit)             │
│ Total: -₹500 | Balance: -₹500      │ ← GREEN
└─────────────────────────────────────┘
+ Regular Fees: ₹62,400
───────────────────────────────────────
= Total Due: ₹61,900
```

### Case 3: ₹0 or null
```
(No opening balance row shown)
Regular Fees: ₹62,400
───────────────────────────────────────
= Total Due: ₹62,400
```

## Real-World Scenarios

### Scenario A: Transfer Student with Outstanding Fees
- **Opening Balance**: ₹2,000
- **Reason**: Unpaid fees from previous school
- **Result**: Added to current year's fees

### Scenario B: Student with Advance Payment
- **Opening Balance**: -₹3,000
- **Reason**: Parent paid advance for next year
- **Result**: Reduces current year's total fees

### Scenario C: New Admission
- **Opening Balance**: ₹0 or null
- **Reason**: Fresh admission, no previous balance
- **Result**: Only current year fees apply

### Scenario D: Fee Adjustment/Correction
- **Opening Balance**: ₹500 or -₹500
- **Reason**: Correction from previous year's calculation error
- **Result**: Adjusts current year's total accordingly

## Formula

```
Total Amount Due = 
  Sum of All Monthly Fees 
  + Opening Balance (if positive)
  - Opening Balance (if negative)
  - Payments Made
```

## Examples in Code

### Setting Opening Balance
```typescript
// In student form
openingBalance: "300"  // Positive (student owes)
openingBalance: "-500" // Negative (student has credit)
openingBalance: "0"    // Zero (no balance)
openingBalance: ""     // Empty (treated as null)
```

### Display Logic
```typescript
// Student Details Card (always shown)
₹{studentDetails.openingBalance?.toLocaleString() || '0'}

// Fee Breakdown (only if non-zero)
if (openingBalance !== 0) {
  // Show as Outstanding or Credit
}
```

## Testing Scenarios

| Test Case | Opening Balance | Expected Display | Expected Total Impact |
|-----------|----------------|-----------------|----------------------|
| 1 | ₹300 | "Ledger Balance (Outstanding)" | +₹300 |
| 2 | -₹500 | "Ledger Balance (Credit)" | -₹500 |
| 3 | ₹0 | Not shown | No impact |
| 4 | null | Not shown | No impact |
| 5 | ₹1,000 | "Ledger Balance (Outstanding)" | +₹1,000 |
| 6 | -₹2,000 | "Ledger Balance (Credit)" | -₹2,000 |

## Different Classes, Categories, and Routes

### Class Variations
- **Lower Classes (1st-3rd)**: Lower fees, simpler fee structure
- **Middle Classes (4th-6th)**: Moderate fees, some additional services
- **Higher Classes (7th-9th)**: Higher fees, lab fees, more services
- **Senior Classes (10th-12th)**: Highest fees, exam fees, comprehensive services

### Fee Category Variations
- **Category A (Standard)**: Base fees, essential services
- **Category B (Premium)**: Higher fees, additional labs, enhanced services

### Route Variations
- **No Transport**: ₹0 additional
- **Short Distance**: ₹800-₹1,000/month
- **Medium Distance**: ₹1,000-₹1,300/month
- **Long Distance**: ₹1,300-₹1,800/month

### Opening Balance Impact Across All Cases
Opening balance works the same way regardless of:
- ✅ Class level (1st Grade or 12th Grade)
- ✅ Fee category (Category A or Category B)
- ✅ Route selection (No transport or any route)
- ✅ Fee structures (Simple or complex)

**Example**: ₹500 opening balance adds ₹500 to total, whether student is in:
- 1st Grade, Category A, No Transport: ₹36,000 → ₹36,500
- 12th Grade, Category B, Long Route: ₹121,000 → ₹121,500

---

## Common Questions

**Q: Why is opening balance sometimes shown and sometimes not?**
A: It's only shown when non-zero. Zero or null values are not displayed to avoid clutter.

**Q: Can opening balance be negative?**
A: Yes! Negative means the student has credit (overpayment or advance payment).

**Q: Does opening balance affect monthly fees?**
A: No, it's a one-time adjustment to the total. Monthly fees remain the same.

**Q: How is opening balance different from regular fees?**
A: Opening balance is a carry-forward amount, not a recurring monthly fee. It's shown as a separate line item.

**Q: What happens if I set opening balance to zero?**
A: It won't appear in the fee breakdown, and totals will only include regular fees.

**Q: Does opening balance change based on class or category?**
A: No! Opening balance is independent. ₹500 is always ₹500, regardless of class, category, or route.

**Q: How do I calculate total fees for a student?**
A: Total = (Class-based fees) + (Category-based fees) + (Route-based fees) + (Opening Balance)

**Q: Can a student have different opening balance than another student in the same class?**
A: Yes! Opening balance is student-specific and depends on their individual payment history, not their class or category.

