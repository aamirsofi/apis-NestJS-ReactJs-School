import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountingService } from './accounting.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting/accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly accountingService: AccountingService,
  ) {}

  @Post()
  async create(@Body() createAccountDto: CreateAccountDto, @Request() req: any) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.accountsService.create(schoolId, createAccountDto);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    // For super_admin, allow querying by schoolId parameter or use school context
    // For regular users, use their schoolId
    let targetSchoolId: number | undefined;
    
    if (req.user?.role === 'super_admin') {
      // Super admin can query by schoolId parameter or use school context
      if (schoolId) {
        targetSchoolId = parseInt(schoolId, 10);
        if (isNaN(targetSchoolId)) {
          throw new BadRequestException(`Invalid school ID parameter: ${schoolId}`);
        }
      } else if (req.school?.id) {
        targetSchoolId = req.school.id;
      } else {
        throw new BadRequestException('School ID is required for super admin. Provide ?schoolId= parameter.');
      }
    } else {
      // Regular users use their assigned schoolId
      targetSchoolId = req.user?.schoolId || req.school?.id;
      if (!targetSchoolId) {
        throw new BadRequestException('School ID not found in request');
      }
    }

    // TypeScript guard - we've already validated above, but TypeScript needs this
    if (!targetSchoolId) {
      throw new BadRequestException('School ID is required');
    }

    try {
      return await this.accountsService.findAll(targetSchoolId, type, includeInactive === 'true');
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(`Failed to fetch accounts: ${err.message}`);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.accountsService.findOne(parseInt(id, 10), schoolId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req: any,
  ) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    return this.accountsService.update(parseInt(id, 10), schoolId, updateAccountDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new BadRequestException('School ID not found in request');
    }

    await this.accountsService.remove(parseInt(id, 10), schoolId);
    return { message: 'Account deleted successfully' };
  }

  @Post('initialize')
  async initializeDefaultAccounts(
    @Request() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    // For super_admin, require schoolId parameter
    // For regular users, use their schoolId
    let targetSchoolId: number | undefined;
    
    if (req.user?.role === 'super_admin') {
      if (schoolId) {
        targetSchoolId = parseInt(schoolId, 10);
        if (isNaN(targetSchoolId)) {
          throw new BadRequestException(`Invalid school ID parameter: ${schoolId}`);
        }
      } else if (req.school?.id) {
        targetSchoolId = req.school.id;
      } else {
        throw new BadRequestException('School ID is required for super admin. Provide ?schoolId= parameter.');
      }
    } else {
      targetSchoolId = req.user?.schoolId || req.school?.id;
      if (!targetSchoolId) {
        throw new BadRequestException('School ID not found in request');
      }
    }

    // TypeScript guard - we've already validated above, but TypeScript needs this
    if (!targetSchoolId) {
      throw new BadRequestException('School ID is required');
    }

    try {
      return await this.accountsService.initializeDefaultAccounts(targetSchoolId);
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(`Failed to initialize accounts: ${err.message}`);
    }
  }

  @Get(':id/balance')
  async getAccountBalance(@Param('id') id: string, @Query('asOfDate') asOfDate?: string) {
    const date = asOfDate ? new Date(asOfDate) : undefined;
    return this.accountingService.getAccountBalance(parseInt(id, 10), date);
  }

  @Get(':id/ledger')
  async getAccountLedger(
    @Param('id') id: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;
    return this.accountingService.getAccountLedger(parseInt(id, 10), from, to);
  }
}
