# Opening Balance Examples - Different Cases

This document demonstrates how the system handles opening balance in various scenarios during fee generation.

## Understanding Opening Balance

- **Positive Opening Balance**: Student owes money (debt/outstanding)
- **Negative Opening Balance**: Student has credit (overpayment/advance)
- **Zero Opening Balance**: No balance carried forward
- **Null/Undefined**: No opening balance set

---

## Example 1: Positive Opening Balance (Student Owes Money)

### Scenario
- Student: Aamir Bashir (ID: 4)
- Opening Balance: ₹300.00
- Monthly Tuition Fee: ₹5,000
- Monthly Library Fee: ₹200
- Academic Year: 2025-2026 (12 months)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | ... | Total | Received | Balance |
|----------|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Outstanding)** | - | - | - | - | **₹300** | ₹0 | **₹300** |
| Tuition Fee | ₹5,000 | ₹5,000 | ₹5,000 | ... | ₹60,000 | ₹0 | ₹60,000 |
| Library Fee | ₹200 | ₹200 | ₹200 | ... | ₹2,400 | ₹0 | ₹2,400 |
| **Total Amount** | ₹5,200 | ₹5,200 | ₹5,200 | ... | **₹62,700** | ₹0 | **₹62,700** |

### Explanation
- Opening balance of ₹300 is added to the total amount due
- Student needs to pay ₹62,700 total (including the outstanding ₹300)
- Displayed as "Ledger Balance (Outstanding)" in red color

---

## Example 2: Negative Opening Balance (Student Has Credit)

### Scenario
- Student: Priya Sharma (ID: 5)
- Opening Balance: -₹1,500.00 (credit/overpayment)
- Monthly Tuition Fee: ₹5,000
- Monthly Library Fee: ₹200
- Academic Year: 2025-2026 (12 months)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | ... | Total | Received | Balance |
|----------|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Credit)** | - | - | - | - | **-₹1,500** | ₹0 | **-₹1,500** |
| Tuition Fee | ₹5,000 | ₹5,000 | ₹5,000 | ... | ₹60,000 | ₹0 | ₹60,000 |
| Library Fee | ₹200 | ₹200 | ₹200 | ... | ₹2,400 | ₹0 | ₹2,400 |
| **Total Amount** | ₹5,200 | ₹5,200 | ₹5,200 | ... | **₹60,900** | ₹0 | **₹60,900** |

### Explanation
- Opening balance of -₹1,500 reduces the total amount due
- Student needs to pay ₹60,900 total (₹62,400 - ₹1,500 credit)
- Displayed as "Ledger Balance (Credit)" in green color
- The credit is applied against the total fees

---

## Example 3: Zero Opening Balance

### Scenario
- Student: Rahul Kumar (ID: 6)
- Opening Balance: ₹0.00
- Monthly Tuition Fee: ₹5,000
- Monthly Library Fee: ₹200
- Academic Year: 2025-2026 (12 months)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | ... | Total | Received | Balance |
|----------|-----|-----|-----|-----|-------|----------|---------|
| Tuition Fee | ₹5,000 | ₹5,000 | ₹5,000 | ... | ₹60,000 | ₹0 | ₹60,000 |
| Library Fee | ₹200 | ₹200 | ₹200 | ... | ₹2,400 | ₹0 | ₹2,400 |
| **Total Amount** | ₹5,200 | ₹5,200 | ₹5,200 | ... | **₹62,400** | ₹0 | **₹62,400** |

### Explanation
- No opening balance row is shown (since it's zero)
- Only regular fees are displayed
- Total is ₹62,400 (no adjustment)

---

## Example 4: Null/Undefined Opening Balance

### Scenario
- Student: New Student (ID: 7)
- Opening Balance: null (not set)
- Monthly Tuition Fee: ₹5,000
- Monthly Library Fee: ₹200
- Academic Year: 2025-2026 (12 months)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | ... | Total | Received | Balance |
|----------|-----|-----|-----|-----|-------|----------|---------|
| Tuition Fee | ₹5,000 | ₹5,000 | ₹5,000 | ... | ₹60,000 | ₹0 | ₹60,000 |
| Library Fee | ₹200 | ₹200 | ₹200 | ... | ₹2,400 | ₹0 | ₹2,400 |
| **Total Amount** | ₹5,200 | ₹5,200 | ₹5,200 | ... | **₹62,400** | ₹0 | **₹62,400** |

### Explanation
- No opening balance row is shown (treated as zero)
- Only regular fees are displayed
- Same behavior as zero opening balance

---

## Example 5: Complex Scenario - Mixed Payments and Opening Balance

### Scenario
- Student: Anjali Patel (ID: 8)
- Opening Balance: ₹500.00 (outstanding)
- Monthly Tuition Fee: ₹5,000
- Monthly Library Fee: ₹200
- Transport Fee: ₹1,000/month
- Academic Year: 2025-2026 (12 months)
- Already Paid: ₹10,000 (partial payment for first 2 months)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | ... | Total | Received | Balance |
|----------|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Outstanding)** | - | - | - | - | **₹500** | ₹0 | **₹500** |
| Tuition Fee | ₹5,000 | ₹5,000 | ₹5,000 | ... | ₹60,000 | ₹10,000 | ₹50,000 |
| Library Fee | ₹200 | ₹200 | ₹200 | ... | ₹2,400 | ₹0 | ₹2,400 |
| Transport Fee | ₹1,000 | ₹1,000 | ₹1,000 | ... | ₹12,000 | ₹0 | ₹12,000 |
| **Total Amount** | ₹6,200 | ₹6,200 | ₹6,200 | ... | **₹74,900** | ₹10,000 | **₹64,900** |

### Explanation
- Opening balance of ₹500 is included in total
- Total fees: ₹74,400 (regular fees) + ₹500 (opening balance) = ₹74,900
- After payment of ₹10,000: Balance = ₹64,900
- Student still needs to pay ₹64,900

---

## Example 6: Large Credit Balance

### Scenario
- Student: Vikram Singh (ID: 9)
- Opening Balance: -₹5,000.00 (large credit from previous year)
- Monthly Tuition Fee: ₹5,000
- Monthly Library Fee: ₹200
- Academic Year: 2025-2026 (12 months)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | ... | Total | Received | Balance |
|----------|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Credit)** | - | - | - | - | **-₹5,000** | ₹0 | **-₹5,000** |
| Tuition Fee | ₹5,000 | ₹5,000 | ₹5,000 | ... | ₹60,000 | ₹0 | ₹60,000 |
| Library Fee | ₹200 | ₹200 | ₹200 | ... | ₹2,400 | ₹0 | ₹2,400 |
| **Total Amount** | ₹5,200 | ₹5,200 | ₹5,200 | ... | **₹57,400** | ₹0 | **₹57,400** |

### Explanation
- Large credit of ₹5,000 significantly reduces the total
- Student needs to pay ₹57,400 instead of ₹62,400
- The credit covers part of the fees

---

## Example 7: Opening Balance with Existing Fees

### Scenario
- Student: Meera Desai (ID: 10)
- Opening Balance: ₹1,200.00 (outstanding)
- Existing Generated Fees:
  - Tuition Fee (Jan): ₹5,000 (Status: PENDING)
  - Library Fee (Jan): ₹200 (Status: PENDING)
- New Fees to Generate: Remaining 11 months

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | ... | Total | Received | Balance |
|----------|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Outstanding)** | - | - | - | - | **₹1,200** | ₹0 | **₹1,200** |
| Tuition Fee | ₹5,000 | ₹5,000 | ₹5,000 | ... | ₹60,000 | ₹0 | ₹60,000 |
| Library Fee | ₹200 | ₹200 | ₹200 | ... | ₹2,400 | ₹0 | ₹2,400 |
| **Total Amount** | ₹5,200 | ₹5,200 | ₹5,200 | ... | **₹63,600** | ₹0 | **₹63,600** |

### Explanation
- Opening balance is shown separately from monthly fees
- Existing fees are included in the breakdown
- Total includes both opening balance and all fees

---

## Example 8: Different Classes - Lower Class (1st Grade)

### Scenario
- Student: Arjun Mehta (ID: 11)
- **Class**: 1st Grade
- **Fee Category**: Category A (Lower Classes)
- **Route**: Route 1 (City Center)
- Opening Balance: ₹200.00
- Fee Structures:
  - Tuition Fee: ₹3,000/month (all 12 months)
  - Library Fee: ₹150/month (all 12 months)
  - Activity Fee: ₹100/month (Sep, Oct, Nov only)
- Transport Fee: ₹800/month (Route Plan for 1st Grade)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total | Received | Balance |
|----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Outstanding)** | - | - | - | - | - | - | - | - | - | - | - | - | **₹200** | ₹0 | **₹200** |
| Tuition Fee | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹3,000 | ₹36,000 | ₹0 | ₹36,000 |
| Library Fee | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹150 | ₹1,800 | ₹0 | ₹1,800 |
| Activity Fee | - | - | - | - | - | - | - | - | ₹100 | ₹100 | ₹100 | - | ₹300 | ₹0 | ₹300 |
| Transport Fee | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹800 | ₹9,600 | ₹0 | ₹9,600 |
| **Total Amount** | ₹3,950 | ₹3,950 | ₹3,950 | ₹3,950 | ₹3,950 | ₹3,950 | ₹3,950 | ₹3,950 | ₹4,050 | ₹4,050 | ₹4,050 | ₹3,950 | **₹47,900** | ₹0 | **₹47,900** |

### Explanation
- Lower class has lower tuition fees (₹3,000 vs ₹5,000)
- Activity fee only applies to specific months (Sep-Nov)
- Transport fee is class-specific (₹800 for 1st Grade)
- Opening balance of ₹200 added to total

---

## Example 9: Different Classes - Higher Class (12th Grade)

### Scenario
- Student: Kavya Reddy (ID: 12)
- **Class**: 12th Grade
- **Fee Category**: Category B (Higher Classes)
- **Route**: Route 2 (Suburbs)
- Opening Balance: -₹1,000.00 (credit)
- Fee Structures:
  - Tuition Fee: ₹8,000/month (all 12 months)
  - Library Fee: ₹300/month (all 12 months)
  - Lab Fee: ₹500/month (all 12 months)
  - Exam Fee: ₹2,000 (one-time, Jan only)
- Transport Fee: ₹1,200/month (Route Plan for 12th Grade)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total | Received | Balance |
|----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Credit)** | - | - | - | - | - | - | - | - | - | - | - | - | **-₹1,000** | ₹0 | **-₹1,000** |
| Tuition Fee | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹8,000 | ₹96,000 | ₹0 | ₹96,000 |
| Library Fee | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹3,600 | ₹0 | ₹3,600 |
| Lab Fee | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹500 | ₹6,000 | ₹0 | ₹6,000 |
| Exam Fee | ₹2,000 | - | - | - | - | - | - | - | - | - | - | - | ₹2,000 | ₹0 | ₹2,000 |
| Transport Fee | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹1,200 | ₹14,400 | ₹0 | ₹14,400 |
| **Total Amount** | ₹12,500 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | ₹10,300 | **₹121,000** | ₹0 | **₹121,000** |

### Explanation
- Higher class has higher tuition fees (₹8,000 vs ₹3,000)
- Additional lab fee for science subjects
- One-time exam fee in January
- Higher transport fee (₹1,200 vs ₹800)
- Credit of ₹1,000 reduces total from ₹122,000 to ₹121,000

---

## Example 10: Different Fee Categories - Category A vs Category B

### Scenario A: Category A Student
- Student: Rohan Kapoor (ID: 13)
- **Class**: 5th Grade
- **Fee Category**: Category A (Standard Fees)
- Opening Balance: ₹500.00
- Fee Structures:
  - Tuition Fee: ₹4,500/month
  - Library Fee: ₹200/month
- **Total Annual Fees**: ₹56,400 + ₹500 = **₹56,900**

### Scenario B: Category B Student
- Student: Sameer Joshi (ID: 14)
- **Class**: 5th Grade (Same class as above)
- **Fee Category**: Category B (Premium Fees)
- Opening Balance: ₹500.00
- Fee Structures:
  - Tuition Fee: ₹6,000/month (higher for Category B)
  - Library Fee: ₹250/month
  - Computer Lab Fee: ₹300/month
- **Total Annual Fees**: ₹78,600 + ₹500 = **₹79,100**

### Comparison Table

| Aspect | Category A | Category B | Difference |
|--------|-----------|-----------|------------|
| Tuition Fee/Month | ₹4,500 | ₹6,000 | +₹1,500 |
| Library Fee/Month | ₹200 | ₹250 | +₹50 |
| Additional Fees | None | Computer Lab ₹300/month | +₹3,600/year |
| Annual Total (without opening balance) | ₹56,400 | ₹78,600 | +₹22,200 |
| With Opening Balance (₹500) | ₹56,900 | ₹79,100 | +₹22,200 |

### Explanation
- Same class (5th Grade) but different fee categories
- Category B has higher fees and additional services
- Opening balance affects both equally (₹500 added to each)

---

## Example 11: Different Routes - No Transport vs With Transport

### Scenario A: Student Without Transport
- Student: Neha Verma (ID: 15)
- **Class**: 8th Grade
- **Fee Category**: Category A
- **Route**: None (No transport)
- Opening Balance: ₹300.00
- Fee Structures:
  - Tuition Fee: ₹5,500/month
  - Library Fee: ₹200/month
- **Total**: ₹68,400 + ₹300 = **₹68,700**

### Scenario B: Student With Transport
- Student: Aditya Nair (ID: 16)
- **Class**: 8th Grade (Same class)
- **Fee Category**: Category A (Same category)
- **Route**: Route 3 (Long Distance)
- Opening Balance: ₹300.00
- Fee Structures:
  - Tuition Fee: ₹5,500/month (same)
  - Library Fee: ₹200/month (same)
- Transport Fee: ₹1,500/month (Route 3 for 8th Grade)
- **Total**: ₹86,400 + ₹300 = **₹86,700**

### Comparison Table

| Fee Component | Without Transport | With Transport | Difference |
|--------------|------------------|---------------|------------|
| Tuition Fee | ₹66,000 | ₹66,000 | Same |
| Library Fee | ₹2,400 | ₹2,400 | Same |
| Transport Fee | ₹0 | ₹18,000 | +₹18,000 |
| Opening Balance | ₹300 | ₹300 | Same |
| **Total** | **₹68,700** | **₹86,700** | **+₹18,000** |

### Explanation
- Same class and fee category
- Transport adds ₹18,000 annually
- Opening balance applies regardless of transport status

---

## Example 12: Different Routes - Short Distance vs Long Distance

### Scenario A: Short Distance Route
- Student: Pooja Shah (ID: 17)
- **Class**: 10th Grade
- **Route**: Route 1 (City Center - Short Distance)
- Route Plan: ₹800/month for 10th Grade
- Opening Balance: ₹400.00
- Transport Fee: ₹9,600/year

### Scenario B: Long Distance Route
- Student: Vikas Kumar (ID: 18)
- **Class**: 10th Grade (Same class)
- **Route**: Route 4 (Outskirts - Long Distance)
- Route Plan: ₹1,800/month for 10th Grade
- Opening Balance: ₹400.00
- Transport Fee: ₹21,600/year

### Comparison Table

| Aspect | Short Distance | Long Distance | Difference |
|--------|---------------|--------------|------------|
| Route Name | Route 1 (City Center) | Route 4 (Outskirts) | - |
| Monthly Transport Fee | ₹800 | ₹1,800 | +₹1,000 |
| Annual Transport Fee | ₹9,600 | ₹21,600 | +₹12,000 |
| Opening Balance | ₹400 | ₹400 | Same |
| **Total Impact** | +₹9,600 | +₹21,600 | **+₹12,000** |

### Explanation
- Same class but different routes
- Long distance routes cost significantly more
- Opening balance is independent of route selection

---

## Example 13: Complex Case - Different Class, Category, Route with Opening Balance

### Scenario
- Student: Ananya Iyer (ID: 19)
- **Class**: 9th Grade
- **Fee Category**: Category B (Premium)
- **Route**: Route 2 (Suburbs)
- Opening Balance: -₹2,500.00 (large credit)
- Fee Structures:
  - Tuition Fee: ₹7,000/month (Category B, 9th Grade)
  - Library Fee: ₹300/month
  - Lab Fee: ₹400/month
  - Sports Fee: ₹200/month (Apr, May, Sep, Oct only)
- Transport Fee: ₹1,100/month (Route Plan for 9th Grade, Route 2)

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total | Received | Balance |
|----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Credit)** | - | - | - | - | - | - | - | - | - | - | - | - | **-₹2,500** | ₹0 | **-₹2,500** |
| Tuition Fee | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹7,000 | ₹84,000 | ₹0 | ₹84,000 |
| Library Fee | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹300 | ₹3,600 | ₹0 | ₹3,600 |
| Lab Fee | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹400 | ₹4,800 | ₹0 | ₹4,800 |
| Sports Fee | - | - | - | ₹200 | ₹200 | - | - | - | ₹200 | ₹200 | - | - | ₹800 | ₹0 | ₹800 |
| Transport Fee | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹1,100 | ₹13,200 | ₹0 | ₹13,200 |
| **Total Amount** | ₹8,800 | ₹8,800 | ₹8,800 | ₹9,000 | ₹9,000 | ₹8,800 | ₹8,800 | ₹8,800 | ₹9,000 | ₹9,000 | ₹8,800 | ₹8,800 | **₹103,900** | ₹0 | **₹103,900** |

### Explanation
- Premium category (Category B) with higher fees
- 9th Grade has lab fees for science subjects
- Sports fee only in specific months (Apr, May, Sep, Oct)
- Route 2 transport fee for 9th Grade
- Large credit of ₹2,500 significantly reduces total
- Without credit: ₹106,400 | With credit: ₹103,900

---

## Example 14: Class-Specific Route Plans

### Scenario
- Student: Ravi Menon (ID: 20)
- **Class**: 6th Grade
- **Route**: Route 5
- Opening Balance: ₹600.00

### Route Plan Variations for Same Route:

| Class | Route Plan Fee/Month | Annual Transport Fee |
|-------|---------------------|---------------------|
| 1st-3rd Grade | ₹700 | ₹8,400 |
| 4th-6th Grade | ₹900 | ₹10,800 |
| 7th-9th Grade | ₹1,100 | ₹13,200 |
| 10th-12th Grade | ₹1,400 | ₹16,800 |

### For 6th Grade Student:
- Transport Fee: ₹900/month = ₹10,800/year
- Opening Balance: ₹600
- **Total Transport Impact**: ₹10,800 + ₹600 = ₹11,400

### Explanation
- Same route (Route 5) but different fees based on class
- Higher classes pay more for transport
- Opening balance is independent of class-based route pricing

---

## Example 15: Multiple Fee Categories with Different Applicable Months

### Scenario
- Student: Shreya Patel (ID: 21)
- **Class**: 11th Grade
- **Fee Category**: Category A
- **Route**: Route 1
- Opening Balance: ₹800.00

### Fee Structures with Different Applicable Months:

| Fee Head | Applicable Months | Monthly Amount | Total |
|----------|------------------|----------------|-------|
| Tuition Fee | All 12 months | ₹6,500 | ₹78,000 |
| Library Fee | All 12 months | ₹250 | ₹3,000 |
| Exam Fee | Jan, Apr, Sep (3 months) | ₹1,500 | ₹4,500 |
| Lab Fee | Feb, Mar, Apr, May, Aug, Sep (6 months) | ₹500 | ₹3,000 |
| Annual Fee | Jan only (1 month) | ₹3,000 | ₹3,000 |
| Transport Fee | All 12 months | ₹1,300 | ₹15,600 |

### Fee Breakdown Display

| Fee Head | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total | Received | Balance |
|----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-------|----------|---------|
| **Ledger Balance (Outstanding)** | - | - | - | - | - | - | - | - | - | - | - | - | **₹800** | ₹0 | **₹800** |
| Tuition Fee | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹6,500 | ₹78,000 | ₹0 | ₹78,000 |
| Library Fee | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹250 | ₹3,000 | ₹0 | ₹3,000 |
| Exam Fee | ₹1,500 | - | - | ₹1,500 | - | - | - | - | ₹1,500 | - | - | - | ₹4,500 | ₹0 | ₹4,500 |
| Lab Fee | - | ₹500 | ₹500 | ₹500 | ₹500 | - | - | ₹500 | ₹500 | - | - | - | ₹3,000 | ₹0 | ₹3,000 |
| Annual Fee | ₹3,000 | - | - | - | - | - | - | - | - | - | - | - | ₹3,000 | ₹0 | ₹3,000 |
| Transport Fee | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹1,300 | ₹15,600 | ₹0 | ₹15,600 |
| **Total Amount** | ₹13,800 | ₹9,050 | ₹9,050 | ₹10,350 | ₹9,550 | ₹8,300 | ₹8,300 | ₹9,050 | ₹10,550 | ₹8,300 | ₹8,300 | ₹8,300 | **₹110,900** | ₹0 | **₹110,900** |

### Explanation
- Different fees apply to different months
- Exam fees only in Jan, Apr, Sep
- Lab fees only during academic months (6 months)
- Annual fee one-time in January
- Monthly totals vary based on applicable fees
- Opening balance added to annual total

---

## Summary Table - Opening Balance Behavior

| Opening Balance | Display Label | Color | Effect on Total | Included in Breakdown? |
|----------------|---------------|-------|-----------------|------------------------|
| ₹500 (positive) | Ledger Balance (Outstanding) | Red | Increases total | ✅ Yes |
| -₹500 (negative) | Ledger Balance (Credit) | Green | Decreases total | ✅ Yes |
| ₹0 | Not shown | - | No effect | ❌ No |
| null/undefined | Not shown | - | No effect | ❌ No |

---

## Summary Table - Class Variations

| Class | Typical Tuition Fee/Month | Transport Fee Range/Month | Example Total Annual Fees* |
|-------|--------------------------|---------------------------|---------------------------|
| 1st-3rd Grade | ₹3,000 - ₹4,000 | ₹700 - ₹900 | ₹36,000 - ₹48,000 |
| 4th-6th Grade | ₹4,500 - ₹5,500 | ₹900 - ₹1,100 | ₹54,000 - ₹66,000 |
| 7th-9th Grade | ₹5,500 - ₹7,000 | ₹1,100 - ₹1,300 | ₹66,000 - ₹84,000 |
| 10th-12th Grade | ₹6,500 - ₹8,000 | ₹1,200 - ₹1,800 | ₹78,000 - ₹96,000 |

*Without opening balance and transport fees

---

## Summary Table - Fee Category Impact

| Fee Category | Typical Features | Additional Fees | Price Difference |
|-------------|-----------------|----------------|-----------------|
| Category A (Standard) | Basic education | Library, Activity | Base pricing |
| Category B (Premium) | Enhanced services | Library, Lab, Computer, Sports | +₹15,000 - ₹25,000/year |

---

## Summary Table - Route Impact

| Route Type | Distance | Monthly Fee Range | Annual Impact |
|-----------|----------|------------------|---------------|
| No Transport | N/A | ₹0 | ₹0 |
| Short Distance | < 5 km | ₹800 - ₹1,000 | ₹9,600 - ₹12,000 |
| Medium Distance | 5-10 km | ₹1,000 - ₹1,300 | ₹12,000 - ₹15,600 |
| Long Distance | > 10 km | ₹1,300 - ₹1,800 | ₹15,600 - ₹21,600 |

---

## Comprehensive Comparison Matrix

### Scenario: Same Opening Balance (₹500) Across Different Configurations

| Student | Class | Category | Route | Annual Fees* | Opening Balance | Total Due |
|---------|-------|----------|-------|-------------|----------------|-----------|
| A | 1st | A | None | ₹36,000 | ₹500 | ₹36,500 |
| B | 1st | A | Short | ₹45,600 | ₹500 | ₹46,100 |
| C | 1st | B | Short | ₹50,400 | ₹500 | ₹50,900 |
| D | 5th | A | None | ₹56,400 | ₹500 | ₹56,900 |
| E | 5th | B | Medium | ₹78,600 | ₹500 | ₹79,100 |
| F | 9th | A | Medium | ₹79,200 | ₹500 | ₹79,700 |
| G | 9th | B | Long | ₹106,400 | ₹500 | ₹106,900 |
| H | 12th | A | Long | ₹122,000 | ₹500 | ₹122,500 |
| I | 12th | B | Long | ₹121,000 | ₹500 | ₹121,500 |

*Annual fees include all applicable fees (tuition, library, lab, etc.) but exclude opening balance

### Key Observations:
1. **Class Impact**: Higher classes = Higher fees (₹36,000 → ₹122,000)
2. **Category Impact**: Category B adds ₹15,000 - ₹25,000 annually
3. **Route Impact**: Transport adds ₹9,600 - ₹21,600 annually
4. **Opening Balance**: Always adds/subtracts the same amount regardless of configuration
5. **Combined Effect**: All factors are additive (Class + Category + Route + Opening Balance)

---

## Real-World Scenarios Summary

### Scenario 1: New Admission (Lower Class, No Transport)
- **Configuration**: 1st Grade, Category A, No Route
- **Opening Balance**: ₹0
- **Total**: ₹36,000
- **Use Case**: Fresh admission, local student

### Scenario 2: Transfer Student (Higher Class, With Transport)
- **Configuration**: 10th Grade, Category A, Long Distance Route
- **Opening Balance**: ₹2,000 (outstanding from previous school)
- **Total**: ₹122,000 + ₹2,000 = ₹124,000
- **Use Case**: Student transferred mid-year with pending fees

### Scenario 3: Premium Student (Middle Class, Premium Category)
- **Configuration**: 6th Grade, Category B, Medium Distance Route
- **Opening Balance**: -₹3,000 (advance payment)
- **Total**: ₹78,600 - ₹3,000 = ₹75,600
- **Use Case**: Parent paid advance for entire year

### Scenario 4: Complex Case (All Factors)
- **Configuration**: 11th Grade, Category B, Long Distance Route
- **Opening Balance**: ₹1,500
- **Total**: ₹121,000 + ₹1,500 = ₹122,500
- **Use Case**: Senior student with premium services and outstanding balance

---

## Code Logic Summary

```typescript
// Frontend Logic (FeeGeneration.tsx)
if (studentDetails?.openingBalance !== undefined && studentDetails.openingBalance !== null) {
  const openingBalance = parseFloat(studentDetails.openingBalance.toString());
  if (openingBalance !== 0) {
    breakdown.push({
      feeHead: openingBalance > 0 
        ? 'Ledger Balance (Outstanding)' 
        : 'Ledger Balance (Credit)',
      feeStructureId: 0,
      monthlyAmounts: {},
      total: openingBalance,
      received: 0,
      balance: openingBalance,
    });
  }
}

// Totals Calculation (automatic)
feeBreakdown.forEach((fee) => {
  grandTotal += fee.total;  // Includes opening balance if present
  grandReceived += fee.received;
  grandBalance += fee.balance;
});
```

---

## Testing Checklist

- [x] Positive opening balance increases total
- [x] Negative opening balance decreases total
- [x] Zero opening balance is not shown
- [x] Null opening balance is not shown
- [x] Opening balance appears in totals calculation
- [x] Opening balance has correct label (Outstanding vs Credit)
- [x] Opening balance works with existing fees
- [x] Opening balance works with partial payments

---

## Notes

1. **Opening Balance Purpose**: 
   - Tracks money owed by student (positive) or credit available (negative)
   - Carried forward from previous academic years or adjustments

2. **When to Use**:
   - Positive: Student has unpaid fees from previous period
   - Negative: Student overpaid or has advance payment
   - Zero/Null: New student or fully settled account

3. **Display Behavior**:
   - Always shown in student details card
   - Only shown in fee breakdown if non-zero
   - Automatically included in total calculations

4. **Payment Impact**:
   - Positive opening balance must be paid along with current fees
   - Negative opening balance reduces the amount student needs to pay

