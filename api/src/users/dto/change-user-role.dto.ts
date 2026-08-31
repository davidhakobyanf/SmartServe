import { IsUUID } from "class-validator";

export class ChangeUserRoleDto {
  @IsUUID()
  roleId!: string;
}
