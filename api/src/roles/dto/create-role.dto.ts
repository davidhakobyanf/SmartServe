import {
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsArray,
  ArrayUnique,
  IsEnum,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Permission } from "src/common/auth/permission";
import { LocalizedNameDto } from "src/common/i18n/localized-text.dto";

export class CreateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      "code must start with a lowercase letter and contain only lowercase letters, numbers, and underscores",
  })
  code!: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions!: Permission[];
}
