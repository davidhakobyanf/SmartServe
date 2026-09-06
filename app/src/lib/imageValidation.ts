export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

const IMAGE_MIME_TYPES = new Set(IMAGE_ACCEPT.split(','));

export type ImageValidationError = 'invalidType' | 'tooLarge';

export function validateImageFile(file: Pick<File, 'size' | 'type'>) {
  if (!IMAGE_MIME_TYPES.has(file.type)) return 'invalidType';
  if (file.size > MAX_IMAGE_BYTES) return 'tooLarge';
  return null;
}
