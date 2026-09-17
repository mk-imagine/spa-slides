import { useCallback, useEffect, useRef, useState } from 'react';
import { defineInteractive, type LiveProps } from '../../lib/interactive';
import { localPoint } from '../../lib/pointer';
import { drawScene, prepareCanvas, readPalette, toDomain } from './draw';
import { INITIAL_MODEL, makeData, step, train, type Model, type Point } from './model';
import { LossSpark } from './LossSpark';
import './LogisticSim.css';

const SIZE = 760;
const HISTORY = 400;
const STATIC_STEPS = 200;
const STATIC_LR = 0.5;

interface Props {
  seed?: number;
}

function metrics() {
  window.__spikeMetrics ??= { simTicks: 0, pointerLog: [] };
  return window.__spikeMetrics;
}

function Live({ seed = 7, active }: Props & LiveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const data = useRef<Point[]>(makeData(seed));
  const model = useRef<Model>(INITIAL_MODEL);
  const losses = useRef<number[]>([]);
  const steps = useRef(0);
  const lr = useRef(0.5);

  const [logLr, setLogLr] = useState(Math.log10(lr.current));
  const [running, setRunning] = useState(true);
  const [addLabel, setAddLabel] = useState<0 | 1>(1);
  const [readout, setReadout] = useState({ steps: 0, loss: Number.NaN, losses: [] as number[] });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScene(prepareCanvas(canvas, SIZE), SIZE, data.current, model.current, readPalette(canvas));
  }, []);

  const advance = useCallback(() => {
    const result = step(model.current, data.current, lr.current);
    model.current = result.model;
    losses.current.push(result.loss);
    if (losses.current.length > HISTORY) losses.current.shift();
    steps.current += 1;
  }, []);

  const publish = useCallback(() => {
    setReadout({ steps: steps.current, loss: losses.current.at(-1) ?? Number.NaN, losses: [...losses.current] });
  }, []);

  useEffect(redraw, [redraw]);

  useEffect(() => {
    if (!active || !running) return;
    let frame = 0;
    let tick = 0;
    const loop = () => {
      advance();
      redraw();
      metrics().simTicks += 1;
      if (++tick % 4 === 0) publish();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      publish();
    };
  }, [active, running, advance, redraw, publish]);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const { x, y } = localPoint(event, canvas);
    const rect = canvas.getBoundingClientRect();
    metrics().pointerLog.push({ x, y, naiveX: event.clientX - rect.left, naiveY: event.clientY - rect.top });
    data.current = [...data.current, { x: toDomain(x, SIZE), y: -toDomain(y, SIZE), label: addLabel }];
    redraw();
  };

  const reset = () => {
    data.current = makeData(seed);
    model.current = INITIAL_MODEL;
    losses.current = [];
    steps.current = 0;
    redraw();
    publish();
  };

  return (
    <div className="sim">
      <canvas ref={canvasRef} className="sim__canvas" onPointerDown={onPointerDown} aria-label="Logistic regression decision boundary" />
      <div className="sim__panel">
        <div className="sim__field">
          <label htmlFor="sim-lr">
            Learning rate η = <span className="sim__mono">{(10 ** logLr).toFixed(3)}</span>
          </label>
          <input
            id="sim-lr"
            className="sim__range"
            type="range"
            min={-3}
            max={1}
            step={0.01}
            value={logLr}
            onChange={(e) => {
              const next = Number(e.target.value);
              lr.current = 10 ** next;
              setLogLr(next);
            }}
          />
        </div>

        <div className="sim__buttons">
          <button type="button" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => {
              advance();
              redraw();
              publish();
            }}
          >
            Step
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="sim__field">
          <span className="sim__label">Click the plot to add a point labeled</span>
          <div className="sim__buttons">
            <button type="button" aria-pressed={addLabel === 0} onClick={() => setAddLabel(0)}>
              <span className="sim__swatch sim__swatch--0" /> 0
            </button>
            <button type="button" aria-pressed={addLabel === 1} onClick={() => setAddLabel(1)}>
              <span className="sim__swatch sim__swatch--1" /> 1
            </button>
          </div>
        </div>

        <div className="sim__readout">
          <div>
            step <span className="sim__mono" data-testid="sim-steps">{readout.steps}</span>
          </div>
          <div>
            loss <span className="sim__mono">{Number.isNaN(readout.loss) ? '—' : readout.loss.toFixed(4)}</span>
          </div>
          <LossSpark losses={readout.losses} />
        </div>
      </div>
    </div>
  );
}

function Static({ seed = 7 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [losses, setLosses] = useState<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = makeData(seed);
    const result = train(INITIAL_MODEL, data, STATIC_LR, STATIC_STEPS);
    drawScene(prepareCanvas(canvas, SIZE), SIZE, data, result.model, readPalette(canvas));
    setLosses(result.losses);
  }, [seed]);

  return (
    <div className="sim">
      <canvas ref={canvasRef} className="sim__canvas" aria-label="Logistic regression decision boundary (static)" />
      <div className="sim__panel">
        <p className="sim__note">
          Snapshot after {STATIC_STEPS} gradient-descent steps at η = {STATIC_LR}. In the live deck this plot trains in real
          time, with a learning-rate slider and click-to-add points.
        </p>
        <div className="sim__readout">
          <div>
            loss <span className="sim__mono">{losses.length ? losses.at(-1)!.toFixed(4) : '—'}</span>
          </div>
          <LossSpark losses={losses} />
        </div>
      </div>
    </div>
  );
}

export const LogisticSim = defineInteractive<Props>({
  name: 'logistic-sim',
  requires: 'single-file',
  Live,
  Static,
});
