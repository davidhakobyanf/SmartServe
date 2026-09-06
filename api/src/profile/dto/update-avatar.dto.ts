import { Type } from "class-transformer";
import { IsDefined, ValidateNested } from "class-validator";
import { ImageUploadDto } from "src/common/dto/image-upload.dto";

export class UpdateAvatarDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => ImageUploadDto)
  image!: ImageUploadDto;
}
