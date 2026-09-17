import { Slide, Text } from '@mk-imagine/spa-slides';

export function ThreeWords() {
  return (
    <Slide
      title="Three words"
      notes={[
        'Resist adding a fourth word. Staging, HEAD, index, origin — all can wait. Three is what fits in working memory alongside learning an interface.',
      ]}
    >
      <dl>
        <dt>Repository</dt>
        <dd>A project folder that Git is watching. “Repo” for short.</dd>
        <dt>Commit</dt>
        <dd>A saved state of that folder, plus a note saying why.</dd>
        <dt>Remote</dt>
        <dd>The copy that lives on GitHub.</dd>
      </dl>
      <p>That is the whole vocabulary for today.</p>
    </Slide>
  );
}

export function DailyLoop() {
  return (
    <Slide
      title="The loop you will run every day"
      notes={[
        'This is the ritual. Say it twice here and once more at the end. Nearly every problem a beginner hits is caused by skipping the pull.',
      ]}
    >
      <ol>
        <li>
          <strong>Pull</strong> — get the latest version
        </li>
        <li>
          <strong>Work</strong> — edit your files like normal
        </li>
        <li>
          <strong>Commit</strong> — save a checkpoint, and say why
        </li>
        <li>
          <strong>Push</strong> — send it to GitHub
        </li>
      </ol>
      <p>Pull when you sit down. Push when you stand up.</p>
    </Slide>
  );
}

export function RuleOne() {
  return (
    <Slide
      title="Rule One"
      notes={[
        'State it before they touch anything, so the first thing they learn is the guardrail. We come back to the mechanism in twenty minutes.',
        'Some of you may have protocols that do cover GitHub — that is between you, your PI, and the IRB. The default is out.',
        'Do not adjudicate anyone’s specific protocol live. Redirect to their PI.',
      ]}
    >
      <Text as="p" size="large" align="center">
        <strong>Participant data does not go in the repository.</strong>
      </Text>
      <Text as="p" align="center">
        Unless your own IRB protocol specifically covers GitHub.
        <br />
        If you are not sure: it stays out.
      </Text>
      <p>
        Your code, your notes, and your write-up go in. Your data stays where your protocol already says it lives.
      </p>
    </Slide>
  );
}
