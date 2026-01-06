import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':id')
  async getReceipt(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.receiptsService.getReceiptData(parseInt(id, 10), schoolId);
  }
}

