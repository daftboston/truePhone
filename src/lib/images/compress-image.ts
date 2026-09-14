/**
 * @file compress-image.ts
 * @description Client-side image compression for Server Action uploads.
 * @dependencies none (browser Canvas / createImageBitmap)
 */

/** Soft target so multipart overhead stays under Next’s Server Action body limit. */
const DEFAULT_MAX_BYTES = 900_000;
const DEFAULT_MAX_EDGE = 2000;
const JPEG_QUALITY_START = 0.82;
const JPEG_QUALITY_MIN = 0.45;

/**
 * compressImageForUpload
 *
 * Resizes and JPEG-compresses a photo so Server Action bodies stay under the
 * configured limit (phone camera files are often 2–8 MB).
 *
 * @param file - Original image from gallery or camera.
 * @param options.maxBytes - Soft max output size; defaults to ~900 KB.
 * @param options.maxEdge - Longest edge in pixels; defaults to 2000.
 * @returns Compressed JPEG File, or the original when already small / non-image.
 * @calledBy FileInput before assigning selected files to the form input
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxBytes?: number; maxEdge?: number },
): Promise<File> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;

  if (!file.type.startsWith("image/") || file.size <= maxBytes) {
    return file;
  }

  // Prefer createImageBitmap (handles EXIF orientation on modern browsers).
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = JPEG_QUALITY_START;
  let blob: Blob | null = await canvasToJpeg(canvas, quality);

  while (blob && blob.size > maxBytes && quality > JPEG_QUALITY_MIN) {
    quality = Math.max(JPEG_QUALITY_MIN, quality - 0.12);
    blob = await canvasToJpeg(canvas, quality);
  }

  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * canvasToJpeg
 *
 * Converts a canvas to a JPEG Blob at the given quality.
 *
 * @param canvas - Drawn image canvas.
 * @param quality - JPEG quality 0–1.
 * @returns JPEG blob or null when conversion fails.
 * @calledBy compressImageForUpload
 */
function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
  });
}
