# How to Add Students - Step by Step Guide

## Overview
With the new academic year structure, adding a student is now a **two-step process**:
1. **Create Student** - Add permanent student information
2. **Assign Academic Record** - Assign the student to a class for the current academic year

---

## Step-by-Step Process

### Step 1: Ensure Academic Year Exists

Before adding students, make sure you have a current academic year set up:

1. Navigate to **Settings → Academics → Academic Years**
2. If no academic year exists, click **"Add Academic Year"**
3. Fill in:
   - **Academic Year Name**: e.g., "2024-2025"
   - **Start Date**: e.g., "2024-04-01"
   - **End Date**: e.g., "2025-03-31"
   - **Check "Set as current academic year"** ✅
4. Click **"Create Academic Year"**

> **Note**: The system will automatically create a current academic year if none exists when you try to assign a class to a student.

---

### Step 2: Create Student (Permanent Information)

1. Navigate to **Students** page (from main menu)
2. Click **"Add Student"** button
3. Fill in the **required fields**:
   - **Student ID** * (e.g., "STU001")
   - **First Name** *
   - **Last Name** *
   - **Email** *
   - **Admission Date** *

4. Fill in **optional fields**:
   - **Date of Birth**
   - **Gender** (Male/Female/Other)
   - **Blood Group** (e.g., O+, A-, etc.)
   - **Phone**
   - **Address**
   - **Admission Number**
   - **Status** (Active/Inactive/Graduated/Transferred)

5. Fill in **Parent/Guardian Information** (optional):
   - **Parent Name**
   - **Relation** (Father/Mother/Guardian)
   - **Parent Email**
   - **Parent Phone**

6. Click **"Create Student"**

> **Important**: At this point, the student is created but **NOT assigned to any class**. You'll see "Not assigned" in the Class column.

---

### Step 3: Assign Academic Record (Class Assignment)

After creating the student:

1. In the **Students** table, find the student you just created
2. In the **Class** column, you'll see:
   - **"Not assigned"** text
   - **"Assign class"** link button
3. Click **"Assign class"**
4. Fill in the academic record form:
   - **Academic Year**: Automatically shows current year (read-only)
   - **Class** *: Select from dropdown (e.g., "1st", "2nd", "10th", etc.)
   - **Section**: Optional (e.g., "A", "B", "C")
   - **Roll Number**: Optional (e.g., "001", "002")
5. Click **"Assign Class"**

> **Done!** The student is now assigned to a class for the current academic year.

---

## Quick Workflow Summary

```
1. Create Academic Year (if needed)
   ↓
2. Create Student (permanent info)
   ↓
3. Assign Class (academic record)
   ↓
✅ Student is ready!
```

---

## Visual Guide

### Student Listing View

```
┌─────────────────────────────────────────────────────────┐
│ Students                                                 │
├─────────────────────────────────────────────────────────┤
│ Student          │ Contact    │ Class (2024-2025) │ Status │
├─────────────────────────────────────────────────────────┤
│ John Doe         │ john@...   │ Not assigned      │ Active │
│ STU001           │            │ [Assign class]    │        │
└─────────────────────────────────────────────────────────┘
```

### After Assigning Class

```
┌─────────────────────────────────────────────────────────┐
│ Students                                                 │
├─────────────────────────────────────────────────────────┤
│ Student          │ Contact    │ Class (2024-2025) │ Status │
├─────────────────────────────────────────────────────────┤
│ John Doe         │ john@...   │ 10th - A          │ Active │
│ STU001           │            │                    │        │
└─────────────────────────────────────────────────────────┘
```

---

## Important Notes

### ✅ What Changed

- **Before**: Class and section were part of student creation
- **Now**: Class assignment is separate (academic record)

### ✅ Benefits

1. **Historical Data**: All year-specific data is preserved
2. **Promotion**: Easy to promote students to next year
3. **Flexibility**: Students can be in different classes each year
4. **Data Integrity**: Class is properly linked (not just a string)

### ⚠️ Common Scenarios

#### Scenario 1: New Student Admission
1. Create student → Fill permanent info
2. Assign class → Select current year's class
3. Done!

#### Scenario 2: Student Promotion (Next Year)
1. Navigate to Academic Years → Create next year
2. Use promotion feature (coming soon) or manually assign new class
3. Student's history is preserved

#### Scenario 3: Bulk Import
- Bulk import still works (creates students)
- After import, assign classes individually or use bulk assignment (coming soon)

---

## Troubleshooting

### Problem: "No current academic year found"
**Solution**: Go to Academic Years page and create/set a current academic year

### Problem: "Class not found" when assigning
**Solution**: Make sure classes are created first (Settings → Academics → Classes)

### Problem: Student shows "Not assigned" but I assigned them
**Solution**: Refresh the page or check if the academic record was created successfully

### Problem: Can't see "Assign class" button
**Solution**: Make sure you're viewing the Students page and the student doesn't already have an academic record

---

## Next Steps (Future Features)

- ✅ Bulk class assignment
- ✅ Student promotion workflow
- ✅ Academic history view
- ✅ Student details page with full academic record

---

## API Endpoints Used

- `POST /students` - Create student
- `GET /academic-years/current` - Get current academic year
- `POST /student-academic-records` - Assign class
- `GET /student-academic-records/student/:id/current` - Get current class

---

## Example: Complete Student Creation

```typescript
// Step 1: Create Student
POST /students
{
  "studentId": "STU001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "admissionDate": "2024-04-01",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "parentName": "John Doe Sr.",
  "parentRelation": "father"
}

// Step 2: Assign Class
POST /student-academic-records
{
  "studentId": 1,
  "academicYearId": 1,
  "classId": 5,  // 10th grade
  "section": "A",
  "rollNumber": "001"
}
```

---

**Need Help?** Check the Students page or Academic Years page for more details!

