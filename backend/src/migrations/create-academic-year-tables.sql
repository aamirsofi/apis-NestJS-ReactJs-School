-- Create academic_years table
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "isCurrent" BOOLEAN DEFAULT false,
  description TEXT,
  "schoolId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UQ_academic_years_school_name" UNIQUE ("schoolId", name),
  CONSTRAINT "FK_academic_years_school" FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE
);

-- Create student_academic_records table
CREATE TABLE IF NOT EXISTS student_academic_records (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL,
  "academicYearId" INTEGER NOT NULL,
  "classId" INTEGER NOT NULL,
  section VARCHAR(50),
  "rollNumber" VARCHAR(50),
  "admissionNumber" VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  remarks TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UQ_student_academic_records" UNIQUE ("studentId", "academicYearId"),
  CONSTRAINT "FK_student_academic_records_student" FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT "FK_student_academic_records_academic_year" FOREIGN KEY ("academicYearId") REFERENCES academic_years(id) ON DELETE CASCADE,
  CONSTRAINT "FK_student_academic_records_class" FOREIGN KEY ("classId") REFERENCES classes(id) ON DELETE RESTRICT
);

-- Add academicYearId and academicRecordId to student_fee_structures if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_fee_structures' AND column_name = 'academicYearId'
  ) THEN
    ALTER TABLE student_fee_structures 
    ADD COLUMN "academicYearId" INTEGER,
    ADD COLUMN "academicRecordId" INTEGER,
    ADD CONSTRAINT "FK_student_fee_structures_academic_year" 
      FOREIGN KEY ("academicYearId") REFERENCES academic_years(id) ON DELETE CASCADE,
    ADD CONSTRAINT "FK_student_fee_structures_academic_record" 
      FOREIGN KEY ("academicRecordId") REFERENCES student_academic_records(id) ON DELETE SET NULL;
    
    -- Update unique constraint to include academicYearId
    DROP INDEX IF EXISTS "UQ_student_fee_structures_student_fee";
    CREATE UNIQUE INDEX "UQ_student_fee_structures_student_fee_year" 
    ON student_fee_structures("studentId", "feeStructureId", "academicYearId");
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IDX_academic_years_school" ON academic_years("schoolId");
CREATE INDEX IF NOT EXISTS "IDX_academic_years_current" ON academic_years("schoolId", "isCurrent") WHERE "isCurrent" = true;
CREATE INDEX IF NOT EXISTS "IDX_student_academic_records_student" ON student_academic_records("studentId");
CREATE INDEX IF NOT EXISTS "IDX_student_academic_records_year" ON student_academic_records("academicYearId");
CREATE INDEX IF NOT EXISTS "IDX_student_academic_records_class" ON student_academic_records("classId");

