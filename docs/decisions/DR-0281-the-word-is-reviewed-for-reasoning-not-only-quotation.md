# DR-0281 — The Word is reviewed for REASONING, not only quotation

**Status:** accepted
**Date:** 2026-08-07
**Tier:** A (every Scripture-bearing artifact and every comprehensive review)
**Declared by:** Darrell — *"did we review the historical accuracy and perspective of the Kingdom Operating System called the Word?"* and, on the fix: *"Yes. Obviously. Also add it to our Ways and documentation in a way it's preserved and being used each time we review."*
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, TEACH-DONT-DEBATE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## The decision

**Scripture-bearing content is accuracy-reviewed on two levels, because they are two different disciplines with two different failure modes:**

1. **QUOTED** — every fragment verbatim from the repo's own KJV, machine-gated. Already in force (`world-issues-verse-integrity.test.js`, `godhead-study.test.js`, `scripts/fetch-godhead-verses.mjs`). Fetch it; never write a verse from memory.
2. **REASONED** — the claims made *across* verses. **A verbatim gate cannot see an error that lives between two correct quotes.** Every cross-verse assertion runs four questions, and every tension that bites becomes a registry entry in a CI gate.

The four questions:

- **(a)** Does each verse actually say what I am using it for, in its own context?
- **(b)** When two cited verses carry different figures, **what does each one measure** — and does my prose tell the reader, or does it silently blur them?
- **(c)** Am I asserting a fulfillment, equivalence, or sequence *the text itself* asserts, or one I assembled?
- **(d)** Have I let the Word explain the Word (DR-0098), rather than reconciling by cleverness?

## What happened

Issue 8 of the World Issues track ("Two Aftermaths, One Scale") shipped a sentence teaching that Yahweh announced **"four hundred years"** (Genesis 15:13) and then **"hit the date"** at **"four hundred and thirty years"** (Exodus 12:41).

Both quotes were verbatim. Every gate was green. The reasoning across them was wrong.

The Word explains the Word: **400 is the AFFLICTION** — *"they shall afflict them four hundred years"* (Genesis 15:13), restated by Stephen, *"entreat them evil four hundred years"* (Acts 7:6). **430 is the SOJOURNING** — *"the sojourning of the children of Israel, who dwelt in Egypt, was four hundred and thirty years"* (Exodus 12:40), the same 430 Paul measures from the confirmed promise to the law (Galatians 3:17). Two clocks, two subjects, both kept exactly.

The defect shipped **inside a lesson whose entire teaching is that a wrong number inside a true case gets the case dismissed** — the lesson corrected two of the source teaching's figures while carrying an uncorrected numeric collapse of its own. Darrell caught it by asking whether we had applied to the Word the same accuracy review we had applied to Tulsa, the GI Bill, and the 1986 sentencing statute. We had not. "Fetched verbatim and gated in CI" had been treated as if it were the whole of accuracy.

## The gate

`scripts/scripture-inference-guard.mjs`, wired into `ci.yml` selftest-first.

**Registry-driven, and honestly scoped.** This is **not** a universal inference checker; no such thing exists, and claiming one would be the theater DR-0076 §3 forbids. It enforces a `REGISTRY` of known cross-verse tensions: each entry names the **sides** of the tension, the collapse risk, the distinction, and the words the prose must carry. Citing two refs from the *same* side asserts no tension and is not gated; citing **across** sides in one claim requires the passage to name what each side measures. The registry grows every time a new tension bites — the same way every other gate in this repo grew.

**An earlier draft tried to auto-detect any numeric disagreement between co-cited verses. It produced 205 false positives** on existing, correct lessons (incidental cardinals inside quoted verses — "one of these my brethren," "ten days" — and chapter:verse digits read as quantities). A noisy gate gets switched off, and a switched-off gate protects nothing. Registry-driven is the honest instrument, and saying so plainly is part of the record.

**Proven-to-catch three ways** (`--selftest-break`): it fails on the exact shipped defect; it passes the corrected, distinction-naming form; and it *still* fails when only one side is named — which was a real hole in the first draft, where the defective sentence contained "affliction" and a some-match let it through. Naming one side and omitting the other is precisely how the original passed review.

**It earned its place on its first real run**: it caught a *second* live instance of the same collapse in the same lesson's `benefits` list, which hand-review had missed after the deep-source prose was already fixed.

## Where it is preserved and used

- **`COMPREHENSIVE-REVIEW-STANDARD.md` dimension 8** — the standard is run and named on every comprehensive review, so this is exercised rather than filed. The doc moves from seven dimensions to eight.
- **`ci.yml`** — selftest + real pass on every push; a red guard blocks the merge lane.
- **This DR** — the permanent record of the miss and the reasoning.

## Honest limits

The guard checks **registered** tensions. It does not and cannot verify that a verse is used in context, that an inference is sound, or that a reading is faithful — those stay human work under DR-0098 and the four questions above. What the machine now guarantees is narrower and real: **a tension we have already been bitten by cannot silently recur.** Claiming more than that would repeat the very error this DR records.

## Pairs with

DR-0076 (verification doctrine — §2 gate-the-class, §3 proven-to-catch), DR-0098 (the Word explains the Word), DR-0127 (Word-first opening), DR-0239 (COMPREHENSIVE-REVIEW-STANDARD), DR-0075 (perpetual improvement).
