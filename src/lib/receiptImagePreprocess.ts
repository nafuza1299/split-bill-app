export function grayscaleAndContrast(pixels: Uint8ClampedArray): void {
  const grays = new Uint8ClampedArray(pixels.length / 4);
  let min = 255;
  let max = 0;

  for (let i = 0; i < grays.length; i++) {
    const o = i * 4;
    const gray = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2];
    grays[i] = gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }

  const range = max - min;
  if (range === 0) return;

  for (let i = 0; i < grays.length; i++) {
    const stretched = ((grays[i] - min) / range) * 255;
    const o = i * 4;
    pixels[o] = stretched;
    pixels[o + 1] = stretched;
    pixels[o + 2] = stretched;
  }
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_BOUNDS_RATIO = 0.05;
const MAX_BOUNDS_RATIO = 0.9;
const PADDING_RATIO = 0.05;

// ponytail: brightness-only, largest-connected-component bounding box —
// assumes the receipt is the brightest contiguous thing in frame (true for
// paper on a darker surface), classifies pixels above the global mean luma
// as "bright", then flood-fills to find the single largest bright blob and
// returns its bbox. Taking the largest component (not just the overall
// bright-pixel bbox) specifically handles a stray bright object elsewhere in
// frame — e.g. a napkin corner — which would otherwise stretch a naive bbox
// across the gap between it and the receipt. Still no true contour/edge
// detection, so an oddly-shaped or broken-up bright region can still throw
// this off; every OCR'd row stays user-editable regardless.
export function findReceiptBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): CropRect | null {
  const pixelCount = width * height;
  const luma = new Float64Array(pixelCount);
  let sum = 0;

  for (let i = 0; i < pixelCount; i++) {
    const o = i * 4;
    const gray = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2];
    luma[i] = gray;
    sum += gray;
  }

  const mean = sum / pixelCount;
  const bright = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) bright[i] = luma[i] > mean ? 1 : 0;

  const visited = new Uint8Array(pixelCount);
  const stack = new Int32Array(pixelCount);
  let bestSize = 0;
  let bestMinX = 0;
  let bestMaxX = -1;
  let bestMinY = 0;
  let bestMaxY = 0;

  for (let start = 0; start < pixelCount; start++) {
    if (!bright[start] || visited[start]) continue;

    let sp = 0;
    stack[sp++] = start;
    visited[start] = 1;
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    let size = 0;

    while (sp > 0) {
      const idx = stack[--sp];
      const x = idx % width;
      const y = (idx / width) | 0;
      size++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      if (x > 0 && bright[idx - 1] && !visited[idx - 1]) {
        visited[idx - 1] = 1;
        stack[sp++] = idx - 1;
      }
      if (x < width - 1 && bright[idx + 1] && !visited[idx + 1]) {
        visited[idx + 1] = 1;
        stack[sp++] = idx + 1;
      }
      if (y > 0 && bright[idx - width] && !visited[idx - width]) {
        visited[idx - width] = 1;
        stack[sp++] = idx - width;
      }
      if (y < height - 1 && bright[idx + width] && !visited[idx + width]) {
        visited[idx + width] = 1;
        stack[sp++] = idx + width;
      }
    }

    if (size > bestSize) {
      bestSize = size;
      bestMinX = minX;
      bestMaxX = maxX;
      bestMinY = minY;
      bestMaxY = maxY;
    }
  }

  if (bestMaxX < 0) return null;

  const boxWidth = bestMaxX - bestMinX + 1;
  const boxHeight = bestMaxY - bestMinY + 1;
  const boxRatio = (boxWidth * boxHeight) / pixelCount;
  if (boxRatio < MIN_BOUNDS_RATIO || boxRatio > MAX_BOUNDS_RATIO) return null;

  const padX = Math.round(boxWidth * PADDING_RATIO);
  const padY = Math.round(boxHeight * PADDING_RATIO);
  const x = Math.max(0, bestMinX - padX);
  const y = Math.max(0, bestMinY - padY);
  const right = Math.min(width, bestMaxX + 1 + padX);
  const bottom = Math.min(height, bestMaxY + 1 + padY);

  return { x, y, width: right - x, height: bottom - y };
}

// ponytail: fixed global threshold, not adaptive/per-region — reliable here
// specifically because it runs after grayscaleAndContrast (which already
// stretches the crop's own range to fill 0-255) and after cropping removes
// the dominant dark background. Uneven lighting within the crop itself could
// still push text to the wrong side; upgrade to per-tile thresholding only
// if real photos show that happening.
export function binarize(pixels: Uint8ClampedArray, threshold = 128): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const value = pixels[i] >= threshold ? 255 : 0;
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }
}
