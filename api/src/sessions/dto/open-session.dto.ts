import { IsUUID } from "class-validator";

export class OpenSessionDto {
  @IsUUID()
  tableToken!: string;
}
