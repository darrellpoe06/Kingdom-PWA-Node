# DR-1194: A committed row names its commit — the placeholder that passed the check and failed the suite

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one function's judgement tightened; no data file changes; two tests added, one proven to catch)
**Type:** tooling
**Area:**
- `scripts/lesson-dates-core.mjs` (`judgeEntry` — the `working-tree` placeholder)
- `app/src/__tests__/lesson-dates.test.js` (2 cases added, 1 proven to catch)

**Grounds:** DR-1193 recorded this as `re-review: 2026-10-28` after it cost a CI cycle on sov48. It is closed the same day instead, because it was buildable and verifiable with the tools in hand right now (DR-0236), and because the gap it leaves open is a check that lies.
**Principles:** DR-0076 §3 (proven to catch — a gate that passes on a break is itself a lie) and §4 (measure, never claim); DR-0075 (recurring friction becomes a fix); DR-0236 (nothing buildable waits)

## Context

`lesson-dates.json` records, per lesson, the day it was written and the commit that first defined it. A lesson written but not yet committed has no commit, so the deriver writes the placeholder `'working-tree'` — which is the honest answer while that is true.

On 2026-10-21 it stopped being true and nothing noticed.

## What was measured

**The sequence that produced the failure, traced rather than guessed at:**

1. sov48's row was derived **before** its lesson was committed, so it was written `["2026-10-21", "working-tree"]`.
2. `derive-lesson-dates --check` **passed** on that row. So it was committed in good faith.
3. Every later re-derivation **kept** it. `judgeEntry` returned `null` for it: the placeholder is not in `reachable`, so it fell through to the squash-grace path, where the recorded day matched git's day and the gap scored **0** — indistinguishable from a sound branch-dated row.
4. `lesson-dates.test.js` requires `/^[0-9a-f]{8}$/` of every sha and **rejected** it: `expected 'working-tree' to match /^[0-9a-f]{8}$/`. It reddened `app — vitest shard 1/4` on `6c5d63c20`.

So the file was **blessed by the check and rejected by the suite at the same time**, and the only way out was deleting the row by hand and re-deriving. A check that passes on what the suite fails is worse than no check, because it is trusted.

**The blast radius, measured before changing a shared check.** On main `911f444a7`: **584 committed rows, every one carrying an 8-hex sha, and not one carrying the placeholder.** So rejecting a landed placeholder cannot disturb a single existing row — confirmed by running `--check` on main's untouched `lesson-dates.json` with the change in place: exit 0.

## Impact

- `--check` now **fails** on a committed `working-tree` row whose lesson git can trace, naming the real commit and the day, and telling the operator exactly what to run.
- `npm run lesson-dates` now **heals it automatically**, replacing the placeholder with the real commit and reporting the replacement. Today that required deleting the row by hand; it no longer does.
- The legitimate case is untouched: while a lesson really is uncommitted, the placeholder is still accepted, because that is what it is for.

## Decision

**The `working-tree` placeholder is true only while the lesson is uncommitted. Once git can trace the lesson, the row is rejected so the derivation replaces it.**

`judgeEntry`'s single-line special case became an explicit two-way branch. Previously:

```js
if (entry.sha === 'working-tree' && git && git.reason) return null; // still uncommitted
```

— which said nothing at all about the case where `git.reason` is absent, and let it fall into a path written for a different situation. Now the placeholder is handled completely in one place, and the comment records why, so the next reader does not have to rediscover the four-step sequence above.

## Verification

- **18 cases green** in `lesson-dates.test.js`, two of them new.
- **PROVEN TO CATCH (DR-0076 §3), on the real file and not only a fixture.** Injecting `working-tree` into sov48's committed row reproduced today's failure exactly:
  - `--check` → **exit 1**, reporting `sovereign-ai/sov48-...: recorded 'working-tree', but it has since landed as 911f444a on 2026-10-21 — a committed row must name its commit; re-derive (npm run lesson-dates) to replace it`.
  - `npm run lesson-dates` → `replaced sovereign-ai/sov48-...`, row rewritten to a real 8-hex sha.
  - `--check` again → **exit 0**.
  - The file was then restored to main's exact bytes and `--check` re-run: **exit 0**, so the change disturbs nothing that exists.
- The unit case pins the shape that actually slipped through — a placeholder on the **same day** as the commit, where the day gap is 0 — not merely a mismatched day, which the old code already caught.
- A second case pins the heal through `buildDatesFile`, so the automatic replacement is guarded and not just observed once.

## What this does not do

- **It does not merge `lesson-dates:check` into `verify:gates`.** That is the wider version of the same lesson from the same day: `verify:gates` does not run `lesson-dates:check`, and `lesson-dates:check` did not catch what the suite catches — **four of 2026-10-21's reds came from the coverage of a check rather than from the work.** Whether the gate suites should be consolidated so one green means one thing is a larger change than this one and touches how every session validates before pushing. **`re-review: 2026-11-04`.**
- **It does not stop a placeholder being written in the first place.** Deriving dates before committing the lesson is a legitimate order of work, and the placeholder is the correct value at that moment. The fix is that it can no longer survive the commit silently.
