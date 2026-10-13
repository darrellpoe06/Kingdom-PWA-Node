---
id: DR-0988
title: A drained lesson keeps its day — declared with its provenance, not by loosening the threshold
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0687, DR-0986]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-13 — the blocker DR-0987 measured while attempting DR-0986's first drain
---

## Context

DR-0687 records the day every lesson was created, from git, on Darrell's own
words: *"Add all the days the lessons were created so we can have all of them in
each course so they can get done."* DR-0986 then decided the 52-PR backlog is
drained oldest-first. The **first drain** — PR #1217, a Godhead Study teaching
authored 2026-08-09 — hit a contradiction that no single file can satisfy, and
DR-0987 recorded it as a blocker rather than papering over it.

The generator reads `git log … HEAD` and checks `rev-list HEAD`. The lane
**squash**-merges. So a lesson authored on a branch two months ago has two
different true answers depending on which side you ask from.

## What was measured

Simulated rather than argued — a worktree off `main`, `git merge --squash` of
the drain, then `lesson-dates:check`:

| | |
|---|---|
| on the PR head (its real commits) | generator derives **2026-08-09** |
| on `main` after the squash | those commits unreachable; derives **2026-10-13** |
| `merge-base --is-ancestor 6600e1bc HEAD` on simulated main | **false** |
| the gap | **65 days** |
| `SQUASH_GRACE_DAYS` | **14** |
| `lesson-dates:check` on the simulated squash | **exit 1** |

`judgeEntry`'s unreachable-commit path fails on exactly one condition —
`gap > SQUASH_GRACE_DAYS` — and 65 > 14. The same `lesson-dates.json` cannot be
right on both the PR and on `main`, so **any** drain of an old PR that carries
new lessons reddens this gate on one side or the other. That is a property of
draining, not of #1217.

## Impact

Left alone it makes DR-0986's decision unexecutable for a whole class of the
backlog: every parked PR that adds a lesson. It would also quietly push the
wrong fix — running the generator on `main` after such a merge rewrites the real
authoring day to the merge day, so a teaching Darrell gave in August would be
recorded as October, in the one file whose entire job is to say when it was
given.

Nothing is at risk today: the gate is correctly red for the one blocked PR and
green for everything else.

## Decision

1. **A drained lesson's day is DECLARED, per lesson, with its provenance** —
   `SQUASHED_AWAY` in `scripts/lesson-dates-core.mjs`, keyed by lesson id,
   carrying `day`, `pr` and `why`. `judgeEntry` honours a declaration **only
   when its `day` equals the day the file records**, so it cannot bless a day
   nobody checked, and it covers only the id it names.
2. **`SQUASH_GRACE_DAYS` stays at 14, untouched.** Raising it to admit 65 days
   would weaken the "is this really a squash?" question for *every* lesson, and
   that question is the grace's whole purpose — it catches a hand-edited wrong
   day. A declared exception is strictly stronger: it admits exactly the one
   lesson somebody can account for, and nothing else.
3. **The refusal now tells the reader what to do**, naming the id: *"if a drain
   squashed its branch away, declare '<id>' in SQUASHED_AWAY with its day, pr
   and why"*. A gate that refuses without naming the remedy sends the next
   person to the easy wrong fix (regenerate, lose the real day).
4. **Empty is the correct shipped state.** The mechanism lands with no
   declarations; an entry means a drain happened and was accounted for. This is
   the same shape as `constraint-allow-list-guard`'s declarations — an exception
   is **data in the repository with a reason attached**, not a threshold moved.
5. **NOT chosen: extending `RECORDED_ELSEWHERE` to the Eternal Algorithms
   course.** That mechanism makes a hand file authoritative for a WHOLE course,
   which would mean hand-recording all ~157 Godhead cards and giving up git as
   the source for every one of them to solve a problem affecting seven. The
   precedent was the right place to look — it is where I looked first — but the
   narrower tool is the right one to use.
6. **NOT chosen: merging such a PR without squashing.** It would preserve the
   commits and need no mechanism at all, but it fights the lane's single merge
   method (DR-0103) for every future drain, and the lane is load-bearing.
7. **NOT done here: re-landing PR #1217.** The mechanism ships on its own with
   its gate, then the teaching comes back using it — content and mechanism in
   separate changes, so a failure in either is unambiguous. `re-review:
   2026-10-16`.

## Verification

- **The blocker was measured, not predicted** — simulated squash, unreachable
  commit confirmed by `merge-base --is-ancestor`, `lesson-dates:check` exit 1.
  Run rather than reasoned specifically because I predicted a fourth masked
  smoke failure earlier the same night and was wrong.
- **The mechanism is PROVEN TO CATCH and proven to be NARROW** — 12 tests, every
  one against the real shape of the blocker (`2026-08-09` recorded, `2026-10-13`
  in history, own commit unreachable):
  - the 65-day gap is refused with no declaration, and the refusal names the id;
  - a declaration accepts it;
  - **a different recorded day is still refused** even with the declaration
    present — the declaration cannot bless an unchecked day;
  - a **sibling** lesson is still refused — it covers only the id it names;
  - an entry whose commit **is** reachable is unaffected (exact match still
    required, wrong day still caught);
  - a day **after** history is still refused;
  - an ordinary within-grace squash still passes with no declaration.
- **`SQUASH_GRACE_DAYS === 14` is asserted in the test**, so the thing this
  record declines to do cannot be done quietly later.
- The declaration shape is asserted: any live entry must carry an ISO `day`, a
  numeric `pr`, and a `why` of real length.
- `lesson-dates.test.js` (16 tests, the existing gate) still green; the one
  internal caller was updated to pass the id it already had in hand.
- **Three brittle assertions of my own, caught and fixed**, which is worth
  recording because they were all the same mistake: a gate floor written as
  `refs.length > 300` (a census pretending to be a guard — DR-0987), then a
  prose assertion spanning a wrapped comment, then the same assertion after
  collapsing whitespace, which still failed because the JSDoc `*` markers
  survive. Prose assertions are now short fragments that cannot cross a line,
  with the reasoning in a comment.
- **Not verified:** that the declaration path works end-to-end on a real squash
  merge. These tests exercise `judgeEntry` directly with the blocker's exact
  values; the end-to-end proof is #1217 re-landing green on both sides, which is
  decision 7's work. `re-review: 2026-10-16`.

## Links

[DR-0987] (a quoted verse is the corpus — the record that measured this blocker
and shipped the Scripture fix without it), [DR-0986] (the stale-but-real PR has
no lane — the decision to drain, whose first drain found this), [DR-0687] (every
lesson carries the real day it was created, and Darrell's words behind it),
[DR-0103] (the lane squash-merges — why merging differently was not chosen),
[DR-0076] (a declared exception with a reason beats a loosened threshold),
`scripts/constraint-allow-list-guard.mjs` (the declaration pattern this follows).
