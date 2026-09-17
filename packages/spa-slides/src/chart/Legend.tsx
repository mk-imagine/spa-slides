import type { ReactNode } from 'react';
import { markClass, type MarkTone } from './context.js';

export interface LegendItem {
  label: ReactNode;
  series?: number;
  tone?: MarkTone;
  /** Draw the key as a dashed line, matching a dashed series. */
  dashed?: boolean;
  /** Draw the key as a line (default) or a filled swatch, matching bars. */
  shape?: 'line' | 'swatch';
}

/** The identity key for two or more series. Text stays in text colors; the key carries the color. */
export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="sps-legend">
      {items.map((item, i) => (
        <li key={i}>
          <svg className="sps-legend-key" width={40} height={16} aria-hidden="true">
            {item.shape === 'swatch' ? (
              <rect className={`sps-bar ${markClass(item.series, item.tone)}`} x={8} y={0} width={24} height={16} rx={4} />
            ) : (
              <line className={`sps-line ${markClass(item.series, item.tone)}${item.dashed ? ' sps-line--dashed' : ''}`} x1={0} x2={40} y1={8} y2={8} />
            )}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
