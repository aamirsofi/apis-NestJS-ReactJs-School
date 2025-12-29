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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Fee Structures')
@ApiBearerAuth('JWT-auth')
@Controller('fee-structures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new fee structure' })
  @ApiResponse({ status: 201, description: 'Fee structure created successfully' })
  create(@Body() createFeeStructureDto: CreateFeeStructureDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    if (!schoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('School context required');
    }
    return this.feeStructuresService.create(createFeeStructureDto, schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fee structures' })
  @ApiResponse({ status: 200, description: 'List of fee structures' })
  findAll(@Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeStructuresService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fee structure by ID' })
  @ApiResponse({ status: 200, description: 'Fee structure found' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeStructuresService.findOne(+id, schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update fee structure' })
  @ApiResponse({ status: 200, description: 'Fee structure updated successfully' })
  update(@Param('id') id: string, @Body() updateFeeStructureDto: UpdateFeeStructureDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeStructuresService.update(+id, updateFeeStructureDto, schoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete fee structure' })
  @ApiResponse({ status: 200, description: 'Fee structure deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeStructuresService.remove(+id, schoolId);
  }
}

