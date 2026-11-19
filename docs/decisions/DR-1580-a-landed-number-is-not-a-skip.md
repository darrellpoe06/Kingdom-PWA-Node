# DR-1580: A landed number is not a skipped number

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (two gates read the state they already claim to read; no lesson, no schema, no workflow changed)
**Type:** orchestration
**Area:** `scripts/lib/reserve-ref.mjs`, `app/src/__tests__/living-lessons-id-collision.test.js`, `app/src/__tests__/the-lesson-count-is-derived.test.jsx`
**Sent in by:** Darrell, 2026-11-18: *"Does the lessons from the research work fastest... what path should I use based on outcome for new lessons"* and *"We want to fix it so we have fast lanes for these sequences after this lesson"*.
**Pairs with:** DR-1468 (parallel lessons, one reserved number each), DR-1477 (lessons land in any order), DR-0763 (the count label's two branches), DR-0644 (keep-prs-current), DR-0108 (review our Ways), DR-0076 section 3

## Context

Four lessons were built in one evening on their own branches, numbered L330 to L334 because other sessions held L324 to L329 and L332. None had landed after three hours. Each fault below was found one CI cycle at a time.

## What was measured

| what | measured |
| --- | --- |
| a landing reddens every other lesson branch | L324 landed 02:25Z and L325 at 03:21Z. Each time `living-lessons-id-collision.test.js` failed on every open lesson branch with "a session skipped a number: 324" then "325". The check excuses a missing number only if it is reserved on origin at that moment; `sweep-reservations` deletes the reservation when the lesson lands; a branch cut earlier does not hold the lesson yet. |
| reproduced | on a branch without L325 the check fails; `git fetch` of main's tip (trees only) plus `ls-tree` of the lesson directory answers in 0.7 s and names ll325 |
| a lesson ahead of the queue fails the count test | `the-lesson-count-is-derived.test.jsx` required the real catalog to hold at most `NAMED_GAPS` (6) unused numbers. With L324 to L329 and L332 in flight the catalog had ten. `lessonCountLabel` already reports a count past six, and the test's own comment says it must not hard-code one branch of that rule. |
| who keeps a branch current | `keep-prs-current` comments "nothing was pushed here... until the `LANE_PUSH_TOKEN` secret exists". Every landing was followed by a hand merge of main into five branches and a full CI run each. |
| CI wall time that night | checks queued 25 to 35 minutes before starting; a run took 40 to 60 minutes end to end, with 14 pull requests open |
| preview deploys | Vercel refused previews with "more than 100" deployments that day; of the ones seen on these branches, one built and the rest were refused |

## Impact

A lesson branch no longer goes red because a different lesson landed, and a lesson may land ahead of numbers still held by parallel branches. Neither change lets a real skip through: a number that is neither reserved nor on main is still a hole.

## Decision

1. **A number main already carries is accounted for.** `landedLessonNumbersOnOrigin` reads the lesson file names on origin's main (one trees-only fetch of the tip; depth 1 only when the checkout is already shallow, so a full clone is never made shallow). The numbering gate excuses a hole that is reserved OR landed. Any failure to read returns an empty set and excuses nothing.
2. **The count test reads both branches of its rule.** Named gaps while the list is short, the count past the bound.

**Not decided here, and Darrell's:** setting `LANE_PUSH_TOKEN` so `keep-prs-current` can merge main into open branches itself (the largest remaining cost: a hand merge and a full run per landing per branch), and whether preview deploys on every push are worth the daily cap. `re-review: 2026-11-26`.

## Verification

`living-lessons-id-collision.test.js`, 12 cases, one new and proven to catch: the read, the shallow and full-clone paths, 325 excused when main carries it while 326 stays a hole, and an offline read excusing none. On the live repository the gate failed before this change on a branch without L325 and passes after. `the-lesson-count-is-derived.test.jsx` 7 of 7 with ten gaps and with four. Not yet seen: the gate on a runner's depth-1 checkout; the first lesson run after merge is that witness.
