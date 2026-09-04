import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { LocalizedNameDto } from "../../common/i18n/localized-text.dto";

export class CreateTableDto {
  @IsInt()
  @Min(1)
  number!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
