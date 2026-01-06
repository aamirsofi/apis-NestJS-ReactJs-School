import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { UpdateFeeInvoiceDto } from './dto/update-fee-invoice.dto';
import { GenerateInvoiceFromFeeStructuresDto } from './dto/generate-invoice-from-fee-structures.dto';
import { AddTransportItemDto, AddHostelItemDto, AddFineDto, AddMiscItemDto } from './dto/add-invoice-item.dto';
import { InvoiceType } from './entities/fee-invoice.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(
    @Body() createInvoiceDto: CreateFeeInvoiceDto,
    @Request() req: any,
    @Query('schoolId') schoolIdParam?: string,
  ) {
    // Priority: 1. JWT token, 2. Query param, 3. Subdomain
    const userSchoolId = req.user?.schoolId || req.school?.id;
    const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : userSchoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School context not found. Please ensure you are logged in and have access to a school.');
    }

    return this.invoicesService.create(schoolId, createInvoiceDto);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('schoolId') schoolIdParam?: string,
  ) {
    // Priority: 1. JWT token, 2. Query param, 3. Subdomain
    const userSchoolId = req.user?.schoolId || req.school?.id;
    const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : userSchoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School context not found. Please ensure you are logged in and have access to a school.');
    }

    return this.invoicesService.findAll(
      schoolId,
      studentId ? parseInt(studentId, 10) : undefined,
      status,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
    @Query('schoolId') schoolIdParam?: string,
  ) {
    // Priority: 1. JWT token, 2. Query param, 3. Subdomain
    const userSchoolId = req.user?.schoolId || req.school?.id;
    const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : userSchoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School context not found. Please ensure you are logged in and have access to a school.');
    }

    return this.invoicesService.findOne(parseInt(id, 10), schoolId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateFeeInvoiceDto,
    @Request() req: any,
  ) {
    const schoolId = req.user?.schoolId || req.school?.id;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.invoicesService.update(parseInt(id, 10), schoolId, updateInvoiceDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user?.schoolId || req.school?.id;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    await this.invoicesService.remove(parseInt(id, 10), schoolId);
    return { message: 'Invoice deleted successfully' };
  }

  @Post(':id/finalize')
  async finalize(
    @Param('id') id: string,
    @Request() req: any,
    @Query('schoolId') schoolIdParam?: string,
  ) {
    // Priority: 1. JWT token, 2. Query param, 3. Subdomain
    const userSchoolId = req.user?.schoolId || req.school?.id;
    const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : userSchoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School context not found. Please ensure you are logged in and have access to a school.');
    }

    return this.invoicesService.finalize(parseInt(id, 10), schoolId);
  }

  @Post('generate-from-fee-structures')
  async generateFromFeeStructures(
    @Body() generateDto: GenerateInvoiceFromFeeStructuresDto,
    @Request() req: any,
    @Query('schoolId') schoolIdParam?: string,
  ) {
    // Priority: 1. JWT token, 2. Query param, 3. Subdomain
    const userSchoolId = req.user?.schoolId || req.school?.id;
    const schoolId = schoolIdParam ? parseInt(schoolIdParam, 10) : userSchoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School context not found. Please ensure you are logged in and have access to a school.');
    }

    // Validate period fields based on type
    if (generateDto.type === InvoiceType.MONTHLY && !generateDto.periodMonth) {
      throw new BadRequestException('periodMonth is required for monthly invoices');
    }
    if (generateDto.type === InvoiceType.QUARTERLY && !generateDto.periodQuarter) {
      throw new BadRequestException('periodQuarter is required for quarterly invoices');
    }
    if (generateDto.type === InvoiceType.YEARLY && !generateDto.periodYear) {
      throw new BadRequestException('periodYear is required for yearly invoices');
    }

    // Set default periodYear if not provided
    const periodYear = generateDto.periodYear || new Date().getFullYear();

    return this.invoicesService.generateInvoiceFromFeeStructures(
      schoolId,
      generateDto.studentId,
      generateDto.academicYearId,
      generateDto.type,
      generateDto.periodMonth,
      generateDto.periodQuarter,
      periodYear,
      generateDto.issueDate ? new Date(generateDto.issueDate) : undefined,
      generateDto.dueDate ? new Date(generateDto.dueDate) : undefined,
    );
  }

  /**
   * ==========================================
   * POLYMORPHIC INVOICE ITEM ENDPOINTS
   * ==========================================
   * Add different types of charges to existing invoices
   */

  /**
   * Add transport fee to invoice
   * POST /invoices/:id/items/transport
   */
  @Post(':id/items/transport')
  async addTransportItem(
    @Param('id') id: string,
    @Body() addTransportDto: AddTransportItemDto,
    @Request() req: any,
  ) {
    const schoolId = req.user?.schoolId || req.school?.id;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.invoicesService.addTransportItemToInvoice(
      parseInt(id, 10),
      schoolId,
      addTransportDto.routePriceId,
      addTransportDto.description,
      addTransportDto.amount,
    );
  }

  /**
   * Add hostel fee to invoice
   * POST /invoices/:id/items/hostel
   */
  @Post(':id/items/hostel')
  async addHostelItem(
    @Param('id') id: string,
    @Body() addHostelDto: AddHostelItemDto,
    @Request() req: any,
  ) {
    const schoolId = req.user?.schoolId || req.school?.id;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.invoicesService.addHostelItemToInvoice(
      parseInt(id, 10),
      schoolId,
      addHostelDto.hostelPlanId,
      addHostelDto.description,
      addHostelDto.amount,
      addHostelDto.metadata,
    );
  }

  /**
   * Add fine to invoice
   * POST /invoices/:id/items/fine
   */
  @Post(':id/items/fine')
  async addFine(
    @Param('id') id: string,
    @Body() addFineDto: AddFineDto,
    @Request() req: any,
  ) {
    const schoolId = req.user?.schoolId || req.school?.id;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.invoicesService.addFineToInvoice(
      parseInt(id, 10),
      schoolId,
      addFineDto.fineId,
      addFineDto.description,
      addFineDto.amount,
      addFineDto.metadata,
    );
  }

  /**
   * Add miscellaneous charge to invoice
   * POST /invoices/:id/items/misc
   */
  @Post(':id/items/misc')
  async addMiscItem(
    @Param('id') id: string,
    @Body() addMiscDto: AddMiscItemDto,
    @Request() req: any,
  ) {
    const schoolId = req.user?.schoolId || req.school?.id;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.invoicesService.addMiscItemToInvoice(
      parseInt(id, 10),
      schoolId,
      addMiscDto.miscChargeId,
      addMiscDto.description,
      addMiscDto.amount,
      addMiscDto.metadata,
    );
  }
}

