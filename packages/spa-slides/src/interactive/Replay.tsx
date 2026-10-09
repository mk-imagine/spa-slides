import type { ReactNode } from 'react';
import { useSteps } from '../core/steps.js';
import { Interactive } from './Interactive.js';
import { useTimeline, type Keyframe } from './timeline.js';

export interface ReplayProps {
  /** Where the replay starts. Default 0. */
  from?: number;
  /** Where it ends. */
  to: number;
  /** The click that plays it. Default 1. Before it the replay waits at `from`; after it, it holds at `to`. */
  on?: number;
  /** Milliseconds the play takes. Default 6000. */
  duration?: number;
  /** The still, when it is not simply the figure drawn whole. */
  still?: ReactNode;
  /**
   * Draws the figure at a position along the replay, or whole when given `undefined`. With a chart,
   * that is the Plot's `reveal`: `{(x) => <Plot reveal={x} …>}`.
   */
  children: (position: number | undefined) => ReactNode;
}

function Playing({ from, to, on, duration, render }: Required<Omit<ReplayProps, 'still' | 'children'>> & { render: ReplayProps['children'] }) {
  const { count } = useSteps();
  if (!Number.isInteger(on) || on < 1 || on > count) {
    throw new Error(`[spa-slides] <Replay on={${on}}> plays on a click this slide does not have: it has ${count}`);
  }
  const keyframes = Array.from({ length: count + 1 }, (_, step): number | Keyframe => (step < on ? from : step === on ? { at: to, duration } : to));
  return <>{render(useTimeline(keyframes))}</>;
}

/**
 * A figure that fills in on a click: the common case of `<Interactive>` and `useTimeline`, for a
 * replay of recorded data. Its still is the figure drawn whole, unless one is given. For anything
 * with more than one moving part, use those two directly.
 */
export function Replay({ from = 0, to, on = 1, duration = 6000, still, children }: ReplayProps) {
  return (
    <Interactive still={still ?? children(undefined)}>
      <Playing from={from} to={to} on={on} duration={duration} render={children} />
    </Interactive>
  );
}
