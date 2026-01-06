import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('journal-entries')
  async createJournalEntry(@Body() createDto: CreateJournalEntryDto, @Request() req: any) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.accountingService.createJournalEntry(schoolId, createDto, req.user?.id);
  }

  @Post('journal-entries/:id/post')
  async postJournalEntry(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.accountingService.postJournalEntry(parseInt(id, 10), req.user?.id);
  }

  @Post('journal-entries/:id/reverse')
  async reverseJournalEntry(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.accountingService.reverseJournalEntry(parseInt(id, 10), req.user?.id, body.reason);
  }

}

