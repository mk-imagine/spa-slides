import { Children, type ReactNode } from 'react';

export interface ColumnsProps {
  /** Relative column widths, e.g. `[54, 44]`. Equal widths when omitted. One child per column. */
  widths?: number[];
  children: ReactNode;
}

export function columnTemplate(count: number, widths?: number[]): string {
  if (widths && widths.length !== count) {
    throw new Error(`[spa-slides] <Columns> has ${count} children but ${widths.length} widths`);
  }
  if (widths?.some((w) => !(w > 0))) {
    throw new Error(`[spa-slides] <Columns> widths must be positive, got [${widths.join(', ')}]`);
  }
  return (widths ?? Array.from({ length: count }, () => 1)).map((w) => `${w}fr`).join(' ');
}

export function Columns({ widths, children }: ColumnsProps) {
  const columns = Children.toArray(children);
  return (
    <div className="sps-columns" style={{ gridTemplateColumns: columnTemplate(columns.length, widths) }}>
      {columns.map((column, i) => (
        <div className="sps-column" key={i}>
          {column}
        </div>
      ))}
    </div>
  );
}
