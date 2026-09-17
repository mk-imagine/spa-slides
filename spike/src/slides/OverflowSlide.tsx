import { Slide } from '../lib/Slide';
import { SlideTitle } from '../lib/layout';

const TOO_MANY_POINTS = [
  'This slide is deliberately overfull so the overflow check has something to catch.',
  'AI-authored slides most often fail by overflowing: the code looks fine, the render does not.',
  'Every bullet here is long enough to wrap onto a second line at body text size on a 1920 by 1080 canvas.',
  'The check renders each slide in headless Chromium and compares element bounds against the slide box.',
  'Anything that extends past the bottom or right edge of the slide is reported with its selector and overshoot.',
  'Reveal centers slides vertically, so an overfull slide spills off both the top and the bottom edge.',
  'That makes it especially easy to miss when only glancing at the middle of the slide in a browser.',
  'A useful library would run this check on every build and fail loudly rather than warn quietly.',
  'Ninth point, still going, because authors under deadline tend to keep adding just one more thing.',
  'Tenth point. The first draft of this slide stopped here and still fit, which the check correctly reported.',
  'Eleventh point, added because the author guessed at the layout instead of measuring it.',
  'Twelfth point: guessing is exactly the failure mode the check exists to replace.',
  'Thirteenth point, which should now push the list past the bottom edge of the canvas.',
  'Fourteenth point, for good measure.',
  'Fifteenth point. If this still fits, the check is broken.',
];

export function OverflowSlide() {
  return (
    <Slide notes="Should be flagged by the overflow check.">
      <SlideTitle>Deliberately overfull slide</SlideTitle>
      <ul>
        {TOO_MANY_POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </Slide>
  );
}
