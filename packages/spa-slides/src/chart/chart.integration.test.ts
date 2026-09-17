import { describe, expect, it } from 'vitest';
import { buildFixtureDeck } from '../testing/build-fixture.js';
import { verifyDeck } from '../verify/index.js';

describe('chart gallery', () => {
  it('renders every chart primitive without failing any check', async () => {
    const deckDir = await buildFixtureDeck('chart-gallery');
    const result = await verifyDeck({ deckDir, expectSlides: 2 });
    const failed = result.checks.filter((c) => !c.pass).map((c) => ({ id: c.id, detail: c.detail }));
    expect(failed, JSON.stringify(failed, null, 2)).toEqual([]);
    // Screenshots stay in `${deckDir}/report/slides` for a visual check.
    console.log(`chart gallery report: ${result.outDir}`);
  }, 180_000);
});
