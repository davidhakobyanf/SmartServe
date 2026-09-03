import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateSauceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}