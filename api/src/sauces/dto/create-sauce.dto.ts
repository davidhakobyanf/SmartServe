import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { LocalizedNameDto } from "../../common/i18n/localized-text.dto";
import { ImageUploadDto } from "../../common/dto/image-upload.dto";

export class CreateSauceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageUploadDto)
  image?: ImageUploadDto;
}
