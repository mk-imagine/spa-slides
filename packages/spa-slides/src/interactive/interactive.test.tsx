import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { proseDifference } from '../verify/prose.js';
import { allowsMotion, stillReason, windowRole, type Environment } from './environment.js';
import { replay, trace } from './sources.js';
import { useStepValue } from '../core/steps.js';
import { glidePosition, useTimeline } from './timeline.js';

const presenting: Environment = { print: false, verify: null, query: false, reducedMotion: false, role: 'audience' };

describe('stillReason', () => {
  it('shows the live version to a presenter, and the still when the key is pressed', () => {
    expect(stillReason(presenting, false, false)).toBeNull();
    expect(stillReason(presenting, true, false)).toBe('toggle');
  });

  it('shows the still in print and in the verifier’s still pass, whatever was pressed', () => {
    for (const toggled of [false, true]) {
      expect(stillReason({ ...presenting, print: true }, toggled, false)).toBe('print');
      expect(stillReason({ ...presenting, verify: 'still' }, toggled, false)).toBe('verify');
    }
  });

  it('shows the live version in the verifier’s live pass, even with reduced motion set', () => {
    expect(stillReason({ ...presenting, verify: 'live', reducedMotion: true }, true, false)).toBeNull();
  });

  it('starts from the still under ?still or reduced motion, and the key brings the live version up', () => {
    expect(stillReason({ ...presenting, query: true }, false, false)).toBe('query');
    expect(stillReason({ ...presenting, reducedMotion: true }, false, false)).toBe('reduced-motion');
    expect(stillReason({ ...presenting, reducedMotion: true }, true, false)).toBeNull();
  });

  it('reports a failure over everything else, including the verifier’s live pass', () => {
    expect(stillReason({ ...presenting, verify: 'live' }, false, true)).toBe('error');
    expect(stillReason({ ...presenting, print: true }, false, true)).toBe('error');
  });
});

describe('windowRole', () => {
  it('tells the audience window from the speaker view\'s two frames, by the URLs Reveal gives them', () => {
    expect(windowRole('')).toBe('audience');
    expect(windowRole('?receiver&progress=false&scrollActivationWidth=false&postMessageEvents=true')).toBe('current');
    expect(windowRole('?receiver&progress=false&scrollActivationWidth=false&controls=false')).toBe('upcoming');
  });
});

describe('allowsMotion', () => {
  it('lets a presenter’s timelines glide, and nobody else’s', () => {
    expect(allowsMotion(presenting)).toBe(true);
    expect(allowsMotion({ ...presenting, verify: 'live' })).toBe(false);
    expect(allowsMotion({ ...presenting, print: true })).toBe(false);
    expect(allowsMotion({ ...presenting, reducedMotion: true })).toBe(false);
  });
});

describe('useTimeline', () => {
  it('refuses to run outside the live version of an <Interactive>, where there is no still', () => {
    function Bare() {
      useTimeline([0]);
      return null;
    }
    expect(() => renderToStaticMarkup(<Bare />)).toThrow(/live version of an <Interactive>/);
  });
});

describe('useStepValue', () => {
  it('needs one value per step, step 0 included', () => {
    function TwoValues() {
      useStepValue(['a', 'b']);
      return null;
    }
    expect(() => renderToStaticMarkup(<TwoValues />)).toThrow(/one value per step/);
  });
});

describe('glidePosition', () => {
  const glide = { step: 1, from: 10, to: 20, start: 1000, duration: 500 };

  it('runs from where the timeline was to the keyframe, at a steady rate by default', () => {
    expect(glidePosition(glide, 1000)).toBe(10);
    expect(glidePosition(glide, 1250)).toBe(15);
    expect(glidePosition(glide, 1500)).toBe(20);
  });

  it('holds at the keyframe once it arrives, and never starts behind where it was', () => {
    expect(glidePosition(glide, 9000)).toBe(20);
    expect(glidePosition(glide, 0)).toBe(10);
  });

  it('applies an easing to the time, not the distance', () => {
    expect(glidePosition(glide, 1250, (t) => t * t)).toBe(12.5);
  });
});

describe('replay', () => {
  const frames = ['a', 'b', 'c'];

  it('reads any frame directly, and clamps past the ends', () => {
    const source = replay(frames);
    expect(source.at(1)).toBe('b');
    expect(source.at(1.7)).toBe('b');
    expect(source.at(-3)).toBe('a');
    expect(source.at(99)).toBe('c');
    expect(source.length).toBe(3);
  });

  it('blends between frames when told how', () => {
    const source = replay([0, 10, 30], (a, b, t) => a + (b - a) * t);
    expect(source.at(1.5)).toBe(20);
    expect(source.at(2)).toBe(30);
  });

  it('refuses an empty replay', () => {
    expect(() => replay([])).toThrow(/at least one frame/);
  });
});

describe('trace', () => {
  const series = trace([
    [0, 0],
    [10, 1],
    [20, null],
    [30, 3],
  ]);

  it('draws up to the position, with the last point interpolated', () => {
    expect(series.at(5)).toEqual([
      [0, 0],
      [5, 0.5],
    ]);
    expect(series.at(10)).toEqual([
      [0, 0],
      [10, 1],
    ]);
  });

  it('does not reach across a gap', () => {
    expect(series.at(15)).toEqual([
      [0, 0],
      [10, 1],
    ]);
    expect(series.at(25)).toEqual([
      [0, 0],
      [10, 1],
      [20, null],
    ]);
  });

  it('shows nothing before the first point, and everything after the last', () => {
    expect(series.at(-1)).toEqual([]);
    expect(series.at(99)).toHaveLength(4);
  });
});

describe('proseDifference', () => {
  it('finds nothing when the text matches', () => {
    expect(proseDifference('Same words.', 'Same words.')).toBeNull();
  });

  it('points at where the versions part, with a little of each', () => {
    expect(proseDifference('The still claims one thing.', 'The still claims another.', 6)).toEqual({
      at: 17,
      still: '…laims one th…',
      live: '…laims anothe…',
    });
  });
});
