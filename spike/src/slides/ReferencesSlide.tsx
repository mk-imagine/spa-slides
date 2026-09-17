import { Slide } from '../lib/Slide';
import { References } from '../lib/cite';
import { SlideTitle } from '../lib/layout';

export function ReferencesSlide() {
  return (
    <Slide notes="Generated from src/refs.bib at build time, APA via CSL.">
      <SlideTitle>References</SlideTitle>
      <References />
    </Slide>
  );
}
