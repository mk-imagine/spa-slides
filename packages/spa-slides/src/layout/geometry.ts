import type { ImageAsset } from '../assets.js';

/** Source pixels trimmed from each edge of an image. */
export interface Crop {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

export interface CropGeometry {
  /** Width / height of the visible region. */
  aspectRatio: number;
  /** The whole image's width and offsets, as percentages of the visible region. */
  imageWidthPct: number;
  leftPct: number;
  topPct: number;
}

export function cropGeometry(image: ImageAsset, crop: Crop = {}): CropGeometry {
  const { left = 0, top = 0, right = 0, bottom = 0 } = crop;
  if ([left, top, right, bottom].some((v) => v < 0)) {
    throw new Error(`[spa-slides] crop values must be >= 0 for ${image.src}`);
  }
  const width = image.width - left - right;
  const height = image.height - top - bottom;
  if (width <= 0 || height <= 0) {
    throw new Error(
      `[spa-slides] crop ${JSON.stringify(crop)} leaves nothing of a ${image.width}×${image.height} image (${image.src})`,
    );
  }
  return {
    aspectRatio: width / height,
    imageWidthPct: (image.width / width) * 100,
    leftPct: (-left / width) * 100,
    topPct: (-top / height) * 100,
  };
}
