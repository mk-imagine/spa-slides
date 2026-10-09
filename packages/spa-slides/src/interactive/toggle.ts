import { openChannel, type DeckChannel } from './channel.js';

/**
 * The key that switches the current slide between its still and its live version. `t` is free of
 * Reveal's own bindings and is not something a presenter's clicker sends (clickers send page
 * up/down, arrows, and sometimes `b` or `.`).
 */
export const TOGGLE_KEY = { keyCode: 84, key: 'T', description: 'Switch this slide between its still and its live version' } as const;

/** Marks an interactive figure in the DOM. Shared by the component, the toggle, and the verifier. */
export const INTERACTIVE_ATTRIBUTE = 'data-sps-interactive';

const SLIDES = '.reveal .slides > section';

type Message = { type: 'state'; toggled: number[] } | { type: 'hello' };

function isMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as { type?: unknown; toggled?: unknown };
  if (message.type === 'hello') return true;
  return message.type === 'state' && Array.isArray(message.toggled) && message.toggled.every((n) => Number.isInteger(n));
}

/** A slide's position among the deck's slides, which is the same in every window showing the deck. */
export function slideIndexOf(element: Element): number {
  const section = element.closest('section');
  return section ? [...document.querySelectorAll(SLIDES)].indexOf(section) : -1;
}

/**
 * Which slides the presenter has switched, shared by every window showing the deck.
 *
 * Messages carry the whole state, never "flip", so a window that missed one or opened late cannot
 * end up inverted; a window that opens asks the others for it.
 */
export class ToggleStore {
  private toggled: ReadonlySet<number> = new Set();
  private readonly listeners = new Set<() => void>();
  private channel: DeckChannel | null = null;

  /** `name` scopes the messages to one deck. */
  constructor(private readonly name: string) {}

  /** Starts listening, and asks any window already open for its state. Returns the disconnect. */
  connect(): () => void {
    this.channel = openChannel(this.name, (message) => this.receive(message));
    this.send({ type: 'hello' });
    return () => {
      this.channel?.close();
      this.channel = null;
    };
  }

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  has(slide: number): boolean {
    return this.toggled.has(slide);
  }

  /** Switches one slide, here and in every other window. */
  toggle(slide: number) {
    const next = new Set(this.toggled);
    if (!next.delete(slide)) next.add(slide);
    this.apply(next);
    this.send({ type: 'state', toggled: [...next] });
  }

  /** The key's action: switches the slide being shown, if it has anything to switch. */
  toggleCurrent() {
    const present = document.querySelector(`${SLIDES}.present`);
    if (present?.querySelector(`[${INTERACTIVE_ATTRIBUTE}]`)) this.toggle(slideIndexOf(present));
  }

  private receive(message: unknown) {
    if (!isMessage(message)) return;
    if (message.type === 'hello') {
      if (this.toggled.size > 0) this.send({ type: 'state', toggled: [...this.toggled] });
      return;
    }
    this.apply(new Set(message.toggled));
  }

  private apply(next: ReadonlySet<number>) {
    if (next.size === this.toggled.size && [...next].every((n) => this.toggled.has(n))) return;
    this.toggled = next;
    for (const listener of this.listeners) listener();
  }

  private send(message: Message) {
    this.channel?.send(message);
  }
}
