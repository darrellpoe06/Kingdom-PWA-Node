# DR-1317: A verse is never spent, and overlap is how lessons connect — DR-1313 called three of Darrell's lessons duplicates on a measure that cannot see where a lesson lands

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** B (one intake instrument and its suite; no product code, no schema, no money — but it removes a false claim about Darrell's own teaching from a surface that printed it on every run, and it corrects the rule four builds were given tonight)
**Type:** correction
**Declared by:** **Darrell, 2026-11-05**, correcting me directly and at law-tier intensity.
**Area:** `scripts/one-thread-one-record-guard.mjs` (`EXAMINED_AWAITING_FOLD` removed; `SHARED_FOUNDATION_DIFFERENT_POINT` in its place, with the test of "one teaching" stated) · `app/src/__tests__/a-record-that-considered-a-thread-does-not-claim-it.test.js` (23 cases; the duplicate assertions replaced, and a new case that reads the shipped source and fails if the word reappears)
**Amends:** **DR-1313**, whose central conclusion was wrong. DR-1313 is not rewritten (DR-0011: a new directive is a new record, never a rewrite); this record supersedes its duplicate finding and its `EXAMINED_AWAITING_FOLD` list.
**Considered, not built:** `1a11668e8023cd3e`, `1a11be8ea0e58748`, `1a11be8188dbc2f6`, `1a11bdb1aeb9ee21` — this record builds no lesson and has no source thread of its own; it names these four as the evidence. `1a11668e8023cd3e` is ll215 by **DR-0793** and ll239 by **DR-0863**; `1a11be8ea0e58748` is ll223 by **DR-0834** and ll238 by **DR-0864**; `1a11bdb1aeb9ee21` is ll220 by **DR-0820** and ll237 by **DR-0861**; `1a11be8188dbc2f6` is ll221 by **DR-0821** and ll236 by **DR-0860**.
**Pairs with:** DR-1313 (corrected here), DR-0610 (one teaching, one lesson — whose meaning this record fixes), DR-1185 (the fold precedent, which is NOT the remedy here), DR-1285 / DR-1305 (the guard and the declaration), DR-0098 (teach the Word, do not debate it), DR-0076 (§1 evidence, §4 measure don't claim, §8 honest uncertainty), DR-0250 (a citation is a claim you consulted the source), DR-0621 (a flag is where the work starts)

## Context

DR-1313 read the one-thread guard's six unexamined collisions, cleared four, and concluded that **two pairs of Living Lessons were "one teaching built twice"** — measured duplicates awaiting an editorial fold. It put them in a list named `EXAMINED_AWAITING_FOLD` and made the guard print, on every run:

```
! DUPLICATE awaiting fold: ll215 / ll239 … 13 shared verses
! DUPLICATE awaiting fold: ll223 / ll238 … 14 shared verses
```

That merged to `main` and ran on every build for about two hours. It was false, and it was false about Darrell's own teaching on a COLG-facing surface.

## What was measured

**Darrell's correction, in his words:**

> "Duplicates of exactly three same... there would be overlapping at times however not the exact same lesson... sometimes 8 points of this lesson does not end with the same message it's close however another point entirely after explaining the foundations of the eternal systems Yahweh created in us and outside of us... make sense!! How else would they connect?! ... don't oversimplify our processes!"

and, on the measure itself:

> "How can we have only reference one scripture ever?! Doesn't make any sense!"

**THE RULE. "One teaching" is decided by WHERE A LESSON LANDS — its point, its message, its action — NEVER by the Scripture it stands on.** The eternal systems Yahweh built in us and outside us rest on common foundations, so two lessons teaching from them *should* share that ground. **The overlap is how they connect to each other.** A lesson explains the foundation it needs and then carries it to its own point. Eight points of shared foundation and then another point entirely is two lessons.

**A verse is never SPENT.** Scripture is finite and it is the foundation of everything taught here. A rule that retires a verse once a lesson has used it says we may reference a given Scripture only once, ever, which is nonsense on its face.

**Measured on the real catalog, on the correct test — where each lesson ends:**

| pair | shared foundation | lands on |
|---|---|---|
| ll215 / ll239 | counting the cost; who gives the safety; Luke 14:28-32 (13 verses) | ll215 teaches the foundation. **ll239 ends on COUNSEL** — count, *then* consult; "write more than two names whose counsel you will genuinely seek, and seek it", on Proverbs 24:6, 11:14 and 15:22, **none of which ll215 carries**. |
| ll220 / ll237 | Darrell's own teaching of 2026-10-08; His Knowledge as the standard (13 verses) | **ll220 ends on the practice** — NOTICE → TEST → CAPTURE, the eight questions of Philippians 4:8, run on paper for three days. **ll237 ends on DECIDING** — pray Proverbs 3:5-6 before one decision you would make on instinct; catch *ten* thoughts, not all of them. |
| ll223 / ll238 | the storm you can see coming; Mark 4:37-39, Psalms 107:28-29, Matthew 7:24-27 (14 verses) | **ll223 ends on what a warning ASKS OF YOU**, carrying a capital case and the Word's standard of evidence beside the storm. **ll238 ends on who HOLDS the wind, the foundation, and THE NEIGHBOUR in the storm's path** — water, light, a radio off the grid, and the two warnings you are ignoring. |

Three pairs, three shared foundations, three different landings. **Not one duplicate among them.**

**And the records said so already.** DR-0864's own Decision section, §5: *"Four sibling lessons were built from four forwarded threads the same day on four branches off main, so every branch had holes where its siblings were not. L239 landed first and recorded 236, 237 and 238 as holds."* These were **deliberate siblings**, each holding numbers for the others. That sentence has been in the ledger since 2026-10-09.

**Why DR-1313 got it wrong, stated exactly.** It decided on records it had not read. It read front matter and titles — it even said so — and shipped the conclusion anyway. A verse count can only see the ground a lesson stands on; it is structurally blind to where the lesson carries it, which is the only thing that decides the question. Using a blind measure is a defect; using it on unread sources and writing the result onto `main` is the DR-0250 failure one level up: not citing a source unread, but **deciding** on one.

## Impact

**The repo asserted a duplicate about Darrell's teaching and printed it on every guard run.** That is the worst class of fault this ledger has, because the surface looked rigorous — a measured count, a named list, a dated comparison — and was wrong.

**Four builds tonight were given the wrong rule, by me, in writing, as lesson number one of their briefs.** The cost is real and is named rather than softened:

- **sov63 threw away a COMPLETE finished lesson** because Isaiah 54:16 and 1 Kings 6:7 appeared in prose elsewhere in its own course. I reported that as the discipline working. It was a loss.
- **sov65 refused nine readings** of a single issue as "already built", including the whole just-weight ground (Proverbs 11/16/20, Deuteronomy 25, Leviticus 19, Micah 6 marked SPENT).
- **sov64 dropped three of four colliding references** and kept the fourth only by declaring the overlap — the declaration was right; the three drops were not.
- **ll274 rewrote Jeremiah 26:18 out of all five reader texts** because ll198 quotes it to date Micah.

**What the honest handling looks like**, and sov64 already demonstrated it: teach the foundation with the right Scripture *even when another lesson uses it*, name the neighbouring lesson, and state how your point differs. sov64 did that for sov14's glance at Mark 2:27 in all five reader texts. That is the pattern. Dropping the verse is not.

## Decision

**1. `EXAMINED_AWAITING_FOLD` is gone, not renamed around it.** `SHARED_FOUNDATION_DIFFERENT_POINT` records the two pairs as what they are, with Darrell's words as the stated test, and the guard prints `~ shared foundation, different point … — not a duplicate`. Nothing is awaiting a fold. No fold is recommended, scheduled or implied.

**2. The test of "one teaching" is where the lesson lands.** DR-0610 stands and its meaning is fixed: the same *message*, not the same *ground*. A pair that shares a foundation and lands elsewhere is the catalog connecting to itself.

**3. A verse is never spent**, and no builder is to drop a reading because a chapter or verse appears in another lesson. The live builder was sent this correction mid-flight before it could discard anything.

**4. The two pairs stay recorded** — not as debt, but so the relationship is documented and visible rather than silently forgotten.

## Verification

`a-record-that-considered-a-thread-does-not-claim-it.test.js`, **23 cases green**, run from inside `app/`. The guard reports `61 thread(s) named, 8 shared (6 examined and cleared, 2 sharing a foundation and landing elsewhere, 0 unexamined), 0 new.`

**A case that reads the shipped source rather than the exports**, because the fault was a *printed claim*: it fails if `AWAITING_FOLD`, `awaiting Darrell's fold` or `DUPLICATE awaiting` ever appears in the guard again, and requires the corrected reading to be present where a reader meets it. Renaming the symbol while leaving the sentence would pass a weaker test; it does not pass this one.

**Each entry must state the different point**, asserted by regex on its own `why` — an entry that records only the shared ground, which is what DR-1313 did, fails.

**The landing points above were read from the live catalog** (`bigIdea` and the in-app action of all six lessons), not from the records' summaries and not from titles. DR-0864 §5 was read in full.

**Honest uncertainty, stated.** I have read the six lessons' big ideas and in-app actions, and DR-0864's Decision section. I have **not** read all six lesson bodies end to end. The landing points are clear and distinct on what I read, and nothing in this record depends on a claim beyond it.

## What this does not close

**The `free` / `SPENT` chapter machinery itself.** Every lesson build tonight ran a census that treats a used chapter as spent, and the briefs told builders to drop colliding verses. That machinery is woven through the lesson gates and the builder brief. **Removing or reshaping it changes how every future lesson is built, so it is the Governor's call and not mine** — the recommendation on the table is that a collision stops being a refusal and becomes a required *disclosure* (name the neighbour, state the different point, in all five reader texts), which is what sov64 did voluntarily and what the honest handling looks like. Measurement of where it is enforced, and that recommendation, go to Darrell rather than into a unilateral change. `re-review: 2026-11-06`.

**The four lessons already diminished by the wrong rule.** sov63's discarded draft, sov65's nine refusals, sov64's three drops and ll274's rewritten movement are not restored here. Whether any should be revisited is a question about his curriculum, with his answer. `re-review: 2026-11-06`.

---
_Generated by [Claude Code](https://claude.ai/code)_
