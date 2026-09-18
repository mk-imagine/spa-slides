// A deck with one deliberate failure per slide, so tests can check that the verifier
// reports each problem on the right slide and nowhere else.
import { useEffect } from 'react';
import { Cite, Deck, References, Screenshot, Slide, Step, TitleSlide, mountDeck, useStep } from '@mk-imagine/spa-slides';
import { AxisX, Line, Plot } from '@mk-imagine/spa-slides/chart';
import '@mk-imagine/spa-slides/styles.css';
import './fixture.css';
import grid from './images/grid.png?image';

function LogsAnError() {
  useEffect(() => console.error('fixture console error'), []);
  return null;
}

/** Shows the step it reads, and at step 2 adds rows that do not fit: overflow in one build state only. */
function GrowsAtStepTwo() {
  const step = useStep();
  return (
    <>
      <p data-testid="step">{step}</p>
      <Step at={1}>
        <p data-testid="from-step-one">Shown from step 1.</p>
      </Step>
      {step >= 2 && (
        <ul>
          {Array.from({ length: 16 }, (_, i) => (
            <li key={i}>Row {i + 1}, added at step 2</li>
          ))}
        </ul>
      )}
    </>
  );
}

mountDeck(
  <Deck meta={{ title: 'Verifier fixture' }}>
    {/* 1: clean, with notes for the speaker-view check */}
    <TitleSlide notes={['Opening notes for the verifier fixture deck.']}>
      <p data-testid="narrative">
        After <Cite id="saxe2019" narrative />.
      </p>
      <p data-testid="parenthetical">
        Two sources <Cite id={['saxe2019', 'rogers2004']} />.
      </p>
    </TitleSlide>

    {/* 2: clean. The cropped image extends past its frame on purpose; that is not overflow. */}
    <Slide title="Cropped screenshot" footer="Fixture footer · exploratory">
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

    {/* 6: an unbundled font, a citation key that does not exist, and a console error */}
    <Slide title="Noisy">
      <p className="system-font">Set in a font the deck does not bundle.</p>
      <p data-testid="missing">
        As shown by <Cite id="nonexistent2020" />.
      </p>
      <LogsAnError />
    </Slide>

    {/* 7: builds; overflows at step 2 only */}
    <Slide title="Builds" steps={2}>
      <GrowsAtStepTwo />
    </Slide>

    {/* 8: two line labels drawn on top of each other */}
    <Slide title="Colliding labels">
      <Plot width={1200} height={500} x={{ domain: [0, 10] }} y={{ domain: [0, 1] }} margin={{ right: 260 }} label="Two lines that end together">
        <AxisX label="Epoch" />
        <Line series={1} data={[[0, 0.2], [10, 0.9]]} label="first label" />
        <Line series={2} data={[[0, 0.4], [10, 0.9]]} label="second label" />
      </Plot>
    </Slide>

    {/* 9: lists a reference the deck never cites */}
    <Slide appendix title="Backup">
      <p>Nothing wrong here.</p>
      <References />
    </Slide>
  </Deck>,
);
