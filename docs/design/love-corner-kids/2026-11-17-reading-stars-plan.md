# Reading Stars: the Kids Zone literacy development plan (next phase, after the v1 launch)

**Sent in by:** Darrell, 2026-11-17: *"Children should earn stars for recognizing sight words, practicing phonics, reading sentences, completing Bible stories, and answering comprehension questions... Reward effort and improvement, not just perfect answers. Avoid penalties for mistakes or missed days. Keep Reading Stars connected to the existing badges and progress tracking... Do not delay our current Version 1 launch."*
**Record:** DR-1521. **Pairs with:** DR-1508 (the Kids Zone), DR-1520 (v1 launch), DR-0431 (Little Learners), DR-0093 (nothing public about a child), DR-0061 (reality-trace first), DR-0076 (verification).
**Status:** planned; nothing here is in PR #2696's launch scope.

## 1. Reality-trace (the premise, written before code)

- **The record is the one that exists.** A learner record (`saveLearnerRecord` / `fetchLearnerRecords`; `normalizeRecord` in `lib/youth-zone.js`) carries `lessonId`, `courseKey`, `ageBand`, `completedAt` and `quiz.{passed,pct,attempts}`. Badges (`badgesFor`) and the adventure map already derive from those rows and nothing else. Reading Stars derive from the same rows. There is no second store, no star table, no streak counter.
- **Four of the five star sources already write rows.** A finished storybook writes `storybook-<id>` under `kids-storybooks` (Storybook.jsx); its three questions are the comprehension answers (`quiz.pct`); a Living Lesson read at the Kids door writes its row with the lesson's quiz. Little Learners lil1 to lil3 teach letters and sounds and lil5 teaches six sight words from the Word (light, good, day, night, made, love), each with a quiz row.
- **One source is new.** Sight-word recognition, phonics practice and sentence reading as their own short activities do not exist yet; they become rows under one new course key, `kids-reading`, with `lessonId` of the shape `sight-<set>`, `phonics-<pattern>`, `sentence-<ref>`.
- **The words are the Word's.** Sight words come from lil5 and from the weekly verse's short words (the Word Builder already loads the verse verbatim from the hosted KJV); phonics sets come from the letters lessons; a sentence is a phrase of a storybook page cut at the verse's own punctuation (`phrasesOf` in `lib/kids/word-builder.js`). Nothing is typed into the app (DR-0076).

## 2. The rule: effort and improvement, never a penalty

`readingStarsFor(records, { now })` in `lib/kids/reading-stars.js`, pure and tested:

1. **One star for the effort**: every completed row in a reading skill earns one star, whatever the score. Finishing is the achievement.
2. **One more for the improvement**: a row whose `quiz.pct` is higher than the child's own previous best on the same `lessonId` earns a second star. The comparison is only ever to the child's own earlier self.
3. **A third for the whole**: a row with every answer right earns a third star. Perfect is celebrated, never required.
4. **Nothing is ever taken away.** A wrong answer says "not yet" (as every kids game already does); a lower score than before earns the effort star and says so kindly; a day, a week or a month with no rows changes nothing on the shelf. There is no streak, no "missed" count, no reminder that shames.
5. **Five skills, one shelf**: sight words, phonics, sentences, Bible stories (a finished storybook or a finished lesson), comprehension (any quiz answered). A skill's count is the sum of its rows' stars.

## 3. The experience

- **The Reading Stars shelf on the Badges tab**: a night sky that fills with stars, one row per skill with its stars and the girl or the boy beside it (girl-encourage, boy-cheer from the artwork collection; the approved reference until they land). Signed out: an empty sky and the invitation to sign in, never painted stars (P15).
- **The celebration**: the moment a row is saved, the guide's bubble says what the star was for in the child's words ("You read every page of Jonah!"; "Better than last time!"), with the app's own read-aloud. Every line passes `checkVoices` (lib/kids/voice-gate.js) before it ships.
- **On the Reading corner door and the Little Ones door**: the child's star count for that skill, from the rows.
- **Grown-ups tab**: the five counts and one sentence each on what the skill is and how a star is earned.

## 4. Connected to the badges, not beside them

Three badge keys join `BADGES` and derive from the same rows: `first-star` (any reading star), `ten-stars`, `five-skills` (a star in every skill). The adventure map's stops keep lighting from finished lessons and storybooks exactly as today. One row, counted once, shown in two places.

## 5. Proven to catch (DR-0076 §3), before any of it ships

- Pure tests: the effort star on a 0% row; the improvement star only when `pct` beats the child's own best; three stars for 100%; a lower score never subtracts; a 30-day gap leaves every count unchanged; no row, no star.
- Render tests: the shelf shows zero and the invitation signed out; stars from a fixture of rows signed in; the celebration line is the one the row earned; every encouragement line passes the voice gate.
- The legibility guard and the UI-standards set on the new surface; the layout probe at 360 px.

## 6. Phases

| Phase | Scope | Done when |
|---|---|---|
| R1 | `readingStarsFor` + the shelf + the three badges, derived from the rows that already exist (storybooks, lessons, Little Learners) | stars appear on day one for a child who has finished anything; tests above green |
| R2 | Sight-word, phonics and sentence activities writing `kids-reading` rows, each from the Word verbatim | every word and sentence shown is proven to be in its verse; rows land; the shelf counts them |
| R3 | Celebrations with the girl-encourage and boy-cheer renders; the Grown-ups counts | the voice gate passes every line; the landed renders replace the reference in place |

Nothing about a child beyond the learner records that exist today (DR-0093). Tier B; no schema, no auth, no money.
