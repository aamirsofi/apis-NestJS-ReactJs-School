import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('trial-balance')
  async getTrialBalance(@Request() req: any, @Query('asOfDate') asOfDate?: string) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    const date = asOfDate ? new Date(asOfDate) : undefined;
    return this.reportsService.getTrialBalance(schoolId, date);
  }

  @Get('profit-loss')
  async getProfitAndLoss(
    @Request() req: any,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.reportsService.getProfitAndLoss(schoolId, new Date(fromDate), new Date(toDate));
  }

  @Get('balance-sheet')
  async getBalanceSheet(@Request() req: any, @Query('asOfDate') asOfDate: string) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.reportsService.getBalanceSheet(schoolId, new Date(asOfDate));
  }

  @Get('fee-collection')
  async getFeeCollectionSummary(
    @Request() req: any,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.reportsService.getFeeCollectionSummary(
      schoolId,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('outstanding-dues')
  async getStudentOutstandingDues(@Request() req: any) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.reportsService.getStudentOutstandingDues(schoolId);
  }
}

