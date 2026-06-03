import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { NumericField } from '../../common/decorators/numeric-field.decorator';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @NumericField()
  allPrice!: number;

  @IsString()
  table!: string;
}

export class DeleteOrderDto {
  @IsString()
  id!: string;
}
