import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto, schoolId: number): Promise<Student> {
    if (!schoolId) {
      throw new BadRequestException('School ID is required to create a student');
    }
    const student = this.studentsRepository.create({
      ...createStudentDto,
      schoolId,
    });
    return await this.studentsRepository.save(student);
  }

  async findAll(schoolId?: number): Promise<Student[]> {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.studentsRepository.find({
      where,
      relations: ['school', 'user'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Student> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const student = await this.studentsRepository.findOne({
      where,
      relations: ['school', 'user', 'payments', 'feeStructures'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto, schoolId?: number): Promise<Student> {
    const student = await this.findOne(id, schoolId);
    Object.assign(student, updateStudentDto);
    return await this.studentsRepository.save(student);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const student = await this.findOne(id, schoolId);
    await this.studentsRepository.remove(student);
  }
}

