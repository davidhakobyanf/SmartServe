import { IsEmail, IsString, MinLength } from "class-validator";


export class SetupDto {
    @IsString()
    name!: string;

    @IsString()
    surname!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;
}