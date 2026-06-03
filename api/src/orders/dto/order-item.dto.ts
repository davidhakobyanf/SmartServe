import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { NumericField } from '../../common/decorators/numeric-field.decorator';

export class OrderItemImageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsOptional()
  hasData?: boolean;
}

/** Nested DTO so ValidationPipe whitelist keeps item fields in orders */
export class OrderItemDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @NumericField()
  price!: number;

  @IsArray()
  @IsOptional()
  sauces?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @NumericField()
  @IsOptional()
  count?: number;

  @ValidateNested()
  @Type(() => OrderItemImageDto)
  @IsOptional()
  image?: OrderItemImageDto;
}
