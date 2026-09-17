import { Slide } from '../lib/Slide';
import { LogisticSim } from '../components/LogisticSim/LogisticSim';
import { SlideTitle } from '../lib/layout';

export function SimSlide() {
  return (
    <Slide notes="Live simulation. Drag the learning rate up past 3 to show oscillation. Click to add outliers.">
      <SlideTitle>Gradient descent, live</SlideTitle>
      <LogisticSim seed={7} />
    </Slide>
  );
}
