# DR-1028: A growing ledger must not loosen the "already decided" match — rareness is an absolute cap, because every denominator leaks

**Date:** 2026-10-14
**Status:** accepted
**Tier:** A (defect fix in the intake matcher, with the proven-to-catch tests that found it and the corrected one that proves the class)
**Type:** orchestration
**Area:**
- `app/src/lib/intake-outcome.js` (`ledgerIndex`'s `isRare`: an absolute document-frequency cap; `DECIDED_MATCH.rareMaxDocs` added, `rareShare` kept only as a reader's note)
- `app/src/__tests__/intake-outcome.test.js` (new case: rareness may not change when only the count of unrelated records changes)

**Amends:** DR-0625 (the matcher's thresholds), leaving every previously stated threshold value unchanged.
**Grounds:** DR-0076 (a check that drifts is worse than no check, and the drift was measured — twice), DR-0621 (a flag is where the work starts, and we work it until it works), DR-0625 (every intake carried to an outcome)
**Declared by:** the proven-to-catch test for a giving-link note, firing on the 790th decided record — and then again on the 791st

## Concern

`matchDecision` answers an intake note with "already decided" when it matches a decision record closely enough. Its thresholds are deliberately conservative and the file says why: *"a wrong 'already decided' brushes a person off, which is worse than carrying the note as work."*

One of its four conditions is `minRareShared: 3` — at least three shared words must be RARE in the ledger. Rareness was `df <= floor(n * rareShare)`: a **step function** whose ceiling rose with every tenth decided record. A check built to be conservative was getting monotonically **looser** as the house wrote decisions, and the ledger is append-only by design.

## Evidence

**THE ORIGINAL DEFECT, MEASURED IN BOTH TREES.** Adding DR-1027 took the count of records carrying a decision from **789 to 790**:

| | base (6d5cdbe86) | with DR-1027 |
| --- | --- | --- |
| decided records (`idx.n`) | 789 | 790 |
| `rareMax = floor(n × 0.1)` | **78** | **79** |
| `df("church")` | 79 | 79 (unchanged) |
| `church` rare? | 79 > 78 → **no** | 79 ≤ 79 → **yes** |

The note is a real one from the first live census: *"Add the giving link from the church website thechurchofthelivinggod.com"*, tokens `giv, link, church, website`. `giv` and `website` were already rare and `link` was not, so rareShared was **2** and the note correctly did not match. One record later it was **3**, and `matchDecision` returned **DR-0136** at coverage 1.0.

**The consequence in plain words.** A member reports the giving link is missing, and instead of the note becoming work the app tells them it is *already decided*, citing a record about the Give panel's channels. Not because the matcher changed — because the house wrote one more decision about something else. Nothing in DR-1027 mentions giving, the church website or DR-0136; it was simply the 790th such record, and any record would have done it.

**MY FIRST FIX WAS WRONG, AND IT SHIPPED A FALSE CLAIM FOR ONE COMMIT.** I replaced the floor with a strict ratio, `df / n < rareShare`, and wrote in this record and in the commit message that it had "no step to cross", so "growth alone can never promote a token into rareness." **That reasoning was backwards.** The floor form loosens by raising the ceiling; the ratio form loosens by shrinking the quotient. Both have `n` in them, and that was the whole problem.

The full suite caught it one record later. Adding DR-1028 itself took `n` to **791**, and 79/791 = **0.09987**, which IS below 0.1 — so `church` became rare again and the same note matched again. The arithmetic I had offered as proof (79/789 = 0.1001, 79/790 = 0.1000) only ever showed that two particular points sat above the line; it said nothing about the direction of travel, which was downward all along.

**AND MY FIRST TEST FOR IT WAS WORSE THAN NO TEST.** The case I added alongside that fix appended 5, 9, 10, 11, 25 and 100 unrelated records to the fixture ledger and asserted a non-matching note still did not match. It passed — and it passed against the floor form *and* against the ratio form, verified by restoring each. Every word in that fixture sat far below any threshold, so the rare set never changed and the assertion never exercised the thing it named. A proven-to-catch that cannot fail on the defect in its own title is a green light with nothing behind it, which is precisely the failure DR-0076 §3 exists to forbid, committed in the act of fixing another one.

**WHY AN ABSOLUTE CAP IS THE ONLY SAFE FORM.** `df` is monotone non-decreasing as records are added. A cap on `df` alone therefore can only ever *demote* a word out of rareness, never promote one into it — so appending records can only make matching harder. Any measure involving `n` can promote, because `n` grows while `df` does not have to.

**THE NUMBER WAS CHOSEN FROM THE MEASURED GAP, AND THE FIRST CHOICE WAS ALSO WRONG.** On the real ledger the two bracketing cases are:

- **must match DR-0248** — "the kill switch should be back on the deterministic automation loops": `automation` 15, `kill` 29, `deterministic` 37, `loop` 51, `switch` 54, `back` 140.
- **must not match** — the giving note: `website` 2, `giv` 19, `church` 79, `link` 91.

I first took **50**, reasoning from the three rarest words of the true positive (15/29/37) that anything ≥ 40 would do. The suite refused it: DR-0248 reaches three rare words only through `loop` (51) and `switch` (54), so at 50 it dropped out of the candidate set entirely and the note matched the older DR-0110 it amends. The usable window is **[54, 78]**, not [40, 78]. **65** is taken — 11 clear of the true positive, 14 below `church`, the nearest word that must not qualify.

## Impact

- Unresolved: the match loosens by one rareness tier roughly every ten decided records, forever, with no signal but a borderline note being brushed off.
- The call obligates: a threshold in a safety check may not move as a side effect of unrelated growth, and a test that claims to prove a class must be shown to fail against that class before it is believed.

## Decision

1. **Rareness is an absolute document-frequency cap: `df <= rareMaxDocs`, with `rareMaxDocs: 65`.** No denominator, so no leak.
2. **The number is decided, not derived, and is re-reviewable.** It was read off the measured gap between the two bracketing cases rather than fitted, and both bounds are written into the code beside it.
3. **Matching gets HARDER as the ledger grows, and that is the intended direction.** `df` only rises, so over time fewer words qualify as rare and fewer notes are answered "already decided" — which is the failure the file already prefers.
4. **No previously stated threshold changes.** `minShared`, `minRareShared`, `minCoverage`, `minTitleShared` and `newerWithin` are untouched, and the test pinning the first four still passes. `rareShare` remains exported but unread, so a reader can see what the derived form was.
5. **The invariant is asserted on `isRare` directly, with a fixture built to straddle the boundary.** Two ledgers hold the same word in exactly 6 records and differ only in how many unrelated records sit beside them (n = 50 and n = 100). Same `df`, so the verdict must be identical.

## Outcome

- **50 tests green**, and **proven to catch BOTH broken forms**, each verified by restoring it: with `df <= floor(n * 0.1)` the new case fails (6 > 5 then 6 ≤ 10); with `df / n < 0.1` it fails (0.12 then 0.06); with the cap it passes.
- The giving-link case passes on its own terms again: `matchDecision` returns null, the note categorises as `work`, and the domain is still stripped to nothing by `tokensOf`. The DR-0248-over-DR-0110 case passes, which is what rejected the first cap.
- **Found only because the full suite was allowed to finish before pushing — twice.** The lesson that exposed it (DR-1027) had 66 green checks of its own and passing curriculum gates; this failure was two subsystems away, and the second failure was introduced by my own fix and caught by the same discipline.
- `re-review: 2026-11-14` — read `rareMaxDocs` against the ledger's size then. At 65 of ~790 it is about one in twelve; as the ledger grows that fraction shrinks and matching tightens, which is safe but should be a decision rather than a drift in the other direction.
