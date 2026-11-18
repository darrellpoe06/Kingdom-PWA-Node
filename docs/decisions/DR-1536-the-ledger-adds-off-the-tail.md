# DR-1536: The ledger adds off the tail, so a waiting PR is not knocked out of date by every landing

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — one writer function and its test; no schema, no policy, no new road
**Type:** decision
**Area:** `scripts/ai-usage-ledger.mjs`, `app/src/__tests__/ledger-adds-off-the-tail.test.js`
**Pairs with:** DR-0644 (keep-prs-current, ledger-only conflicts), DR-1347 (the ledger and its `--add`), DR-1369 (the writer's own serialization), DR-1483 (the first entry moved off the tail by hand)

## Context

Every lesson PR adds one entry to `app/src/lib/ai-usage-ledger.json`, and
`--add` appended it at the tail. Every landing on main appends at the tail too,
so every waiting PR conflicted there on every merge: merge main again, re-run
the whole CI (about 25 jobs), and by the time it finished, main had moved again.
On 2026-11-13 a queue of lesson PRs stalled on this; on 2026-11-18 it drained
only once each branch's entry was moved off the tail by hand, after which
sov84, pm19 and sov85-88 each landed on the first CI run.

## What was measured

- **Order carries no meaning in this ledger.** `validateLedger` checks shape,
  unique ids and that every record from DR-1331 on has a line; nothing reads
  position (`app/src/lib/ai-usage-ledger-rules.js`). DR-1483 already moved its
  entry off the tail for this reason.
- **Git itself confirms both halves,** in the new test: two branches that each
  append at the tail conflict; the same two entries placed by `placementIndex`
  merge cleanly with both kept; a branch placed off the tail merges cleanly
  after main appends.

## Impact

Lesson PRs stop conflicting on the ledger with each other and with main's
appends, so a PR's green CI stays mergeable instead of being invalidated by
the next unrelated landing. `docs/decisions/INDEX.md` still appends rows in DR
order; its conflicts are already resolved inside `git merge` by the dr-ledger
driver (DR-1369), so it is left as it is.

## Decision

`--add` places a new entry at `placementIndex(id, length)`: a slot read from an
FNV-1a hash of the entry's own id, never inside the last 40 entries
(`TAIL_GUARD`). Deterministic, so the same id always lands in the same slot; a
ledger of 40 entries or fewer still appends. Entries already in the file are
not moved.

## Verification

- `app/src/__tests__/ledger-adds-off-the-tail.test.js`: placement stays out of
  the tail at several lengths, a short ledger appends, the slot is stable, and
  three git three-way merges (`git merge-file`) prove the tail append conflicts
  while the new placement merges with both entries kept.
- `ai-usage-ledger.test.jsx` and `resolve-ledger-conflicts.test.js` still pass.
