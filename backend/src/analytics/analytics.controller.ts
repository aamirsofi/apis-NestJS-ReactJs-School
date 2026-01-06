import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(
    @Request() req: any,
    @Query('schoolId') querySchoolId?: number,
  ) {
    // Priority: JWT schoolId > query param > subdomain middleware
    const schoolId = req.user?.schoolId || querySchoolId || req.school?.id;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.analyticsService.getOverview(schoolId);
  }

  @Get('revenue')
  async getRevenueAnalytics(
    @Request() req: any,
    @Query('schoolId') querySchoolId?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    // Priority: JWT schoolId > query param > subdomain middleware
    const schoolId = req.user?.schoolId || querySchoolId || req.school?.id;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.analyticsService.getRevenueAnalytics(
      schoolId,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('school-performance')
  async getSchoolPerformance(@Request() req: any) {
    // This endpoint is for super-admin to see all schools
    return this.analyticsService.getSchoolPerformance();
  }
}

