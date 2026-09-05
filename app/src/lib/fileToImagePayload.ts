export interface ImagePayload {
  name: string;
  mimeType: string;
  data: string;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export async function fileToImagePayload(file: File): Promise<ImagePayload> {
  const dataUrl = await fileToDataUrl(file);
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid image data');
  }
  return {
    name: file.name,
    mimeType: match[1],
    data: match[2],
  };
}
