# DR-1521: Reading Stars reward effort and improvement from the same rows as the badges

**Date:** 2026-11-17
**Status:** Accepted (planned; next phase after the v1 launch)
**Tier:** B (child-facing; derives from existing learner records; no schema, no auth, no RLS, no money)
**Type:** decision
**Area:** `docs/design/love-corner-kids/2026-11-17-reading-stars-plan.md` (the plan); to be built: `app/src/lib/kids/reading-stars.js`, a Reading Stars shelf on the Badges tab, three badge keys in `lib/youth-zone.js`, the `kids-reading` activities
**Sent in by:** Darrell, 2026-11-17: *"Children should earn stars for recognizing sight words, practicing phonics, reading sentences, completing Bible stories, and answering comprehension questions... Reward effort and improvement, not just perfect answers. Avoid penalties for mistakes or missed days. Keep Reading Stars connected to the existing badges and progress tracking rather than creating a disconnected rewards system. Do not delay our current Version 1 launch for this feature."*
**Pairs with:** DR-1508 (the Kids Zone), DR-1520 (the v1 launch), DR-0431 (Little Learners), DR-0093 (nothing public about a child), DR-0061 (reality-trace), DR-0076 (verification)

## Context

The Kids Zone v1 (DR-1520) is held for Darrell's word. Its badges and adventure map derive from learner records alone (`badgesFor` in `lib/youth-zone.js`); storybooks and lessons already write those rows with a quiz percentage; Little Learners already teaches letters, sounds and six sight words from the Word. Darrell asked for a reading-progress experience that celebrates effort, and asked that it ride the tracking that exists.

## What was measured

- `badgesFor` reads `completedAt`, `quizPassed` and `ageBand` from normalized rows; six badge keys exist. A finished storybook writes `storybook-<id>` under `kids-storybooks` with `quiz.pct` (Storybook.jsx); a Living Lesson at the Kids door writes its row; lil5 carries six sight words with their verses.
- No activity exists today for sight-word recognition, phonics practice or sentence reading as its own row.

## Impact

Without a rule written down first, a rewards layer would grow its own counters, streaks and penalties, the "disconnected rewards system" Darrell named. With it, every star is a derivation of a row that already exists or will exist for a real activity, counted once and shown in two places, and nothing is ever subtracted from a child.

## Decision

1. **Stars derive from learner records; there is no star store.** `readingStarsFor(records)` is pure over the same rows the badges read.
2. **Effort, improvement, whole: one, two, three.** One star for any completed reading row; a second when `quiz.pct` beats the child's own previous best on that activity; a third for every answer right. The comparison is only to the child's own earlier self.
3. **Never a penalty.** No star is removed for a wrong answer or a lower score; a gap of any length changes no count; there is no streak and no "missed" anything.
4. **Five skills, one shelf, connected badges.** Sight words, phonics, sentences, Bible stories, comprehension; three badge keys (`first-star`, `ten-stars`, `five-skills`) derive from the same rows.
5. **The words are the Word's.** Every word, sound set and sentence shown comes from a verse loaded verbatim (DR-0076); every encouragement line passes the voice gate.
6. **Not in the launch.** Nothing here enters PR #2696's scope; R1 begins after the merge.

## Verification

- The plan's §5 names the proven-to-catch tests each phase ships with: effort star on 0%, improvement only against own best, no subtraction, a 30-day gap changes nothing, zero signed out, the voice gate on every line.
- `re-review: 2026-12-05` — R1 built and green, or a why.
