import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSteps } from '../core/steps.js';
import { allowsMotion } from './environment.js';
import { LiveContext, useEnvironment } from './Interactive.js';

/** Where a timeline rests at one build step, and how it gets there. */
export interface Keyframe {
  /** The position at this step, in whatever units the slide's source reads: a frame, a trial, an epoch. */
  at: number;
  /** Milliseconds to travel here from the previous step's position. 0 jumps. Default: the timeline's `duration`. */
  duration?: number;
}

export interface TimelineOptions {
  /** Milliseconds to travel between keyframes, unless a keyframe says otherwise. Default: 600. */
  duration?: number;
  /** Maps elapsed time (0–1) to distance travelled (0–1). Default: linear, so a replay runs at a steady rate. */
  easing?: (t: number) => number;
}

/** A move in progress, from where the timeline was to the keyframe of `step`. */
export interface Glide {
  step: number;
  from: number;
  to: number;
  start: number;
  duration: number;
}

const linear = (t: number) => t;

/** The position a glide has reached at time `now`. */
export function glidePosition(glide: Glide, now: number, easing: (t: number) => number = linear): number {
  const t = glide.duration <= 0 ? 1 : Math.min(1, Math.max(0, (now - glide.start) / glide.duration));
  return glide.from + (glide.to - glide.from) * easing(t);
}

/**
 * A position driven by the slide's build steps: one keyframe per step, step 0 included, so a slide
 * with `steps={3}` takes four. The step is the authority, and the clock only animates between
 * keyframes, so the speaker view, back-navigation and print all inherit the step's correctness.
 *
 * Only the live version of an `<Interactive>` may use one: anything that moves needs a still.
 *
 * Advancing one step glides there. Anything else lands at once: stepping back, jumping, and arriving
 * from another slide. Where motion is not allowed (the verifier, reduced motion) every step lands at
 * once, so what is measured is where the slide settles.
 */
export function useTimeline(keyframes: readonly (number | Keyframe)[], options: TimelineOptions = {}): number {
  const { duration = 600, easing = linear } = options;
  if (!useContext(LiveContext)) {
    throw new Error('[spa-slides] useTimeline belongs in the live version of an <Interactive>, so that print and the verifier have a still to show');
  }
  const { step, count } = useSteps();
  if (keyframes.length !== count + 1) {
    throw new Error(`[spa-slides] useTimeline needs one keyframe per step, step 0 included: ${count + 1} for this slide, got ${keyframes.length}`);
  }
  const frames = keyframes.map((k): Keyframe => (typeof k === 'number' ? { at: k } : k));
  const target = frames[step]!.at;
  const motion = allowsMotion(useEnvironment());

  const [glide, setGlide] = useState<Glide | null>(null);
  const [, setTick] = useState(0);
  /** Where the timeline was in the last render that reached the screen. */
  const shown = useRef(target);
  const lastStep = useRef(step);

  // Before paint, so the first frame of a glide is where it starts, never where it ends. The render
  // that brings a new step has no glide yet and so shows the target; `shown` is still the position
  // before it, because it is only updated by the effect below, which runs after this one.
  useLayoutEffect(() => {
    const previous = lastStep.current;
    lastStep.current = step;
    const ms = frames[step]!.duration ?? duration;
    if (motion && step === previous + 1 && ms > 0 && shown.current !== target) {
      setGlide({ step, from: shown.current, to: target, start: performance.now(), duration: ms });
    } else {
      setGlide(null);
    }
    // Only a change of step starts or ends a move.
  }, [step]);

  useEffect(() => {
    if (glide === null) return;
    let frame = requestAnimationFrame(function tick(now) {
      if (now - glide.start >= glide.duration) {
        setGlide(null);
        return;
      }
      setTick((n) => n + 1);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [glide]);

  const position = glide !== null && glide.step === step ? glidePosition(glide, performance.now(), easing) : target;
  useLayoutEffect(() => {
    shown.current = position;
  });
  return position;
}
