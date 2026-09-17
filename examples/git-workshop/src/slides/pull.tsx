import { MonoBlock, Screenshot, Slide, Text } from '@mk-imagine/spa-slides';
import { Dual } from '../components/Dual';
import pullOrigin from '../images/pull-origin.png?image';

export function Pull() {
  return (
    <Slide
      title="Pull"
      notes={[
        'Push a change to the sandbox from the instructor machine right now, live, and have them pull it. Seeing something arrive makes pull concrete.',
      ]}
    >
      <Dual
        gui={
          <>
            Click <strong>Fetch origin</strong>, then <strong>Pull origin</strong> if there is anything to get
          </>
        }
        command="git pull"
      />
      <p>This brings down changes made somewhere else — by your PI, or by you on a different computer.</p>
      <Screenshot
        image={pullOrigin}
        alt="GitHub Desktop, Pull origin button showing 1 commit available"
        crop={{ left: 470, bottom: 572, right: 229, top: 28 }}
        width={0.62}
      />
    </Slide>
  );
}

export function TheOneProblem() {
  return (
    <Slide
      title="The one problem you will actually hit"
      notes={[
        'Show them the actual error text so it is familiar rather than alarming when it appears at 11pm.',
        'Since nobody is co-editing the same files, this is essentially the only conflict situation they will meet.',
      ]}
    >
      <p>You work on the lab desktop. You go home. You work on your laptop. You forgot to pull.</p>
      <MonoBlock size="small">
        {`
          ! [rejected] main -> main (fetch first)
          Updates were rejected because the remote contains
          work that you do not have locally.
        `}
      </MonoBlock>
      <p>
        This is not broken. Git is telling you there is something you have not seen yet.{' '}
        <strong>Pull first, then push.</strong>
      </p>
    </Slide>
  );
}

export function TheRitual() {
  return (
    <Slide
      title="The ritual"
      notes={['Third and final repetition. This is the habit that determines whether they are still using Git in a month.']}
    >
      <Text as="p" size="large" align="center">
        <strong>Pull when you sit down.</strong>
        <br />
        <strong>Push when you stand up.</strong>
      </Text>
      <p>Do that and the previous slide never happens to you.</p>
    </Slide>
  );
}
