// Lint fixture: this file must fail `eslint src/slides`. It is not part of the deck.
import { Slide } from '@revealjs/react';

export function InlineStyleViolation() {
  return (
    <Slide>
      <h2 style={{ fontSize: 13 }}>Tiny off-token heading</h2>
      <svg viewBox="0 0 10 10">
        <rect width="10" height="10" fill="#ff0000" />
      </svg>
    </Slide>
  );
}
