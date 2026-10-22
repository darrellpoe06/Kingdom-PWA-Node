# DR-1208: The dates check joins the gates — DR-1194's dated item closed early, and a coverage claim of mine that the measurement disproved

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one line of `app/package.json`; no code, no record rewritten; proven to catch on the live data file)
**Type:** tooling
**Area:**
- `app/package.json` (`verify:gates` gains `npm run lesson-dates:check` as its last step)

**Grounds:** DR-1194's own `re-review: 2026-11-04`, run thirteen days early on the condition it set, because it was buildable and verifiable with the tools in hand right now (DR-0236) and because the gap it left is a pre-push gate set that does not run a check the repo already owns.
**Principles:** DR-0076 §3 (proven to catch), §4 (measure, never claim), §8 (name the method's limits); DR-0236 (nothing buildable waits); DR-0075 (recurring friction becomes a fix); DR-1194 (the check this folds in, and the judgement it added)

## Context

DR-1194 recorded, as its one open item: *"`verify:gates` does not run `lesson-dates:check`, and `lesson-dates:check` did not catch what the suite catches — four of 2026-10-21's reds came from the coverage of a check rather than from the work."* It parked the wider question (should the gate suites be consolidated so one green means one thing) behind a dated re-review, on the grounds that it touches how every session validates before pushing.

Half of that is a one-line change and did not need the date. This closes that half.

## Measured (DR-0076 §4)

**First, a claim of mine that the measurement disproved.** Earlier today I said that `verify:gates` and `lint` do not run the decision-chain gate, and I offered that as a coverage gap in the repo's tooling. Measured:

```
verify       = npm run lint && npm run verify:gates && vitest run
verify:gates = 25 node guards (decision-citation-guard IN, business-systems-guard IN, lesson-dates NOT IN)
```

`npm run verify` already runs **the whole vitest suite**, so the chain gate was never uncovered. What happened is that I ran `verify:gates` and `lint` instead of `verify`, because the full suite is slow — and then shipped two reds that `verify` would have caught. **That was my practice, not the repo's coverage**, and the earlier framing was wrong. Recorded here rather than quietly corrected, because a wrong diagnosis of a gate's coverage is exactly the kind of claim DR-0076 §8 says to mark.

**What the measurement DID confirm:** `lesson-dates:check` is genuinely absent from `verify:gates` — the one real half of DR-1194's item.

| | before | after |
|---|---|---|
| `lesson-dates:check` in `verify:gates` | no | yes, as the last step |
| `verify:gates` wall time | ~20s | **41.5s** (the check itself 20.5s) |
| lessons it reads | — | 839 dated, 0 undated |

## The decision

**`verify:gates` ends with `npm run lesson-dates:check`.** One line. It runs last because it is the slowest step, so the 24 fast guards still fail in seconds.

The wider consolidation DR-1194 reserved is **still reserved** and still dated. This does not answer it; it removes the one piece of it that was a line of JSON.

## Impact — what this obligates

**Unresolved, the cost is a check nobody runs.** `lesson-dates:check` existed, passed, and was not in the gate set any session runs before pushing — so the judgement DR-1194 added to `judgeEntry` yesterday (a committed row must name its commit) was enforced only by the full suite, in CI, after a push. A check outside the pre-push set is a check that finds things late.

**What the call obligates:**

- **`verify:gates` is now 41.5s, not 20s**, and that is the price of the fold. If it grows past the point where sessions skip it, the fold has backfired and the honest fix is to split fast and slow sets — not to quietly drop a gate.
- **The dates file stays generated.** The check's own failure text says it: `cd app && npm run lesson-dates`, never edit its days by hand.
- **`npm run verify` is the pre-push command for anything touching the ledger or a lesson**, not `verify:gates`. That is the actual lesson of today's two reds, and it is a practice, which no amount of JSON enforces.

### Limits, named rather than left (DR-0076 §8)

- **This does not consolidate the gates.** `npm run verify` remains the only command whose green means everything is green. DR-1194's `re-review: 2026-11-04` stands for the real question.
- **A fast ledger-only subset was considered and NOT built.** The idea was a `verify:dr` running just the suites that gate a decision-record change. It was dropped because its completeness could not be established: the attempt to enumerate those suites by grepping for `docs/decisions` **missed `decision-chain.test.js`**, which builds its path as `join('docs', 'decisions')` — the same class of error, inside the tool meant to prevent it. A subset whose coverage is unknown invites exactly the false confidence that produced today's reds, so there is nothing here instead of something unsound. `re-review: 2026-11-12` — the honest way to build that list is empirical (break a record, run the full suite, record which files go red), and that measurement is the prerequisite.

## Proven to catch (DR-0076 §3)

Run against the real `app/src/lib/lesson-dates.json`, not a fixture, with a byte snapshot restored and verified by sha256 — never `git checkout`, for the reason DR-1207 records:

| step | result |
|---|---|
| baseline | `verify:gates` exit **0** |
| row `ai/wk1-what-is-ai` sha set to `working-tree` | `verify:gates` exit **1**, naming it: *"recorded 'working-tree', but it has since landed as 2b90e74d on 2026-06-15 — a committed row must name its commit"* |
| restored from the snapshot | sha256 identical |
| after restore | `verify:gates` exit **0** |

The first attempt at this proof **proved nothing, and I nearly recorded it anyway**: the patch targeted the row as an object when it is a pair (`["2026-06-15", "2b90e74d"]`), so it threw, nothing was written, and the gate passed — which reads exactly like "the gate does not catch it." It was caught by checking that the patch had applied before trusting the run, which is the refusal DR-1207's operator makes unskippable. Two of those in one day is the argument for the operator, not an argument about this gate.

And the message the break produced is DR-1194's own judgement firing — the fold is carrying a real check, not a decorative one.
