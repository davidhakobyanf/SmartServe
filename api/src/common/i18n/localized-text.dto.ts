import { IsOptional, IsString, MaxLength } from "class-validator";

export class LocalizedNameDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  am?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ru?: string;
}

export class LocalizedTitleDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  am?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  ru?: string;
}

export class LocalizedDescriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  am?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ru?: string;
}
