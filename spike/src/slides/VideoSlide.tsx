import { Slide } from '../lib/Slide';
import { Video } from '../components/Video';
import { asset } from '../lib/assets';
import { SlideTitle } from '../lib/layout';

export function VideoSlide() {
  return (
    <Slide notes="Video loads from the media folder next to index.html. Plays on enter, pauses on leave.">
      <SlideTitle>Embedded video from the assets folder</SlideTitle>
      <Video
        src={asset('media/LinearToSigmoid.mp4')}
        poster={asset('media/LinearToSigmoid-poster.png')}
        label="Animation: from a straight line to a sigmoid"
      />
    </Slide>
  );
}
