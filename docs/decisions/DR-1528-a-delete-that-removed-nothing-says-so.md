# DR-1528: A delete that removed nothing says so

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — one library function, one handler, one message; no schema, no policy, no new road
**Type:** decision
**Area:** `app/src/lib/choir-sync.js`, `app/src/components/Pulpit.jsx`
**Pairs with:** DR-0076 §8 (unknown is never an answer — here on the WRITE side), migration `0061-dedupe-sermons-guard.sql` (clones in this table are a known fault), DR-1526 (try the road before declaring)

## Context

Darrell, 2026-11-18, on The Word: a draft — *"Your Victory is Guaranteed"* —
would not delete. No error, no message, no movement. The button looked dead.

## What was measured

- **PostgREST answers a refused DELETE with no error and no rows.**
  `deleteSermon` returned `{ deleted: true }` on the strength of `error == null`,
  so a row that is still there reported success, and `reportSkip` then CLEARED
  the error banner. The UI said nothing because the code believed it worked.
- **The list draws one row per duplicate group.** The library renders
  `dedupeSermons(...).kept`; clones live in `dropped` and stay in the table.
  Deleting the kept id promoted a clone into its place, so the card never left.
- **Either defect alone produces the identical symptom** — click, silence. They
  are independent, and both were live.
- **Which one Darrell hit is NOT established.** His database was not read: the
  query was offered and he declined it, which is his call.

## Impact

The button either works (clones) or says why it cannot (a permissions rule).
It can no longer do neither.

## Decision

1. **A delete asks what it removed.** `.select('id')` makes the row count
   visible; zero rows with no error is `nothing-deleted`, never `deleted`.
2. **The whole duplicate group goes.** Every row sharing the message's
   `sermonDedupeKey` is that same message, so they are removed together — one
   logical delete, and a different message cannot be swept in.
3. **A delete gets its own sentence.** `reportSkip` says "could not save", which
   is wrong for a delete and said nothing at all for a silent no-op.

## Verification

- **9 new cases; proven to catch:** restoring the original `deleteSermon` fails
  5 of them, headed by *"a refused delete must never report success."*
- The dedupe-key case pins both directions: two clone shapes share a key, and a
  different title does not — so the group delete cannot widen.
- An empty id makes **no request at all**, asserted by the call log.
- 85 existing choir-sync cases green; eslint clean on both changed files.
- **Not claimed:** not exercised against the live database, and the root cause
  of Darrell's own case is still one of two. `re-review: 2026-11-25`.
