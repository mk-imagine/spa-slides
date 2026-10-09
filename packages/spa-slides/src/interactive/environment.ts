/**
 * Why an interactive figure is showing its still rather than its live version. Each is reported on
 * the page, because "showing the still" and "showing the still because the live one crashed" are
 * very different things to find ten minutes before a talk.
 */
export type StillReason = 'print' | 'verify' | 'query' | 'reduced-motion' | 'toggle' | 'error';

/** URL parameter the verifier adds to announce itself, and which version its pass is checking. */
export const VERIFY_PARAM = 'sps-verify';
/** URL parameter that forces every still, for opening a deck with no motion at all. */
export const STILL_PARAM = 'still';

/**
 * Which of the windows showing the deck this is. The speaker view runs two copies of the deck in
 * frames, both with `receiver` in their URL: the current slide, which Reveal also gives
 * `postMessageEvents`, and the upcoming one, which can show the next click of the same slide.
 */
export type WindowRole = 'audience' | 'current' | 'upcoming';

export function windowRole(search: string = window.location.search): WindowRole {
  const params = new URLSearchParams(search);
  if (!params.has('receiver')) return 'audience';
  return params.get('postMessageEvents') === 'true' ? 'current' : 'upcoming';
}

export interface Environment {
  /** Reveal's print layout, which the PDF export is made from. */
  print: boolean;
  /** The verifier, and the version its pass checks. Null for anyone else. */
  verify: 'still' | 'live' | null;
  /** `?still` in the URL. */
  query: boolean;
  /** The viewer's `prefers-reduced-motion` setting. */
  reducedMotion: boolean;
  role: WindowRole;
}

/**
 * Reads the environment from the page. Print has to be read from the URL: Reveal only adds its
 * `reveal-print` class after the deck boots, so a check of the class at mount sees nothing and
 * the live version is printed. Reveal's own test is the same pair: `print-pdf` anywhere in the
 * query, or `view=print`.
 */
export function readEnvironment(): Environment {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const verify = params.get(VERIFY_PARAM);
  return {
    print: /print-pdf/i.test(search) || params.get('view') === 'print' || document.documentElement.classList.contains('reveal-print'),
    verify: verify === 'still' || verify === 'live' ? verify : null,
    query: params.has(STILL_PARAM),
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    role: windowRole(search),
  };
}

/**
 * Which version a figure shows: null for the live one, otherwise why it shows its still.
 *
 * Print and the verifier decide outright, so the PDF and the checks never depend on a key someone
 * pressed. Otherwise the toggle switches away from whatever the viewer would get by default, so a
 * presenter with reduced motion set can still bring a live figure up. A failure overrides all of it.
 */
export function stillReason(env: Environment, toggled: boolean, failed: boolean): StillReason | null {
  if (failed) return 'error';
  if (env.print) return 'print';
  if (env.verify === 'still') return 'verify';
  if (env.verify === 'live') return null;
  const preference: StillReason | null = env.query ? 'query' : env.reducedMotion ? 'reduced-motion' : null;
  if (!toggled) return preference;
  return preference === null ? 'toggle' : null;
}

/**
 * Whether a live figure's timeline may animate between keyframes. Where it may not, it lands on
 * each keyframe at once: the verifier's screenshots and measurements are then the state the slide
 * settles in, rather than wherever an animation happened to be when the step landed.
 */
export function allowsMotion(env: Environment): boolean {
  return !env.print && env.verify === null && !env.reducedMotion;
}
