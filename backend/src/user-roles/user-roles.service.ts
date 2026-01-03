import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async findAll(): Promise<UserRole[]> {
    return this.userRoleRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<UserRole | null> {
    return this.userRoleRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<UserRole | null> {
    return this.userRoleRepository.findOne({ where: { name } });
  }

  async create(userRole: Partial<UserRole>): Promise<UserRole> {
    const newRole = this.userRoleRepository.create(userRole);
    return this.userRoleRepository.save(newRole);
  }

  async update(id: number, userRole: Partial<UserRole>): Promise<UserRole> {
    await this.userRoleRepository.update(id, userRole);
    const updated = await this.findOne(id);
    if (!updated) {
      throw new Error(`UserRole with id ${id} not found after update`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.userRoleRepository.delete(id);
  }
}

