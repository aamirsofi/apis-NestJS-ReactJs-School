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
import { FeeCategoriesService } from './fee-categories.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from './dto/update-fee-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Fee Categories')
@ApiBearerAuth('JWT-auth')
@Controller('fee-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeCategoriesController {
  constructor(private readonly feeCategoriesService: FeeCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new fee category' })
  @ApiResponse({ status: 201, description: 'Fee category created successfully' })
  create(@Body() createFeeCategoryDto: CreateFeeCategoryDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    if (!schoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('School context required');
    }
    return this.feeCategoriesService.create(createFeeCategoryDto, schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fee categories' })
  @ApiResponse({ status: 200, description: 'List of fee categories' })
  findAll(@Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeCategoriesService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fee category by ID' })
  @ApiResponse({ status: 200, description: 'Fee category found' })
  @ApiResponse({ status: 404, description: 'Fee category not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeCategoriesService.findOne(+id, schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update fee category' })
  @ApiResponse({ status: 200, description: 'Fee category updated successfully' })
  update(@Param('id') id: string, @Body() updateFeeCategoryDto: UpdateFeeCategoryDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeCategoriesService.update(+id, updateFeeCategoryDto, schoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete fee category' })
  @ApiResponse({ status: 200, description: 'Fee category deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.feeCategoriesService.remove(+id, schoolId);
  }
}

