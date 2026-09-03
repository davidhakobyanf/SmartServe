import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class UpdateVenueSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  venueName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  timezone?: string;
}
