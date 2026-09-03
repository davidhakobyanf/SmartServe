import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class UpdateBasketItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  sauceIds?: string[];
}
