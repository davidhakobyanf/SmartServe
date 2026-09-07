import { NotFoundException } from "@nestjs/common";
import type { Response } from "express";

export interface ImageContent {
  buffer: Buffer;
  mimeType: string;
}

export function storedImageContent(
  data: Buffer | null | undefined,
  mimeType: string | null | undefined,
  notFoundMessage: string,
): ImageContent {
  if (!data) throw new NotFoundException(notFoundMessage);
  return { buffer: data, mimeType: mimeType || "image/jpeg" };
}

export function sendImage(response: Response, image: ImageContent): void {
  response.setHeader("Content-Type", image.mimeType);
  response.setHeader("Cache-Control", "public, max-age=86400");
  response.send(image.buffer);
}
