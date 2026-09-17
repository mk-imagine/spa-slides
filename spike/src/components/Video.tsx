import { useEffect, useRef } from 'react';
import { defineInteractive, type LiveProps } from '../lib/interactive';

interface Props {
  src: string;
  poster: string;
  label: string;
}

function Live({ src, poster, label, active }: Props & LiveProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.play().catch((err: DOMException) => console.warn(`[spa-slides] video autoplay blocked: ${err.name}`));
    } else {
      video.pause();
    }
  }, [active]);

  return <video ref={ref} className="video" src={src} poster={poster} aria-label={label} controls muted playsInline preload="auto" />;
}

function Static({ poster, label }: Props) {
  return <img className="video" src={poster} alt={label} />;
}

export const Video = defineInteractive<Props>({
  name: 'video',
  requires: 'asset-folder',
  Live,
  Static,
});
