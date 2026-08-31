import { ArrayUnique, IsArray, IsEnum } from "class-validator";
import { Permission } from "src/common/auth/permission";

export class UpdateUserPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissionAllow!: Permission[];

  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissionDeny!: Permission[];
}
