export interface ImagePayload {
  name: string;
  mimeType: string;
  data: string;
}

export function fileToImagePayload(file: File): Promise<ImagePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image'));
        return;
      }
      const match = /^data:([^;]+);base64,(.+)$/.exec(result);
      if (!match) {
        reject(new Error('Invalid image data'));
        return;
      }
      resolve({
        name: file.name,
        mimeType: match[1],
        data: match[2],
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}
