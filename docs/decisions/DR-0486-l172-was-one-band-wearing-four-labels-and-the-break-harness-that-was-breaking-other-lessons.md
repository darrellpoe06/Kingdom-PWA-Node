# DR-0486 — L172 was one band wearing four labels, and a break harness that was breaking other lessons

- **Status:** accepted
- **Tier:** B (lesson content on the corpus reader path, plus a gate change)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (ll172 youth + senior bands re-authored), `app/src/lib/band-differentiation-baseline.json` (19 -> 18 entries), `app/src/__tests__/band-differentiation-gate.test.js` (live-catch threshold derived rather than hard-coded)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §8 honest uncertainty), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0484 (the measure), DR-0485 (the first repair), DR-0468 (L172 itself)

## The state it was in

`ll172-the-spirit-of-your-mind-dust-breath-and-the-one-who-inhabits-eternity` measured **teen~senior 0.99** and **youth~teen 0.73**. Diffing the two worst showed the shape exactly: the senior band was the teen band plus about six hundred words of senior-specific additions bolted on. Two labels, one text, a longer tail.

The youth and senior bands were written from scratch. Senior addresses a reader who has already watched the outward man wear out, already caught his own heart lying to him, and already stood beside a body after the breath went — so the lesson supplies him the Word's vocabulary for what he has been living inside rather than new information. Youth is built at its own register with its own entry points. All **86 referenced spans survive verbatim in each band**, every one carrying its reference, nothing elided.

## Measured

| | before | after |
|---|---|---|
| worst pair | **0.99** (teen~senior) | **0.34** (teen~senior) |
| youth~teen | 0.73 | 0.27 |
| child~youth | 0.13 | 0.16 |
| child~senior | 0.13 | 0.09 |
| shares (child/youth/teen/senior) | 0.88 / 0.91 / 1.11 / 1.31 | 0.88 / 1.08 / 1.11 / 1.37 |
| FK ladder (child / teen / senior) | 1.6 / 6.4 / 6.5 | 1.6 / 6.4 / 7.4 |
| youth FK | 5.97 | 4.90 |
| recorded duplication debt | 19 lessons | **18 lessons** |

L172's 181-check gate passed on the first run for both bands. **That is a claim, not evidence** — a gate is not proven by passing.

## The finding: my break harness was breaking the wrong lessons

The first harness ran twelve deliberate breaks and reported **8 of 12 caught**, with four misses including a corrupted quotation. A corrupted quotation surviving the verbatim check would be a serious hole, so it was worth running down before it was written up.

It was not a hole. The harness did `ORIG.replace(from, to)` on the **whole corpus file**, and `String.replace` takes the first occurrence. `"Jesus wept." (John 11:35)` appears in **24 lessons**. The harness was corrupting a quotation in some other lesson and then asking L172's gate whether L172 was still sound. It was, correctly, and the harness read that as a miss.

Scoped to the ll172 record and to the named band, the same class of break ran **12 of 12 caught** — including the corrupted quotation, a stripped reference, a deleted week-practice instruction, a removed refusal label and a softened claim. The one remaining apparent miss was a weak break rather than a gate hole: removing the word "girded" from one sentence while the band still taught the same thing two sentences earlier. Deleting the load-bearing clause outright was caught.

**The lesson is the same one this whole pass keeps producing, now aimed at the instrument instead of the gate: ask what the thing you are running actually reads.** A break harness that is not scoped to the subject under test measures nothing, and it fails in the flattering direction — it reports misses, which look like diligence, while proving nothing at all.

## The threshold came down on its own

DR-0485 re-anchored the live proven-to-catch to "the worst row the corpus still carries", with 0.9 hard-coded. That needed a hand-edit **within the hour**, because ll172 cleared and the worst left was ll82 at 0.86. A threshold that must be edited on every repair is friction that buys nothing, so it is now **derived from the baseline's own worst recorded entry**. The baseline is rebased in the same commit as any repair, so the two move together, and the check still proves what it exists to prove: the live measure reports a real near-duplicate that the recorded debt agrees is there. It also now fails when the debt is cleared, naming the retirement.

## What remains

Eighteen lessons. Worst-first: ll82 and ll91 at 0.86, ll81 at 0.83, ll149 at 0.78, ll100 at 0.76, ll99 at 0.75. The pattern DR-0484 measured is unchanged — **youth~teen dominates**, because the youth band was added later (DR-0418) and cloned from teen rather than written. Both 0.99 lessons are now repaired; the rest are a youth-band job.
