import { MonoBlock, Screenshot, Slide, Text } from '@mk-imagine/spa-slides';
import changesIgnoredCsv from '../images/changes-ignored-csv.png?image';

export function BackToRuleOne() {
  return (
    <Slide
      title="Back to Rule One"
      notes={[
        'Transition back to the rule now that they know what “tracking” concretely means. It would not have landed twenty minutes ago.',
      ]}
    >
      <p>Git is very good at tracking everything in a folder.</p>
      <p>That is a problem when the folder contains participant data.</p>
      <p>So we tell it what to ignore.</p>
    </Slide>
  );
}

export function GitignoreFile() {
  return (
    <Slide
      title={
        <>
          The <code>.gitignore</code> file
        </>
      }
      notes={[
        'Do not teach glob syntax. They need to recognise the file and trust it, not author it. Anyone who needs a custom rule will ask.',
      ]}
    >
      <p>A plain text file listing what Git should pretend it cannot see.</p>
      <MonoBlock align="start" size="small">
        {`
          # nothing in data/ is tracked
          data/*
          !data/README.md

          # data formats, anywhere
          *.sav
          *.csv
          *.xlsx
        `}
      </MonoBlock>
      <p>It is already in the template. You do not have to write one.</p>
    </Slide>
  );
}

export function ProveItWorks() {
  return (
    <Slide
      title="Prove it works"
      notes={[
        'This exercise is worth more than any explanation. Make sure every single person sees the empty Changes tab with their own eyes.',
        'Walk the room and confirm. Someone will have created the file in the wrong folder and will see it appear — that is a useful teaching moment, not a failure.',
      ]}
    >
      <p>
        <strong>Everyone do this now:</strong>
      </p>
      <ol>
        <li>
          Make a file called <code>participants.csv</code> inside the <code>data</code> folder
        </li>
        <li>Put any nonsense in it</li>
        <li>Save it</li>
        <li>Look at GitHub Desktop</li>
      </ol>
      <p>
        <strong>Nothing appears.</strong> Git cannot see it. That is the whole point.
      </p>
      <Screenshot
        image={changesIgnoredCsv}
        alt="GitHub Desktop, Changes tab empty, with participants.csv visible in Finder behind it"
        crop={{ left: 95, bottom: 449, right: 119, top: 85 }}
        maxHeight={0.33}
      />
    </Slide>
  );
}

export function TheTrap() {
  return (
    <Slide
      title="The trap"
      notes={['This is the one piece of mechanism they must retain. Everything else they can look up.']}
    >
      <Text as="p" size="large" align="center">
        <code>.gitignore</code> does <strong>not</strong> remove files
        <br />
        that are already committed.
      </Text>
      <p>If data goes in first and the ignore rule comes second, the rule does nothing.</p>
      <p>This is why it ships in the template, already there, from the first commit.</p>
    </Slide>
  );
}

export function WhyStrict() {
  return (
    <Slide
      title="Why we are strict about it"
      notes={[
        'Not a scare tactic — this is the accurate reason the rule is a rule rather than a preference.',
        'If asked about private repos: private helps, but none of the three bullets above change. Private is necessary, not sufficient.',
      ]}
    >
      <ul>
        <li>
          <strong>History is permanent.</strong> Committing a file and deleting it next does not remove it. It is still in
          the repo, still downloadable.
        </li>
        <li>
          <strong>Every copy is a full copy.</strong> Anyone with access holds the entire history on their own machine.
        </li>
        <li>
          <strong>Undoing it is genuinely hard.</strong> Rewriting history, force-pushing, contacting GitHub support, and
          hoping nobody already cloned it.
        </li>
      </ul>
      <p>Keeping data out is easy. Getting it back out is not.</p>
    </Slide>
  );
}
