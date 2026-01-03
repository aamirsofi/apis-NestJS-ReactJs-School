import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRolesService } from '../user-roles/user-roles.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private userRolesService: UserRolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`A user with email "${createUserDto.email}" already exists.`);
    }

    try {
      // Convert role name to roleId if provided
      const userData: any = { ...createUserDto };
      if (createUserDto.role) {
        const role = await this.userRolesService.findByName(createUserDto.role);
        if (!role) {
          throw new BadRequestException(`Invalid role: ${createUserDto.role}`);
        }
        userData.roleId = role.id;
        delete userData.role;
      } else {
        // Default to student role if not specified
        const studentRole = await this.userRolesService.findByName('student');
        if (studentRole) {
          userData.roleId = studentRole.id;
        }
      }

      const user = this.usersRepository.create(userData);
      const savedUser = await this.usersRepository.save(user);
      // Reload with relations to return complete user object
      // savedUser is a single User entity, not an array
      const userEntity = Array.isArray(savedUser) ? savedUser[0] : savedUser;
      return await this.findOne(userEntity.id);
    } catch (error: any) {
      // Handle PostgreSQL unique constraint violations (error code 23505)
      if (
        error.code === '23505' ||
        (error instanceof QueryFailedError && error.message.includes('unique constraint'))
      ) {
        // Check error detail for specific field information
        const errorDetail = error.detail || error.message || '';

        if (
          errorDetail.includes('email') ||
          errorDetail.includes('UQ_') ||
          error.message.includes('email')
        ) {
          throw new ConflictException(`A user with email "${createUserDto.email}" already exists.`);
        }
        // Generic unique constraint violation
        throw new ConflictException('A record with the same unique value already exists.');
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      relations: ['role'],
      order: { createdAt: 'desc' },
    });
  }

  async findBySchool(schoolId: number): Promise<User[]> {
    return await this.usersRepository.find({
      where: { schoolId },
      relations: ['role'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        roleId: true,
        schoolId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`A user with email "${updateUserDto.email}" already exists.`);
      }
    }

    // Handle password update with current password verification
    if (updateUserDto.password) {
      if (!updateUserDto.currentPassword) {
        throw new BadRequestException('Current password is required to update password');
      }

      // Get user with password field for verification
      const userWithPassword = await this.usersRepository.findOne({
        where: { id },
        relations: ['role'],
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          roleId: true,
          schoolId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!userWithPassword) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        updateUserDto.currentPassword,
        userWithPassword.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updateUserDto.password = hashedPassword;
    }

    // Remove currentPassword from DTO before saving (it's not a user field)
    const { currentPassword, role, ...userUpdateData } = updateUserDto;

    // Convert role name to roleId if provided
    const updateData: any = { ...userUpdateData };
    if (role) {
      const roleEntity = await this.userRolesService.findByName(role);
      if (!roleEntity) {
        throw new BadRequestException(`Invalid role: ${role}`);
      }
      updateData.roleId = roleEntity.id;
    }

    try {
      Object.assign(user, updateData);
      return await this.usersRepository.save(user);
    } catch (error: any) {
      // Handle PostgreSQL unique constraint violations (error code 23505)
      if (
        error.code === '23505' ||
        (error instanceof QueryFailedError && error.message.includes('unique constraint'))
      ) {
        // Check error detail for specific field information
        const errorDetail = error.detail || error.message || '';

        if (
          errorDetail.includes('email') ||
          errorDetail.includes('UQ_') ||
          error.message.includes('email')
        ) {
          throw new ConflictException(
            `A user with email "${updateUserDto.email || user.email}" already exists.`,
          );
        }
        // Generic unique constraint violation
        throw new ConflictException('A record with the same unique value already exists.');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
