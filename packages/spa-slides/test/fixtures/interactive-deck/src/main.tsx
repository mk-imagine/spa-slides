// A deck of interactive figures, each failing in one way at most, so tests can check that the
// verifier's two passes report each problem on the right slide and in the right version.
import { Deck, Figure, Interactive, Replay, Slide, TitleSlide, mountDeck, trace, useTimeline } from '@mk-imagine/spa-slides';
import { AxisX, Bar, Line, Marker, Playhead, Plot, Rule } from '@mk-imagine/spa-slides/chart';
import '@mk-imagine/spa-slides/styles.css';

const POINTS = Array.from({ length: 41 }, (_, i): [number, number] => [i, (i / 40) ** 2]);
const SERIES = trace(POINTS);

/** A playhead over a recorded series, on useTimeline directly: 0 on arrival, 10 at steps 1 and 2, 40 at step 3. */
function Glide() {
  const position = useTimeline([0, 10, 10, { at: 40, duration: 1200 }], { duration: 600 });
  return (
    <Figure label={`Live, at ${position.toFixed(2)}`}>
      <span data-testid="position" hidden>
        {position}
      </span>
      <Plot width={900} height={360} x={{ domain: [0, 40] }} y={{ domain: [0, 1] }} label="A series drawn up to the playhead">
        <AxisX label="Trial" />
        <Line series={1} data={SERIES.at(position)} />
        <Rule x={position} />
      </Plot>
    </Figure>
  );
}

function Still({ label = 'The still' }: { label?: string }) {
  return (
    <Figure label={label}>
      <Plot width={900} height={360} x={{ domain: [0, 40] }} y={{ domain: [0, 1] }} label="The whole series">
        <AxisX label="Trial" />
        <Line series={1} data={SERIES.at(40)} />
      </Plot>
    </Figure>
  );
}

function Throws(): never {
  throw new Error('fixture: the live version fails');
}

mountDeck(
  <Deck meta={{ title: 'Interactive fixture' }}>
    {/* 1: notes, so the speaker view has something to open on */}
    <TitleSlide notes={['Opening notes for the interactive fixture.']} />

    {/* 2: clean. The text is shared, so it cannot drift; the figure differs between versions. */}
    <Slide title="Playhead" steps={3}>
      <p>The text both versions share.</p>
      <Interactive still={<Still />}>
        <Glide />
      </Interactive>
    </Slide>

    {/* 3: text inside the switch that says different things in the two versions */}
    <Slide title="Drifted">
      <Interactive
        still={
          <>
            <p>The still claims one thing.</p>
            <Still />
          </>
        }
      >
        <p>The live version claims another.</p>
        <Still label="The live one" />
      </Interactive>
    </Slide>

    {/* 4: the live version throws, so it shows its still */}
    <Slide title="Throws">
      <Interactive still={<Still />}>
        <Throws />
      </Interactive>
    </Slide>

    {/* 5: the live version overflows; the still fits */}
    <Slide title="Overflows live">
      <Interactive still={<Still />}>
        <Figure label="Too tall">
          <Plot width={900} height={1400} x={{ domain: [0, 40] }} y={{ domain: [0, 1] }} label="A chart taller than the slide">
            <AxisX label="Trial" />
          </Plot>
        </Figure>
      </Interactive>
    </Slide>

    {/* 6: nothing interactive, for pressing the key where there is nothing to switch */}
    <Slide title="Plain">
      <p>Nothing to switch here.</p>
    </Slide>

    {/* 7: the common case: a replay that waits for its click, then fills in; its still is the chart whole */}
    <Slide title="Replay" steps={1}>
      <Replay to={40} duration={400}>
        {(x) => (
          <Plot width={900} height={360} x={{ domain: [0, 40] }} y={{ domain: [0, 1] }} reveal={x} label="A series that fills in">
            <AxisX label="Trial" />
            <Line series={1} data={POINTS} />
            <Marker x={30} y={POINTS[30]![1]} label="reached at 30" />
            <Playhead />
          </Plot>
        )}
      </Replay>
    </Slide>

    {/* 8: bars that answer a hover with their names, values and ranges */}
    <Slide title="Bars">
      <Plot width={900} height={360} x={{ domain: [0, 10] }} y={{ domain: [2, 0] }} label="Two named bars">
        <AxisX label="Value" />
        <Bar at={0.5} value={6} range={[5, 7]} thickness={60} series={1} name="first" />
        <Bar at={1.5} value={3} thickness={60} series={2} name="second" />
      </Plot>
    </Slide>
  </Deck>,
);
