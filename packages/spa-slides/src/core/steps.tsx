import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { STEP_MARKER_CLASS } from './step-marker.js';

export interface StepState {
  /** 0 on arrival; one more per click, up to `count`. */
  step: number;
  /** How many clicks the slide has. */
  count: number;
}

const StepContext = createContext<StepState>({ step: 0, count: 0 });

/** The current build step of the enclosing slide. 0 outside a slide with steps. */
export function useStep(): number {
  return useContext(StepContext).step;
}

/** The current build step and how many the slide has. */
export function useSteps(): StepState {
  return useContext(StepContext);
}


/**
 * Gives a slide `count` clicks. Reveal advances through a slide's `.fragment` elements and marks
 * each one it has shown `visible`, in the audience window, in the speaker view's previews, when
 * navigating back into a slide, and in print (where it shows them all). Invisible markers
 * therefore give a slide clicks without anything appearing, and counting the visible markers
 * is the step. Watching their classes, rather than Reveal's events, keeps every one of those
 * cases in sync.
 */
export function StepProvider({ count, children }: { count: number; children: ReactNode }) {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`[spa-slides] steps must be a whole number >= 0, got ${count}`);
  }
  const markers = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const container = markers.current;
    if (!container || count === 0) return;
    const read = () => setStep(container.querySelectorAll(`.${STEP_MARKER_CLASS}.visible`).length);
    read();
    const observer = new MutationObserver(read);
    observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [count]);

  return (
    <StepContext.Provider value={{ step, count }}>
      {count > 0 && (
        <span ref={markers} className="sps-step-markers" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={`fragment ${STEP_MARKER_CLASS}`} data-fragment-index={i} />
          ))}
        </span>
      )}
      {children}
    </StepContext.Provider>
  );
}

export interface StepProps {
  /** First step at which the children show. */
  at: number;
  /** Step at which they hide again. Omit to keep them. */
  until?: number;
  as?: 'div' | 'span';
  children: ReactNode;
}

/**
 * Shows its children from step `at` (until step `until`). Hidden children keep their space,
 * so a build never shifts the rest of the slide.
 */
export function Step({ at, until, as: Tag = 'div', children }: StepProps) {
  const step = useStep();
  const shown = step >= at && (until === undefined || step < until);
  return (
    <Tag className="sps-step" data-shown={shown} aria-hidden={shown ? undefined : true}>
      {children}
    </Tag>
  );
}
