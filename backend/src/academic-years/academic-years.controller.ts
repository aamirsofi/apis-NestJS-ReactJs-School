import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic Years')
@ApiBearerAuth('JWT-auth')
@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new academic year' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'School ID (required for super admin, optional for school admin)',
  })
  @ApiResponse({ status: 201, description: 'Academic year created successfully' })
  create(
    @Body() createAcademicYearDto: CreateAcademicYearDto,
    @Request() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    const userSchoolId = req.school?.id || req.user?.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    if (req.user.role !== UserRole.SUPER_ADMIN && targetSchoolId !== userSchoolId) {
      throw new BadRequestException('You can only create academic years for your own school');
    }

    if (!targetSchoolId) {
      throw new BadRequestException('School ID is required');
    }

    return this.academicYearsService.create(createAcademicYearDto, targetSchoolId);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all academic years' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID (optional for super admin)',
  })
  @ApiResponse({ status: 200, description: 'List of academic years' })
  findAll(@Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user?.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School context required');
    }

    // For super admin without schoolId, we could return all, but for now require schoolId
    if (!targetSchoolId) {
      throw new BadRequestException('School ID is required. Use ?schoolId=X query parameter for super admin.');
    }

    return this.academicYearsService.findAll(targetSchoolId);
  }

  @Get('current')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current academic year' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'School ID (required for super admin, optional for school admin)',
  })
  @ApiResponse({ status: 200, description: 'Current academic year' })
  async getCurrent(@Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user?.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School context required');
    }

    if (!targetSchoolId) {
      throw new BadRequestException('School ID is required. Use ?schoolId=X query parameter for super admin.');
    }

    return await this.academicYearsService.getOrCreateCurrent(targetSchoolId);
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get academic year by ID' })
  @ApiResponse({ status: 200, description: 'Academic year found' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;
    const numericSchoolId = schoolId ? (typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId) : undefined;
    return this.academicYearsService.findOne(+id, numericSchoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update academic year' })
  @ApiResponse({ status: 200, description: 'Academic year updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto,
    @Request() req: any,
  ) {
    const schoolId = req.school?.id || req.user?.schoolId;
    const numericSchoolId = schoolId ? (typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId) : undefined;
    return this.academicYearsService.update(+id, updateAcademicYearDto, numericSchoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete academic year' })
  @ApiResponse({ status: 200, description: 'Academic year deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;
    const numericSchoolId = schoolId ? (typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId) : undefined;
    return this.academicYearsService.remove(+id, numericSchoolId);
  }
}

