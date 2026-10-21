# DR-1152: A missing ledger is not a fresh one — the null that wore a zero, and the rule that had to leave the workflow

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (corrects a fabricated measurement published hours earlier; moves one rule into a testable file, no behaviour added)
**Type:** way

**Area:** `scripts/loops-witness-services.mjs` (new), `.github/workflows/loops-health.yml` (calls it instead of its own inline copy), `app/src/__tests__/a-missing-ledger-is-not-a-fresh-one.test.js` (new). Corrects **DR-1151**.

**Principles:** DR-0076 (never fabricate; provenance must be true; unknown is not an answer); DR-1147 §3 (a test that reads a guard's source text survives the break it is meant to catch); DR-1149 (the first live run is part of shipping); DR-0621 (hold the hand of the process — a flag is where the work starts); DR-1151 (the road this corrects).

## Context

**DR-1151 shipped, merged, deployed — and its first live witness published six fabricated timestamps.**

`loops-health.yml` ran on main at 03:23 and wrote report issue #2329. Of its ten loops, **six** published this:

```
family-key           its own ledger, 0s old
agent-consumer       its own ledger, 0s old
db-backup            its own ledger, 0s old
choir-dates          its own ledger, 0s old
stream-length        its own ledger, 0s old
worship-song-harvest its own ledger, 0s old
```

Every one of those `last_run_at` values equalled the read time to the millisecond, and **none of those loops has a ledger at all.** The witness writes `ledger_age_s: None` for a loop it found no ledger for; that is `null` in JSON; the mapping read `Number(e.ledger_age_s)`; **`Number(null)` is `0`**, which is finite and passes `>= 0`. So the guard credited a loop with "ran just now" and attached the words *"its own ledger"* to a file that does not exist.

**That is a fabricated measurement wearing false provenance** — the single failure this whole road was built to prevent, shipped inside the change whose own record argues against it. It did not throw, it did not look wrong, and it would have fed the census a run time for loops nothing has evidence of.

**Why no test caught it, which is the second half of the defect.** The mapping lived inline in the workflow's `github-script` step, so the only thing a test could do was **grep its source text** — and a source-text assertion survives the break it is supposed to catch, which DR-1147 recorded as its own third defect three hours earlier. I wrote that lesson down and then built the next thing in the shape it warns against.

## What was measured

Replayed against the ten loops exactly as #2329 reported them:

| | before (shipped) | after |
|---|---|---|
| claiming `its own ledger` | **10 of 10** | **4** — and they are the four that have one |
| credited to the services-sync cycle | 0 | **6**, named as the cycle, not as a file |
| timestamps equal to the read time | **6** | 0 |

The four with real ledgers: `lesson-voice` and `lesson-parity` (479s), `church-mail` and `lesson-mail` (482s).

## Decision

**The guard checks the type, and demands an age above zero.** `typeof v !== 'number'` rejects the null outright, and `v <= 0` is refused too, because a ledger written in the same second as the read cannot be told apart from the absent case — and the honest answer to *"I cannot tell"* is the fallback, never a guess.

**The rule moved out of the workflow into `scripts/loops-witness-services.mjs`**, as a pure function with `now` injected, so a test can **run** it rather than read it. The workflow imports it; the test imports the same file. Two implementations of one rule is how the inline version got away with being wrong, and a case now fails if the workflow grows its own copy back.

**What a loop without its own ledger may still be credited with:** the services-sync cycle it last ran `ok` in, named in those words. That is genuinely what is known — the witness derived `ok` from that cycle's own events. Anything else gets **no timestamp and a stated reason**, so the census reads unknown.

## Impact

**The published witness is wrong until it runs again**, so re-running `loops-health` is part of this change, not a follow-up: the body is rewritten on every run.

**The honest coverage number, which DR-1151 did not state:** `loops-health` watches **10** loops; `services.json` registers **29**. So the fold fills at most 10, and **19 NAS services remain unknown** after it — their witness does not exist yet, which is a gap in the report and not a fault in those loops. DR-1151's impact section implied the NAS half would be answered; it answers a third of it. **`re-review: 2026-10-28`** — whether the remaining 19 get a witness of their own, or the census should name them as unwatched rather than merely unknown.

**The pattern worth keeping:** three defects tonight were found by looking at live output after a green merge (DR-1149's two, and this one). None was found by a test, and every one rendered perfectly. A surface is not proven by its suite; it is proven by reading what it actually published.

## Verification

**12 cases**, run against the function, and **proven to catch by restoring the shipped coercion** (`Number(entry.ledger_age_s)` with `>= 0`):

| what went red | message |
| --- | --- |
| the live defect, by name | *"expected 'its own ledger, 0s old' not to match /its own ledger/"* |
| `ledgerAge` refusing a null | *"expected +0 to be null"* |
| the ok-loop fallback | *"expected '2026-10-21T03:23:04.711Z' to be '2026-10-21T03:16:50Z'"* |
| a failed loop given a timestamp | *"a: expected '2026-10-21T03:23:04.711Z' to be null"* |
| the replayed live witness, both halves | *"expected [ 'agent-consumer', …(9) ] to deeply equal [ 'church-mail', …]"*; *"expected [] to have a length of 6"* |

**7 red in total**, restored **12 passed**. `ledgerAge` is pinned against `null`, `undefined`, a numeric **string**, `0`, `NaN` and a negative — every shape that could pass a loose coercion.

`npm run lint` exit **0** · `npm run verify:gates` exit **0**, read without a pipe. The workflow's YAML parses and its `github-script` body passes `node --check`.
