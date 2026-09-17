import type { ReactNode } from 'react';
import { Columns } from '@mk-imagine/spa-slides';

/** The button you click beside the command that does the same thing. */
export function Dual({ gui, command }: { gui: ReactNode; command: string }) {
  return (
    <Columns>
      <p>
        <strong>In GitHub Desktop</strong>
        <br />
        {gui}
      </p>
      <p>
        <strong>The same thing, typed</strong>
        <br />
        <code>{command}</code>
      </p>
    </Columns>
  );
}
