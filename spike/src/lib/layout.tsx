import type { ReactNode } from 'react';

export function SlideTitle({ children }: { children: ReactNode }) {
  return <h2 className="slide-title">{children}</h2>;
}
