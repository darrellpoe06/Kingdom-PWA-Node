# DR-1344: A proof of a removed refusal is still the refusal — DR-1333 corrected seven gates and left the frozen census standing inside five of their own proofs

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** A (five proven-to-catch cases re-pointed in lesson gates; no product code, no schema, no money, no reader-facing text)
**Type:** correction
**Declared by:** Darrell, 2026-11-05 (DR-1317), applied here to the last place the overturned rule was still live after DR-1333.
**Area:** `app/src/__tests__/sovereign-ai-sov58-verses.test.js` · `…sov59…` · `…sov60…` · `…sov61…` · `…sov63-verses.test.js`
**Found by:** CI on PR #2555 (sov68), shard 4/4 — `expected [ 'Hebrews 6', 'Proverbs 11' ] to deeply equal [ 'Proverbs 11' ]` in sov61's gate.
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** **DR-1333** (the incomplete fix this completes), DR-1317 (a verse is never spent), DR-1323 and DR-1326 (the two passes before it), DR-1332 (sov67) and the sov68 build that exposed it, DR-0076 (§3 proven-to-catch, §4 measure don't claim), DR-0621 (hold the hand of the process)

## Context

DR-1333 removed the frozen chapter census from seven Sovereign A.I. gates and said so in its own title: seven, not two. It was right about the count and wrong about the extent.

Each of those gates also carries a **proven-to-catch** case — a proof written to show the old refusal fired. Each of those proofs contained, as its second half, the very assertion being removed:

```js
const bentOurs = [...OURS, 'Proverbs 11'];
expect(bentOurs.filter((c) => taken.has(c))).toEqual(['Proverbs 11']);
expect(OURS.filter((c) => taken.has(c))).toEqual([]);   // ← the frozen census, again
```

DR-1333 re-pointed exactly two of them — sov57's and sov62's — **because those were the two that went red when it ran the gates against sov67's module.** The other five were left untouched and looked green, for the only reason that sov67 did not happen to share a chapter with them.

## What was measured

**sov68 shared a chapter with two of the five, and both went red.** CI on PR #2555 shard 4/4 reported sov61's proof failing with `expected [ 'Hebrews 6', 'Proverbs 11' ] to deeply equal [ 'Proverbs 11' ]` — sov68 anchors **Hebrews 6**, which is one of sov61's, so the bent list returned two where the proof pinned one. Running all seven gates against sov68's real module surfaced a second: **sov60 shares Amos 3.**

**The exact-equality on the bent list is the same defect in the other direction.** `toEqual(['Proverbs 11'])` says the bent list contains that chapter *and nothing else*, which silently re-asserts that none of `OURS` is shared. Both lines had to change, not one.

**Six files carried the stale line**, found by searching for its literal text rather than by memory: sov58, sov59, sov60, sov61, sov62 and sov63 — sov62's being DR-1333's own replacement comment, which quotes the old line and is not an assertion.

## Impact

**DR-1333 shipped green and was still incomplete, and nothing in it would have told anyone.** Its verification ran the corrected gates against the one lesson in flight at the time. That is a real measurement and it proved what it claimed; it simply could not see a defect that only a *different* lesson's chapters would expose. Five latent failures stayed latent for one more lesson, and the next build paid for two of them.

**The lesson about verification is the finding.** "I ran it against the lesson that broke it" is weaker than it feels: it proves the fix handles that lesson, not the class. The right question was the one DR-1333 asked of the main assertions and failed to ask of the proofs — *where else does this exact text appear?* A grep for the literal line would have found all six in one pass, before CI did.

## Decision

**1. The frozen-census half is removed from all five remaining proofs**, each replaced with a non-vacuity assertion on the census itself (`taken.size > 20`), and each carrying the measurement that exposed it so the next reader knows why the line is gone.

**2. The bent-list equality becomes `expect.arrayContaining`** in every one, so the proof still shows a known-taken chapter is detected while no longer asserting that this lesson's own ground is unshared.

**3. What the proof still proves is kept**: a chapter known to be anchored elsewhere must read as taken. If that ever stops, the census above it is scanning nothing and the report is decorative.

## Verification

**601 cases green** across the seven gates and the class guard on clean `origin/main` (`fae90d561`), run from inside `app/`. `eslint` clean on all seven files.

**Proven against the lesson that exposed it.** With sov68's real module checked out of `refs/pull/2555/head` into the worktree, the same seven gates run **586/586 green**, printing five sharings as measurements: `sov57: Psalms 102`, `sov60: Amos 3`, `sov61: Hebrews 6`, `sov62: Hebrews 12`, `sov63: Haggai 2` — each tagged *expected, DR-1317*. Two of those five (sov60 and sov61) were red before this change, and sov60's was not reported by CI at all; it was found by running the whole set rather than by reading the failure list.

**Honest limit, and it is the same one DR-1333 had.** This was verified against the two lessons currently in flight. A third lesson sharing a chapter with sov58, sov59 or sov63's spine would be the next test of it, and none exists today to run. What *is* stronger than last time: the fix was applied by searching for the literal stale text across every gate rather than by waiting for a red, so the remaining risk is a variant spelled differently rather than another copy of the same line. `re-review: 2026-12-05`.

---
_Generated by [Claude Code](https://claude.ai/code)_
