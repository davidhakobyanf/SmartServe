import { IsOptional, IsString } from 'class-validator';
import type { MenuCard } from '../../common/types/menu-card';
import { NumericField } from '../../common/decorators/numeric-field.decorator';

export class AddBasketItemDto implements Partial<MenuCard> {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @NumericField()
  price!: number;

  @IsOptional()
  sauces?: string[];

  @IsOptional()
  image?: Record<string, unknown>;

  @IsOptional()
  active?: boolean;
   
  @IsOptional()
  @IsString()
  table?: string;

  @NumericField()
  count!: number;
}

export class DeleteBasketItemDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  table?: string;
}

export class DeleteAllBasketDto {
  @IsString()
  table!: string;
}
