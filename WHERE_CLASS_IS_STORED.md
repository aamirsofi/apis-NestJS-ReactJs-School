# Where is Class Stored?

## Summary

**Class is stored in the `student_academic_records` table, NOT directly in the `students` table.**

## Database Structure

### 1. Students Table (`students`)
- **Does NOT store classId**
- Stores permanent student information (name, contact, address, etc.)
- Has a relation to `academicRecords` (one-to-many)

### 2. Student Academic Records Table (`student_academic_records`)
- **Stores classId** ✅
- One record per student per academic year
- Contains year-specific information:
  - `classId` - The class the student is in for this academic year
  - `academicYearId` - Which academic year/session
  - `section` - Section (A, B, etc.)
  - `rollNumber` - Roll number in that class
  - `status` - Active, Promoted, etc.

## Why This Design?

### ✅ Benefits:
1. **Year-Specific**: A student can be in different classes in different academic years
2. **Historical Tracking**: You can see a student's class history across years
3. **Promotion Support**: When a student moves to the next class, you create a new academic record
4. **Flexibility**: Supports students repeating a class or transferring

### Example:
```
Student: Aamir Bashir (ID: 1)

Academic Year 2024-2025:
  - Academic Record: classId = 5 (5th Grade)

Academic Year 2025-2026:
  - Academic Record: classId = 6 (6th Grade) - Promoted!
```

## Entity Structure

### Student Entity
```typescript
@Entity('students')
export class Student {
  id: number;
  studentId: string; // Permanent ID
  firstName: string;
  lastName: string;
  // ... other permanent fields
  
  // Relations
  @OneToMany(() => StudentAcademicRecord, record => record.student)
  academicRecords!: StudentAcademicRecord[]; // Multiple records for different years
}
```

### StudentAcademicRecord Entity
```typescript
@Entity('student_academic_records')
@Unique(['studentId', 'academicYearId']) // One per student per year
export class StudentAcademicRecord {
  id: number;
  studentId: number;
  academicYearId: number;
  classId!: number; // ✅ CLASS IS STORED HERE
  section?: string;
  rollNumber?: string;
  
  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class!: Class; // Relation to Class entity
}
```

## How to Get Student's Current Class

### Backend:
```typescript
// Get academic record for current academic year
const academicRecord = await academicRecordRepository.findOne({
  where: {
    studentId: student.id,
    academicYearId: currentAcademicYearId,
  },
  relations: ['class'],
});

const currentClass = academicRecord?.class; // Class object
const currentClassId = academicRecord?.classId; // Class ID
```

### Frontend:
```typescript
// When searching student, get their academic record
const academicRecordResponse = await api.instance.get('/student-academic-records', {
  params: { studentId: student.id, academicYearId },
});

const academicRecord = records[0];
const classId = academicRecord?.classId;
const className = academicRecord?.class?.name;
```

## Important Notes

1. **Always specify academic year**: Class is year-specific, so you need to know which academic year you're asking about

2. **One record per year**: The unique constraint ensures one academic record per student per academic year

3. **Class can change**: When updating a student's class, you update the `StudentAcademicRecord`, not the `Student` entity

4. **For fee generation**: Always use the class from the academic record for the selected academic year

## Common Issues

### Issue: "Student must have a class assigned"
**Cause**: No academic record exists for the selected academic year, or the academic record doesn't have a `classId`

**Solution**: 
- Create/update academic record for the student in the selected academic year
- Ensure `classId` is set in the academic record

### Issue: Class not showing in student details
**Cause**: Academic record not loaded with class relation

**Solution**: 
- Include `relations: ['class']` when querying academic records
- Or use `leftJoinAndSelect('record.class', 'class')` in query builder

## Database Tables

```
students
├── id
├── studentId (permanent)
├── firstName
├── lastName
└── ... (no classId here!)

student_academic_records
├── id
├── studentId (FK → students.id)
├── academicYearId (FK → academic_years.id)
├── classId (FK → classes.id) ✅ CLASS IS HERE
├── section
├── rollNumber
└── status
```

## Summary

| Question | Answer |
|----------|--------|
| **Where is class stored?** | `student_academic_records.classId` |
| **Is class in students table?** | No |
| **Can a student have multiple classes?** | Yes, one per academic year |
| **How to get current class?** | Query academic record for current academic year |
| **How to update class?** | Update the `StudentAcademicRecord` entity |

