import {
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsArray,
  ArrayUnique,
  IsEnum,
} from "class-validator";
import { Permission } from "src/common/auth/permission";

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

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
