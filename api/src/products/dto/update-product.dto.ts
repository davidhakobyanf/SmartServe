import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ProductImageDto } from "./product-image.dto";
import {
  LocalizedDescriptionDto,
  LocalizedTitleDto,
} from "../../common/i18n/localized-text.dto";

export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTitleDto)
  titleTranslations?: LocalizedTitleDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number | null;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  sauceIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductImageDto)
  image?: ProductImageDto;
}
