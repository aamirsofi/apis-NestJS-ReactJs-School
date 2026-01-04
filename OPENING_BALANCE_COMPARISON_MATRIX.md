# Opening Balance - Comparison Matrix

## Quick Visual Comparison

### Same Opening Balance (₹500) Across Different Configurations

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Configuration          │ Annual Fees │ Opening Balance │ Total Due    │
├─────────────────────────────────────────────────────────────────────────┤
│ 1st Grade, Cat A      │   ₹36,000    │     ₹500        │  ₹36,500     │
│ No Transport          │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 1st Grade, Cat A      │   ₹45,600    │     ₹500        │  ₹46,100     │
│ Short Route           │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 1st Grade, Cat B       │   ₹50,400    │     ₹500        │  ₹50,900     │
│ Short Route           │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 5th Grade, Cat A      │   ₹56,400    │     ₹500        │  ₹56,900     │
│ No Transport          │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 5th Grade, Cat B      │   ₹78,600    │     ₹500        │  ₹79,100     │
│ Medium Route          │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 9th Grade, Cat A      │   ₹79,200    │     ₹500        │  ₹79,700     │
│ Medium Route          │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 9th Grade, Cat B      │  ₹106,400    │     ₹500        │  ₹106,900    │
│ Long Route            │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 12th Grade, Cat A     │  ₹122,000    │     ₹500        │  ₹122,500    │
│ Long Route            │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 12th Grade, Cat B     │  ₹121,000    │     ₹500        │  ₹121,500    │
│ Long Route            │              │                 │              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Same Opening Balance (-₹1,000 Credit) Across Different Configurations

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Configuration          │ Annual Fees │ Opening Balance │ Total Due    │
├─────────────────────────────────────────────────────────────────────────┤
│ 1st Grade, Cat A      │   ₹36,000    │    -₹1,000      │  ₹35,000     │
│ No Transport          │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 5th Grade, Cat B      │   ₹78,600    │    -₹1,000      │  ₹77,600     │
│ Medium Route          │              │                 │              │
├─────────────────────────────────────────────────────────────────────────┤
│ 12th Grade, Cat B     │  ₹121,000    │    -₹1,000      │  ₹120,000    │
│ Long Route            │              │                 │              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fee Component Breakdown

### Example: 9th Grade, Category B, Long Route, ₹500 Opening Balance

```
┌──────────────────────────────────────────────────────────────┐
│ Fee Component Breakdown                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Class-Based Fees:                                            │
│  ├─ Tuition Fee (9th Grade):        ₹84,000/year            │
│  ├─ Library Fee:                    ₹3,600/year            │
│  └─ Lab Fee:                        ₹4,800/year            │
│                                                               │
│  Category-Based Fees (Category B):                            │
│  ├─ Additional Lab Fee:             ₹4,800/year            │
│  └─ Sports Fee (4 months):          ₹800/year              │
│                                                               │
│  Route-Based Fees:                                            │
│  └─ Transport Fee (Long Route):      ₹13,200/year           │
│                                                               │
│  Opening Balance:                                            │
│  └─ Outstanding Amount:              ₹500                   │
│                                                               │
│  ─────────────────────────────────────────────────────────── │
│  Total Annual Fees:                  ₹106,400              │
│  Opening Balance:                    ₹500                   │
│  ─────────────────────────────────────────────────────────── │
│  TOTAL DUE:                         ₹106,900                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Impact Analysis

### How Each Factor Affects Total Fees

| Factor | Impact Range | Example |
|--------|-------------|---------|
| **Class Level** | ₹36,000 - ₹122,000 | 1st Grade vs 12th Grade |
| **Fee Category** | +₹15,000 - ₹25,000 | Category A vs Category B |
| **Route Selection** | ₹0 - ₹21,600 | No transport vs Long distance |
| **Opening Balance** | Variable | ₹500 adds ₹500, -₹1,000 reduces by ₹1,000 |

### Opening Balance is Independent

```
Opening Balance Impact = Opening Balance Amount

It does NOT depend on:
❌ Class level
❌ Fee category
❌ Route selection
❌ Other fees

It ALWAYS adds/subtracts the exact amount specified.
```

---

## Real-World Scenarios

### Scenario 1: New Student (No Opening Balance)
```
Student: Fresh admission
Class: 5th Grade
Category: Category A
Route: Short Distance
Opening Balance: ₹0

Calculation:
  Base Fees: ₹56,400
  Transport: ₹9,600
  Opening Balance: ₹0
  ─────────────────
  Total: ₹66,000
```

### Scenario 2: Transfer Student (Positive Opening Balance)
```
Student: Transferred from another school
Class: 10th Grade
Category: Category A
Route: Medium Distance
Opening Balance: ₹2,500 (outstanding fees)

Calculation:
  Base Fees: ₹78,000
  Transport: ₹12,000
  Opening Balance: ₹2,500
  ─────────────────
  Total: ₹92,500
```

### Scenario 3: Advance Payment (Negative Opening Balance)
```
Student: Parent paid advance
Class: 8th Grade
Category: Category B
Route: Long Distance
Opening Balance: -₹5,000 (credit)

Calculation:
  Base Fees: ₹84,000
  Transport: ₹15,600
  Opening Balance: -₹5,000
  ─────────────────
  Total: ₹94,600
```

---

## Testing Matrix

### Test Cases for Different Combinations

| Test # | Class | Category | Route | Opening Balance | Expected Behavior |
|--------|-------|----------|-------|----------------|------------------|
| 1 | 1st | A | None | ₹500 | Shows as Outstanding, adds ₹500 |
| 2 | 1st | A | Short | ₹500 | Shows as Outstanding, adds ₹500 |
| 3 | 5th | B | Medium | ₹500 | Shows as Outstanding, adds ₹500 |
| 4 | 9th | A | Long | -₹1,000 | Shows as Credit, reduces by ₹1,000 |
| 5 | 12th | B | Long | ₹0 | Not shown, no impact |
| 6 | 12th | B | Long | null | Not shown, no impact |
| 7 | Any | Any | Any | ₹300 | Always adds ₹300 |
| 8 | Any | Any | Any | -₹500 | Always reduces by ₹500 |

---

## Key Takeaways

1. ✅ **Opening balance is universal** - Works the same for all classes, categories, and routes
2. ✅ **Simple addition/subtraction** - ₹500 always adds ₹500, -₹1,000 always reduces by ₹1,000
3. ✅ **Independent factor** - Not affected by other fee components
4. ✅ **Consistent display** - Positive = Outstanding (Red), Negative = Credit (Green)
5. ✅ **Zero/null handling** - Not displayed when zero or null

---

## Formula Summary

```
Total Due = 
  Class-Based Fees
  + Category-Based Fees  
  + Route-Based Fees
  + Opening Balance (can be positive or negative)
  - Payments Made
```

**Opening Balance Component:**
- If positive: Adds to total (student owes)
- If negative: Reduces total (student has credit)
- If zero/null: No impact

