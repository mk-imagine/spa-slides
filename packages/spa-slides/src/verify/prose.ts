export interface ProseDifference {
  /** Characters into the text where the two versions part. */
  at: number;
  still: string;
  live: string;
}

/** Where a slide's text first differs between its still and its live version, with a little of each around it. */
export function proseDifference(still: string, live: string, context = 40): ProseDifference | null {
  if (still === live) return null;
  let at = 0;
  while (at < still.length && at < live.length && still[at] === live[at]) at++;
  const from = Math.max(0, at - context);
  const excerpt = (text: string) => `${from > 0 ? '…' : ''}${text.slice(from, at + context)}${at + context < text.length ? '…' : ''}`;
  return { at, still: excerpt(still), live: excerpt(live) };
}
