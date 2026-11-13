# DR-1468: Parallel lessons — one file, one branch, one number reserved on origin

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (tooling and gates; no lesson content, no money, no schema)
**Type:** decision
**Area:** `app/src/lib/living-lessons-per-file.js`, `app/src/lib/living-lessons/`, `scripts/lib/{living-lesson-files,reserve-ref,kjv}.mjs`, `scripts/{claim-decision-number,sweep-reservations,new-lesson,verse,fill-verses,unfilled-verse-token-guard}.mjs`, ci.yml, keep-prs-current.yml
**Sent in by:** Darrell, 2026-11-13: *"Build 1, 2 and 3, and allow parallel branches."* He approved parallel lesson branches: each lesson on its own `claude/lesson-llNNN` branch and its own PR, each with its own DR reserved atomically.
**Pairs with:** DR-1079 / DR-1359 (the read path), DR-1339 (file budgets; lesson content out of JS, re-review 2026-11-19), DR-0692, DR-1126, DR-0076 §2–4

## Context

Every Living Lesson edited the same lines: one 32,192-line array, one dates map, the file budget, the voice-witness fixture, the honesty-gap pin, INDEX and the usage ledger. Lessons were serialized, and decision numbers collided: DR-1441 taken twice, numbers 1445 and 1449 contested, one day. `claim-decision-number.mjs` only read, so two sessions reading in one minute took the same number.

## What was measured

| what | measured |
| --- | --- |
| a lesson planted as `living-lessons/ll302-*.js` | joins LIVING_LESSONS_MODULES (299), dated by its own ADDED; every gate green except one pin (below) |
| each guard on a planted defect in that file | red: verse gate, every-catalog, every-store, provenance (kjv-drift), inference (400/430), surface-hollow, testimony, unchecked, parable name, adversary capital, token guard, file budget (646 > 600) |
| withAdded reading dates.js first (mutation) | the stand-in test red: `2020-01-01` for `2026-11-13` |
| `--reserve` on the real origin | `refs/heads/reserve/dr-1462` created; a second claim of 1462 refused `held` |
| the same day, on main | the L302–L306 branch took 1462–1466 WITHOUT reserving: the lease binds only claimants who use it. This record moved to 1468, reserved the same way (1467 held by a branch in flight) |
| two processes racing against a bare repo, 3 rounds | six numbers, six distinct; without the lease, two claimants both told they hold 1 |
| plain node importing the catalog without the preload | refused by name, never a silent empty directory |

## Impact

A new lesson is one new file and one new test; two lesson branches never touch the same line. The catalog file, dates map, file budget (a 600-line directory ceiling), voice fixture (it samples the catalog file only) and GAP pin (a per-file lesson declares `UNCHECKED` with a re-review date) are no longer edited per lesson. A reserved number cannot be handed to a second session. The 300 lessons in the catalog file stay where they are.

## Decision

1. **One file per new lesson** under `app/src/lib/living-lessons/<id>.js` exporting ORDER (the number), ADDED and the module; `import.meta.glob` appends them by ORDER; plain node preloads through `register-json-imports.mjs`. Every path-listing guard reads the directory through `scripts/lib/living-lesson-files.mjs`.
2. **Reserve, don't read:** `claim-decision-number --reserve` pushes an empty commit on main to `reserve/dr-NNNN` with an empty `--force-with-lease`; the read path counts `reserve/*` as held. The proxy allowed `reserve/*`, so the lock-file fallback was not needed. `sweep-reservations.mjs` in keep-prs-current deletes what main has passed; ci.yml skips `reserve/**`.
3. **The author never types a verse:** `verse.mjs`, `fill-verses.mjs` (`{{kjv:Ref}}`, `{{kjv:Ref|part}}`), and `unfilled-verse-token-guard` in verify:gates and ci. A new lesson needs no per-lesson verse test: `quoted-verse-is-the-verse.test.js` reads every lesson in the list.
4. **`new-lesson.mjs`** reserves the lesson number (`reserve/ll-NNN`) and the DR, and writes the skeleton and its test.

NOT decided: moving the existing 300 (DR-1339's re-review owns it).

## Verification

Gates: `living-lessons-per-file`, `...-joins-the-catalog`, `claim-decision-number-reserve`, `the-author-never-types-a-verse`, verify:gates. One pin is left on purpose: `living-lessons-order.test.jsx` names the newest lesson's day, and the L302–L306 branch edits that line now. `re-review: 2026-11-16` — derive it once that branch lands. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`.
