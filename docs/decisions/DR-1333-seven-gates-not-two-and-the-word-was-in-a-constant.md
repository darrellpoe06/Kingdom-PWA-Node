# DR-1333: Seven gates, not two — and the overturned rule was hiding in a constant's NAME, where neither guard could see it

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** B (seven live lesson gates lose a frozen census, two proven-to-catch cases are re-pointed, and the class guard gains a third direction; no product code, no schema, no money — but it decides whether a future lesson may stand on Scripture a past one used)
**Type:** correction
**Declared by:** Darrell, 2026-11-05 (DR-1317 — *"How can we have only reference one scripture ever?! Doesn't make any sense!"* — and *"Fix it!!!!!!"*), applied here to every remaining instance of the machinery that was still enforcing the overturned rule.
**Area:** `app/src/__tests__/sovereign-ai-sov57-verses.test.js` · `…sov58…` · `…sov59…` · `…sov60…` · `…sov61…` · `…sov62…` · `…sov63-verses.test.js` (seven gates) · `app/src/__tests__/no-lesson-gate-claims-a-verse-for-itself.test.js` (+5 cases, 15 total)
**Found by:** the sov67 builder (DR-1332), which hit three of these gates, refused to drop **Hebrews 12:26-27**, refused to edit a neighbour's proof, and reported the defect rather than buying a green check by thinning the lesson.
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** **DR-1317** (the rule this applies), **DR-1323** (the same correction, two gates), **DR-1326** (the same correction, four more, and the guard whose stated limit this closes), **DR-1332** (sov67, which paid for the finding), DR-1316 (the cost shape: a gate failing in a file the new build never touched), DR-0610 (one teaching, one lesson — decided by where a lesson LANDS), DR-0734 (`sharedGround`, which links lessons BY shared Scripture), DR-0076 (§3 proven-to-catch, §4 measure don't claim), DR-0621 (hold the hand of the process)

## Context

This is the third pass at one correction, and the reason it took three is worth recording more than the fix is.

DR-1323 removed seven exclusivity assertions from two gates and wrote its own honest limit: the guard matches **case titles**, so a gate enforcing the rule under an innocent title would pass. DR-1326 measured that limit the next day, found four more instances in `ll275`'s gate, and widened the guard to read **assertion messages** — adding six patterns for the *language of spending*.

Both passes found what they were looking for. Neither found these, because the rule was not written as a sentence at all.

## What was measured

**Seven gates carried it, not two and not three.** `sovereign-ai-sov57` through `sov63` — every lesson in that run — each declared a constant named **`DECLINED_AS_SPENT`** and each asserted a frozen chapter census with `toEqual([])`. A builder copied it forward lesson after lesson, and the name taught the next one the overturned rule before it read a word of prose.

**Why both existing guards were blind to all seven:**

| guard | reads | why it missed |
|---|---|---|
| DR-1323 | `it()` titles | the titles say *"NO chapter of this spine is an anchor of any OTHER lesson"* — none of the five title patterns match |
| DR-1326 | `expect(x, 'message')` strings | the messages say *"another week already stands on"* — none of the six spending patterns match |
| — | identifiers | **nothing read them.** The word `SPENT` lived in `DECLINED_AS_SPENT`, a declaration |

**And it cost, with no route around it.** sov67 (DR-1332) stands on three of those chapters and three gates went red in files sov67 never touched — `Psalms 102` (sov57), `Hebrews 12` (sov62), `Haggai 2` (sov63). Measured decisively by that builder: all 265 cases in those suites pass on clean `origin/main`, so the failures are caused by the new lesson and are not pre-existing.

**sov66's escape route does not exist here.** When sov65's gate refused `2 Kings 18:21`, sov66 could carry **Isaiah 36:6** instead — the Word's other witness, the same clause word for word. **Hebrews 12:26-27 has no second witness.** *"the removing of those things that are shaken, as of things that are made"* appears nowhere else in Scripture, and it is sov67's hinge, its title and its whole teaching. So an exclusivity construct was not inconveniencing a lesson; it was **refusing one outright**, over a chapter census that never looked at where either lesson lands.

## Impact

**Every future Sovereign A.I. lesson was blocked from the spines of seven of its own neighbours**, by gates in files it may not edit, enforcing a rule its Governor overturned on 2026-11-05. The only escapes were to drop the teaching or find a second witness — and the second witness exists only because Scripture is sometimes rich, never because the gate was right.

**A guard that has been widened twice and missed the same class both times is the real finding.** Each pass fixed what it could see and said honestly what it had not measured; each limit turned out to be hiding more instances than the pass had found. DR-1323 found two, DR-1326 found four, this found seven. The pattern is that a rule removed from prose survives in the vocabulary around it.

## Decision

**1. The frozen census becomes a dated measurement in all seven gates.** Each reports its drift (`console.log`) instead of asserting emptiness: *"sov62: 1 of its 10 spine chapters are now shared with another lesson of the department: Hebrews 12 — expected, DR-1317."* A later lesson taking a chapter is the library filling, not a fault.

**2. What is still asserted, because it is about the gate's own honesty:** the census must not be vacuous (`taken.size > 400` department-wide, `> 20` course-wide), and a chapter this lesson DECLINED to take must really be anchored elsewhere — that constrains only this lesson's stated reasoning, never a neighbour's ground.

**3. `DECLINED_AS_SPENT` is renamed `DECLINED_FOR_ANOTHER_LANDING`** in all seven, because that is what the choice actually was: the teaching lands elsewhere, so this lesson did not take it. Nothing is spent. The failure messages are restated the same way.

**4. Two proven-to-catch cases are RE-POINTED, not deleted.** They existed to prove the old refusal fired, and half of each assertion was the frozen census itself. They now prove the thing still worth proving — that the census is a real measurement over live data and cannot read as a pass on an empty scan — with the reason for the change written in beside them.

**5. The guard gains a third direction: it reads IDENTIFIERS.** `SPENDING_IDENTIFIERS` matches `DECLINED_AS_SPENT`, any `*_AS_SPENT`, `SPENT_CHAPTERS|VERSES|GROUND` and `CHAPTERS|VERSES_SPENT` across every `const`/`let` in the suite. `SPENDING_LANGUAGE` also gains the three real phrasings these gates used.

**6. A lesson gate asserting its OWN scope stays legal**, unchanged from DR-1323 and DR-1326. Only the claim on another lesson's ground is refused.

## Verification

**669 cases green**, run from inside `app/`: the seven corrected gates, the class guard (15), and `ll275`'s gate (68, which DR-1326 had rewritten). `eslint` clean across all eight changed files at default settings.

**Proven to unblock, on the real artifact.** The three blocking gates were run twice in a worktree with sov67's actual module checked out of its branch: **255/255 green with sov67 present**, each printing its sharing — `Psalms 102`, `Hebrews 12`, `Haggai 2`, each tagged *expected, DR-1317*. The same three were red on those exact chapters before the change, which the sov67 builder measured independently.

**Proven to catch, executable rather than asserted.** One case reconstructs the **real identifier** `DECLINED_AS_SPENT` and requires the matcher to recognise it; the same case holds the **real message** *"another week already stands on: Hebrews 12"* and requires the widened language patterns to catch it — the measurement that justifies widening them, since DR-1326's six all missed it. A third asserts the replacement name `DECLINED_FOR_ANOTHER_LANDING` is **not** flagged, or the fix would be unshippable. A fourth lists eight ordinary gate identifiers (`SPINE`, `OURS`, `DECLINED_AS_PROSE_BUILT`, `CONFESSION_CHAPTERS`, …) and requires each to pass, so the guard cannot grow into refusing honest work (P46). A fifth reads all seven real files and fails on a title, a message **or** a name.

**Honest limits.** The identifier scan reads `const`/`let` declarations in `app/src/__tests__`; a spending word in a function name, an object key, or a plain comment is still unread, and nothing equivalent runs over `lesson_gates.py` or `band_gates.mjs` — the limit DR-1323 opened and DR-1326 narrowed is narrowed again, not closed. And the guard deliberately does **not** flag a frozen census *by shape*: `toEqual([])` over a computed set is ordinary and correct in a hundred honest places, and a matcher guessing at intent would cry wolf. That means an eighth instance written with neutral vocabulary would still pass. `re-review: 2026-12-05`.

## What this does not close

**Whether other departments carry the same class.** Only the Sovereign A.I. run and `ll275` have been read. `management-stewardship-mgmt9-verses.test.js` and `the-true-month-beside-every-cadence.test.js` both contain the phrase *"already stands on"* and were **not** examined here, because neither blocks anything today. `re-review: 2026-12-05`.

---
_Generated by [Claude Code](https://claude.ai/code)_
