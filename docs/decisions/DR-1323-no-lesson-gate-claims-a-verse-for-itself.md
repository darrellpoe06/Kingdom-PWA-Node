# DR-1323: No lesson gate claims a verse for itself — two gates were refusing his own future lessons, and sov66 had to route a teaching around one

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** B (two live lesson gates lose seven assertions, and a new guard refuses the class; no product code, no schema, no money — but it decides whether a future lesson can stand on Scripture a past one used)
**Type:** correction
**Declared by:** Darrell, 2026-11-05 (DR-1317), applied here to the machinery that was still enforcing the overturned rule.
**Area:** `app/src/__tests__/sovereign-ai-sov65-verses.test.js` (4 cases removed, one own-ground case added) · `app/src/__tests__/sovereign-ai-sov64-verses.test.js` (3 cases removed) · `app/src/__tests__/no-lesson-gate-claims-a-verse-for-itself.test.js` (new, 5 cases)
**Found by:** the sov66 builder (DR-1322), which hit sov65's gate, refused to drop its reading and refused to edit a neighbour's proof, and reported the defect rather than working around it silently.
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** DR-1317 (the rule this applies), DR-1322 (sov66, which paid for the finding), DR-1316 (the cost shape: a gate failing in a file the new build never touched), DR-0610 (one teaching, one lesson — decided by where a lesson lands), DR-0734 (`sharedGround`, which links lessons BY shared Scripture), DR-0076 (§3 proven-to-catch, §4 measure don't claim)

## Context

DR-1317 recorded Darrell's correction — *"How can we have only reference one scripture ever?! Doesn't make any sense!"* — and said the free/SPENT machinery was still live and was the Governor's call. He then said: **fix it.**

The first sweep for that machinery looked for a gate that *scans other lessons and fails on reuse* and reported finding none. **That was wrong**, and it was wrong because it searched for the wrong shape: the enforcement is not in a shared library, it is in individual lessons' own pinned gates.

## What was measured

Two lesson gates carried it — `sovereign-ai-sov64-verses.test.js` and `sovereign-ai-sov65-verses.test.js` — seven cases between them:

- *"every chapter this lesson stands on is FREE of every OTHER lesson in the department"*
- *"and in the OTHER direction: no other lesson stands on a chapter this one claims"* ← **this is the one that refuses future lessons**
- *"the chapters DECLINED AS SPENT really are spent, so the census cannot have been invented"*
- *"THE PROSE-LEVEL CENSUS: not one of the 40 references appears anywhere in another department lesson"* ← **refuses prose reuse too**

**They protected nothing.** The only thing DR-0610 forbids is two lessons **landing on the same message**, and not one of these assertions ever looked at where a lesson lands. They measured ground, which DR-1317 settled is shared on purpose.

**And they were already costing.** Building sov66, the builder cited **2 Kings 18:21** — Egypt as the bruised reed, exactly its teaching — and **sov65's gate went red in a file sov66 never touched.** That is DR-1316's cost shape precisely. The builder then did three correct things in a row: it refused to drop the reading (DR-1317), it refused to edit sov65's assertions (not its file, and DR-1317 reserved the machinery), and it carried the teaching on **Isaiah 36:6** instead — the Word's other witness, the same clause word for word — then **reported the defect** rather than leaving the next builder to meet it.

**Why removing the two is not enough.** Both were written by builders following an instruction that was **mine, not Darrell's**. Four lesson builds tonight received it in writing. Without a check, the next builder writes a third.

## Impact

**Every Sovereign A.I. lesson after sov65 was blocked from 24 chapters, and after sov64 from its own set**, by a gate in a file it may not edit. The only escapes were to drop the teaching or to find a second witness — and the second witness only exists because Scripture is rich, not because the gate was right.

**The reason this took a second pass is worth recording.** My first sweep asked "does a shared library refuse a reused chapter?" and answered no. The right question was "where is the refusal, in any shape?" — and it was in the lessons' own gates, which is where a builder naturally puts a measurement it was told to make.

**What is NOT changed, deliberately.** sov64's reader texts carry a declaration that it shares Mark 2:27 with sov14, and sov65's gate records that Numbers 23:19 was dropped for prose overlap. Under DR-1317 that drop was a loss and the declaration is reviewer bookkeeping in a reader's text. **Both are content changes to live lessons**, and editing his teaching is not mine to do quietly. Reported below.

## Decision

**1. The seven exclusivity cases are removed**, with a header block in each file stating what was asserted, why it was false, and that the census measured when the lesson was built is kept **as history** — a measurement on a date, not a standing claim about what another lesson may teach.

**2. sov65 keeps an own-ground case** in their place: it stands on exactly the chapters it declares, 24, spine whole. A lesson's gate is for the lesson's own integrity.

**3. A new guard refuses the class.** `no-lesson-gate-claims-a-verse-for-itself.test.js` scans every `it()` title in the suite and fails on a claim that another lesson may not use a verse.

**4. Declaring shared ground stays legal.** Only the claim of exclusivity is refused — a lesson naming the neighbour it shares ground with passes, asserted.

## Verification

**143 cases green** across the three affected gates (sov64 42, sov65, sov66 51), plus the new guard's **5**, run from inside `app/`. `npm run lint` clean.

**Proven to catch, executable rather than asserted:** one case reconstructs the **four real removed titles** by their literal text and requires the matcher to still recognise each — if it ever stops, the guard is decorative. Another case lists five legitimate titles (own chapter count, verbatim quotation, declaring shared ground with sov14, the talk-together directions, the four bands) and requires each to pass, so the guard cannot grow into refusing honest work. A third reads sov64's and sov65's real files and fails if either still claims a verse.

**Honest limits.** The guard matches **case titles**, which is where the claim is made in words a reader trusts — it does not read assertion bodies, so a gate that enforces exclusivity under an innocent title would pass. I did not measure that class. And the sweep covers `app/src/__tests__`; nothing equivalent runs over the Python layer (`lesson_gates.py`) or `band_gates.mjs`. `re-review: 2026-12-05`.

## What this does not close

**Numbers 23:19 in sov65.** Dropped for prose overlap under the wrong rule; restoring it is a change to a live lesson and is his call. `re-review: 2026-11-06`.

**sov64's cross-reference declaration in its reader texts.** Honest when written, and now the kind of note DR-1317 says belongs in a record rather than in front of a reader. Removing it edits a live lesson. `re-review: 2026-11-06`.

**Whether any other course's gates carry the same class under different wording.** Only the two that matched these phrasings were found. `re-review: 2026-12-05`.

---
_Generated by [Claude Code](https://claude.ai/code)_
