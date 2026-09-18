import type { ReactNode } from 'react';

export type StackGap = 'tight' | 'flow' | 'loose';

export interface StackProps {
  /**
   * How far apart the blocks sit. `flow` (the default) is the gap between separate blocks;
   * `tight` groups parts of one thing; `loose` separates halves of a slide.
   */
  gap?: StackGap;
  children: ReactNode;
}

/**
 * A column of blocks with a gap between them.
 *
 * Slides group content in wrappers all the time, and a wrapper that does not space its children
 * leaves them touching, so two visuals read as one. `<Stack>` is that wrapper: the spacing comes
 * from the container, so it holds however many children it is given and whatever they are.
 */
export function Stack({ gap = 'flow', children }: StackProps) {
  return <div className={`sps-stack sps-stack--${gap}`}>{children}</div>;
}
