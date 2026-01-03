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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Create a new user (Administrator or Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    // Administrators can only create users for their own school
    if (req.user.role === 'administrator') {
      if (!req.user.schoolId) {
        throw new BadRequestException('School context required');
      }
      // Administrators can only create ACCOUNTANT users
      if (createUserDto.role && createUserDto.role !== 'accountant') {
        throw new BadRequestException('Administrators can only create ACCOUNTANT users');
      }
      // Force schoolId to match administrator's school
      createUserDto.schoolId = req.user.schoolId;
      createUserDto.role = createUserDto.role || 'accountant';
    }
    // Super Admin can create any user with any role
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Get all users (Administrator or Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll(@Request() req: any) {
    // Administrators can only see users from their school
    if (req.user.role === 'administrator') {
      return this.usersService.findBySchool(req.user.schoolId);
    }
    // Super Admin sees all users
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    // Administrators can only update users from their school
    if (req.user.role === 'administrator') {
      const user = await this.usersService.findOne(+id);
      if (user.schoolId !== req.user.schoolId) {
        throw new BadRequestException('Cannot update users from other schools');
      }
      // Administrators cannot change roles to SUPER_ADMIN
      if (updateUserDto.role === 'super_admin') {
        throw new BadRequestException('Cannot assign SUPER_ADMIN role');
      }
    }
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any) {
    // Administrators can only delete users from their school
    if (req.user.role === 'administrator') {
      const user = await this.usersService.findOne(+id);
      if (user.schoolId !== req.user.schoolId) {
        throw new BadRequestException('Cannot delete users from other schools');
      }
      const userRoleName = user.role?.name || (user.role as any);
      if (userRoleName === 'super_admin') {
        throw new BadRequestException('Cannot delete SUPER_ADMIN user');
      }
    }
    return this.usersService.remove(+id);
  }
}
