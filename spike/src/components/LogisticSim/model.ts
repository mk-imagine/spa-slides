export interface Point {
  x: number;
  y: number;
  label: 0 | 1;
}

export interface Model {
  w1: number;
  w2: number;
  b: number;
}

/** Deliberately wrong starting boundary so the audience sees it rotate into place. */
export const INITIAL_MODEL: Model = { w1: -1.2, w2: 0.6, b: 0.3 };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number) => Math.max(-0.95, Math.min(0.95, v));

/** Two overlapping Gaussian blobs in [-1, 1]². Seeded so live and print versions match. */
export function makeData(seed: number, perClass = 22): Point[] {
  const rand = mulberry32(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const blob = (cx: number, cy: number, label: 0 | 1) =>
    Array.from({ length: perClass }, () => ({ x: clamp(cx + 0.3 * gauss()), y: clamp(cy + 0.3 * gauss()), label }));
  return [...blob(-0.35, -0.3, 0), ...blob(0.35, 0.35, 1)];
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export const predict = (m: Model, x: number, y: number) => sigmoid(m.w1 * x + m.w2 * y + m.b);

/** One full-batch gradient descent step on mean binary cross-entropy. Returns the pre-update loss. */
export function step(m: Model, data: Point[], lr: number): { model: Model; loss: number } {
  let g1 = 0;
  let g2 = 0;
  let gb = 0;
  let loss = 0;
  for (const p of data) {
    const yhat = predict(m, p.x, p.y);
    const err = yhat - p.label;
    g1 += err * p.x;
    g2 += err * p.y;
    gb += err;
    const q = Math.min(Math.max(yhat, 1e-12), 1 - 1e-12);
    loss -= p.label * Math.log(q) + (1 - p.label) * Math.log(1 - q);
  }
  const n = data.length;
  return {
    model: { w1: m.w1 - (lr * g1) / n, w2: m.w2 - (lr * g2) / n, b: m.b - (lr * gb) / n },
    loss: loss / n,
  };
}

export function train(m: Model, data: Point[], lr: number, steps: number) {
  const losses: number[] = [];
  let model = m;
  for (let i = 0; i < steps; i++) {
    const result = step(model, data, lr);
    model = result.model;
    losses.push(result.loss);
  }
  return { model, losses };
}
