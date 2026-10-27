# DR-1247: The claim tool sees what main holds — the instrument built to prevent renumbers was recommending them

**Date:** 2026-10-27
**Status:** Accepted
**Amends:** DR-1076 (the next free decision number), DR-1021 (the fourth renumber by hand is a tool)
**Pairs with:** DR-0644 (the resolver refuses rather than folds), DR-0076 (verification), DR-0621 (hold the hand of the process)

## Context

`scripts/claim-decision-number.mjs` exists because DR-1021 counted nineteen hand-renumbers in seven days and asked for an instrument instead of a one-liner written on the spot. Its whole job is to answer one question — which decision number is actually free — so that two sessions do not put two decisions on one number.

It was answering that question wrongly, and confidently, for any branch that had not recently merged main.

Found while landing sov51 (#2432). `resolve-ledger-conflicts.mjs` refused the merge, correctly: main had taken DR-1241 for `DR-1241-the-isolation-witness-is-green-again.md` while the branch held `DR-1241-the-office-that-does-not-transfer.md`. The refusal message does the right thing — it names its own blind spot in its own words, *"disk cannot see a branch still in flight"*, and tells the operator to run the claim tool rather than trust the number it just printed.

So the claim tool was run, as instructed. **It returned DR-1244 — a number main already held.**

## What was measured

Two measurements, on 2026-10-27.

**One, the case that exposed it.** Asked from the sov51 worktree (pre-merge), the tool answered `DR-1244 is free on disk AND in flight`. Main's `docs/decisions/` contained `DR-1240`, `DR-1241` and `DR-1244`. Taking the answer would have produced exactly the collision the tool exists to prevent.

**Two, the size of it.** Replayed on a deliberately stale throwaway worktree (`9d246cbf7`, a branch head some days behind main), so the measurement was not one unlucky branch:

| | answer | on disk | what main holds |
| --- | --- | --- | --- |
| before | **DR-1173** | 1073 records, highest DR-1172 | 1132 records, highest DR-1244 |
| after | **DR-1247** | 1073 records, highest DR-1172 | 1132 records, highest DR-1244 |

**74 numbers of drift, not an off-by-one.** DR-1173 collides with sixty landed records. Worse than the wrong number was how reasonable it looked: the tool also printed *"46 number(s) held by unlanded branches, 46 of them at or above DR-1173"*, so the answer arrived wearing evidence of having thought about collisions.

**The mechanism.** `onDisk()` read the working tree's `docs/decisions/` directory. That is main-inclusive only when the branch has merged main. `claimedInFlight()` then skipped every ref that is an ancestor of main, on the stated grounds that *"merged work is already counted on disk"* — true of a current tree, false of a stale one. So main's own landed records were counted **nowhere**: absent from a stale disk, and skipped by the in-flight scan as already merged. The one number a stale branch must never be handed was precisely the number it got handed.

The false premise was written down in the test suite too, as the comment on an existing case: *"a merged branch holds nothing — its numbers are already on disk."*

**Independent confirmation (DR-0076 §7).** The free number was settled separately, before the fix existed, by sweeping all 1,028 PR-head refs plus every local worktree: taken was main's `{1240, 1241, 1244}` plus 1242 (#2433), 1243 (#2431), 1245 (#2434), 1246 (sov51). That sweep said **1247**. The fixed tool, asked independently, also says **1247**. Two methods, one answer.

## Impact — what this obligates, and the limits named rather than left

- Every renumber target this tool has recommended from a stale tree is suspect. This does not retroactively corrupt anything — the resolver's refusal (DR-0644) is what actually caught each collision, and it held every time. The tool was the weaker of the two witnesses, and it is the one that was believed.
- **The resolver remains the authority**, not this tool. The fix makes the advice correct; it does not move the gate. `resolve-ledger-conflicts.mjs` still refuses rather than folds.
- **Unseen records are now stated out loud.** A stale tree prints which landed records it cannot see and that they are counted as taken anyway. Silence about staleness is what let a wrong answer look like a right one.
- **Honest limit:** an unreadable base ref yields an empty set, because `git()` swallows failure by design. That cannot be mistaken for "nothing is taken" — the floor is the HIGHER of disk and base, so a failed read degrades to the old disk-only answer rather than to zero. A case pins this. What is *not* claimed: that an unreadable base is detected and reported as such. It is not, and that is a smaller instance of the same family — a read that fails reading as a clean result. Logged here rather than fixed, `re-review: 2026-11-10`.
- **Honest limit:** `SCAN_LIMIT` stays at 60 branches. The in-flight half is still bounded and can still miss a number held by a branch outside the 60 most recently touched. The manual all-refs sweep remains the authoritative method for a high-stakes renumber; this tool is the cheap first read.

## Decision

`onBase(base = 'origin/main')` reads the base ref's decision files with one `ls-tree`, independent of what the tree has checked out. `main()` folds it in two ways: the taken set becomes `disk ∪ base ∪ inFlight`, and the floor becomes `max(disk, base) + 1` rather than `max(disk) + 1`. A tree behind main prints the records it cannot see.

One `ls-tree` per run. Nothing else about the tool moves — `SCAN_LIMIT`, the bounded scan, and the refusal semantics are untouched.

## Verification

- `claim-decision-number.test.js` — **13 cases green** (10 existing, 3 added).
- **Proven to catch (DR-0076 §3):** making `onBase()` return `[]` reddens the suite with *"origin/main returned no decision files at all: expected 0 to be greater than 0"*. Restored, green.
- The regression case is pinned as arithmetic rather than left to the live corpus, because the live corpus will stop exhibiting it the moment this lands: a stale disk `{1,2,3}` against a base `{1,2,3,4,5}` yields 4 under the old computation — `expect(base.has(oldWay)).toBe(true)`, asserting the defect — and 6 under the new one.
- Live end-to-end, measured above: DR-1173 → DR-1247 on a real stale tree, agreeing with the independent all-refs sweep.
- `lint` exit 0.
