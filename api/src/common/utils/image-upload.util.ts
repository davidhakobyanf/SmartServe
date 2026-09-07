import { BadRequestException } from "@nestjs/common";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface ImageUploadInput {
  name?: string;
  mimeType?: string;
  data?: string;
}

export function imageReplacement(
  image: ImageUploadInput | undefined,
  removeImage: boolean | undefined,
  fallbackName: string,
) {
  if (removeImage) return { imageName: null, imageMimeType: null, imageData: null };
  return image?.data ? decodeImage(image, fallbackName) : {};
}

export interface DecodedImage {
  imageName: string;
  imageMimeType: string;
  imageData: Buffer;
}

export function decodeImage(
  image: ImageUploadInput,
  fallbackName: string,
): DecodedImage {
  const mimeType = image.mimeType?.trim() || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    throw new BadRequestException("Invalid image type");
  }

  const base64 = image.data?.replace(/\s/g, "") ?? "";
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new BadRequestException("Invalid image data");
  }

  const imageData = Buffer.from(base64, "base64");
  if (imageData.length === 0 || imageData.length > MAX_IMAGE_BYTES) {
    throw new BadRequestException("Image must be smaller than 5 MB");
  }

  return {
    imageName: image.name?.trim() || fallbackName,
    imageMimeType: mimeType,
    imageData,
  };
}
