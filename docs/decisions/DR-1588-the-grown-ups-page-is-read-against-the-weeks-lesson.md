# DR-1588: The grown-ups page is read against the week's own lesson

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one test file; no product code, no schema)
**Type:** fix
**Area:** Kids Zone (`app/src/__tests__/kids-zone-render.test.jsx`); read against `app/src/components/kids/GrownUps.jsx` and `app/src/lib/youth-zone.js`
**Pairs with:** DR-1508 / DR-1509 / DR-1520 (Kids Zone v1), DR-0076 (a gate must mean something), DR-1468 (lessons land in parallel)

## Context

`kids-zone-render.test.jsx` required the words "How to lead it" on the grown-ups page for a fixed Monday, 2026-11-16. The lesson shown that week is `weeklyLesson`, the week index modulo the length of the catalog, so the pick moves every time a lesson lands. The page prints the leading-notes heading only when the picked lesson wrote a `facilitator.howToRun`, which is right: it shows no heading for notes it does not have.

When L327 and L332 landed on 2026-11-19 at 05:48Z the pick for that Monday became a lesson with no `howToRun`, and the test went red on `main` itself. Every open PR then failed shard 3 on a line none of them touched.

## What was measured

| what | measured |
| --- | --- |
| `main` at `75b7f8a4`, before | 1 failed, 6 passed: expected "This week with your child: Humility I…" to contain "How to lead it" |
| `main` at `75b7f8a4`, after | 7 passed |
| first seen | PR #2775 (two lessons more than main), CI shard 3, 05:34Z; then PR #2788 (no lesson added), 06:25Z, which is what showed `main` was red |
| proven to catch | with `GrownUps.jsx` forced to show the heading always, the case fails (expected true to be false); restored, it passes |

## Decision

The test reads the page against the lesson the catalog picks for that Monday: the lesson's title always, and the leading-notes heading exactly when that lesson has notes. It imports `weeklyLesson`, `moduleFor` and `leadLines`, the same functions the page uses to choose and read the lesson, so the rule under test is the page's own rule and not a snapshot of one week's catalog.

No product code changes. The page was right.

## Also in this record: the second gap test learns what the first learned

`living-lessons-numbers-are-unique.test.js` excused a missing lesson number only if it was reserved on origin. A reservation is swept when its lesson lands, so a branch cut before the landing read L327 and L332 as held by nobody (PR #2782, shard 3, 06:46Z). DR-1580 fixed this same race in `living-lessons-id-collision.test.js`; this file asked the same question and was missed. It now also counts the numbers `main` carries (`landedLessonNumbersOnOrigin`). Reproduced by removing the two lesson files from a copy of `main`: 1 failed before, 11 of 11 after. A number neither reserved nor landed is still a hole (the file's planted-gap case is unchanged).

## Not done

Some lessons have no `facilitator.howToRun`, so on their weeks a parent sees the title and the anchor and no leading notes. How many, and whether to write notes for them, was not measured here. `re-review: 2026-12-03`.

## Verification

7 of 7 in `kids-zone-render.test.jsx` on `main` with this change. The identical file rides in PR #2775, #2780, #2788 and #2796, so those merge without conflict whichever lands first.
