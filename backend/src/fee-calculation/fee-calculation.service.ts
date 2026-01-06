import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { FeeCategory, FeeCategoryType, CategoryStatus } from '../fee-categories/entities/fee-category.entity';
import { FeeStructure, StructureStatus } from '../fee-structures/entities/fee-structure.entity';
import { RoutePrice, RoutePriceStatus } from '../route-prices/entities/route-price.entity';
import { Route } from '../routes/entities/route.entity';

export interface FeeBreakdownItem {
  feeCategoryId: number;
  feeCategoryName: string;
  feeCategoryType: FeeCategoryType;
  categoryHeadId: number;
  categoryHeadName: string;
  amount: number;
  source: 'fee_structures' | 'route_prices';
}

export interface FeeBreakdownResult {
  studentId: number;
  studentName: string;
  schoolId: number;
  classId: number;
  className: string;
  categoryHeadId: number;
  categoryHeadName: string;
  routeId: number;
  routeName: string;
  breakdown: FeeBreakdownItem[];
  totalAmount: number;
  academicYearId: number;
}

@Injectable()
export class FeeCalculationService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(FeeCategory)
    private feeCategoryRepository: Repository<FeeCategory>,
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(RoutePrice)
    private routePriceRepository: Repository<RoutePrice>,
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
  ) {}

  /**
   * Generate fee breakdown for a student
   * Follows strict separation: school fees from fee_structures, transport fees from route_prices
   */
  async generateFeeBreakdown(
    studentId: number,
    academicYearId: number,
    schoolId: number,
  ): Promise<FeeBreakdownResult> {
    // Step 1: Fetch student with required relations
    const student = await this.studentRepository.findOne({
      where: { id: studentId, schoolId },
      relations: ['categoryHead', 'route', 'academicRecords', 'academicRecords.class'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Get current academic record for the student
    const currentAcademicRecord = student.academicRecords?.find(
      (record) => record.academicYearId === academicYearId && record.status === 'active',
    );

    if (!currentAcademicRecord) {
      throw new BadRequestException(
        `Student ${studentId} has no active academic record for academic year ${academicYearId}`,
      );
    }

    const classId = currentAcademicRecord.classId;
    const className = currentAcademicRecord.class?.name || 'Unknown';

    // Validate required fields
    if (!classId) {
      throw new BadRequestException(`Student ${studentId} has no class assigned`);
    }

    if (!student.categoryHeadId) {
      throw new BadRequestException(`Student ${studentId} has no category head assigned`);
    }

    if (!student.routeId) {
      throw new BadRequestException(`Student ${studentId} has no route assigned. Every student must have a route.`);
    }

    // Step 2: Fetch all fee categories applicable for the student's class
    const feeCategories = await this.feeCategoryRepository.find({
      where: {
        schoolId,
        status: CategoryStatus.ACTIVE,
      },
      relations: ['categoryHead'],
    });

    if (feeCategories.length === 0) {
      throw new NotFoundException(`No fee categories found for school ${schoolId}`);
    }

    // Step 3: Build breakdown by processing each fee category
    const breakdown: FeeBreakdownItem[] = [];
    const missingPricing: string[] = [];

    for (const category of feeCategories) {
      let amount: number;
      let source: 'fee_structures' | 'route_prices';

      if (category.type === FeeCategoryType.SCHOOL) {
        // School fee: fetch from fee_structures
        const feeStructure = await this.feeStructureRepository.findOne({
          where: {
            schoolId,
            classId,
            categoryHeadId: student.categoryHeadId,
            feeCategoryId: category.id,
            status: StructureStatus.ACTIVE,
          },
        });

        if (!feeStructure) {
          missingPricing.push(
            `School fee: ${category.name} (categoryId: ${category.id}, classId: ${classId}, categoryHeadId: ${student.categoryHeadId})`,
          );
          continue;
        }

        amount = parseFloat(feeStructure.amount.toString());
        source = 'fee_structures';
      } else if (category.type === FeeCategoryType.TRANSPORT) {
        // Transport fee: fetch from route_prices
        const routePrice = await this.routePriceRepository.findOne({
          where: {
            schoolId,
            routeId: student.routeId,
            classId,
            categoryHeadId: student.categoryHeadId,
            status: RoutePriceStatus.ACTIVE,
          },
          relations: ['route'],
        });

        if (!routePrice) {
          missingPricing.push(
            `Transport fee: ${category.name} (routeId: ${student.routeId}, classId: ${classId}, categoryHeadId: ${student.categoryHeadId})`,
          );
          continue;
        }

        amount = parseFloat(routePrice.amount.toString());
        source = 'route_prices';

        // FREE route naturally returns amount = 0, no special handling needed
      } else {
        // Unknown fee category type - skip
        continue;
      }

      breakdown.push({
        feeCategoryId: category.id,
        feeCategoryName: category.name,
        feeCategoryType: category.type,
        categoryHeadId: student.categoryHeadId,
        categoryHeadName: student.categoryHead?.name || 'Unknown',
        amount,
        source,
      });
    }

    // Step 4: Validate all required pricing exists
    if (missingPricing.length > 0) {
      throw new BadRequestException(
        `Missing pricing configuration:\n${missingPricing.join('\n')}\n\n` +
          `Please ensure all fee categories have corresponding pricing rows:\n` +
          `- School fees: fee_structures table\n` +
          `- Transport fees: route_prices table`,
      );
    }

    // Step 5: Calculate total amount
    const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      schoolId: student.schoolId,
      classId,
      className,
      categoryHeadId: student.categoryHeadId,
      categoryHeadName: student.categoryHead?.name || 'Unknown',
      routeId: student.routeId,
      routeName: student.route?.name || 'Unknown',
      breakdown,
      totalAmount,
      academicYearId,
    };
  }

  /**
   * Get fee breakdown for multiple students (batch processing)
   */
  async generateFeeBreakdownBatch(
    studentIds: number[],
    academicYearId: number,
    schoolId: number,
  ): Promise<FeeBreakdownResult[]> {
    const results: FeeBreakdownResult[] = [];
    const errors: Array<{ studentId: number; error: string }> = [];

    for (const studentId of studentIds) {
      try {
        const breakdown = await this.generateFeeBreakdown(studentId, academicYearId, schoolId);
        results.push(breakdown);
      } catch (error: any) {
        errors.push({
          studentId,
          error: error.message || 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new BadRequestException(
        `Failed to generate breakdowns for all students:\n${errors.map((e) => `Student ${e.studentId}: ${e.error}`).join('\n')}`,
      );
    }

    return results;
  }

  /**
   * Validate pricing configuration for a student's class and category head
   * Useful for pre-validation before generating breakdowns
   */
  async validatePricingConfiguration(
    schoolId: number,
    classId: number,
    categoryHeadId: number,
    routeId: number,
  ): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = [];

    // Get all fee categories for the school
    const feeCategories = await this.feeCategoryRepository.find({
      where: {
        schoolId,
        status: CategoryStatus.ACTIVE,
      },
    });

    for (const category of feeCategories) {
      if (category.type === FeeCategoryType.SCHOOL) {
        const feeStructure = await this.feeStructureRepository.findOne({
          where: {
            schoolId,
            classId,
            categoryHeadId,
            feeCategoryId: category.id,
            status: StructureStatus.ACTIVE,
          },
        });

        if (!feeStructure) {
          missing.push(`School fee: ${category.name} (fee_structures missing)`);
        }
      } else if (category.type === FeeCategoryType.TRANSPORT) {
        const routePrice = await this.routePriceRepository.findOne({
          where: {
            schoolId,
            routeId,
            classId,
            categoryHeadId,
            status: RoutePriceStatus.ACTIVE,
          },
        });

        if (!routePrice) {
          missing.push(`Transport fee: ${category.name} (route_prices missing)`);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

