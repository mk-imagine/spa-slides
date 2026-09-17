import type { ReactNode } from 'react';

/** Speaker notes. An array renders as a bulleted list, like Beamer's `\note[item]`. */
export type Notes = ReactNode | ReactNode[];

export function SpeakerNotes({ notes }: { notes?: Notes }) {
  if (notes === undefined || notes === null) return null;
  return (
    <aside className="notes">
      {Array.isArray(notes) ? (
        <ul>
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      ) : (
        notes
      )}
    </aside>
  );
}
