import { predict, type Model, type Point } from './model';

export interface Palette {
  class0: string;
  class1: string;
  fg: string;
  bg: string;
}

/** Canvas can't read CSS variables, so resolve the tokens once from the DOM. */
export function readPalette(el: Element): Palette {
  const css = getComputedStyle(el);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return { class0: token('--color-class-0'), class1: token('--color-class-1'), fg: token('--color-fg'), bg: token('--color-bg') };
}

const BACKING_SCALE = 2;
const CELL = 19;

/** Sizes the backing store once; drawing then happens in logical (CSS) pixels. */
export function prepareCanvas(canvas: HTMLCanvasElement, size: number) {
  if (canvas.width !== size * BACKING_SCALE) {
    canvas.width = size * BACKING_SCALE;
    canvas.height = size * BACKING_SCALE;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.setTransform(BACKING_SCALE, 0, 0, BACKING_SCALE, 0, 0);
  return ctx;
}

export const toDomain = (px: number, size: number) => (px / size) * 2 - 1;
const toCanvasX = (x: number, size: number) => ((x + 1) / 2) * size;
const toCanvasY = (y: number, size: number) => ((1 - y) / 2) * size;

export function drawScene(ctx: CanvasRenderingContext2D, size: number, data: Point[], model: Model, palette: Palette) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, size, size);

  // Probability field.
  for (let px = 0; px < size; px += CELL) {
    for (let py = 0; py < size; py += CELL) {
      const p = predict(model, toDomain(px + CELL / 2, size), -toDomain(py + CELL / 2, size));
      ctx.globalAlpha = 0.3 * p;
      ctx.fillStyle = palette.class1;
      ctx.fillRect(px, py, CELL, CELL);
      ctx.globalAlpha = 0.3 * (1 - p);
      ctx.fillStyle = palette.class0;
      ctx.fillRect(px, py, CELL, CELL);
    }
  }
  ctx.globalAlpha = 1;

  // Decision boundary: w1·x + w2·y + b = 0.
  ctx.strokeStyle = palette.fg;
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  if (Math.abs(model.w2) > 1e-6) {
    const yAt = (x: number) => -(model.w1 * x + model.b) / model.w2;
    ctx.moveTo(toCanvasX(-1, size), toCanvasY(yAt(-1), size));
    ctx.lineTo(toCanvasX(1, size), toCanvasY(yAt(1), size));
  } else if (Math.abs(model.w1) > 1e-6) {
    const x = -model.b / model.w1;
    ctx.moveTo(toCanvasX(x, size), 0);
    ctx.lineTo(toCanvasX(x, size), size);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  for (const p of data) {
    ctx.beginPath();
    ctx.arc(toCanvasX(p.x, size), toCanvasY(p.y, size), 10, 0, Math.PI * 2);
    ctx.fillStyle = p.label === 1 ? palette.class1 : palette.class0;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = palette.bg;
    ctx.stroke();
  }
}
