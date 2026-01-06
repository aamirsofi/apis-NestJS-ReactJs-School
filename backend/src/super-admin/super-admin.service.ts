import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike, In } from 'typeorm';
import { School, SchoolStatus } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { CreateSchoolDto } from '../schools/dto/create-school.dto';
import { UpdateSchoolDto } from '../schools/dto/update-school.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SchoolsService } from '../schools/schools.service';
import { UsersService } from '../users/users.service';
import { UserRolesService } from '../user-roles/user-roles.service';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { FeeCategory, FeeCategoryType } from '../fee-categories/entities/fee-category.entity';
import { getPaginationParams, createPaginatedResponse } from '../common/utils/pagination.util';
import { BulkImportStudentsDto } from './dto/bulk-import-students.dto';
import { CreateFeeCategoryDto } from '../fee-categories/dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from '../fee-categories/dto/update-fee-category.dto';
import { CreateFeeStructureDto } from '../fee-structures/dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from '../fee-structures/dto/update-fee-structure.dto';
import { CategoryHead, CategoryHeadStatus } from '../category-heads/entities/category-head.entity';
import { Class, ClassStatus } from '../classes/entities/class.entity';
import { Route } from '../routes/entities/route.entity';
import { RoutePrice, RoutePriceStatus } from '../route-prices/entities/route-price.entity';
import { CreateRoutePriceDto } from '../route-prices/dto/create-route-price.dto';
import { UpdateRoutePriceDto } from '../route-prices/dto/update-route-price.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(FeeStructure)
    private feeStructuresRepository: Repository<FeeStructure>,
    @InjectRepository(FeeCategory)
    private feeCategoriesRepository: Repository<FeeCategory>,
    @InjectRepository(CategoryHead)
    private categoryHeadsRepository: Repository<CategoryHead>,
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(Route)
    private routesRepository: Repository<Route>,
    @InjectRepository(RoutePrice)
    private routePricesRepository: Repository<RoutePrice>,
    private schoolsService: SchoolsService,
    private usersService: UsersService,
    private userRolesService: UserRolesService,
  ) {}

  // ========== SCHOOL MANAGEMENT ==========
  async createSchool(createSchoolDto: CreateSchoolDto, createdById: number) {
    return await this.schoolsService.create(createSchoolDto, createdById);
  }

  async getAllSchools(page: number = 1, limit: number = 10, status?: string) {
    try {
      const { skip, limit: take } = getPaginationParams(page, limit);

      // Build where clause
      const whereConditions: any = {};
      if (status) {
        whereConditions.status = status as SchoolStatus;
      }

      // Debug logging
      console.log('getAllSchools service called with:', { page, limit, skip, status });

      const [schools, total] = await this.schoolsRepository.findAndCount({
        where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
        relations: { createdBy: true },
        order: { createdAt: 'desc' },
        skip,
        take,
      });

      // Debug logging
      console.log('Query result:', { schoolsCount: schools.length, total, page, limit });

      return createPaginatedResponse(schools, total, page, limit);
    } catch (error) {
      console.error('Error in getAllSchools:', error);
      throw error;
    }
  }

  async getSchool(id: number) {
    return await this.schoolsService.findOne(id);
  }

  async getSchoolDetails(id: number) {
    // Get school with creator info
    const school = await this.schoolsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    // Get all related data in parallel
    const [students, users, payments, feeStructures] = await Promise.all([
      // Students
      this.studentsRepository.find({
        where: { schoolId: id },
        order: { createdAt: 'desc' },
        take: 100, // Limit to recent 100 for performance
      }),
      // Users assigned to this school
      this.usersRepository.find({
        where: { schoolId: id },
        select: ['id', 'name', 'email', 'role', 'schoolId', 'createdAt', 'updatedAt'],
        order: { createdAt: 'desc' },
      }),
      // Payments
      this.paymentsRepository.find({
        where: { schoolId: id },
        relations: ['student', 'studentFeeStructure', 'studentFeeStructure.feeStructure'],
        order: { createdAt: 'desc' },
        take: 100, // Limit to recent 100 for performance
      }),
      // Fee Structures
      this.feeStructuresRepository.find({
        where: { schoolId: id },
        relations: ['category'],
        order: { createdAt: 'desc' },
      }),
    ]);

    // Calculate statistics
    const [
      totalRoutePrices,
      totalClasses,
      totalCategoryHeads,
    ] = await Promise.all([
      this.routePricesRepository.count({ where: { schoolId: id } }),
      this.classesRepository.count({ where: { schoolId: id, status: ClassStatus.ACTIVE } }),
      this.categoryHeadsRepository.count({ where: { schoolId: id } }),
    ]);

    const stats = {
      totalStudents: await this.studentsRepository.count({ where: { schoolId: id } }),
      activeStudents: await this.studentsRepository.count({
        where: { schoolId: id, status: StudentStatus.ACTIVE },
      }),
      totalUsers: users.length,
      totalPayments: await this.paymentsRepository.count({ where: { schoolId: id } }),
      completedPayments: await this.paymentsRepository.count({
        where: { schoolId: id, status: PaymentStatus.COMPLETED },
      }),
      totalRevenue: await this.paymentsRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.schoolId = :schoolId', { schoolId: id })
        .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),
      totalFeeStructures: feeStructures.length,
      activeFeeStructures: feeStructures.filter(fs => fs.status === 'active').length,
      totalRoutePrices,
      totalClasses,
      totalCategoryHeads,
    };

    return {
      school,
      students,
      users,
      payments,
      feeStructures,
      stats,
    };
  }

  async updateSchool(id: number, updateSchoolDto: UpdateSchoolDto) {
    return await this.schoolsService.update(id, updateSchoolDto);
  }

  async deleteSchool(id: number) {
    return await this.schoolsService.remove(id);
  }

  // ========== USER MANAGEMENT ==========
  /**
   * Check if a school has at least one administrator
   */
  private   async hasAdministrator(schoolId: number): Promise<boolean> {
    // Find administrator role
    const adminRole = await this.userRolesService.findByName('administrator');
    if (!adminRole) return false;

    const adminCount = await this.usersRepository.count({
      where: {
        schoolId,
        roleId: adminRole.id,
      },
    });
    return adminCount > 0;
  }

  async createUser(createUserDto: CreateUserDto) {
    // If user has a schoolId and is not an administrator, ensure school has at least one administrator
    if (createUserDto.schoolId && createUserDto.role !== 'administrator') {
      const hasAdmin = await this.hasAdministrator(createUserDto.schoolId);
      if (!hasAdmin) {
        throw new BadRequestException(
          'Each school must have at least one administrator. Please assign an administrator role to this user or ensure the school has an existing administrator.',
        );
      }
    }
    return await this.usersService.create(createUserDto);
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    schoolId?: number,
  ) {
    try {
      const { skip, limit: take } = getPaginationParams(page, limit);

      // Build where clause - exclude super_admin users
      let baseCondition: any = {
        roleId: Not(null), // Will filter by role name later
      };

      // Add schoolId filter if provided
      if (schoolId) {
        baseCondition.schoolId = schoolId;
      }

      // Add search filter if provided
      let whereConditions: any;
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        whereConditions = [
          {
            ...baseCondition,
            name: ILike(searchTerm),
          },
          {
            ...baseCondition,
            email: ILike(searchTerm),
          },
        ];
      } else {
        whereConditions = baseCondition;
      }

      const [users, total] = await this.usersRepository.findAndCount({
        relations: ['school'],
        where: whereConditions,
        order: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          schoolId: true,
          createdAt: true,
          updatedAt: true,
          school: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      });

      return createPaginatedResponse(users, total, page, limit);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async getUser(id: number) {
    return await this.usersService.findOne(id);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersService.findOne(id);

    // Get user role name
    const userRoleName = user.role?.name || (user.role as any);

    // Prevent changing SUPER_ADMIN role
    if (
      userRoleName === 'super_admin' &&
      updateUserDto.role &&
      updateUserDto.role !== 'super_admin'
    ) {
      throw new BadRequestException('Cannot change SUPER_ADMIN role');
    }

    // Check if changing role from administrator to something else
    const schoolId = updateUserDto.schoolId !== undefined ? updateUserDto.schoolId : user.schoolId;
    const newRole = updateUserDto.role !== undefined ? updateUserDto.role : userRoleName;

    // If user is currently an administrator and role is being changed to non-administrator
    if (userRoleName === 'administrator' && newRole !== 'administrator' && schoolId) {
      // Find administrator role
      const adminRole = await this.userRolesService.findByName('administrator');
      if (!adminRole) {
        throw new BadRequestException('Administrator role not found');
      }

      // Count other administrators for this school (excluding current user)
      const adminCount = await this.usersRepository.count({
        where: {
          schoolId,
          roleId: adminRole.id,
        },
      });

      // If this is the only administrator, prevent the change
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot change role: Each school must have at least one administrator. Please assign another user as administrator first.',
        );
      }
    }

    // If schoolId is being removed and user is an administrator, check if they're the last administrator
    if (updateUserDto.schoolId === null && userRoleName === 'administrator' && user.schoolId) {
      const adminRole = await this.userRolesService.findByName('administrator');
      if (!adminRole) {
        throw new BadRequestException('Administrator role not found');
      }

      const adminCount = await this.usersRepository.count({
        where: {
          schoolId: user.schoolId,
          roleId: adminRole.id,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove user from school: Each school must have at least one administrator. Please assign another user as administrator first.',
        );
      }
    }

    // If schoolId is being changed and new role is not administrator, ensure new school has an administrator
    if (
      updateUserDto.schoolId !== undefined &&
      updateUserDto.schoolId !== null &&
      updateUserDto.schoolId !== user.schoolId &&
      newRole !== 'administrator'
    ) {
      const hasAdmin = await this.hasAdministrator(updateUserDto.schoolId);
      if (!hasAdmin) {
        throw new BadRequestException(
          'Cannot assign user to this school: Each school must have at least one administrator. Please assign an administrator role to this user or ensure the school has an existing administrator.',
        );
      }
    }

    return await this.usersService.update(id, updateUserDto);
  }

  async deleteUser(id: number) {
    const user = await this.usersService.findOne(id);
    const userRoleName = user.role?.name || (user.role as any);

    // Prevent deleting SUPER_ADMIN
    if (userRoleName === 'super_admin') {
      throw new BadRequestException('Cannot delete SUPER_ADMIN user');
    }

    // Prevent deleting the last administrator of a school
    if (userRoleName === 'administrator' && user.schoolId) {
      const adminRole = await this.userRolesService.findByName('administrator');
      if (!adminRole) {
        throw new BadRequestException('Administrator role not found');
      }

      const adminCount = await this.usersRepository.count({
        where: {
          schoolId: user.schoolId,
          roleId: adminRole.id,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete user: Each school must have at least one administrator. Please assign another user as administrator before deleting this user.',
        );
      }
    }

    return await this.usersService.remove(id);
  }

  // ========== DASHBOARD & STATS ==========
  async getDashboardStats() {
    const [totalSchools, totalUsers, totalStudents, totalPayments] = await Promise.all([
      this.schoolsRepository.count(),
      this.usersRepository.count(),
      this.studentsRepository.count(),
      this.paymentsRepository.count(),
    ]);

    const [totalRevenue, recentSchools] = await Promise.all([
      this.paymentsRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),
      this.schoolsRepository.find({
        take: 5,
        order: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalSchools,
      totalUsers,
      totalStudents,
      totalPayments,
      totalRevenue: totalRevenue?.total || 0,
      recentSchools,
    };
  }

  async bulkImportStudents(
    schoolId: number,
    bulkImportDto: BulkImportStudentsDto,
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; studentId?: string; email?: string; error: string }>;
    created: Array<{ studentId: string; email: string; name: string }>;
  }> {
    // Verify school exists
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; studentId?: string; email?: string; error: string }>,
      created: [] as Array<{ studentId: string; email: string; name: string }>,
    };

    // Process each student
    for (let i = 0; i < bulkImportDto.students.length; i++) {
      const studentDto = bulkImportDto.students[i];
      const rowNumber = i + 1; // 1-indexed for user-friendly error messages

      try {
        // Validate required fields
        if (!studentDto.studentId?.trim()) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Student ID is required',
          });
          continue;
        }

        if (!studentDto.firstName?.trim() || !studentDto.lastName?.trim()) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            error: 'First name and last name are required',
          });
          continue;
        }

        if (!studentDto.email?.trim()) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            error: 'Email is required',
          });
          continue;
        }

        // Note: Class assignment is now done via StudentAcademicRecord, not during student creation
        // We'll create the student without class/section, and class can be assigned later

        // Check for duplicates within the import batch
        const duplicateInBatch = bulkImportDto.students
          .slice(0, i)
          .some(
            s =>
              s.studentId?.trim().toLowerCase() === studentDto.studentId.trim().toLowerCase() ||
              s.email?.trim().toLowerCase() === studentDto.email.trim().toLowerCase(),
          );

        if (duplicateInBatch) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            email: studentDto.email,
            error: 'Duplicate student ID or email in import file',
          });
          continue;
        }

        // Check if student already exists in database
        const existingStudentId = await this.studentsRepository.findOne({
          where: {
            studentId: studentDto.studentId.trim(),
            schoolId,
          },
        });

        if (existingStudentId) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            error: `Student ID "${studentDto.studentId}" already exists for this school`,
          });
          continue;
        }

        const existingEmail = await this.studentsRepository.findOne({
          where: {
            email: studentDto.email.trim().toLowerCase(),
            schoolId,
          },
        });

        if (existingEmail) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            email: studentDto.email,
            error: `Email "${studentDto.email}" already exists for this school`,
          });
          continue;
        }

        // Create the student (without class/section - those are now in StudentAcademicRecord)
        const studentData: Partial<Student> = {
          studentId: studentDto.studentId.trim(),
          firstName: studentDto.firstName.trim(),
          lastName: studentDto.lastName.trim(),
          email: studentDto.email.trim().toLowerCase(),
          phone: studentDto.phone?.trim() || undefined,
          address: studentDto.address?.trim() || undefined,
          dateOfBirth: studentDto.dateOfBirth ? new Date(studentDto.dateOfBirth) : undefined,
          gender: studentDto.gender?.trim() || undefined,
          bloodGroup: studentDto.bloodGroup?.trim() || undefined,
          admissionDate: studentDto.admissionDate ? new Date(studentDto.admissionDate) : new Date(),
          admissionNumber: studentDto.admissionNumber?.trim() || undefined,
          parentName: studentDto.parentName?.trim() || undefined,
          parentEmail: studentDto.parentEmail?.trim() || undefined,
          parentPhone: studentDto.parentPhone?.trim() || undefined,
          parentRelation: studentDto.parentRelation?.trim() || undefined,
          status: (studentDto.status || StudentStatus.ACTIVE) as StudentStatus,
          schoolId,
        };

        const student = this.studentsRepository.create(studentData);
        const savedStudent = await this.studentsRepository.save(student);
        results.success++;
        results.created.push({
          studentId: savedStudent.studentId,
          email: savedStudent.email,
          name: `${savedStudent.firstName} ${savedStudent.lastName}`,
        });
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          studentId: studentDto.studentId,
          email: studentDto.email,
          error: error.message || 'Failed to create student',
        });
      }
    }

    return results;
  }

  // ========== FEE CATEGORIES MANAGEMENT ==========
  async getAllFeeCategories(
    page: number = 1,
    limit: number = 10,
    search?: string,
    schoolId?: number,
    type?: FeeCategoryType,
  ) {
    const { skip, limit: take } = getPaginationParams(page, limit);

    const queryBuilder = this.feeCategoriesRepository
      .createQueryBuilder('feeCategory')
      .leftJoinAndSelect('feeCategory.school', 'school')
      .orderBy('feeCategory.createdAt', 'DESC');

    // Build where conditions
    const whereConditions: any[] = [];
    const whereParams: any = {};

    // Filter by school if provided
    if (schoolId) {
      whereConditions.push('feeCategory.schoolId = :schoolId');
      whereParams.schoolId = schoolId;
    }

    // Filter by type if provided
    if (type) {
      whereConditions.push('feeCategory.type = :type');
      whereParams.type = type;
    }

    // Apply where conditions
    if (whereConditions.length > 0) {
      queryBuilder.where(whereConditions.join(' AND '), whereParams);
    }

    // Search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      if (whereConditions.length > 0) {
        queryBuilder.andWhere(
          '(feeCategory.name ILIKE :search OR feeCategory.description ILIKE :search)',
          { search: searchTerm },
        );
      } else {
        queryBuilder.where(
          '(feeCategory.name ILIKE :search OR feeCategory.description ILIKE :search)',
          { search: searchTerm },
        );
      }
    }

    const [data, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    return createPaginatedResponse(data, total, page, take);
  }

  async getFeeCategoryById(id: number) {
    const feeCategory = await this.feeCategoriesRepository.findOne({
      where: { id },
      relations: ['school', 'feeStructures'],
    });

    if (!feeCategory) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    return feeCategory;
  }

  async createFeeCategory(createFeeCategoryDto: CreateFeeCategoryDto, schoolId: number) {
    // Verify school exists
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    // Check for duplicate name within the same school
    const existing = await this.feeCategoriesRepository.findOne({
      where: {
        name: createFeeCategoryDto.name.trim(),
        schoolId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Fee category with name "${createFeeCategoryDto.name}" already exists for this school`,
      );
    }

    const feeCategory = this.feeCategoriesRepository.create({
      ...createFeeCategoryDto,
      name: createFeeCategoryDto.name.trim(),
      type: createFeeCategoryDto.type || FeeCategoryType.SCHOOL,
      schoolId,
    });

    return await this.feeCategoriesRepository.save(feeCategory);
  }

  async updateFeeCategory(
    id: number,
    updateFeeCategoryDto: UpdateFeeCategoryDto,
    schoolId?: number,
  ) {
    const feeCategory = await this.feeCategoriesRepository.findOne({
      where: { id },
    });

    if (!feeCategory) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    // If schoolId is provided, verify it matches
    if (schoolId && feeCategory.schoolId !== schoolId) {
      throw new BadRequestException(`Fee category does not belong to school with ID ${schoolId}`);
    }

    // Check for duplicate name if name is being updated
    if (updateFeeCategoryDto.name && updateFeeCategoryDto.name.trim() !== feeCategory.name) {
      const existing = await this.feeCategoriesRepository.findOne({
        where: {
          name: updateFeeCategoryDto.name.trim(),
          schoolId: feeCategory.schoolId,
        },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Fee category with name "${updateFeeCategoryDto.name}" already exists for this school`,
        );
      }
    }

    Object.assign(feeCategory, {
      ...updateFeeCategoryDto,
      name: updateFeeCategoryDto.name?.trim() || feeCategory.name,
    });

    return await this.feeCategoriesRepository.save(feeCategory);
  }

  async deleteFeeCategory(id: number, schoolId?: number) {
    const feeCategory = await this.feeCategoriesRepository.findOne({
      where: { id },
      relations: ['feeStructures'],
    });

    if (!feeCategory) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    // If schoolId is provided, verify it matches
    if (schoolId && feeCategory.schoolId !== schoolId) {
      throw new BadRequestException(`Fee category does not belong to school with ID ${schoolId}`);
    }

    // Check if fee category has associated fee structures
    if (feeCategory.feeStructures && feeCategory.feeStructures.length > 0) {
      throw new BadRequestException(
        `Cannot delete fee category. It has ${feeCategory.feeStructures.length} associated fee structure(s). Please remove or reassign them first.`,
      );
    }

    await this.feeCategoriesRepository.remove(feeCategory);
    return { message: 'Fee category deleted successfully' };
  }

  // ========== FEE STRUCTURES (FEE PLANS) MANAGEMENT ==========
  async getAllFeeStructures(
    page: number = 1,
    limit: number = 10,
    search?: string,
    schoolId?: number,
    feeCategoryId?: number,
    categoryHeadId?: number,
    academicYear?: string,
  ) {
    const { skip, limit: take } = getPaginationParams(page, limit);

    const queryBuilder = this.feeStructuresRepository
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.school', 'school')
      .leftJoinAndSelect('fs.category', 'category')
      .leftJoinAndSelect('fs.categoryHead', 'categoryHead')
      .leftJoinAndSelect('fs.class', 'class');

    // Apply filters
    if (schoolId) {
      queryBuilder.andWhere('fs.schoolId = :schoolId', { schoolId });
    }

    if (feeCategoryId) {
      queryBuilder.andWhere('fs.feeCategoryId = :feeCategoryId', { feeCategoryId });
    }

    if (categoryHeadId !== undefined) {
      if (categoryHeadId === null) {
        queryBuilder.andWhere('fs.categoryHeadId IS NULL');
      } else {
        queryBuilder.andWhere('fs.categoryHeadId = :categoryHeadId', { categoryHeadId });
      }
    }

    if (academicYear) {
      queryBuilder.andWhere('fs.academicYear = :academicYear', { academicYear });
    }

    // Search by name or description
    if (search && search.trim()) {
      queryBuilder.andWhere('(fs.name ILike :search OR fs.description ILike :search)', {
        search: `%${search.trim()}%`,
      });
    }

    queryBuilder.orderBy('fs.createdAt', 'DESC');

    const [feeStructures, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    return createPaginatedResponse(feeStructures, total, page, limit);
  }

  async getFeeStructureById(id: number) {
    const feeStructure = await this.feeStructuresRepository.findOne({
      where: { id },
      relations: ['school', 'category', 'categoryHead', 'class'],
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }

    return feeStructure;
  }

  async createFeeStructure(createFeeStructureDto: CreateFeeStructureDto, schoolId: number) {
    // Verify school exists
    const school = await this.schoolsRepository.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    // Verify fee category exists and belongs to school
    const feeCategory = await this.feeCategoriesRepository.findOne({
      where: { id: createFeeStructureDto.feeCategoryId },
    });
    if (!feeCategory) {
      throw new NotFoundException(
        `Fee category with ID ${createFeeStructureDto.feeCategoryId} not found`,
      );
    }
    if (feeCategory.schoolId !== schoolId) {
      throw new BadRequestException(`Fee category does not belong to school with ID ${schoolId}`);
    }

    // Verify category head if provided
    if (createFeeStructureDto.categoryHeadId) {
      const categoryHead = await this.categoryHeadsRepository.findOne({
        where: { id: createFeeStructureDto.categoryHeadId },
      });
      if (!categoryHead) {
        throw new NotFoundException(
          `Category head with ID ${createFeeStructureDto.categoryHeadId} not found`,
        );
      }
      if (categoryHead.schoolId !== schoolId) {
        throw new BadRequestException(
          `Category head does not belong to school with ID ${schoolId}`,
        );
      }
    }

    // Check for duplicate name within school (academic year is optional now)
    const whereCondition: any = {
      name: createFeeStructureDto.name,
      schoolId,
    };
    if (createFeeStructureDto.academicYear) {
      whereCondition.academicYear = createFeeStructureDto.academicYear;
    }
    const existing = await this.feeStructuresRepository.findOne({
      where: whereCondition,
    });
    if (existing) {
      const yearText = createFeeStructureDto.academicYear
        ? ` for academic year ${createFeeStructureDto.academicYear}`
        : '';
      throw new BadRequestException(
        `Fee structure with name "${createFeeStructureDto.name}" already exists for this school${yearText}`,
      );
    }

    const feeStructure = this.feeStructuresRepository.create({
      ...createFeeStructureDto,
      schoolId,
      dueDate: createFeeStructureDto.dueDate ? new Date(createFeeStructureDto.dueDate) : undefined,
    });

    return await this.feeStructuresRepository.save(feeStructure);
  }

  async updateFeeStructure(
    id: number,
    updateFeeStructureDto: UpdateFeeStructureDto,
    schoolId: number,
  ) {
    const feeStructure = await this.feeStructuresRepository.findOne({
      where: { id },
      relations: ['school', 'category', 'categoryHead', 'class'],
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }

    // Verify school matches
    if (feeStructure.schoolId !== schoolId) {
      throw new BadRequestException(`Fee structure does not belong to school with ID ${schoolId}`);
    }

    // Verify fee category if being updated
    if (updateFeeStructureDto.feeCategoryId) {
      const feeCategory = await this.feeCategoriesRepository.findOne({
        where: { id: updateFeeStructureDto.feeCategoryId },
      });
      if (!feeCategory) {
        throw new NotFoundException(
          `Fee category with ID ${updateFeeStructureDto.feeCategoryId} not found`,
        );
      }
      if (feeCategory.schoolId !== schoolId) {
        throw new BadRequestException(`Fee category does not belong to school with ID ${schoolId}`);
      }
    }

    // Verify category head if being updated
    if (updateFeeStructureDto.categoryHeadId !== undefined) {
      if (updateFeeStructureDto.categoryHeadId) {
        const categoryHead = await this.categoryHeadsRepository.findOne({
          where: { id: updateFeeStructureDto.categoryHeadId },
        });
        if (!categoryHead) {
          throw new NotFoundException(
            `Category head with ID ${updateFeeStructureDto.categoryHeadId} not found`,
          );
        }
        if (categoryHead.schoolId !== schoolId) {
          throw new BadRequestException(
            `Category head does not belong to school with ID ${schoolId}`,
          );
        }
      }
    }

    // Verify class if being updated
    if (updateFeeStructureDto.classId !== undefined) {
      if (updateFeeStructureDto.classId) {
        const classEntity = await this.classesRepository.findOne({
          where: { id: updateFeeStructureDto.classId },
        });
        if (!classEntity) {
          throw new NotFoundException(`Class with ID ${updateFeeStructureDto.classId} not found`);
        }
        if (classEntity.schoolId !== schoolId) {
          throw new BadRequestException(`Class does not belong to school with ID ${schoolId}`);
        }
      }
    }

    // Check for duplicate name if name is being updated
    if (updateFeeStructureDto.name) {
      const whereCondition: any = {
        name: updateFeeStructureDto.name,
        schoolId,
      };
      const academicYear = updateFeeStructureDto.academicYear || feeStructure.academicYear;
      if (academicYear) {
        whereCondition.academicYear = academicYear;
      }
      const existing = await this.feeStructuresRepository.findOne({
        where: whereCondition,
      });
      if (existing && existing.id !== id) {
        const yearText = academicYear ? ` for academic year ${academicYear}` : '';
        throw new BadRequestException(
          `Fee structure with name "${updateFeeStructureDto.name}" already exists for this school${yearText}`,
        );
      }
    }

    // Update fields
    Object.assign(feeStructure, {
      ...updateFeeStructureDto,
      dueDate: updateFeeStructureDto.dueDate
        ? new Date(updateFeeStructureDto.dueDate)
        : feeStructure.dueDate,
    });

    return await this.feeStructuresRepository.save(feeStructure);
  }

  async removeFeeStructure(id: number, schoolId: number) {
    const feeStructure = await this.feeStructuresRepository.findOne({
      where: { id },
      relations: ['studentStructures', 'payments'],
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }

    // Verify school matches
    if (feeStructure.schoolId !== schoolId) {
      throw new BadRequestException(`Fee structure does not belong to school with ID ${schoolId}`);
    }

    // Check if fee structure has associated student structures
    // Payments are now linked to StudentFeeStructure, not FeeStructure directly
    if (feeStructure.studentStructures && feeStructure.studentStructures.length > 0) {
      const studentCount = feeStructure.studentStructures.length;
      throw new BadRequestException(
        `Cannot delete fee structure. It has ${studentCount} student assignment(s). Please remove or reassign them first.`,
      );
    }

    await this.feeStructuresRepository.remove(feeStructure);
    return { message: 'Fee structure deleted successfully' };
  }

  // ========== SCHOOL CLASSES ==========
  async getSchoolClasses(schoolId: number): Promise<string[]> {
    // Verify school exists
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    // Fetch all classes for the school (from Classes entity, not from students)
    const classes = await this.classesRepository.find({
      where: { schoolId, status: ClassStatus.ACTIVE },
      select: ['name'],
      order: { name: 'ASC' },
    });

    // Extract class names and return as sorted array
    const uniqueClasses = classes.map(cls => cls.name).sort();

    return uniqueClasses;
  }

  // ========== ROUTE PRICES MANAGEMENT ==========
  async getAllRoutePrices(
    page: number = 1,
    limit: number = 10,
    schoolId?: number,
    routeId?: number,
    classId?: number,
    categoryHeadId?: number,
    search?: string,
  ) {
    const { skip, limit: take } = getPaginationParams(page, limit);

    const queryBuilder = this.routePricesRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.school', 'school')
      .leftJoinAndSelect('rp.route', 'route')
      .leftJoinAndSelect('rp.class', 'class')
      .leftJoinAndSelect('rp.categoryHead', 'categoryHead');

    // Apply filters
    if (schoolId) {
      queryBuilder.andWhere('rp.schoolId = :schoolId', { schoolId });
    }

    if (routeId) {
      queryBuilder.andWhere('rp.routeId = :routeId', { routeId });
    }

    if (classId) {
      queryBuilder.andWhere('rp.classId = :classId', { classId });
    }

    if (categoryHeadId) {
      queryBuilder.andWhere('rp.categoryHeadId = :categoryHeadId', { categoryHeadId });
    }

    // Apply search filter
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(route.name ILIKE :search OR class.name ILIKE :search OR categoryHead.name ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    queryBuilder.orderBy('rp.createdAt', 'DESC');

    const [routePrices, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    // Ensure relations are loaded (debug: log first item to verify)
    if (routePrices.length > 0) {
      const first = routePrices[0];
      if (!first.route || !first.class || !first.categoryHead) {
        console.warn('[RoutePrices] Missing relations in response:', {
          routeId: first.routeId,
          hasRoute: !!first.route,
          classId: first.classId,
          hasClass: !!first.class,
          categoryHeadId: first.categoryHeadId,
          hasCategoryHead: !!first.categoryHead,
        });
      }
    }

    return createPaginatedResponse(routePrices, total, page, limit);
  }

  async getRoutePriceById(id: number) {
    const routePrice = await this.routePricesRepository.findOne({
      where: { id },
      relations: ['school', 'route', 'class', 'categoryHead'],
    });

    if (!routePrice) {
      throw new NotFoundException(`Route price with ID ${id} not found`);
    }

    return routePrice;
  }

  async createRoutePrice(createRoutePriceDto: CreateRoutePriceDto, schoolId: number) {
    // Validate route exists
    const route = await this.routesRepository.findOne({
      where: { id: createRoutePriceDto.routeId, schoolId },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${createRoutePriceDto.routeId} not found`);
    }

    // Validate class exists
    const classEntity = await this.classesRepository.findOne({
      where: { id: createRoutePriceDto.classId, schoolId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${createRoutePriceDto.classId} not found`);
    }

    // Validate category head exists
    const categoryHead = await this.categoryHeadsRepository.findOne({
      where: { id: createRoutePriceDto.categoryHeadId, schoolId },
    });

    if (!categoryHead) {
      throw new NotFoundException(
        `Category head with ID ${createRoutePriceDto.categoryHeadId} not found`,
      );
    }

    // Check if route price already exists (unique constraint)
    const existing = await this.routePricesRepository.findOne({
      where: {
        schoolId,
        routeId: createRoutePriceDto.routeId,
        classId: createRoutePriceDto.classId,
        categoryHeadId: createRoutePriceDto.categoryHeadId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `A route price already exists for "${route.name}" route, "${classEntity.name}" class, and "${categoryHead.name}" category head. Please edit the existing entry or choose different values.`,
      );
    }

    const routePrice = this.routePricesRepository.create({
      ...createRoutePriceDto,
      schoolId,
      status: createRoutePriceDto.status || RoutePriceStatus.ACTIVE,
    });

    return await this.routePricesRepository.save(routePrice);
  }

  async updateRoutePrice(
    id: number,
    updateRoutePriceDto: UpdateRoutePriceDto,
    schoolId: number,
  ) {
    const routePrice = await this.routePricesRepository.findOne({
      where: { id },
    });

    if (!routePrice) {
      throw new NotFoundException(`Route price with ID ${id} not found`);
    }

    if (routePrice.schoolId !== schoolId) {
      throw new BadRequestException(`Route price does not belong to school with ID ${schoolId}`);
    }

    // Validate route if being updated
    if (updateRoutePriceDto.routeId) {
      const route = await this.routesRepository.findOne({
        where: { id: updateRoutePriceDto.routeId, schoolId },
      });

      if (!route) {
        throw new NotFoundException(`Route with ID ${updateRoutePriceDto.routeId} not found`);
      }
    }

    // Validate class if being updated
    if (updateRoutePriceDto.classId) {
      const classEntity = await this.classesRepository.findOne({
        where: { id: updateRoutePriceDto.classId, schoolId },
      });

      if (!classEntity) {
        throw new NotFoundException(`Class with ID ${updateRoutePriceDto.classId} not found`);
      }
    }

    // Validate category head if being updated
    if (updateRoutePriceDto.categoryHeadId) {
      const categoryHead = await this.categoryHeadsRepository.findOne({
        where: { id: updateRoutePriceDto.categoryHeadId, schoolId },
      });

      if (!categoryHead) {
        throw new NotFoundException(
          `Category head with ID ${updateRoutePriceDto.categoryHeadId} not found`,
        );
      }
    }

    // Check unique constraint if any key fields are being updated
    if (
      updateRoutePriceDto.routeId ||
      updateRoutePriceDto.classId ||
      updateRoutePriceDto.categoryHeadId
    ) {
      const finalRouteId = updateRoutePriceDto.routeId ?? routePrice.routeId;
      const finalClassId = updateRoutePriceDto.classId ?? routePrice.classId;
      const finalCategoryHeadId =
        updateRoutePriceDto.categoryHeadId ?? routePrice.categoryHeadId;

      const existing = await this.routePricesRepository.findOne({
        where: {
          schoolId,
          routeId: finalRouteId,
          classId: finalClassId,
          categoryHeadId: finalCategoryHeadId,
        },
      });

      if (existing && existing.id !== id) {
        // Fetch names for better error message
        const route = await this.routesRepository.findOne({
          where: { id: finalRouteId, schoolId },
        });
        const classEntity = await this.classesRepository.findOne({
          where: { id: finalClassId, schoolId },
        });
        const categoryHead = await this.categoryHeadsRepository.findOne({
          where: { id: finalCategoryHeadId, schoolId },
        });

        const routeName = route?.name || `ID ${finalRouteId}`;
        const className = classEntity?.name || `ID ${finalClassId}`;
        const categoryHeadName = categoryHead?.name || `ID ${finalCategoryHeadId}`;

        throw new BadRequestException(
          `A route price already exists for "${routeName}" route, "${className}" class, and "${categoryHeadName}" category head. Please edit the existing entry or choose different values.`,
        );
      }
    }

    Object.assign(routePrice, updateRoutePriceDto);
    return await this.routePricesRepository.save(routePrice);
  }

  async removeRoutePrice(id: number, schoolId: number) {
    // Validate inputs
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException(`Invalid route price ID: ${id}`);
    }
    if (!schoolId || isNaN(schoolId) || schoolId <= 0) {
      throw new BadRequestException(`Invalid schoolId: ${schoolId}`);
    }

    const routePrice = await this.routePricesRepository.findOne({
      where: { id },
    });

    if (!routePrice) {
      throw new NotFoundException(`Route price with ID ${id} not found`);
    }

    if (routePrice.schoolId !== schoolId) {
      throw new BadRequestException(`Route price does not belong to school with ID ${schoolId}`);
    }

    // Check if route price has valid categoryHeadId and classId for FK check
    if (routePrice.categoryHeadId && routePrice.classId &&
        typeof routePrice.categoryHeadId === 'number' && 
        typeof routePrice.classId === 'number') {
      
      // Check if route price is referenced by fee structures
      const feeStructures = await this.feeStructuresRepository
        .createQueryBuilder('fs')
        .leftJoinAndSelect('fs.category', 'category')
        .where('fs.schoolId = :schoolId', { schoolId })
        .andWhere('fs.categoryHeadId = :categoryHeadId', { categoryHeadId: routePrice.categoryHeadId })
        .andWhere('fs.classId = :classId', { classId: routePrice.classId })
        .andWhere('category.type = :type', { type: FeeCategoryType.TRANSPORT })
        .getMany();

      if (feeStructures.length > 0) {
        throw new BadRequestException(
          `Cannot delete route price: It is referenced by ${feeStructures.length} fee structure(s). Please remove or update the related fee structures first.`,
        );
      }
    }

    await this.routePricesRepository.remove(routePrice);
    return { message: 'Route price deleted successfully' };
  }

  async bulkRemoveRoutePrices(ids: number[], schoolId: number) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No route price IDs provided');
    }

    // Direct query with both conditions
    const routePrices = await this.routePricesRepository.find({
      where: { id: In(ids), schoolId },
    });

    if (routePrices.length === 0) {
      throw new NotFoundException('No route prices found with the provided IDs');
    }

    if (routePrices.length !== ids.length) {
      throw new BadRequestException(
        `Some route prices not found or do not belong to school ${schoolId}`,
      );
    }

    const deleted: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    for (const routePrice of routePrices) {
      try {
        // Validate that routePrice has valid IDs before checking FK constraints
        if (!routePrice.categoryHeadId || !routePrice.classId || 
            typeof routePrice.categoryHeadId !== 'number' || 
            typeof routePrice.classId !== 'number') {
          // Skip FK check if data is invalid, just try to delete
          // If there's a real FK constraint, PostgreSQL will catch it
          await this.routePricesRepository.remove(routePrice);
          deleted.push(routePrice.id);
          continue;
        }

        // Check if route price is referenced by fee structures
        const feeStructures = await this.feeStructuresRepository
          .createQueryBuilder('fs')
          .leftJoinAndSelect('fs.category', 'category')
          .where('fs.schoolId = :schoolId', { schoolId })
          .andWhere('fs.categoryHeadId = :categoryHeadId', { categoryHeadId: routePrice.categoryHeadId })
          .andWhere('fs.classId = :classId', { classId: routePrice.classId })
          .andWhere('category.type = :type', { type: FeeCategoryType.TRANSPORT })
          .getMany();

        if (feeStructures.length > 0) {
          failed.push({
            id: routePrice.id,
            error: `Referenced by ${feeStructures.length} fee structure(s)`,
          });
          continue;
        }

        await this.routePricesRepository.remove(routePrice);
        deleted.push(routePrice.id);
      } catch (error) {
        failed.push({
          id: routePrice.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      deleted: deleted.length,
      failed: failed.length,
      errors: failed,
    };
  }

}
