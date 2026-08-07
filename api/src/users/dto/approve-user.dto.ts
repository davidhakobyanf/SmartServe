import { IsUUID } from "class-validator";

export class ApproveUserDto {
  @IsUUID()
  roleId!: string;
}
