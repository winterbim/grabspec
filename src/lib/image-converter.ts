/**
 * Client-side image format converter using Canvas API.
 * Converts between JPG, PNG, WEBP, BMP, GIF, TIFF, SVG — runs entirely in the browser.
 * Cloned from DocForge's image-converter engine, adapted for React.
 */

export type ImageOutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

const FORMAT_EXT: Record<ImageOutputFormat, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const FORMAT_LABELS: Record<ImageOutputFormat, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
};

export interface ImageConversionResult {
  blob: Blob;
  filename: string;
  size: number;
  format: ImageOutputFormat;
  duration: number;
}

/** All image extensions we can handle client-side */
const SUPPORTED_IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff', '.tif', '.svg',
  '.ico', '.avif',
]);

/**
 * Detect if a file is a supported image format.
 */
export function isImageFile(file: File): boolean {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return SUPPORTED_IMAGE_EXTS.has(ext);
}

/**
 * Get available output formats for a given image input.
 * Excludes the input format itself.
 */
export function getImageOutputFormats(file: File): ImageOutputFormat[] {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const all: ImageOutputFormat[] = ['image/jpeg', 'image/png', 'image/webp'];

  const inputMime: Record<string, ImageOutputFormat> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };

  const currentMime = inputMime[ext];
  if (currentMime) {
    return all.filter((f) => f !== currentMime);
  }
  // BMP, GIF, TIFF, SVG → can convert to all three
  return all;
}

/**
 * Load an image from a file. Handles SVG specially via text/xml blob.
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  const isSvg = file.name.toLowerCase().endsWith('.svg');

  let url: string;
  if (isSvg) {
    // SVG: read as text, create a proper blob URL with SVG mime type
    const text = await file.text();
    const svgBlob = new Blob([text], { type: 'image/svg+xml' });
    url = URL.createObjectURL(svgBlob);
  } else {
    url = URL.createObjectURL(file);
  }

  const img = new Image();
  // Allow cross-origin for SVG rendering
  if (isSvg) img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
  URL.revokeObjectURL(url);

  return img;
}

/**
 * Convert an image file to the target format using Canvas API.
 * Supports: JPG, JPEG, PNG, WEBP, BMP, GIF, TIFF, TIF, SVG → JPG/PNG/WEBP.
 * Runs 100% client-side — no server round-trip needed.
 */
export async function convertImageClientSide(
  file: File,
  outputFormat: ImageOutputFormat,
  quality = 0.92,
): Promise<ImageConversionResult> {
  const startTime = performance.now();

  const img = await loadImage(file);

  // For SVG without intrinsic dimensions, use sensible defaults
  const width = img.naturalWidth || 1024;
  const height = img.naturalHeight || 1024;

  // Draw onto canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // White background for JPEG (no transparency)
  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  // Export to blob
  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image conversion failed'))),
      outputFormat,
      quality,
    );
  });

  const ext = FORMAT_EXT[outputFormat];
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const filename = `${baseName}${ext}`;

  return {
    blob: outputBlob,
    filename,
    size: outputBlob.size,
    format: outputFormat,
    duration: performance.now() - startTime,
  };
}

export { FORMAT_EXT, FORMAT_LABELS };
