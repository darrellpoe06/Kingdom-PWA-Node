# DR-1292: Join is not the inverse of the parse — the ledger resolver's union was right and its rendering threw the answer away

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (the tool every session runs on every base merge; no product code, no schema, no money — but a wrong answer here corrupts the append-only ledger, so it carries its proof)
**Type:** verification
**Area:** `scripts/resolve-ledger-conflicts.mjs` · `app/src/__tests__/the-pointer-line-stops-doubling.test.js`
**Pairs with:** DR-0011 (the ledger is append-only; the annotations ARE the record), DR-0644 / DR-1021 / DR-1136 (the resolver and the number-collision rules it exists for), DR-0076 (§3 proven-to-catch, §4 measure don't claim, §5 characterise before you change, §8 honest uncertainty), DR-0621 (a flag is where the work starts; we do not discard what does not work), DR-0236 (what is buildable now is built now), DR-0975 / LESSONS P53 (a record nobody can read is not a record)

## Context

`the-pointer-line-stops-doubling.test.js` exists because the `**Next ID:**` pointer line in `docs/decisions/INDEX.md` once grew to **25.7 MB**. The cause, recorded in that file's own header, was a parser that split annotations on paren balance: the accumulated prose carried 70,959 `(` against 69,237 `)`, so depth never returned to zero and the whole remainder was kept as one opaque group. Two opaque blobs from opposite sides of a merge are never string-equal, so the de-duplication could not see them and every fold appended blob to blob.

That was fixed. `nextIdAnnotations` now splits an unbalanced tail on its `(DR-NNNN = ` markers instead of keeping it whole, and `unionAnnotations` de-duplicates the first list against itself as well as the later ones. The suite pins both halves and a 200 KB budget.

Tonight the test went red again, on PR #2487, in CI shard 1/4.

## What was measured

**Characterised before changing anything (DR-0076 §5).** The merge was reproduced exactly rather than reasoned about:

```
git worktree add --detach /tmp/wt-ledger-repro b134a6e6b
cd /tmp/wt-ledger-repro && git merge --no-commit 9497057c2
```

and the conflicted `INDEX.md` measured with the script's own parser:

| | |
|---|---|
| `**Next ID:**` lines in the conflicted file | **2** |
| pointer line 0 (the branch's side) | **42** segments, **41** unique |
| pointer line 1 (`main`'s side) | **45** segments, **45** unique |
| `unionAnnotations` of the two | **48** segments, **48** unique — **correct** |
| re-parse of `union.join(' ')` | **43** segments, **42** unique — **what landed on disk** |
| a second `resolveLedgerText` pass | **42 / 42** — clean |
| a third pass | byte-identical to the second |

**So `unionAnnotations` was never the bug.** Its answer is right, and the *rendering* destroys it. `nextIdAnnotations(ann.join(' ')) !== ann`.

**Which segments, and why.** Seven of the 48 could not be recovered from the joined line, and **every one of the seven is individually balanced** — so "unbalanced prose" is not a sufficient account of it. The mechanism is narrower: once the line *as a whole* becomes unbalanced at some earlier point, everything after that point is an unbalanced tail, and the tail is re-split **only** on `(DR-NNNN = ` markers. A segment beginning `(DR-1272, ` — a comma, not ` = ` — has no marker to be found by, so it is absorbed into the segment before it.

The duplicate is that absorption landing on an existing string:

```
absorbed [5]  (DR-1279 = the-moat-that-moves-bank9, 2026-10-28.)
absorbed [6]  (DR-1272, DR-1273 and DR-1274 are held by sibling lesson branches in f…
duplicate     (DR-1279 = the-moat-that-moves-bank9, 2026-10-28.) (DR-1272, DR-1273 a…
```

One side of the merge held that pair as **one** segment; the other held it as **two**. The union rightly kept both strings, because they are different strings. The re-parse re-joined the two back into the merged form — which was already in the line — and that is the duplicate the test caught.

**Nothing was lost, only re-segmented.** The union totalled 58,418 characters of annotation; the naive render read back as 58,423 (the five joining spaces absorbed); the converged line is 57,905, which is the one repeated 581-character segment going away. All **48** union segments are still present verbatim in the converged line — **0 missing.**

## Impact

A merge of two pointer lines could leave a duplicate on the line, and the only thing that caught it was a test that already existed for a worse version of the same disease. Left alone, every base merge that hit this shape would add one more repeat, which is the growth curve that reached 25.7 MB — slower, but the same curve. And the failure presents as a red shard on an unrelated PR, which is how a session loses an hour to a test it did not write.

This is also a correction to how the symptom was first read. On PR #2487 the repair was made by running `resolveLedgerText` a second time, and the commit there described the one-pass gap as needing "a reproducible conflicted fixture" that had been "resolved away." **The input was reproducible** — two commit SHAs and a worktree — and running the tool twice was the right *repair* but the wrong *fix*: it leaves the next session to notice.

## Decision

**The renderer proves its own output.** New exported `renderPointerLine(pointer, lists, { maxPasses = 6 })`: fold, render, read back, and fold again until the line is a fixed point. `normalizeLedger` renders through it and no longer joins annotations itself, and reports `pointerPasses` and `pointerSegments` so a caller can see whether a repair was needed.

**Why converge rather than fix the writer.** Making every segment self-delimiting means rewriting annotation prose somebody actually typed into the record — balancing parens in the ledger's own words. The annotations **are** the record (DR-0011, append-only), so the writer does not get to edit them. What it can do is refuse to leave a line that does not read back cleanly.

**Two guards, both loud**, because a quiet repair here is how the 25.7 MB line grew:

1. **Not converged within `maxPasses` → THROW with the counts, and the line is not written.** A line that cannot be rendered faithfully does not ship.
2. **Any segment of the first union missing from the final line → THROW.** Segmentation may merge; the record may never lose a word.

Measured on the real case: one invocation now converges in **2 internal passes** to **42 / 42**, a second invocation is a no-op, and **0 of 48** segments are missing.

## Verification

- `the-pointer-line-stops-doubling.test.js` — **21 tests** (was 11). The committed `INDEX.md` is asserted to need **`pointerPasses === 1`**, so a pass above 1 means the line in the repository is already doubling.
- **104 tests** green across the five suites that import this script (`resolve-ledger-conflicts`, `renumber-decision-record`, `splice-append`, `keep-prs-current-lane`, and this one).
- `npm run lint` **0**; `npm run verify:gates` read without a pipe; the resolver's own CLI run clean on the tree (`pointer DR-1289, 1 Next-ID line folded, no duplicate rows`, guard green).
- **Proven to catch — two breaks on the live script, one at a time, each restored byte-identical (`cmp`):**

  | break | result |
  |---|---|
  | `normalizeLedger` back to the naive join — the state before this change | **1 failed** |
  | the duplicate-throw guard disabled | **1 failed** |

  Restored: **21 passed** after each.

- **The first cut of this suite did not catch break 1, and that is recorded rather than quietly fixed.** Reverting `normalizeLedger` to the naive join left all 19 behavioural cases green, because the committed `INDEX.md` happens to read back clean right now, so the function never meets the asymmetry on today's data. A suite that only passes on today's data is not a gate (DR-0076 §3). The wiring is now pinned by source — `normalizeLedger` must call `renderPointerLine(pointer, annotationLists)` and must not contain `ann.join(` — which is the assertion that fails when the naive join comes back.

## Honest limits

- **The prose-loss guard's throw path is NOT exercised.** It was broken deliberately (`const lost = []`) and all 21 cases stayed green. No fixture triggers it, because convergence merges segmentation and a merged segment still *contains* its parts, so `line.includes(g)` holds. It is a belt-and-braces assertion against a failure mode nobody has produced, not a proven gate, and this record says so rather than counting it. **`re-review: 2026-11-19`** — either a case is found that reaches it, or the guard is removed as theatre.
- **An end-to-end fixture driving `normalizeLedger` through the absorption was attempted and NOT achieved.** The duplicate needs one side to hold `(DR-1279 = …) (DR-1272, …)` as one parsed segment and the other as two, with the pair landing adjacent *inside* an unbalanced tail. Parsing normalises the two shapes whenever they sit in the same region of a line, and `unionAnnotations` prepends a later list's new groups, which moves them out of the tail — so with two synthetic pointer lines the shapes collapse to one list and the fold is clean. The real case reached it with the pair deep inside 48 segments and several unbalanced regions. Four orderings were tried and measured; none reproduced it. This is unfinished work, not a property that holds. **`re-review: 2026-11-05`**; the honest alternative, if no minimal fixture is found, is to check in the two real pointer lines (~58 KB) as a fixture.
- **`maxPasses = 6` is not tuned against anything.** The one real case needs 2. The number is a bound on a loop that is observed to converge, not a measurement.
