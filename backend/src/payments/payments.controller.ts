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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('administrator', 'accountant', 'super_admin')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    if (!schoolId && req.user.role !== 'super_admin') {
      throw new Error('School context required');
    }
    return this.paymentsService.create(createPaymentDto, schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'studentId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of payments' })
  findAll(@Request() req: any, @Query('studentId') studentId?: string) {
    const schoolId = req.school?.id || req.user.schoolId;
    if (studentId) {
      return this.paymentsService.findByStudent(+studentId, schoolId);
    }
    return this.paymentsService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.paymentsService.findOne(+id, schoolId);
  }

  @Patch(':id')
  @Roles('administrator', 'accountant', 'super_admin')
  @ApiOperation({ summary: 'Update payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.paymentsService.update(+id, updatePaymentDto, schoolId);
  }

  @Delete(':id')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Delete payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.paymentsService.remove(+id, schoolId);
  }
}
