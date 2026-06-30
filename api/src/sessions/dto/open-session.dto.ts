import { IsInt, Min } from "class-validator";

export class OpenSessionDto {
    @IsInt()
    @Min(1)
    table!:number;
}