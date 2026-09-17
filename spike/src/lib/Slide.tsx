import { Slide as RevealSlide, type SlideProps } from '@revealjs/react';

/** Reveal's <Slide> plus an inner frame that carries slide padding in both live and print views. */
export function Slide({ children, ...props }: SlideProps) {
  return (
    <RevealSlide {...props}>
      <div className="slide-frame">{children}</div>
    </RevealSlide>
  );
}
