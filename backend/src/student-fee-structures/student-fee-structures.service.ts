import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentFeeStructure } from './entities/student-fee-structure.entity';

@Injectable()
export class StudentFeeStructuresService {
  constructor(
    @InjectRepository(StudentFeeStructure)
    private studentFeeStructureRepository: Repository<StudentFeeStructure>,
  ) {}

  async findAll(
    studentId?: number,
    academicYearId?: number,
    schoolId?: number,
  ): Promise<StudentFeeStructure[]> {
    const queryBuilder = this.studentFeeStructureRepository
      .createQueryBuilder('sfs')
      .leftJoinAndSelect('sfs.feeStructure', 'feeStructure')
      .leftJoinAndSelect('feeStructure.category', 'category')
      .leftJoinAndSelect('feeStructure.categoryHead', 'categoryHead')
      .leftJoinAndSelect('sfs.student', 'student')
      .leftJoinAndSelect('sfs.academicYear', 'academicYear');

    if (studentId) {
      queryBuilder.where('sfs.studentId = :studentId', { studentId });
    }

    if (academicYearId) {
      if (studentId) {
        queryBuilder.andWhere('sfs.academicYearId = :academicYearId', { academicYearId });
      } else {
        queryBuilder.where('sfs.academicYearId = :academicYearId', { academicYearId });
      }
    }

    if (schoolId) {
      if (studentId || academicYearId) {
        queryBuilder.andWhere('student.schoolId = :schoolId', { schoolId });
      } else {
        queryBuilder.where('student.schoolId = :schoolId', { schoolId });
      }
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<StudentFeeStructure> {
    const record = await this.studentFeeStructureRepository.findOne({
      where: { id },
      relations: ['student', 'feeStructure', 'academicYear'],
    });

    if (!record) {
      throw new Error(`Student fee structure with ID ${id} not found`);
    }

    return record;
  }
}

