import { Deck } from '@revealjs/react';
import RevealNotes from 'reveal.js/plugin/notes';
import 'reveal.js/reset.css';
import 'reveal.js/reveal.css';
import 'katex/dist/katex.min.css';
import './theme/tokens.css';
import './theme/base.css';
import { assertDeckMode } from './lib/deck-mode';
import { MathSlide } from './slides/MathSlide';
import { OverflowSlide } from './slides/OverflowSlide';
import { ReferencesSlide } from './slides/ReferencesSlide';
import { SimSlide } from './slides/SimSlide';
import { TitleSlide } from './slides/TitleSlide';
import { VideoSlide } from './slides/VideoSlide';

export function Presentation() {
  return (
    <Deck
      config={{
        width: 1920,
        height: 1080,
        margin: 0.04,
        hash: true,
        controls: true,
        progress: true,
        slideNumber: 'c/t',
        center: true,
        transition: 'slide',
        pdfSeparateFragments: false,
        pdfMaxPagesPerSlide: 1,
      }}
      plugins={[RevealNotes]}
      onReady={assertDeckMode}
    >
      <TitleSlide />
      <MathSlide />
      <VideoSlide />
      <SimSlide />
      <OverflowSlide />
      <ReferencesSlide />
    </Deck>
  );
}
