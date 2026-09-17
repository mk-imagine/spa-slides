import { Columns, Screenshot, Slide, StandoutSlide } from '@mk-imagine/spa-slides';
import templateOwner from '../images/template-owner.png?image';

export function YourRepoOrTheLabs() {
  return (
    <Slide
      title="Your repo, or the lab’s?"
      notes={[
        'The URL is the whole check, and it is visible on every page. Teach them to read the owner rather than to trust that they picked right.',
        'A personal account is still the right place for personal things — coursework, side projects. What belongs to the lab lives in the lab.',
      ]}
    >
      <Columns>
        <div>
          <p>
            <code>
              github.com/<strong>you</strong>/project
            </code>
          </p>
          <ul>
            <li>You own it</li>
            <li>Dr.&nbsp;Suri cannot see it</li>
            <li>It leaves with you</li>
            <li>Nobody can recover it for you</li>
          </ul>
        </div>
        <div>
          <p>
            <code>
              github.com/<strong>SuriRADLab</strong>/project
            </code>
          </p>
          <ul>
            <li>The lab owns it</li>
            <li>Dr.&nbsp;Suri sees it, and so does the lab</li>
            <li>It stays when you leave</li>
            <li>Owners can always get to it</li>
          </ul>
        </div>
      </Columns>
      <p>
        Same files either way. Different address. <strong>Check the address.</strong>
      </p>
    </Slide>
  );
}

export function MakingYourRepo() {
  return (
    <Slide
      title="Making your project repo"
      notes={[
        'The Owner dropdown is the single step where work silently ends up outside the lab. Pause on it.',
        'Private is the default posture for lab work. Public is a decision, made with the PI, usually at publication.',
      ]}
    >
      <p>
        Open the template on <code>github.com</code> and click <strong>Use this template</strong>.
      </p>
      <ol>
        <li>
          <strong>Owner</strong>: choose <code>SuriRADLab</code>, not your username
        </li>
        <li>
          Name it after the project, and leave it <strong>Private</strong>
        </li>
        <li>Create it, then clone it in Desktop</li>
      </ol>
      <p>
        Picked the wrong owner? <strong>Settings → Transfer ownership → SuriRADLab</strong>. Old links keep working.
      </p>
      <Screenshot
        image={templateOwner}
        alt="Use this template form, Owner dropdown open with SuriRADLab selected"
        crop={{ left: 275, bottom: 604, right: 502, top: 225 }}
      />
    </Slide>
  );
}

export function Readme() {
  return (
    <Slide
      title="Your README is the front door"
      notes={[
        'This replaces the “let me walk you through my Drive folder” conversation, which is the actual thing the lab is trying to fix.',
      ]}
    >
      <p>
        When someone opens your repo on GitHub, the <code>README.md</code> is what they see.
      </p>
      <p>Keep it short and keep it current:</p>
      <ul>
        <li>What this project is</li>
        <li>Where the data actually lives (not here)</li>
        <li>How to run the analysis</li>
      </ul>
      <p>The template has a skeleton. Fill it in this week.</p>
    </Slide>
  );
}

export function ThisWeek() {
  return (
    <Slide
      title="This week"
      notes={[
        'Name the support channel explicitly — Slack, email, office hours, whatever it is.',
        'The last line matters. The main reason people abandon Git is deciding they are uniquely bad at it.',
      ]}
    >
      <ol>
        <li>
          Make a repo for one real project from the template, owned by <code>SuriRADLab</code>
        </li>
        <li>Fill in the README</li>
        <li>Commit and push at least once a day</li>
      </ol>
      <p>You have the one-page cheat sheet. Everything from today is on it.</p>
      <p>Stuck? Ask me. Being stuck for twenty minutes is normal and is not a sign you are bad at this.</p>
    </Slide>
  );
}

export function WhatWeSkipped() {
  return (
    <Slide title="What we skipped, for later" notes={['Leaves the door open without implying today was incomplete.']}>
      <ul>
        <li>
          <strong>Branches</strong> — working on something risky without touching your main copy
        </li>
        <li>
          <strong>Pull requests</strong> — proposing a change and discussing it before it lands
        </li>
        <li>
          <strong>Merge conflicts</strong> — what happens when two edits collide
        </li>
      </ul>
      <p>
        None of it is needed until you are collaborating on the same files. Second session if there is appetite.
      </p>
    </Slide>
  );
}

export function Takeaways() {
  return (
    <StandoutSlide>
      <p>
        Pull when you sit down.
        <br />
        Push when you stand up.
      </p>
      <p>Lab work lives in the lab’s account.</p>
      <p>Data stays out.</p>
    </StandoutSlide>
  );
}
