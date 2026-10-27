# DR-1244: The catalog merge resolves itself, or it refuses — `splice-append` becomes a repo tool

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `scripts/splice-append.mjs`, `app/src/__tests__/splice-append.test.js`
**Follows:** DR-0644 (the ledger merges resolve themselves), DR-1021 (the fourth renumber by hand is a tool)

## Context

Living Lessons are built in parallel from one waiting queue, each branch
appending its own lesson object at the same point in
`app/src/lib/living-lessons-class.js`. So merging `main` into the next branch
conflicts there **every single time**, and git interleaves the two lesson
objects into several hunks because they share structural lines (`"title":`,
`"q":`).

`keep-prs-current.yml` meets the same files and says so in its own words, once
per PR, across six PRs today:

> could not bring this branch up to date with `main`: files other than the two
> ledger files conflict, and those are the owner's call. Conflicting:
> `app/src/lib/living-lessons-class.js` `app/src/lib/living-lessons-dates.js`
> `infra/nas-voice-lite/fixtures/clarity-corpus.json`

## What was measured

Landing ll259 → ll262 on 2026-10-27: **5 hunks in the catalog, 1 in the dates
map, 1 in the ledger, on every landing.** Each branch's change to those files is
a **pure, contiguous insertion** against the merge base — 166 added / 0 removed
for the catalog, 6 / 0 for the dates map — so the union is exactly computable
from the three merge stages with no parsing of the file at all.

This was already being done, by a script written in a scratchpad and re-written
from memory each session. That is the recurring friction DR-0075 says becomes a
fix, and DR-1021's precedent exactly: the fourth time a thing is done by hand on
the spot, it becomes a tool in the repo.

## The decision

`scripts/splice-append.mjs`, with its whole decision as a **pure function of the
three merge stages** (`spliceAppend({base, ours, theirs, file})`) so it is
testable without a git repository. It takes the common prefix and suffix of base
vs ours, lifts out our block, and inserts it into `theirs` before the same
anchor — which places ours *after* the sibling's, the order the contiguity gate
wants.

**It is wired to nothing.** The merge/CI lane is not touched: DR-0107 forbids
changing that lane without proving the site still deploys, and that is a
separate piece of work with its own proof. This delivery only makes the tool
exist, tested, where the next session can reach it.

### What it refuses, so it can never be the thing that loses a lesson

- a ledger file — `resolve-ledger-conflicts.mjs` owns those *and the pointer*;
- a change that is not a pure insertion (any deletion);
- a base/ours pair that does not reconstruct as prefix + suffix;
- a `theirs` whose trailing anchor is not the base's — the insertion point moved;
- a catalog block not holding exactly one lesson id.

It writes nothing when it refuses.

## Verification

**Proven to catch — three guards broken, each reverted after:**

| break | result |
| --- | --- |
| the ledger guard disabled | **FAIL** — *"resolve-ledger-conflicts.mjs owns it"* |
| the pure-insertion check disabled | **FAIL** — 2 cases (a deletion, and a change in two places) |
| the id regex reverted to `[a-z0-9-]+` | **FAIL** — the under-count case |

**Verified on the REAL catalog, not only fixtures.** Replaying the true
three-way for ll262 (base `2c5a4d033`, ours `3aaf74807`, theirs `e2c760bbe`),
writing the result to disk and **importing it**: **259 modules, highest ll262, 0
duplicates, ll261 and ll262 both present** — byte-for-byte the same outcome as
the hand resolution that passed the real gates. 16 tests; lint clean.

### A guard that under-counted, found by breaking my own test

The id check read `ll\d+-[a-z0-9-]+`. An id whose slug is not lowercase-kebab
is one it **cannot see** — and an id it cannot see is one it does not **count**,
so a block holding two lessons reported "1 id" and would have been spliced as if
it held one. Found when a fixture used `ll262-alsoOurs`. Real ids are
lowercase-kebab, so this was never a live defect, but a guard that under-counts
is a guard that waves things through, which is the one thing this file must
never do. The slug is now matched permissively and the case is pinned.

Worth recording how close that came to the opposite error: the first reading of
the evidence looked like **a lost lesson**, because the regex I was *checking*
with had the same flaw as the one I was checking. The output was correct the
whole time. Measuring with a broken instrument reads as a broken subject.

## Impact — what this obligates, and the limits named rather than left

Nothing in the lane changes yet, so the obligation this record carries is the
`re-review` below: until it is met, every lesson landing still costs a hand
resolution, and the tool sitting unused is worth nothing. The limits:

- **Not wired into the lane.** `keep-prs-current.yml` will go on advising
  "the owner's call" until a separate change teaches it this tool, and that
  change must prove a real deploy (DR-0107). **`re-review: 2026-11-10`.**
- **The corpus fixture is not spliced.** `clarity-corpus.json` is *generated*;
  its conflict is resolved by regenerating with
  `node scripts/voice-clarity-corpus.mjs --write` and verifying the write took —
  not by merging text. The generator exits 0 without `--write` while writing
  nothing, which has already shipped a stale fixture once.
- The tool reads merge stages, so it only works **during** a conflicted merge.
  Outside one it refuses with "not a three-stage conflict".
