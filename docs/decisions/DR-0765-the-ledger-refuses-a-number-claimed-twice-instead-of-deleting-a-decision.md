# DR-0765 — The ledger refuses a number claimed twice instead of deleting a decision

**Date:** 2026-10-06
**Status:** accepted
**Area:** governance, delivery lane
**Principle:** DR-0076 (no claim without evidence; proven-to-catch), DR-0075 (perpetual improvement), DR-0644 (the ledger merges resolve themselves)

## Context

Four lanes were in flight at once on 2026-10-06, and two pairs of them picked the
same decision number. The vault lane merged `DR-0762` to main while the L213
lesson lane held `DR-0762` on its branch; the cameras lane merged `DR-0756` while
the reader lane held `DR-0756`. Both pairs are honest: a lane reads the Next-ID
pointer when it starts, and two lanes that start within the same hour read the
same pointer. Parallel lanes are the whole point of the delivery model (DR-0103),
so number collisions are a normal event, not a mistake to scold.

What is not acceptable is what happened next. `scripts/resolve-ledger-conflicts.mjs`
folds the `INDEX.md` rows arriving from both sides and de-duplicates them by DR
number. Two rows with the same number looked like one row arriving twice, so the
resolver kept the first and threw the second away. On both merges that silently
deleted a real decision from the ledger: the vault's row and the cameras' row
were gone from `INDEX.md` while their files sat on disk.

## What was measured

- **Two collisions in one afternoon, both reproduced:** `DR-0762` (vault,
  merged as `969c0b38`) against L213's `DR-0762`, and `DR-0756` (cameras, merged
  as `c8bd57b9`) against the reader's `DR-0756`.
- **The row was deleted, not merely reordered.** After the resolver ran on the
  L213 merge, `business-systems-guard` reported *"INDEX.md has no row for
  DR-0762 — a decision file exists on disk that the ledger does not know."* The
  same sequence happened again on the reader merge, caught by
  `ledger-uniqueness.test.js` in CI: *"duplicate DR numbers — the in-app ledger
  (vite byNum) silently drops one of each pair."*
- **The resolver reported the deletion as routine.** Its own summary line read
  `no duplicate rows` or listed the dropped row under *duplicate rows dropped*,
  wording that reads like housekeeping when a decision had just been lost.
- **The downstream guards did catch it**, which is why nothing shipped broken.
  The defect was that they caught it *after* the file was already damaged, and
  the repair was then done by hand twice.

## Impact

- **A lost decision becomes impossible rather than merely detectable.** The row
  that records a decision is how the ledger is read; a decision whose row is gone
  is a decision no one can find. The resolver is the one tool that edits that
  file unattended, so it is the right place to make the loss impossible.
- **The repair arrives with the refusal.** The message names both files, the
  number they share, and the next free id, so the fix is mechanical: rename the
  newer file, its row, and its references, then run the resolver again.
- **Parallel lanes stay cheap.** Nothing is slowed down and no lane has to wait
  for another. A collision is handled where it is found instead of being paid for
  by a hand repair after a guard fails further down the lane.
- **The ordinary case is untouched.** The same row arriving from both sides,
  linking to the same file, is still folded to one. Only a number claimed by two
  different files is refused.

## Decision

- `normalizeLedger` keys its de-duplication on **the DR number and the file its
  row links to**, not on the number alone. Same number and same link is a
  duplicate and is folded as before. Same number and a different link is a
  collision: the resolver **throws**, naming both files and the next free id, and
  writes nothing.
- The refusal is a message a person can act on without reading the script:
  *"two different decisions claim DR-NNNN — a.md and b.md. This is a number
  collision, not a duplicate row, and folding them would delete one decision from
  the ledger. Renumber the newer file to DR-NNNN (its file name, its INDEX row
  and every reference to it), then run this again."*
- The convention for which file moves is unchanged (DR-0052): the record that
  has not yet merged takes the next free id.

## Verification

- `resolve-ledger-conflicts.test.js` **21/21 green**, including a new case built
  from the real shape of today's collisions: two rows sharing `DR-0101` with
  different links must throw, the message must name both files and `DR-0102`, and
  the same two rows with the same link must still fold to one.
- **Proven to catch (DR-0076 §3), demonstrated rather than claimed:** with the
  de-duplication put back to keying on the number alone, the new case fails with
  *"expected [Function] to throw an error"*. With the fix in place it passes.
- The two collisions that prompted this were repaired by hand in the same
  session: L213's record renumbered to `DR-0763` with the vault's row restored
  from main, and the reader's renumbered to `DR-0764` with the cameras' row
  restored. Both branches' `business-systems-guard` runs report the ledger whole
  with the pointer correct.
