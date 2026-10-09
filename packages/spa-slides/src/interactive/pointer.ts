import { openChannel, type DeckChannel } from './channel.js';
import type { WindowRole } from './environment.js';

/** A position on one slide, in the slide's own 1920 × 1080 coordinates, which every window shares. */
export interface SlidePoint {
  /** The slide's position among the deck's slides. */
  slide: number;
  x: number;
  y: number;
}

export interface PointerState {
  /** The mouse, over this window's slide. */
  local: SlidePoint | null;
  /** The mouse over another window's slide, mirrored here: the presenter's, from the speaker view. */
  remote: SlidePoint | null;
}

type Message = { type: 'pointer'; source: string; seq: number; at: SlidePoint | null };

function isMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Partial<Message>;
  const at = m.at as Partial<SlidePoint> | null | undefined;
  return (
    m.type === 'pointer' &&
    typeof m.source === 'string' &&
    typeof m.seq === 'number' &&
    (at === null || (typeof at === 'object' && typeof at.slide === 'number' && typeof at.x === 'number' && typeof at.y === 'number'))
  );
}

const SLIDES = '.reveal .slides';

/**
 * Where a point in the window falls on the slide being shown, or null off it. Reveal scales the
 * slide box, so dividing by its scale gives the slide's own coordinates, which are the same in every
 * window however large; spike 5 measured them agreeing to a tenth of a pixel.
 */
export function slidePointAt(clientX: number, clientY: number): SlidePoint | null {
  const slides = document.querySelector<HTMLElement>(SLIDES);
  const present = document.querySelector(`${SLIDES} > section.present`);
  if (!slides || !present || slides.offsetWidth === 0) return null;
  const box = slides.getBoundingClientRect();
  const scale = box.width / slides.offsetWidth;
  const x = (clientX - box.left) / scale;
  const y = (clientY - box.top) / scale;
  if (x < 0 || y < 0 || x > slides.offsetWidth || y > slides.offsetHeight) return null;
  return { slide: [...document.querySelectorAll(`${SLIDES} > section`)].indexOf(present), x, y };
}

const same = (a: SlidePoint | null, b: SlidePoint | null) => a === b || (a !== null && b !== null && a.slide === b.slide && a.x === b.x && a.y === b.y);

/**
 * The deck's one pointer, shared by every window showing it. Each window knows where its own mouse
 * is on its slide, and where the mouse over any other window is: the presenter's, mirrored.
 *
 * The audience window and the speaker view's current-slide frame send; the upcoming frame never
 * does, since it can show the next click of the same slide and a pointer there would land on the
 * projector's. Moves are sent at most once a frame. Every message carries its sender and a count, so
 * one arriving late on the slower route cannot move the pointer back.
 */
export class PointerStore {
  private state: PointerState = { local: null, remote: null };
  private readonly listeners = new Set<() => void>();
  private channel: DeckChannel | null = null;
  private readonly source = Math.random().toString(36).slice(2);
  private sent = 0;
  private readonly heard = new Map<string, number>();
  private frame = 0;
  private client: [number, number] | null = null;

  /** `name` scopes the messages to one deck. */
  constructor(private readonly name: string) {}

  /** Starts listening, and in a window that sends, watching the mouse. Returns the disconnect. */
  connect(role: WindowRole): () => void {
    this.channel = openChannel(this.name, (message) => this.receive(message));
    if (role === 'upcoming') return () => this.disconnect();
    const move = (event: PointerEvent) => {
      this.client = [event.clientX, event.clientY];
      this.schedule();
    };
    const leave = () => {
      this.client = null;
      this.schedule();
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      document.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      this.disconnect();
    };
  }

  /**
   * For when this window's slide changes. The mouse, if it has not moved, is now over a different
   * slide; and whatever reads the pointer has to look again, since a mirrored pointer it ignored
   * may be on the slide it now shows.
   */
  readonly refresh = () => {
    this.set({ ...this.state });
    this.schedule();
  };

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): PointerState => this.state;

  private disconnect() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.channel?.close();
    this.channel = null;
  }

  private schedule() {
    if (this.frame !== 0) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const at = this.client === null ? null : slidePointAt(...this.client);
      if (same(at, this.state.local)) return;
      this.set({ ...this.state, local: at });
      this.channel?.send({ type: 'pointer', source: this.source, seq: ++this.sent, at } satisfies Message);
    });
  }

  private receive(message: unknown) {
    if (!isMessage(message) || message.source === this.source) return;
    // Most messages arrive twice, once on each route; this also drops one overtaken by a later one.
    if ((this.heard.get(message.source) ?? 0) >= message.seq) return;
    this.heard.set(message.source, message.seq);
    if (!same(message.at, this.state.remote)) this.set({ ...this.state, remote: message.at });
  }

  private set(next: PointerState) {
    this.state = next;
    for (const listener of this.listeners) listener();
  }
}
