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
- **~~Honest limit~~ — CLOSED THE SAME DAY, BY CI, ON THIS BRANCH.** The limit as first written: *"an unreadable base ref yields an empty set, because `git()` swallows failure by design. That cannot be mistaken for 'nothing is taken' — the floor is the HIGHER of disk and base, so a failed read degrades to the old disk-only answer rather than to zero… What is not claimed: that an unreadable base is detected and reported as such. It is not, and that is a smaller instance of the same family — a read that fails reading as a clean result. Logged here rather than fixed, `re-review: 2026-11-10`."*

  **It was not smaller, and it did not keep until November.** It fired within the hour, in CI, on this very branch — and the thing that found it was the case written to prove the fix. **A GitHub Actions checkout has no `origin/main` remote-tracking ref at all** (detached HEAD, no local `main`), so `onBase()` read nothing, `base.size` was 0, and `expect(base.size).toBeGreaterThan(0)` was red — a red test whose message, *"origin/main returned no decision files at all"*, was the literal truth about the environment rather than a defect in the arithmetic.

  The reasoning that filed it as acceptable was wrong in one specific way: "degrades to the old disk-only answer" treated the pre-DR-1247 behaviour as a safe floor. It is not a floor — **it is the bug this record exists to fix.** A failed read degrading to the defect is not degradation, it is reversion, and it reverts silently while printing a confident number. **Measured, in a checkout built to CI's shape** (`git init -b work`, one commit, detached HEAD, no remote): the pre-fix code prints `next free decision number: DR-1248` and `on origin/main: 0 record(s)` at exit 0 — a recommendation made with main never read, and DR-1248 was at that moment held by a sibling branch of this one. The fixed code refuses, exit 1.

  **The deeper reading:** this is DR-1249's rule — *a read that failed must not read as a clean result* — which I wrote and shipped for the NAS builder earlier the same day, and then wrote into this record as a tolerated exception a few hours later. The principle was not missing; it was declared and then not applied to my own tool. That is the finding worth keeping.
- **Honest limit:** `SCAN_LIMIT` stays at 60 branches. The in-flight half is still bounded and can still miss a number held by a branch outside the 60 most recently touched. The manual all-refs sweep remains the authoritative method for a high-stakes renumber; this tool is the cheap first read.

## Decision

`onBase()` reads the base ref's decision files with one `ls-tree`, independent of what the tree has checked out. `main()` folds it in two ways: the taken set becomes `disk ∪ base ∪ inFlight`, and the floor becomes `max(disk, base) + 1` rather than `max(disk) + 1`. A tree behind main prints the records it cannot see.

**And it answers only when it has actually read a base.** `readRef(ref)` returns `null` when the ref itself could not be read and a Set when it could — git's own discrimination, by exit code: `ls-tree` on a bad ref exits non-zero, while on a good ref with no such path it exits 0 and prints nothing. `onBase()` returns `{ ok, ref, numbers, tried, reason }`, trying `origin/main`, then `refs/remotes/origin/main`, then `main`, and reporting which one it used so the output never names a ref it did not read. Two distinct faults are named rather than collapsed: no candidate readable, or a ref read that holds no decision records at all (impossible for this repository, so it is a fault and not an answer). On either, `main()` prints a refusal naming the refs it tried, recommends **no number**, and exits 1. `claimedInFlight()` is given the same ref that was actually read, so the two halves can never disagree about which base they mean.

One `ls-tree` per candidate, at most three. Nothing else about the tool moves — `SCAN_LIMIT`, the bounded scan, and the resolver's authority are untouched.

## Verification

- `claim-decision-number.test.js` — **15 cases green** (10 existing, 5 covering both halves).
- **Proven to catch (DR-0076 §3), the arithmetic:** making `onBase()` return `[]` reddens the suite with *"origin/main returned no decision files at all: expected 0 to be greater than 0"*. Restored, green.
- **Proven to catch, the failed read:** collapsing `readRef()`'s `null` into an empty Set (`readRef(ref) || new Set()`) reddens with *"expected 'refs/heads/no-such-ref-exists-here wa…' to match /no base ref could be read/"* — the collapsed version misreports a ref that **is not there** as a ref that **holds nothing**, which are opposite facts. Restored, 15 green.
- **Proven end-to-end in CI's own shape, not only in unit tests** — the lesson of DR-1250, where 36 unit cases passed over a CLI that was broken. In a throwaway checkout built to match a GitHub Actions one (`git init -b work`, one commit, `checkout --detach`, no remote, two real decision files), the pre-fix code printed `next free decision number: DR-1248` / `on origin/main: 0 record(s)` at **exit 0**, and the fixed code printed the refusal naming all three candidate refs at **exit 1**.
- **The CI-safe property is now what is asserted.** The old case needed `origin/main` to exist, which is why it was red on a runner. The property that actually matters needs no such ref: the numbers must come from a **ref**, not from the working tree. `HEAD` always exists, so the case plants `DR-9998-a-file-no-commit-has.md` on disk and asserts `onDisk()` sees it while `onBase('HEAD')` does not — the discrimination itself, provable anywhere, and the planted file is removed in a `finally`.
- The regression case is pinned as arithmetic rather than left to the live corpus, because the live corpus will stop exhibiting it the moment this lands: a stale disk `{1,2,3}` against a base `{1,2,3,4,5}` yields 4 under the old computation — `expect(base.has(oldWay)).toBe(true)`, asserting the defect — and 6 under the new one.
- Live end-to-end, measured above: DR-1173 → DR-1247 on a real stale tree, agreeing with the independent all-refs sweep.
- `lint` exit 0.
