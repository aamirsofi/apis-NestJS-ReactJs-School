import { PartialType } from '@nestjs/mapped-types';
import { CreateFeeInvoiceDto } from './create-fee-invoice.dto';

export class UpdateFeeInvoiceDto extends PartialType(CreateFeeInvoiceDto) {}

