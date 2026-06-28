export function isSupportedImageDataUri(value: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp);base64,/.test(value);
}

export function isProbablyTooLargeDataUri(value: string): boolean {
  // Keep request payloads demo-safe. Roughly > 7MB base64 string.
  return value.length > 7_000_000;
}
