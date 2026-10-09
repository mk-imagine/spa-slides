import { Component, createContext, useContext, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { stillReason } from './environment.js';
import { RuntimeContext, useEnvironment, useSlideIndex } from './runtime.js';
import { INTERACTIVE_ATTRIBUTE } from './toggle.js';

/** True inside the live version of an `<Interactive>`, the only place anything may move. */
export const LiveContext = createContext(false);

const NO_STORE = () => () => {};

interface BoundaryProps {
  onError: () => void;
  children: ReactNode;
}

/** Catches a live version that throws, so the slide falls back to its still instead of going blank. */
class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  // React has already logged the error by now, so the verifier's console check still fails on it.
  override componentDidCatch() {
    this.props.onError();
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface InteractiveProps {
  /**
   * The static version, and what the PDF, the verifier's screenshots, reduced motion and a failure
   * all show. Author it as a figure in its own right: a frozen frame of the live version is often
   * not the figure anyone would draw.
   */
  still: ReactNode;
  /** The live version. */
  children: ReactNode;
}

/**
 * A figure with a still and a live version. Wrap only the figure, and keep the slide's text outside:
 * text authored once cannot drift between the two versions, and the verifier fails a slide whose
 * text does.
 */
export function Interactive({ still, children }: InteractiveProps) {
  const store = useContext(RuntimeContext)?.toggles ?? null;
  const environment = useEnvironment();
  const ref = useRef<HTMLDivElement>(null);
  const slide = useSlideIndex(ref);
  const snapshot = () => (store !== null && slide >= 0 ? store.has(slide) : false);
  const toggled = useSyncExternalStore(store?.subscribe ?? NO_STORE, snapshot, snapshot);
  const [failed, setFailed] = useState(false);
  const reason = stillReason(environment, toggled, failed);

  return (
    <div ref={ref} className="sps-interactive" {...{ [INTERACTIVE_ATTRIBUTE]: reason === null ? 'live' : 'still' }} data-sps-still-reason={reason ?? undefined}>
      {reason === null ? (
        <Boundary onError={() => setFailed(true)}>
          <LiveContext.Provider value={true}>{children}</LiveContext.Provider>
        </Boundary>
      ) : (
        still
      )}
    </div>
  );
}
