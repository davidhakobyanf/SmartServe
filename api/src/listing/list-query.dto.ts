import { Type, Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class ListQueryDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  page = 1;

  @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize = 24;

  @IsOptional() @IsString() @MaxLength(200)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  search?: string;

  @IsOptional() @IsIn(['default', 'newest', 'oldest', 'price-asc', 'price-desc', 'name'])
  sort?: string;

  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() sauceId?: string;
  @IsOptional() @IsUUID() id?: string;
  @IsOptional() @IsIn(['true', 'false']) isActive?: string;
  @IsOptional() @IsIn(['all', 'active', 'history', 'placed', 'preparing', 'ready', 'completed', 'cancelled', 'pending', 'rejected', 'disabled', 'open', 'available', 'inactive'])
  status?: string;
}
