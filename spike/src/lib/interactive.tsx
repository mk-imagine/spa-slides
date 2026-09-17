import type { ComponentType, KeyboardEvent } from 'react';
import { useDeckMode, useSlideActive } from './deck-mode';

/** What the component needs at runtime; decides which build targets can host it. */
export type Requirement = 'single-file' | 'asset-folder' | 'server';

export interface LiveProps {
  /** True only while this slide is on screen for the audience. */
  active: boolean;
}

export interface InteractiveSpec<P extends object> {
  name: string;
  requires: Requirement;
  /** Rendered in the audience window. Must stop all work when `active` is false. */
  Live: ComponentType<P & LiveProps>;
  /** Rendered for PDF export and in the speaker-view previews. Required. */
  Static: ComponentType<P>;
}

const ACTIVATION_KEYS = new Set([' ', 'Enter']);

/**
 * Reveal listens for keydown on `document` and treats Space as "next slide", calling
 * preventDefault — so a focused button never activates. Stop activation keys at the
 * component boundary; everything else (arrows, PageUp/PageDown from a clicker) still
 * reaches Reveal. Reveal already ignores all keys while an <input> or <textarea> has focus.
 */
function keepActivationKeys(event: KeyboardEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement;
  if (ACTIVATION_KEYS.has(event.key) && target.matches('button, [role="button"], summary, a[href]')) {
    event.stopPropagation();
  }
}

export function defineInteractive<P extends object>(spec: InteractiveSpec<P>) {
  const { Live, Static } = spec;

  function Interactive(props: P) {
    const mode = useDeckMode();
    const [active, ref] = useSlideActive<HTMLDivElement>();
    return (
      <div
        ref={ref}
        className="interactive"
        data-interactive={spec.name}
        data-requires={spec.requires}
        data-mode={mode}
        data-prevent-swipe
        onKeyDown={keepActivationKeys}
      >
        {mode === 'live' ? <Live {...props} active={active} /> : <Static {...props} />}
      </div>
    );
  }

  Interactive.displayName = `Interactive(${spec.name})`;
  return Interactive;
}
