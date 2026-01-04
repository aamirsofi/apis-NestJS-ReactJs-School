import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentFeeStructuresService } from './student-fee-structures.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Student Fee Structures')
@ApiBearerAuth('JWT-auth')
@Controller('student-fee-structures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentFeeStructuresController {
  constructor(
    private readonly studentFeeStructuresService: StudentFeeStructuresService,
  ) {}

  @Get()
  @Roles('administrator', 'accountant', 'super_admin')
  @ApiOperation({ summary: 'Get all student fee structures' })
  @ApiQuery({
    name: 'studentId',
    required: false,
    type: Number,
    description: 'Filter by student ID',
  })
  @ApiQuery({
    name: 'academicYearId',
    required: false,
    type: Number,
    description: 'Filter by academic year ID',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID',
  })
  @ApiResponse({ status: 200, description: 'List of student fee structures' })
  findAll(
    @Query('studentId', new ParseIntPipe({ optional: true })) studentId?: number,
    @Query('academicYearId', new ParseIntPipe({ optional: true })) academicYearId?: number,
    @Request() req?: any,
  ) {
    const schoolId = req?.school?.id || req?.user?.schoolId;
    return this.studentFeeStructuresService.findAll(studentId, academicYearId, schoolId);
  }

  @Get(':id')
  @Roles('administrator', 'accountant', 'super_admin')
  @ApiOperation({ summary: 'Get student fee structure by ID' })
  @ApiResponse({ status: 200, description: 'Student fee structure found' })
  @ApiResponse({ status: 404, description: 'Student fee structure not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentFeeStructuresService.findOne(id);
  }
}


