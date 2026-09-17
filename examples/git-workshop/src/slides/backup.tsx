import { Screenshot, Slide, Text } from '@mk-imagine/spa-slides';
import orgInviteAccept from '../images/org-invite-accept.png?image';

export function JoiningTheLab() {
  return (
    <Slide
      appendix
      title="Backup: joining SuriRADLab"
      notes={[
        'Two-factor first is the ordering that matters. Turning it on after the invitation arrives means going back for a fresh one.',
        'Give the Settings route to anyone who says the email never arrived — the invitation lives on the account, not in the inbox, and the same page shows the days remaining.',
      ]}
    >
      <ol>
        <li>
          Have a GitHub account, and <strong>turn two-factor on first</strong> — the lab requires it, and you cannot accept
          the invitation without it
        </li>
        <li>Send me your username</li>
        <li>
          I send the invitation. It <strong>expires after seven days</strong>
        </li>
        <li>
          Accept it — from the email, or on <code>github.com</code> under <strong>Settings → Organizations</strong>
        </li>
        <li>
          Desktop then lists the lab’s repositories under <code>SuriRADLab</code>
        </li>
      </ol>
      <Screenshot
        image={orgInviteAccept}
        alt="github.com Settings > Organizations, SuriRADLab row with Accept and Decline"
        crop={{ left: 345, bottom: 49, right: 37, top: 175 }}
      />
    </Slide>
  );
}

export function DesktopCannotSeeRepos() {
  return (
    <Slide
      appendix
      title="Backup: Desktop cannot see the lab’s repos"
      notes={[
        'Tested from a plain member account on 2026-09-16: Desktop listed the lab’s repositories, so approval is the unlikely branch here, not the expected one.',
        'This one looks like the student did something wrong and they did not. Say so.',
      ]}
    >
      <p>First, check which account Desktop is signed in as. That is nearly always it.</p>
      <p>
        If the account is right, the lab may need to approve the app. Tell me — it is one click on my side. Or request it
        yourself:
      </p>
      <Text as="p" align="center">
        <code>github.com</code> → your picture → <strong>Settings</strong> → <strong>Applications</strong>
        <br />→ <strong>Authorized OAuth Apps</strong> → <strong>GitHub Desktop</strong> → <strong>Request access</strong>
      </Text>
      <p>
        Either way, you can still read the repositories on <code>github.com</code>.
      </p>
    </Slide>
  );
}

export function WhenYouLeave() {
  return (
    <Slide
      appendix
      title="Backup: when you leave the lab"
      notes={[
        'Worth saying out loud to anyone graduating soon: this is not about trust, it is about the lab still having its work in five years.',
      ]}
    >
      <ul>
        <li>
          The repositories stay in <code>SuriRADLab</code>. They belong to the lab.
        </li>
        <li>Your access ends when your membership does</li>
        <li>The copy on your laptop still opens, but it stops syncing</li>
        <li>Anything you kept in a personal repo leaves with you — which is the reason for all of the above</li>
      </ul>
    </Slide>
  );
}
