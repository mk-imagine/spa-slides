import { dedent } from './dedent.js';

export interface MonoBlockProps {
  /** Literal text. Indentation shared by every line is removed, so it can be indented with the JSX. */
  children: string;
  /** How lines sit within the block. The block itself is always centered. */
  align?: 'center' | 'start';
  size?: 'body' | 'small';
}

/** Verbatim monospace lines: file listings, terminal output, config files. */
export function MonoBlock({ children, align = 'center', size = 'body' }: MonoBlockProps) {
  return <pre className={`sps-mono sps-mono--${align} sps-mono--${size}`}>{dedent(children)}</pre>;
}
