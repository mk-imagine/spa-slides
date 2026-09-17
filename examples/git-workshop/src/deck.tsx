import { Deck, Text, TitleSlide } from '@mk-imagine/spa-slides';
import { DesktopCannotSeeRepos, JoiningTheLab, WhenYouLeave } from './slides/backup';
import { Checkpoint, Commit, MakeAChange, NoReadableDiff, OpenDesktop, Push, ReadTheDiff, WritingTheSummary } from './slides/core-loop';
import { BackToRuleOne, GitignoreFile, ProveItWorks, TheTrap, WhyStrict } from './slides/gitignore';
import { CheckYouAreIn, WhereYourWorkLives } from './slides/lab-org';
import { DailyLoop, RuleOne, ThreeWords } from './slides/mental-model';
import { Pull, TheOneProblem, TheRitual } from './slides/pull';
import { WhatGitGives, WhatIsWrong, WhereWeAreGoing, YouAlreadyHaveVcs } from './slides/why';
import { MakingYourRepo, Readme, Takeaways, ThisWeek, WhatWeSkipped, YourRepoOrTheLabs } from './slides/wrap';

export function GitWorkshop() {
  return (
    <Deck
      meta={{
        title: 'Version Control for the Lab',
        subtitle: 'Git and GitHub, from zero',
        author: 'Mark Kim',
        institute: 'San Francisco State University',
        date: 'Friday, September 18, 2026',
      }}
    >
      {/* 0–6 min: why */}
      <TitleSlide>
        <Text as="p" size="small" italic>
          Bring a laptop. You will be typing.
        </Text>
      </TitleSlide>
      <WhereWeAreGoing />
      <YouAlreadyHaveVcs />
      <WhatIsWrong />
      <WhatGitGives />

      {/* 6–10 min: mental model */}
      <ThreeWords />
      <DailyLoop />
      <RuleOne />

      {/* 10–14 min: the lab's organization */}
      <WhereYourWorkLives />
      <CheckYouAreIn />

      {/* 14–30 min: hands-on core loop */}
      <OpenDesktop />
      <MakeAChange />
      <ReadTheDiff />
      <NoReadableDiff />
      <WritingTheSummary />
      <Commit />
      <Push />
      <Checkpoint />

      {/* 30–37 min: .gitignore and the data rule */}
      <BackToRuleOne />
      <GitignoreFile />
      <ProveItWorks />
      <TheTrap />
      <WhyStrict />

      {/* 37–42 min: pull and the two-machine trap */}
      <Pull />
      <TheOneProblem />
      <TheRitual />

      {/* 42–50 min: wrap */}
      <YourRepoOrTheLabs />
      <MakingYourRepo />
      <Readme />
      <ThisWeek />
      <WhatWeSkipped />
      <Takeaways />

      {/* Backup: not presented. Answers to the questions that come up after. */}
      <JoiningTheLab />
      <DesktopCannotSeeRepos />
      <WhenYouLeave />
    </Deck>
  );
}
