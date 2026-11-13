# DR-1477: Lessons land in any order, and the INDEX pointer is derived

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (tooling, gates and one INDEX line; no lesson content, no money, no schema)
**Type:** decision
**Area:** `scripts/lib/{reserve-ref,decision-pointer,prettier-write,lesson-preflight}.mjs`, `scripts/{new-lesson,fill-verses,sweep-reservations,resolve-ledger-conflicts,business-systems-guard,ai-usage-ledger,ari-guard-stop-hook}.mjs`, `docs/decisions/{INDEX,README}.md`, `app/src/__tests__/helpers/living-lesson-gate.js`, `docs/templates/builder-brief.md`
**Sent in by:** Darrell, 2026-11-13, approving parallel branches: remove the friction L307 (DR-1475) and L308 (DR-1476) hit, so N lessons are built side by side and land in any order with no hand steps.
**Pairs with:** DR-1468 (one file, one branch, one reserved number), DR-1469, DR-1474 (its parked helper, built here), DR-0644, DR-1343, DR-1347, DR-0076 §3, DR-0011

## Context

The first two parallel lessons still had five hand steps. L308 was red until L307 merged, because the gap gates read a reserved, unlanded number as a hole. Every record branch rewrote the one `**Next ID:**` line, a guaranteed conflict. Each lesson needed `format-guard --fix`, an eight-question quiz grown to ten, and ~500 lines of copied gate. Each builder unshallowed and linked `node_modules` by hand, and the ledger line asked for a PR before one existed.

## What was measured

| item | change | proof (proven to catch) |
| --- | --- | --- |
| 1 any order | `living-lessons-numbers-are-unique` and `-id-collision` excuse a hole held by `reserve/ll-NNN`, read by `reservedNumbersOnOrigin` (ls-remote, then tracking refs, then none: offline excuses nothing). The sweep deletes a lesson reservation only once main holds that number | a planted 307 hole with no reservation fails; reserved, it passes; a neighbour's does not excuse it. The old sweep rule deletes `reserve/ll-307` once L308 lands; the new one keeps it |
| 2 pointer | the line is one fixed sentence naming `claim-decision-number --reserve`; its 6,832 characters of notes kept verbatim on a frozen history line. Guard, resolver (keep-prs-current copies it alone, so it holds a pinned copy), renumber, claim, ari-guard, README and lesson_builder.py updated | real `git merge`: rows added at two points merge clean; the same branches typing the old pointer conflict on it; two end appends conflict and the resolver unions them; a stale branch's typed pointer folds in and its note moves to history |
| 3 new-lesson | ten questions, a commented `UNCHECKED` slot, both files run through the repo Prettier; `fill-verses` formats any file main does not hold. New tests mount `helpers/living-lesson-gate.js` in a few lines | the raw skeleton fails `prettier --check` and the written one passes, filled too. The gate is green on L308, and 14 planted defects (spine, verse word, capital, his words quoted, God in our voice, friend line, share, copy, quiz, story) are each named |
| 4 preflight | `lesson-preflight.mjs`: refuse a shallow clone with `git fetch --unshallow origin`; link a worktree's missing `app/node_modules` | inside a worktree of a real shallow clone, `test -f .git/shallow` reads clean and preflight refuses; a worktree is linked; with nothing to link, it names `cd app && npm ci` |
| 5 ledger | `--prs` optional; when given it must be PR numbers | an entry with none validates; `'#2665'`, `0` and a bare number are refused |

## Impact

A lesson branch edits only its own file, test, DR, one appended INDEX row and one ledger line. Lessons merge in any order. No branch rewrites the pointer; two rows appended at the same spot still conflict as text and `resolve-ledger-conflicts` unions them.

## Decision

1. A number reserved on origin is in flight, never a hole. Only a lesson reservation main has landed is swept.
2. The pointer is derived, never typed. `business-systems-guard` refuses a typed number in it. The INDEX table stays append-only, one decision per file.
3. `new-lesson` writes a formatted, complete skeleton; new tests use the shared gate. L302–L308 tests are not rewritten.
4. `new-lesson` runs the preflight first.
5. No step fills `prs` later. That is deliberate: no workflow writes the ledger, and editing an old entry would make the resolver refuse every open branch on that id. The squash commit's `(#NNNN)` names the PR. Not built: a backfill workflow (`scripts/workflow-budget.json` unchanged).

NOT decided: an age limit on an abandoned lesson reservation (it excuses its hole until deleted). `re-review: 2026-11-27`.

## Verification

Gates: `verify:gates`, `format-guard`, eslint, `node --check`; tests `the-pointer-is-derived`, `living-lesson-gate`, `lesson-preflight`, `claim-decision-number-reserve`, both gap gates, `resolve-ledger-conflicts`, `the-pointer-line-stops-doubling`, `keep-prs-current-lane`, `business-systems-guard`, `the-author-never-types-a-verse`, `ai-usage-ledger`, the L307 and L308 tests. Reserved as `reserve/dr-1477`.
