// Every chart primitive on real slides, so the verifier and a human can both check how they render.
import { Deck, Slide, mountDeck } from '@mk-imagine/spa-slides';
import { AxisX, AxisY, Bar, Legend, Line, Marker, Plot, Rule, Span } from '@mk-imagine/spa-slides/chart';
import '@mk-imagine/spa-slides/styles.css';

const curve = (k: number, shift: number) =>
  Array.from({ length: 41 }, (_, i): [number, number | null] => [i * 5, 1 / (1 + Math.exp(-k * (i * 5 - shift)))]);

mountDeck(
  <Deck meta={{ title: 'Chart gallery' }}>
    <Slide title="Lines, a rule, a span and a marker">
      <Plot width={1500} height={640} x={{ domain: [0, 200] }} y={{ domain: [0, 1] }} margin={{ right: 200 }} label="Three S-shaped curves">
        <AxisY label="Strength" grid tickValues={[0, 0.5, 1]} />
        <AxisX label="Trials since arrival" />
        <Span x0={110} x1={160} label="run of 50" />
        <Rule y={0.3} label="criterion 0.3" />
        <Line series={1} data={curve(0.08, 50)} label="control" labelOffset={[0, -18]} />
        <Line series={2} data={curve(0.05, 90)} label="specific first" labelOffset={[0, 18]} />
        <Line series={3} dashed data={curve(0.05, 130).map(([x, y]) => [x, x > 170 ? null : y])} label="theory" />
        <Marker x={60} y={0.3} series={2} label="38" labelPosition="below" />
      </Plot>
      <Legend
        items={[
          { label: 'control', series: 1 },
          { label: 'specific first', series: 2 },
          { label: 'theory', series: 3, dashed: true },
        ]}
      />
    </Slide>

    <Slide title="Bars with ranges">
      <Plot width={1500} height={420} x={{ domain: [0, 700] }} y={{ domain: [0.5, 3.5] }} margin={{ left: 320 }} label="Trials to criterion by condition">
        <AxisX label="Trials" tickValues={[0, 100, 200, 300, 400, 500, 600, 700]} grid />
        <AxisY tickValues={[1, 2, 3]} format={(v) => ['', 'one of each first', 'specific first', 'control'][v] ?? ''} />
        <Bar at={3} value={443} range={[412, 450]} series={1} label="443" />
        <Bar at={2} value={11} range={[7, 14]} series={2} label="11" />
        <Bar at={1} value={47} range={[47, 48]} series={3} label="47" />
      </Plot>
      <Plot width={1500} height={300} x={{ domain: [0.5, 100], type: 'log' }} y={{ domain: [0, 2] }} margin={{ left: 320 }} label="Observed over predicted time">
        <AxisX label="Observed ÷ predicted (log scale)" tickValues={[1, 10, 100]} format={(v) => `${v}×`} grid />
        <Marker x={1} y={1} series={1} label="control" />
        <Marker x={12} y={1} series={2} label="specific first" />
        <Marker x={4} y={1} series={3} label="one of each first" labelPosition="below" />
      </Plot>
    </Slide>
  </Deck>,
);
