import { readFileSync } from 'fs';
import path from 'path';

export function isSupportedImageDataUri(value: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp);base64,/.test(value);
}

export function isProbablyTooLargeDataUri(value: string): boolean {
  // Keep request payloads demo-safe. Roughly > 7MB base64 string.
  return value.length > 7_000_000;
}

export function inferMimeTypeFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

export function filePathToDataUri(filePath: string) {
  const mimeType = inferMimeTypeFromPath(filePath);
  const base64 = readFileSync(filePath).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}
