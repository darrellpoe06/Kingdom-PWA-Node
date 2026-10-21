# DR-1195: The week's collisions, counted — the rate held, so the convention conversation is due

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (a measurement and a recommendation; no code changes)
**Type:** orchestration
**Area:** `docs/decisions/` — the shared `**Next ID:**` pointer convention

**Grounds:** DR-1021 closed with `re-review: 2026-10-21` — *"count the week's collisions; if the rate holds, that convention is the next conversation."* This is that count, run on the day it was promised.
**Principles:** DR-0075 (a dated re-review is a promise it gets revisited — never a silent drop); DR-0076 §4 (measure, never claim) and §8 (name the method and its limits, and flag what was got wrong); DR-0111 (a genuinely new decision is surfaced with a recommendation, not decided here)

## Context

The decision ledger numbers records from a single shared `**Next ID:**` line. Two sessions working at once read the same next number, both take it, and the second to merge must renumber — rename the file, relink its INDEX row, rewrite every citation. DR-1021 built `renumber-decision-record.mjs` for exactly that and deliberately did **not** try to prevent the collision, because the prevention changes a convention every session and every past record depends on: a Governor's call, not a tooling change. It set today's date to find out whether the rate justified having that conversation.

## What was measured

Three measures, none of them clean, each named with its bias rather than presented as the count.

**1. Commit subjects that announce a resolution — a FLOOR, it undercounts.** Most collisions are resolved inside a PR whose subject never mentions it. On `origin/main`, 2026-10-14 to 2026-10-21: **8 commits**, and the shape matters more than the total — **7 of the 8 fell in the last two days** (2026-10-20 ×2, 2026-10-21 ×5).

**2. DR records whose own text names a collision or a renumber, bucketed by their own `Date:` field — this OVER-counts,** because records *about* the problem (DR-1021, DR-1076, DR-1136, and this one) match the same patterns:

| window | days | records | rate |
|---|---|---|---|
| 2026-10-09 → 10-15 | 7 | 12 | ~1.7/day |
| 2026-10-16 → 10-21 | 6 | 14 | ~2.3/day |

**3. DR-1076's own count, for a third reading:** nineteen collisions in the seven days to 2026-10-16 — ~2.7/day.

**The verdict across all three: the rate HELD. It did not fall.** DR-1076 changed the convention on 2026-10-16 so that the next number is the next FREE number, and the collisions continued at the same order of magnitude after it. Two of the three measures read slightly *higher* after that change than before.

**And the compounding DR-1021 described was observed live today, not inferred.** PR #2360 has carried an unresolved DR-1185 collision all afternoon, and the target its resolver names moved **1185 → 1192 → 1193 → 1194 → 1195** across four unrelated pushes of mine in a single afternoon. Each of those pushes invalidated advice that session had already been given. Separately: main carried two records claiming DR-1184; and one session's renumber of DR-1185 was duplicated by another session, so #2374 and #2375 both merged doing the same work.

## Impact

- The trigger condition DR-1021 set is **met**. Its own terms — "if the rate holds, that convention is the next conversation" — are satisfied by the measurement above.
- `renumber-decision-record.mjs` and DR-0644's refusal are doing their jobs: not one collision this week silently deleted a decision, which is the failure mode that made the resolver refuse rather than fold (two real decisions were lost that way on 2026-10-06). The cost is not correctness. **The cost is time**: every collision invalidates an already-verified tree, so gates, dates and the affected suites are re-run.

## Decision

**The count is recorded and the convention question goes to the Governor with a recommendation, not a change.**

The recommendation, offered as a default rather than a menu: **give each record a number that cannot collide by construction** — allocate from something other than one shared mutable line, so two sessions cannot read the same next value. The shape that fits this ledger best is a per-session claim (a session reserves its number by creating the file, and the pointer is derived from disk rather than written by hand), because `resolve-ledger-conflicts.mjs` already computes the pointer from disk and two things computing one line is how they drift in the first place (DR-1021).

Not changed here, deliberately: every past record, every citation and every session's habit depends on the current convention, and DR-1021 was explicit that this is a Governor's call. Measuring was the promise; deciding is not mine.

## Verification

- Both counts were produced by script against `origin/main` at `ff13bec8c`, not from memory, and both are reproducible from the commands recorded in this record's Context.
- **Two of my own measurements were wrong first, in opposite directions, and are named rather than quietly corrected (DR-0076 §8).** The commit-subject grep read window A as **1** collision, which cannot be true beside DR-1076's own nineteen — that is how its undercount was discovered. Then the content count read window B as **58**, because 44 records carry no `Date:` field and `'?' >= '2026-10-16'` is true in a string comparison, so every undated record fell into the later window. Excluding non-ISO dates gives the 14 above. **I was one step from reporting that the rate had halved, which is the opposite of what it did.**
- That is the fourth time today a wrong answer came from the coverage of a check rather than from the work (the others: a grep matching one quote style, `verify:gates` not running `lesson-dates:check`, and `lesson-dates:check` not catching what `lesson-dates.test.js` catches — DR-1194). The pattern is now named often enough to be a finding in its own right, which is why DR-1194 left the suite-consolidation question dated rather than closed.

## What this does not do

- **It does not change the numbering convention.** See the Decision — that is the Governor's.
- **It does not resolve #2360.** That is another session's branch; this session commented its correct target earlier and did not push to it. Its resolver recomputes the target on every run, so it is self-correcting as the pointer advances.
- **It does not make the counting exact.** Both measures are proxies with named biases, and the ledger records no first-class collision event. Whether a renumber should write a machine-readable marker so the rate can be counted exactly instead of estimated is **`re-review: 2026-11-04`** — worth doing only if the convention above is NOT changed, because a convention that removes collisions makes counting them moot.
