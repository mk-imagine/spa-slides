import type { Point } from '../chart/marks.js';

/**
 * What a timeline's position means. The contract every source keeps: any position can be asked for
 * directly, without playing through to it, and the same position always gives the same state. That
 * is what lets print, the verifier, back-navigation and scrubbing land anywhere.
 */
export interface Source<State> {
  at(position: number): State;
}

/**
 * A replay over precomputed frames: position i is `frames[i]`. Between two frames it is `blend` of
 * them, if given, and otherwise the earlier one. Positions past either end clamp to it.
 */
export function replay<Frame>(frames: readonly Frame[], blend?: (a: Frame, b: Frame, t: number) => Frame): Source<Frame> & { length: number } {
  if (frames.length === 0) throw new Error('[spa-slides] replay needs at least one frame');
  const last = frames.length - 1;
  return {
    length: frames.length,
    at(position) {
      const p = Math.min(last, Math.max(0, position));
      const i = Math.floor(p);
      const t = p - i;
      return blend === undefined || t === 0 || i === last ? frames[i]! : blend(frames[i]!, frames[i + 1]!, t);
    },
  };
}

/**
 * A recorded series drawn up to a position on its x axis: every point at or before it, and one more
 * at the position itself, interpolated, so a line grows smoothly rather than a sample at a time.
 * Points must be in increasing x. A missing value stays a gap, and the line never reaches across one.
 */
export function trace(points: readonly Point[]): Source<Point[]> {
  return {
    at(x) {
      const shown: Point[] = [];
      for (let i = 0; i < points.length; i++) {
        const point = points[i]!;
        if (point[0] <= x) {
          shown.push(point);
          continue;
        }
        const before = points[i - 1];
        if (before !== undefined && before[1] !== null && point[1] !== null && before[0] < x) {
          const t = (x - before[0]) / (point[0] - before[0]);
          shown.push([x, before[1] + (point[1] - before[1]) * t]);
        }
        break;
      }
      return shown;
    },
  };
}
