import { Columns, MonoBlock, Screenshot, Slide, Text } from '@mk-imagine/spa-slides';
import { Dual } from '../components/Dual';
import changesNewFile from '../images/changes-new-file.png?image';
import commitBox from '../images/commit-box.png?image';
import diffPane from '../images/diff-pane.png?image';
import githubCommitList from '../images/github-commit-list.png?image';
import summaryBox from '../images/summary-box.png?image';

/** A screenshot in a column beside the text, for crops taller than they are wide. */
const SIDE = { width: 1, maxHeight: 0.62 } as const;

export function OpenDesktop() {
  return (
    <Slide
      title="Everyone open GitHub Desktop"
      notes={[
        'Walk the room here. This is the first place people stall — usually not signed in, or not yet accepted into the org.',
        'Have the org invite link ready to re-send.',
      ]}
    >
      <p>
        We will all work in the same practice repository, <code>lab-sandbox</code>, which lives in the lab’s account.
      </p>
      <Dual
        gui={
          <>
            File → Clone repository → pick <code>SuriRADLab/lab-sandbox</code> → Clone
          </>
        }
        command="git clone <url>"
      />
      <p>
        <strong>Clone</strong> means “download a copy of this repo, with its whole history, and keep it connected to
        GitHub.”
      </p>
    </Slide>
  );
}

export function MakeAChange() {
  return (
    <Slide
      title="Make a change"
      notes={[
        '“Open the repo folder” — show them the Repository > Show in Finder / Show in Explorer menu item. Several people will not know where the clone went.',
        'One file each, not a shared one. Eight people editing the same file in the same ten minutes produces real merge conflicts, which we are not teaching. Separate files still produce the rejected push later, but the pull merges cleanly.',
      ]}
    >
      <Columns widths={[54, 44]}>
        <div>
          <p>
            Open the repo folder. Inside <code>notes/</code>, make a new file named after your GitHub username —{' '}
            <code>notes/jsmith.md</code>. Write anything in it. Save it.
          </p>
          <p>
            Switch back to GitHub Desktop. Your file is waiting in the <strong>Changes</strong> tab.
          </p>
          <p>
            <strong>The same thing, typed</strong>
            <br />
            <code>git status</code>
          </p>
        </div>
        <Screenshot
          image={changesNewFile}
          alt="GitHub Desktop, Changes tab, the new file listed"
          crop={{ bottom: 444, right: 708, top: 25 }}
          {...SIDE}
        />
      </Columns>
    </Slide>
  );
}

export function ReadTheDiff() {
  return (
    <Slide
      title="Read the diff"
      notes={[
        'Slow down here. This is the single most important screen in the workshop — the moment “version control” stops being abstract.',
        'Have them make a second edit and watch the diff update live before committing.',
      ]}
    >
      <p>This is the part that matters.</p>
      <ul>
        <li>
          <Text tone="positive">
            <strong>Green</strong>
          </Text>{' '}
          lines are what you added
        </li>
        <li>
          <Text tone="negative">
            <strong>Red</strong>
          </Text>{' '}
          lines are what you removed
        </li>
        <li>Everything else is unchanged</li>
      </ul>
      <p>
        Git does not save files. It saves <strong>differences</strong>.
      </p>
      <Screenshot
        image={diffPane}
        alt="GitHub Desktop diff pane, one green added line and one red removed line"
        crop={{ left: 250, bottom: 414, top: 105 }}
      />
    </Slide>
  );
}

export function NoReadableDiff() {
  return (
    <Slide
      title="Some files have no readable diff"
      notes={[
        'Most of their files will be exactly these — .sav, .xlsx, .docx. Say this without any suggestion that they are doing it wrong. Git is still worth it for those files; it just cannot narrate them.',
        'If someone asks why: a Word file is really a zipped folder of XML. That is the PK at the front, the same two letters every zip file starts with. Do not go further than that.',
        'This is the setup for the next slide. If the diff cannot explain the change, the message has to, and that is the whole argument for writing a real one.',
      ]}
    >
      <p>
        That worked because the file was plain text — <code>.R</code>, <code>.py</code>, <code>.md</code>,{' '}
        <code>.csv</code>. Text is made of lines, and Git compares lines.
      </p>
      <p>
        A Word document, an Excel workbook, a PDF, an SPSS file: none of these are made of lines. Open one up and it reads
        like this:
      </p>
      <MonoBlock size="small">{'PK#%… [Content_Types].xml …$&…'}</MonoBlock>
      <p>
        Git still handles them. Every version is saved, and you can still go back to any of them. What you lose is the{' '}
        <strong>picture of what changed</strong>.
      </p>
      <p>So for those files, your commit message is the only readable record. Which brings us to the next slide.</p>
    </Slide>
  );
}

export function WritingTheSummary() {
  return (
    <Slide
      title="Writing the summary"
      notes={[
        'Name both words once and move on. They will see “Summary” in Desktop and “commit message” everywhere else, and quietly wondering whether those are two different things is a real stumble.',
        'The prompt sentence is the trick that works. It forces present tense and forces intent.',
        'Tell them nobody writes perfect messages and a mediocre message beats no message. The failure mode to avoid is paralysis, not imprecision.',
      ]}
    >
      <p>
        Desktop will not let you commit until you type one line in the box at the bottom left, labelled{' '}
        <strong>Summary</strong>. Git calls that the commit message. It is the part your future self will actually read.
      </p>
      <Screenshot image={summaryBox} alt="GitHub Desktop, the empty Summary box" crop={{ bottom: 168 }} width={0.5} />
      <Columns widths={[32, 64]}>
        <div>
          <p>
            <strong>Not useful</strong>
          </p>
          <ul>
            <li>
              <code>update</code>
            </li>
            <li>
              <code>stuff</code>
            </li>
            <li>
              <code>asdf</code>
            </li>
            <li>
              <code>fixed it</code>
            </li>
          </ul>
        </div>
        <div>
          <p>
            <strong>Useful</strong>
          </p>
          <ul>
            <li>
              <code>Add exclusion criteria to methods</code>
            </li>
            <li>
              <code>Drop participants 12 and 19, incomplete</code>
            </li>
            <li>
              <code>Switch to Welch t-test, unequal variances</code>
            </li>
          </ul>
        </div>
      </Columns>
      <p>
        Finish the sentence: <em>“This change will…”</em>
      </p>
    </Slide>
  );
}

export function Commit() {
  return (
    <Slide
      title="Commit"
      notes={[
        'The commit/push split is the most common beginner confusion. Name it explicitly right here rather than letting them discover it.',
      ]}
    >
      <Columns widths={[54, 44]}>
        <div>
          <p>
            <strong>In GitHub Desktop</strong>
            <br />
            Type a summary in the box at the bottom left, then click <strong>Commit to main</strong>
          </p>
          <p>
            <strong>The same thing, typed</strong>
            <br />
            <code>{'git commit -m "your message"'}</code>
          </p>
          <p>
            Your change is now saved in the history <strong>on your computer</strong>. It is not on GitHub yet.
          </p>
        </div>
        <Screenshot
          image={commitBox}
          alt="GitHub Desktop, commit box filled in, Commit to main button"
          crop={{ right: 708, top: 440 }}
          {...SIDE}
        />
      </Columns>
    </Slide>
  );
}

export function Push() {
  return (
    <Slide
      title="Push"
      notes={[
        'Getting them onto github.com to see their own name in the history is the payoff moment. Do not skip it for time — cut something else.',
      ]}
    >
      <Dual
        gui={
          <>
            Click <strong>Push origin</strong> at the top
          </>
        }
        command="git push"
      />
      <p>Now it is on GitHub. Now it is backed up. Now your advisor can see it.</p>
      <p>
        Open the repo on <code>github.com</code> and find your own commit in the list.
      </p>
      <Screenshot
        image={githubCommitList}
        alt="github.com repository page, commit list with a student’s commit message"
        crop={{ left: 100, bottom: 236, right: 652, top: 235 }}
      />
    </Slide>
  );
}

export function Checkpoint() {
  return (
    <Slide
      title="Checkpoint"
      notes={[
        'Deliberate breathing point. Take questions here — roughly the 30 minute mark.',
        'If the room is behind, this is the place to slow down. The .gitignore segment can compress; this cannot.',
      ]}
    >
      <p>You have just done the entire daily workflow:</p>
      <Text as="p" size="large" align="center">
        edit → commit → push
      </Text>
      <p>
        Everything else is a variation on this. If you stopped learning Git right now, you would still be ahead of the
        folder full of <code>_FINAL_v3</code>.
      </p>
    </Slide>
  );
}
