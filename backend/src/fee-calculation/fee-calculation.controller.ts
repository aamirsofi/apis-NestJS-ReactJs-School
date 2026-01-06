import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FeeCalculationService, FeeBreakdownResult } from './fee-calculation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Fee Calculation')
@ApiBearerAuth('JWT-auth')
@Controller('fee-calculation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeCalculationController {
  constructor(private readonly feeCalculationService: FeeCalculationService) {}

  @Get('breakdown/:studentId')
  @ApiOperation({
    summary: 'Generate fee breakdown for a student',
    description:
      'Calculates fee breakdown following strict separation: school fees from fee_structures, transport fees from route_prices',
  })
  @ApiParam({ name: 'studentId', description: 'Student ID', type: Number })
  @ApiQuery({
    name: 'academicYearId',
    required: true,
    type: Number,
    description: 'Academic Year ID',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'School ID (optional for super admin)',
  })
  @ApiOkResponse({
    type: Object,
    description: 'Fee breakdown result',
    schema: {
      example: {
        studentId: 1,
        studentName: 'John Doe',
        schoolId: 1,
        classId: 5,
        className: 'Grade 5',
        categoryHeadId: 1,
        categoryHeadName: 'General',
        routeId: 1,
        routeName: 'FREE',
        breakdown: [
          {
            feeCategoryId: 1,
            feeCategoryName: 'Tuition Fee',
            feeCategoryType: 'school',
            categoryHeadId: 1,
            categoryHeadName: 'General',
            amount: 5000,
            source: 'fee_structures',
          },
          {
            feeCategoryId: 2,
            feeCategoryName: 'Transport Fee',
            feeCategoryType: 'transport',
            categoryHeadId: 1,
            categoryHeadName: 'General',
            amount: 0,
            source: 'route_prices',
          },
        ],
        totalAmount: 5000,
        academicYearId: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 400, description: 'Missing pricing configuration' })
  async generateBreakdown(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Request() req: any,
    @Query('schoolId') schoolId?: string,
  ): Promise<FeeBreakdownResult> {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId
      ? +schoolId
      : req.user.role === 'super_admin'
        ? undefined
        : userSchoolId;

    if (!targetSchoolId) {
      throw new Error('School ID is required');
    }

    return this.feeCalculationService.generateFeeBreakdown(
      +studentId,
      +academicYearId,
      targetSchoolId,
    );
  }

  @Post('breakdown/batch')
  @Roles('administrator', 'super_admin')
  @ApiOperation({
    summary: 'Generate fee breakdowns for multiple students',
  })
  @ApiQuery({
    name: 'academicYearId',
    required: true,
    type: Number,
    description: 'Academic Year ID',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'School ID (optional for super admin)',
  })
  @ApiOkResponse({
    type: [Object],
    description: 'List of fee breakdown results',
  })
  async generateBreakdownBatch(
    @Body() body: { studentIds: number[] },
    @Query('academicYearId') academicYearId: string,
    @Request() req: any,
    @Query('schoolId') schoolId?: string,
  ): Promise<FeeBreakdownResult[]> {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId
      ? +schoolId
      : req.user.role === 'super_admin'
        ? undefined
        : userSchoolId;

    if (!targetSchoolId) {
      throw new Error('School ID is required');
    }

    return this.feeCalculationService.generateFeeBreakdownBatch(
      body.studentIds,
      +academicYearId,
      targetSchoolId,
    );
  }

  @Get('validate-pricing')
  @ApiOperation({
    summary: 'Validate pricing configuration',
    description: 'Check if all required pricing rows exist for a given configuration',
  })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: Number,
    description: 'School ID',
  })
  @ApiQuery({
    name: 'classId',
    required: true,
    type: Number,
    description: 'Class ID',
  })
  @ApiQuery({
    name: 'categoryHeadId',
    required: true,
    type: Number,
    description: 'Category Head ID',
  })
  @ApiQuery({
    name: 'routeId',
    required: true,
    type: Number,
    description: 'Route ID',
  })
  @ApiOkResponse({
    description: 'Pricing validation result',
    schema: {
      example: {
        valid: true,
        missing: [],
      },
    },
  })
  async validatePricing(
    @Query('schoolId') schoolId: string,
    @Query('classId') classId: string,
    @Query('categoryHeadId') categoryHeadId: string,
    @Query('routeId') routeId: string,
  ) {
    return this.feeCalculationService.validatePricingConfiguration(
      +schoolId,
      +classId,
      +categoryHeadId,
      +routeId,
    );
  }
}

