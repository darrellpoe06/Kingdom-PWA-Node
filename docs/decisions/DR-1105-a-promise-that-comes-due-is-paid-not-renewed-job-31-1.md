# DR-1105: One expired parking, paid three times by two sessions in two hours — and none of the three was mine to keep

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (a process record; **no content change survives from this record's own work**)
**Type:** way

**Area:**
- `app/src/lib/living-lessons-class.js` (resolved to main's `ll113` and main's `ll92`; this branch's own Job 31:1 placement was **dropped**)
- `app/src/lib/passage-reach.js` (main's row content taken verbatim; a new
  `dischargeClaimsNotKept` check and the in-flight note added beside it)
- `app/src/__tests__/passage-reach.test.js` (five cases, one proven on the live row)

**Grounds:** The gate's own clock. `passage-reach.test.js` failed CI run 39180829118 (shard 3/4, 00:34 UTC 2026-10-19) with one message out of 6,144: *"Job 31:1 is still stranded in ll183- and its parking expired 2026-10-19 — a covenant with your eyes."*
**Principles:** DR-0075 (a dated non-improvement is a promise, and the date is what makes it one); DR-0547 (the reach gate); DR-0644 (a resolution must refuse rather than delete); DR-0076 §3 and §8

## Context

Darrell, 2026-09-19: *"Genesis 29:17, Genesis 24, Job 31:1 and Ruth 3:11 were
all at zero lessons — Make sure it's not that way anymore... make sure its
everywhere it's discussion."* Three were placed then; Job 31:1 was parked with
a date because every host carried full-levels debt. The date was 2026-10-19.
It arrived, and the gate failed the build.

## What was measured, and what then happened

| time (UTC) | what | by |
|---|---|---|
| 00:34 | the gate fails: *parking expired* | — |
| ~00:45 | the parking's premise re-measured and found stale; **ll113** chosen; placed in five registers; row paid, floor 1 → 2 | **this session** |
| ~02:0x | main's **#2252** discharges the same passage into **ll92** (Matthew 5:28 counts the look), floor 1 → 2, in the file's own `DISCHARGED into` idiom | another session |
| ~02:3x | this branch merges, takes main's `passage-reach.js` byte-identical, keeps `ll113` as a *second carrier* | this session |
| ~03:0x | main's **#2257** places Job 31:1 into **`ll113`** — all five registers, at **the same four anchor points** this session had used | another session |

So the one expired date was paid three times by two sessions inside two and a
half hours, twice into the same lesson at the same seams.

## Impact

**This record's own content contribution is now nothing, and that is the
finding.** Main's `ll92` is the discharge; main's `ll113` is the second
carrier. Keeping this session's `ll113` text would have put the same teaching
twice into one lesson at the same four anchors, so it was dropped and main's
taken whole. Job 31:1 reach is **3**, beyond its introduction **2** — all of it
main's work, verified after the resolve.

What it cost, measured rather than estimated: two full build-and-verify cycles,
**four renumbers** (DR-1102 → 1105, DR-1101 → 1104, and the two held lessons to
`ll254`/`ll255`), **three merges**, and a catalog resolution that had to be
redone four times. None of that bought a single line the app did not already
have an hour later.

**The cause is structural, not carelessness on either side.** A deterministic,
dated gate fires for *every* session at once. Nothing in the lane tells a
session that another is already paying the same flag — no claim, no lock, no
in-flight marker on the registry row. The `hold` label made it worse here only
by lengthening the window: this branch could not merge, so its payment could
not become the visible fact that would have stopped the second one.

## Decision

**1. Main's placements stand; this session's is dropped.** No duplicate
teaching, no second carrier at the same anchors.

**2. The record is kept rather than deleted, and says plainly that its own work
was superseded.** Quietly dropping the text and leaving a record that reads as
though it placed something would be the kind of thing a reader cannot see
afterward.

**3. The response is built, and it is deliberately narrow — because the two
wider gates were measured against the live series and failed.** A coordination
*lock* is not the answer here and was not attempted: the claim would have to be
visible across sessions, and on a branch under `hold` it cannot be, which is
precisely how this collision happened. So what ships is what can be made true:

- **`dischargeClaimsNotKept` — a row's claimed discharge must be real.** When a
  row says `DISCHARGED <date> into llNN`, the rest of the house reads it as
  settled and the stranded check goes quiet on it. That claim is now checked
  against the catalog instead of trusted, so a placement that was reverted,
  renumbered, or lost in a merge fails the build by name. Three live rows make
  such a claim and all three are borne out.
- **The expired-parking message now carries the in-flight prompt**, so the next
  session reads it at the moment it is deciding: *this is a DATED flag, so it
  fired for every session at once — check for a placement already in flight.*
  It is a prompt, not a lock, it is tested as a prompt, and the case asserts it
  does not read as one.

**What was measured and rejected, so the next person does not re-propose it:**
*"no passage may repeat the same quoted span near itself"* — **11** existing
instances across 253 lessons are deliberate emphasis (`ll203`'s child band
repeats Deuteronomy 18:15 after 332 characters on purpose); a gate needing an
11-entry allow-list on day one is not an invariant. *"a row must name every
lesson that carries its passage"* — **Luke 4:21 sits in eight lessons** by
ordinary spread; that turns a floor into bookkeeping, the same error as
treating a floor as a quota.

**`re-review: 2026-10-26`** — count the week's dated flags and how many were
paid twice. The prompt reduces recurrence; it does not prevent it, and that is
said plainly rather than claimed as a fix.

## Verification

- **Measured after the resolve, not claimed:** Job 31:1 reach **3**, beyond
  introduction **2**, carried by `ll92-…`, `ll113-…`, `ll183-…`; series
  stranded list **empty**; main's `ll113` retains all **6** of its Job 31:1
  spans, asserted by count during the resolve.
- **`passage-reach.js`: main's row content is taken verbatim** — its Job 31:1
  `why`, its floor and its `DISCHARGED into ll92` wording are unedited. What
  this record adds sits beside them: the `dischargeClaimsNotKept` check, the
  `IN_FLIGHT_NOTE`, and their comments. An earlier draft of this record said
  the file was byte-identical to main; that was true when written and is no
  longer, so it is corrected rather than left standing.
- **Proven to catch on the LIVE row, not a fixture** (DR-0076 §3): the real
  Job 31:1 claim was pointed at a lesson that does not exist and the gate
  failed by name — *"Job 31:1: its row claims DISCHARGED into ll777, but
  ll777 does not carry it"*. Restored **byte-identical** (`cmp`), 24 cases
  green after restore. A companion case asserts at least three live rows
  really do make a discharge claim, so the passing case cannot pass by
  checking nothing.
- **The catalog resolution is computed, never recalled.** The graft set is
  `ours − theirs`, asserted equal to `ours − base`: exactly `ll79`, `ll254`,
  `ll255`. Also asserted: every id once, `ll79`'s array neighbours are `ll78`
  and `ll80`, exactly three modules added, no conflict marker survives.
  Measured result: **253** modules, highest `ll255`, no duplicate numbers,
  every module dated and every date matched to a module in both directions.
- **Four failed resolutions preceded this one, each caught by a measurement
  rather than by review** — recorded because the failure mode is silent
  deletion, the DR-0644 class arriving through a merge instead of a ledger
  fold: taking main's copy wholesale dropped this branch's lessons; grafting
  back "the two" dropped a third, **`ll79`**, this branch's whole reason for
  existing; the appended modules landed in `LIVING_LESSONS_SESSION_FLOW`
  because the script took the first `^];` in the file; and `ll79` was placed by
  its JSON-group neighbour instead of `ll78`/`ll80`.
- Lint clean; `verify:gates` green **by exit code** from `app/`; ledger whole,
  pointer computed from disk.

## What this does not do

- **It adds nothing to the catalog.** The three grafted lessons are this
  branch's existing work, not this record's. What this record contributes is
  the two checks above, not a line of teaching.
- **It does not prevent two sessions working the same flag.** It makes the
  row's claim verifiable and puts the warning where a session will read it.
  A real lock needs cross-session visibility that a held branch does not
  have.
- **It does not touch `ll92`, `ll113`, `ll183`, or the registry row.**
- **It does not claim the duplication was avoidable by me.** Main's #2257
  landed after this branch had already merged and pushed its own placement; the
  second session had no signal either.
