// A deck with one deliberate failure per slide, so tests can check that the verifier
// reports each problem on the right slide and nowhere else.
import { useEffect } from 'react';
import { Deck, Screenshot, Slide, TitleSlide, mountDeck } from '@mk-imagine/spa-slides';
import '@mk-imagine/spa-slides/styles.css';
import './fixture.css';
import grid from './images/grid.png?image';

function LogsAnError() {
  useEffect(() => console.error('fixture console error'), []);
  return null;
}

mountDeck(
  <Deck meta={{ title: 'Verifier fixture' }}>
    {/* 1: clean, with notes for the speaker-view check */}
    <TitleSlide notes={['Opening notes for the verifier fixture deck.']} />

    {/* 2: clean. The cropped image extends past its frame on purpose; that is not overflow. */}
    <Slide title="Cropped screenshot">
      <Screenshot image={grid} alt="A grid of numbered colored cells" crop={{ left: 100, top: 100, right: 200, bottom: 100 }} />
    </Slide>

    {/* 3: overflow */}
    <Slide title="Too much">
      <ul>
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i}>Point {i + 1}, which pushes the list past the bottom of the slide</li>
        ))}
      </ul>
    </Slide>

    {/* 4: placeholder */}
    <Slide title="Not captured yet">
      <Screenshot placeholder="Settings page, Organizations tab" />
    </Slide>

    {/* 5: broken image */}
    <Slide title="Broken image">
      <img src="./does-not-exist.png" alt="" />
    </Slide>

    {/* 6: an unbundled font and a console error */}
    <Slide title="Noisy">
      <p className="system-font">Set in a font the deck does not bundle.</p>
      <LogsAnError />
    </Slide>

    {/* 7: clean appendix slide */}
    <Slide appendix title="Backup">
      <p>Nothing wrong here.</p>
    </Slide>
  </Deck>,
);
