import type { ReactNode } from 'react';

export interface TextProps {
  as?: 'span' | 'p' | 'div';
  size?: 'small' | 'body' | 'large';
  tone?: 'default' | 'muted' | 'accent' | 'positive' | 'negative';
  align?: 'start' | 'center';
  italic?: boolean;
  children: ReactNode;
}

/** Typed text variants, so slides never reach for ad-hoc sizes or colors. */
export function Text({ as: Tag = 'span', size = 'body', tone = 'default', align, italic = false, children }: TextProps) {
  const classes = ['sps-text', `sps-text--${size}`, `sps-tone--${tone}`];
  if (align) classes.push(`sps-align--${align}`);
  if (italic) classes.push('sps-text--italic');
  return <Tag className={classes.join(' ')}>{children}</Tag>;
}
