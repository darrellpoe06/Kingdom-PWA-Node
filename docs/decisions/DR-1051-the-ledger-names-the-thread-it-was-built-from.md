# DR-1051: The ledger names the thread it was built from — the DR-0610 lock gets a second witness

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (one new guard plus two recovered ids; no data, no money, no new door, no control moved)
**Type:** orchestration
**Area:**
- `scripts/ledger-names-its-thread.mjs` (new — `isEmailSourced`, `namesAThread`, `walkLedger`, `NEAR_WINDOW`)
- `app/src/__tests__/ledger-names-its-thread.test.js` (new — the gate and the shrink-only outstanding ledger, 13 checks)
- `docs/decisions/DR-1005-order-carries-meaning.md`, `docs/decisions/DR-1004-the-cost-of-owning.md` (thread ids recovered)

**Amends:** DR-0610, whose lock is "the `lesson-captured` tag written only after the push". The tag stays the lock; this adds the witness that catches it when it is missed.
**Grounds:** DR-0610 (one teaching, one lesson); DR-1050 (the finder's inexact matching, and the proximity lesson reused here); DR-0236 (nothing waits — this was named as the remaining gap and built the same session); DR-0225 (brakes gate activation, never building); DR-0076 §3 (proven-to-catch), §4 (measure, do not claim), §8 (honest uncertainty); DR-0075 (a real debt carries a why and a date)
**Declared by:** me, after DR-1050's record named this as the weakest link and then parked it on Darrell — which the integrity guard correctly refused

## Context

On 2026-10-15 the Gmail intake surfaced thread `1a135f165fe391e3` as
uncaptured. It was already a lesson: **sov39, under DR-1005, built on
2026-10-13 from that same forward, the same day it arrived.** The thread was
simply never tagged `Lesson-Captured`.

**Why nothing caught it.** DR-0610 names the lock as *"the `lesson-captured`
tag written only after the push."* That tag is a Gmail label — a **single
witness, living outside the repo**, which can silently fail to be written. It
did. And DR-1005 recorded no Gmail thread id, so nothing in the repo
contradicted the label. **Both witnesses were blind at once**, and the
duplicate was avoided only because the phrase "positional encoding" happened to
sit in DR-1005's prose. With different wording the house would have shipped a
second lesson on a teaching it had already taught — the exact thing DR-0610
exists to prevent.

**Why this and not more inference.** DR-1050 had to measure character distances
between a source name and a date to make the finder's *inexact* matching safe.
That inference is only necessary because the exact identifier is missing. A
record is append-only and local, so with the thread id in it,
`grep <thread id> docs/decisions/` answers "have we built this?" exactly,
offline, with no label and no guessing from a subject line.

**This record exists because the last one parked the work.** DR-1050 named this
gap and left it as a question for the Governor. The `ari-integrity-guard`
stop-hook refused that reply before it reached Darrell, citing DR-0111. It was
right: the change is additive, the shrink-only-debt pattern is already
established in this repo, and DR-0236 says work that can be built and verified
now is built now. The guard caught a process defect in me, not in the code.

## What was measured

- **The near-miss itself**, above: DR-1005 built 2026-10-13, thread untagged,
  re-surfaced 2026-10-14 and 2026-10-15.
- **The detector was narrowed by measurement, twice.** A whole-file test for
  "forwarded" plus the quoted one-word instruction flagged **40** records;
  requiring them within `NEAR_WINDOW` (600) characters flags **27**. The 13 it
  drops include `DR-0685` (Android dictation), which has nothing to do with an
  emailed teaching. This is DR-1050's lesson applied one record later:
  co-presence in a 50KB file is not a statement.
- **The debt, measured and then reduced.** Of the 27 email-sourced records,
  **11** named no thread id. Two were recovered the same session, leaving
  **9**:
  - `DR-1005` → **`1a135f165fe391e3`**, verified directly today by reading the
    thread and matching its source, its forward time and its one word.
  - `DR-1004` → **`1a135b7ba6605c98`** ("Fw: 91% of finance AI pilots are
    failing. Is yours next?", CFO Dive, forwarded 2026-10-13 14:43 UTC) — the
    only CFO Dive forward in that window, and it carries both
    `Lesson-Captured` and `Lesson-Published`. The basis is recorded in the
    record itself rather than presented as certainty.
- **The remaining nine are not guessed.** Each is listed with why, and the two
  hardest say so plainly: DR-0412 and DR-0416 were *both* forwarded on
  2026-09-15 ("Darrell forwarded two items on 2026-09-15"), so source-and-day
  cannot tell them apart and an id would have to be matched by subject first. A
  guessed id is worse than a missing one — it would make the exact query return
  a confident wrong answer.
- **THE GUARD CAUGHT A GAP ON ITS FIRST RUN, and the gap was in my test.** It
  failed on the Morning Brew thread `1a13f985bb4d2a79`. The record that carries
  it, DR-1049, is on its own unmerged branch and so is not in this tree — I had
  asserted a record that does not exist here. Checked on that branch: DR-1049
  **does** name the id. The assertion was corrected rather than the ledger.
- **The threshold is 1048, not 1051, on purpose.** Setting it at this guard's
  own number would exempt the three records that prove it works. Verified
  before setting it: DR-1048 names `1a13feefef705fa7`, DR-1049 names
  `1a13f985bb4d2a79`, DR-1050 names `1a135f165fe391e3`.
- **A 40-character git SHA is rejected as a thread id**, asserted directly —
  otherwise every record citing a commit would look compliant and the guard
  would be theatre.

## Impact

**What it buys.** The intake's first question stops depending on a label that
can fail silently. One grep, local and exact, replaces an inference that needed
a measured character window to be trustworthy.

**What it obligates.** Every lesson built from a forward now carries its thread
id in its provenance line. That is one phrase per record and it is enforced, so
it cannot quietly lapse.

**What it does not claim.** The guard cannot tell whether an id is *real* — it
reads the repo, never Gmail. A wrong id is a different failure from a missing
one, and only the second is caught. Said here rather than left to be assumed.

**What it costs.** One pattern scan per record on each run of the suite.

## Decision

1. **A record describing a teaching that arrived as a forward must name its
   Gmail thread id**, from `DR-1048` on, enforced by
   `ledger-names-its-thread.test.js`.
2. **Detection is by proximity**, not whole-file co-presence — the DR-1050
   rule, reused.
3. **The nine older records are a shrink-only debt**, each with a stated why,
   following the `HELD` pattern in `n8n-is-gone.test.js`. The list is asserted
   to equal the real debt in **both** directions, so a stale excuse must be
   deleted in the same commit that recovers an id, and a new record cannot join
   it quietly.
4. **An id is recovered or left missing, never guessed.**

## Verification

- **Targeted:** `ledger-names-its-thread.test.js` **13/13**.
- **Proven to catch, two mutations, both on the real ledger:**
  1. A new email-sourced record naming no thread id → **RED**, naming the rule
     and the fix (*"Add it to the provenance line as (Gmail thread `<16
     hex>`)"*).
  2. An id recovered while its outstanding entry was left in place → **RED**,
     *"an entry no longer applies — delete it in the same commit that recovered
     the id"* (9 vs 8).
  Both reverted, and `DR-0505` confirmed restored byte-identical by
  `git diff --stat`. Restored tree: **GREEN, 13/13.**
- **Gates:** `npm run verify:gates` — 20 guards. **Lint:** clean.
- **Not proven here:** the full suite did not complete locally; parallel
  sessions hold the shared memory lock. CI's four shards are the authority.

## What this does not fix

- **Nine records still name no thread**, listed with why in the test. Recovering
  them means matching each forward by subject in Gmail — real work, not a
  sweep, and not safe to guess. **`re-review: 2026-10-22`**, with the other
  intake items already dated that day.
- **The `Lesson-Captured` label for thread `1a135f165fe391e3` is still not
  written.** The Gmail label calls need an approval this session does not hold,
  so the tag is outstanding and reported as outstanding. The repo now records
  the thread, so the next tick can tell it is built even with the label
  missing — which is precisely the failure this record was written for.
