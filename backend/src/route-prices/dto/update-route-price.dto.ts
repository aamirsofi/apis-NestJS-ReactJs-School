import { PartialType } from '@nestjs/swagger';
import { CreateRoutePriceDto } from './create-route-price.dto';

export class UpdateRoutePriceDto extends PartialType(CreateRoutePriceDto) {}

