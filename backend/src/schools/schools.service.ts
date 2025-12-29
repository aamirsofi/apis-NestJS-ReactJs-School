import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
  ) {}

  async create(createSchoolDto: CreateSchoolDto, createdById: number): Promise<School> {
    const school = this.schoolsRepository.create({
      ...createSchoolDto,
      createdById,
    });
    return await this.schoolsRepository.save(school);
  }

  async findAll(): Promise<School[]> {
    return await this.schoolsRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<School> {
    const school = await this.schoolsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return school;
  }

  async findBySubdomain(subdomain: string): Promise<School | null> {
    return await this.schoolsRepository.findOne({
      where: { subdomain },
    });
  }

  async update(id: number, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const school = await this.findOne(id);
    Object.assign(school, updateSchoolDto);
    return await this.schoolsRepository.save(school);
  }

  async remove(id: number): Promise<void> {
    const school = await this.findOne(id);
    await this.schoolsRepository.remove(school);
  }
}

