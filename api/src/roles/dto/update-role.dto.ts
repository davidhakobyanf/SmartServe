import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Permission } from "src/common/auth/permission";

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];
}
