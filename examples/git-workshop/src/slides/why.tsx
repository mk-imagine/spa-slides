import { MonoBlock, Slide } from '@mk-imagine/spa-slides';

export function WhereWeAreGoing() {
  return (
    <Slide
      title="Where we are going"
      notes={[
        'Set expectations immediately. The list is deliberately short and every item is something they will do with their own hands.',
        'Naming what we are skipping prevents the “am I missing something” anxiety, and pre-empts anyone who has read a tutorial.',
      ]}
    >
      <p>By the end of today you will be able to:</p>
      <ul>
        <li>Put a project under version control</li>
        <li>
          Save a change, with a note explaining <em>why</em> you made it
        </li>
        <li>Send that change to GitHub, and pull it back on another computer</li>
        <li>Keep it in the lab’s account, where Dr.&nbsp;Suri can see it</li>
        <li>
          Keep participant data <strong>out</strong> of it
        </li>
      </ul>
      <p>
        We are <strong>not</strong> covering branching or merging today. You do not need them to start, and I did not use
        them for my first year either.
      </p>
    </Slide>
  );
}

export function YouAlreadyHaveVcs() {
  return (
    <Slide
      title="You already have a version control system"
      notes={[
        'Ask for a show of hands. Everyone has this folder. The laugh is the point: the problem is already familiar, so Git is a solution to something they feel rather than a new obligation.',
        'Follow-up question to the room: which one produced the number in your poster?',
      ]}
    >
      <MonoBlock>
        {`
          analysis.R
          analysis_v2.R
          analysis_v2_fixed.R
          analysis_FINAL.R
          analysis_FINAL_v3.R
          analysis_FINAL_v3_USE_THIS_ONE.R
        `}
      </MonoBlock>
      <p>It is just a bad one.</p>
    </Slide>
  );
}

export function WhatIsWrong() {
  return (
    <Slide
      title="What is wrong with the folder"
      notes={[
        'Drive gives you offsite backup and that is genuinely valuable. It does not give you intent, and intent is the thing you actually need six months later.',
        'Drive’s own version history is per-file, unlabelled, and time-based. Git’s is per-project, labelled, and reason-based.',
      ]}
    >
      <ul>
        <li>
          You cannot tell what actually <strong>changed</strong> between two of them
        </li>
        <li>
          You cannot tell <strong>why</strong> any change was made
        </li>
        <li>You cannot get back to “the version that made Figure 3”</li>
        <li>If the laptop dies, all of it dies</li>
      </ul>
      <p>Google Drive fixes exactly one of these.</p>
    </Slide>
  );
}

export function WhatGitGives() {
  return (
    <Slide
      title="What Git gives you instead"
      notes={[
        'Lead with 1 and 2 — those are the ones they will feel in the first week. 3 and 4 matter later but are what makes this worth doing at all.',
        'The last line is the sentence to repeat if they remember nothing else.',
      ]}
    >
      <ol>
        <li>
          <strong>History and undo</strong> — every saved state, forever, with a reason attached
        </li>
        <li>
          <strong>Backup</strong> — your work exists on GitHub’s servers, not just your laptop
        </li>
        <li>
          <strong>A legible record</strong> — your advisor can see what you did without a folder tour
        </li>
        <li>
          <strong>Reproducibility</strong> — “Figure 3 came from <em>this exact state</em> of the code”
        </li>
      </ol>
      <p>
        Drive syncs <strong>files</strong>. Git records <strong>decisions</strong>.
      </p>
    </Slide>
  );
}
