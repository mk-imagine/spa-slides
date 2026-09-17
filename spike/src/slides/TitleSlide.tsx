import { Slide } from '../lib/Slide';

export function TitleSlide() {
  return (
    <Slide notes="Opening slide. Static content only.">
      <p className="eyebrow">spa-slides · spike</p>
      <h1 className="deck-title">Interactive slides on reveal.js 6 and React</h1>
      <p className="lede">
        A throwaway deck that tests the unknowns: simulation lifecycle, keyboard focus, pointer scaling, the speaker view,
        PDF export, and a single-file build.
      </p>
    </Slide>
  );
}
