import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class ImageUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsBoolean()
  hasData?: boolean;
}
