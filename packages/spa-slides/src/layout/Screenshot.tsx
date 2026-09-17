import type { ImageAsset } from '../assets.js';
import { SLIDE_HEIGHT } from '../core/size.js';
import { cropGeometry, type Crop } from './geometry.js';

export type { Crop } from './geometry.js';

interface Sizing {
  /** Maximum width as a fraction of the available width. Default 0.86. */
  width?: number;
  /** Maximum height as a fraction of the slide height. Default 0.4. */
  maxHeight?: number;
}

interface ImageScreenshot extends Sizing {
  image: ImageAsset;
  /** Describes what the screenshot shows. Required: it is the only description a screen reader gets. */
  alt: string;
  crop?: Crop;
  placeholder?: never;
}

interface PlaceholderScreenshot extends Sizing {
  /** What still needs capturing. Renders a labeled box, and the verifier fails the deck until it is replaced. */
  placeholder: string;
  image?: never;
  alt?: never;
  crop?: never;
}

export type ScreenshotProps = ImageScreenshot | PlaceholderScreenshot;

const DEFAULT_WIDTH = 0.86;
const DEFAULT_MAX_HEIGHT = 0.4;
const PLACEHOLDER_ASPECT = 16 / 9;

export function Screenshot(props: ScreenshotProps) {
  const { width = DEFAULT_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT } = props;
  const maxHeightPx = maxHeight * SLIDE_HEIGHT;

  if (props.placeholder !== undefined) {
    return (
      <div
        className="sps-shot sps-shot--placeholder"
        data-placeholder={props.placeholder}
        style={{ width: `min(${width * 100}%, ${maxHeightPx * PLACEHOLDER_ASPECT}px)`, aspectRatio: PLACEHOLDER_ASPECT }}
      >
        <span>[ screenshot ] {props.placeholder}</span>
      </div>
    );
  }

  const geometry = cropGeometry(props.image, props.crop);
  return (
    <div
      className="sps-shot"
      role="img"
      aria-label={props.alt}
      // Fit inside both limits while keeping the cropped region's aspect ratio.
      style={{ width: `min(${width * 100}%, ${maxHeightPx * geometry.aspectRatio}px)`, aspectRatio: geometry.aspectRatio }}
    >
      <img
        src={props.image.src}
        alt=""
        draggable={false}
        style={{ width: `${geometry.imageWidthPct}%`, left: `${geometry.leftPct}%`, top: `${geometry.topPct}%` }}
      />
    </div>
  );
}
