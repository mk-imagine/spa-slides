import { Screenshot, Slide } from '@mk-imagine/spa-slides';
import cloneDialog from '../images/clone-dialog.png?image';

export function WhereYourWorkLives() {
  return (
    <Slide
      title="Where your work lives"
      notes={[
        'Say the payoff plainly: work inside the org is visible to the PI by default. Work outside it is invisible until the student remembers to share it, and nobody remembers.',
        'This is also the answer to “what happens to my analysis when I graduate” — it stays, and it stays readable.',
      ]}
    >
      <p>
        <strong>SuriRADLab</strong> is the lab’s own account on GitHub. Not yours, not mine — the lab’s.
      </p>
      <ul>
        <li>Every lab project belongs in it, including yours</li>
        <li>Dr.&nbsp;Suri can see everything in it, without being added to anything</li>
        <li>It stays with the lab after you graduate</li>
      </ul>
      <p>You joined it before today. That is what the invitation email was.</p>
    </Slide>
  );
}

export function CheckYouAreIn() {
  return (
    <Slide
      title="Check that you are in"
      notes={[
        'This is the gate for everything that follows. Walk the room and confirm every screen before moving on, because a student who cannot see the repo cannot do any of the next fifteen minutes.',
        'Check the signed-in account first — Desktop’s Settings/Preferences shows it. People sign in with a personal account and get invited on a university one.',
      ]}
    >
      <p>
        In GitHub Desktop: <strong>File → Clone repository</strong>. You should see <code>SuriRADLab/lab-sandbox</code> in
        the list.
      </p>
      <p>Not there? It is one of these:</p>
      <ul>
        <li>The invitation is still in your email — it expires after seven days</li>
        <li>Two-factor is not on yet, so you cannot accept it</li>
        <li>Desktop is signed in as a different account than the one I invited</li>
      </ul>
      <Screenshot
        image={cloneDialog}
        alt="GitHub Desktop, File > Clone repository dialog, GitHub.com tab, SuriRADLab/lab-sandbox in the list"
        crop={{ left: 50, bottom: 314, right: 479, top: 175 }}
        maxHeight={0.34}
      />
    </Slide>
  );
}
