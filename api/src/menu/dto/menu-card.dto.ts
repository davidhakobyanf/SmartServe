import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { NumericField } from '../../common/decorators/numeric-field.decorator';

export class CreateMenuCardDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @NumericField()
  price!: number;

  @IsArray()
  @IsOptional()
  sauces?: string[];

  @IsOptional()
  image?: {
    name?: string;
    mimeType?: string;
    data?: string;
    hasData?: boolean;
  };

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateMenuCardDto extends CreateMenuCardDto {
  @IsString()
  id!: string;
}

export class DeleteMenuCardDto {
  @IsString()
  id!: string;
}
