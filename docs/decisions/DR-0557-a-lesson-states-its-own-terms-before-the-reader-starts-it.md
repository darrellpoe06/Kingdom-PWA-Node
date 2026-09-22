# DR-0557 — A lesson states its own terms before the reader starts it: measured opportunities and constraints

- **Status:** accepted
- **Tier:** B
- **Type:** product
- **Date:** 2026-09-22
- **Scope:** `app/src/lib/lesson-context.js` (new — `lessonContext()` / `countShape()`); `app/src/components/DiscernmentStages.jsx` (the "Before you begin" block, above Stage 1); `app/src/lib/discernment-track.js` (`normalizeIssue` carries a new authored `limits` field); `app/src/lib/world-issues-class.js` (issue 17 authors its three source limits; its stale `source.medium` corrected); `app/src/__tests__/full-context-before-the-lesson.test.js` (19 checks, new); `app/src/__tests__/context-block-renders-before-stage-one.test.jsx` (8 checks, new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — counted, never claimed; unknown never reads as fine), REALITY-TRACE (DR-0061 — a surface is a live view of real state), PERPETUAL-IMPROVEMENT (DR-0075), SPEAK-ESTABLISHED-FACT (DR-0100), DECISION-RECORDS (DR-0011)
- **Grounds:** Darrell 2026-09-22, reading issue 17's Stage 3; DR-0555 / DR-0556 (the lesson and its provenance upgrade that exposed this); DR-0239 §3 (surface-says-truth)

---

## What he said

Reading World Issues issue 17 on the live build, at Stage 3, Darrell hit the provenance limit *after* he had already read the perspectives:

> "We quote none of them verbatim from the recording... **This is a gap in our lessons... we need to be able to have full context before lessons.... opportunities and constraints?**"

He is right, and the gap is not a slip in one lesson. It is structural, and it was true of all seventeen.

## What was actually wrong — traced, not assumed

**The limits were buried in prose.** `source.note` is the only place a lesson's provenance limits live. On issue 17 that note is roughly **2,400 characters** of continuous prose rendered as one small grey paragraph above Stage 1. Everything a reader needs is in it. Almost nothing reaches him. A limit you have to mine out of a paragraph is a limit that does not arrive.

**Nothing counted the lesson's own shape.** Issue 17 knows — exactly, in its own arrays — that it carries 11 evidence items of which **2 are disputed and 1 partly documented**, that **6** of its statements are inference rather than fact, that its 8 documented facts carry **26 dated sources**, and that it is written at 3 reading levels with 10 check questions. Every one of those numbers was free, exact, and told to nobody.

**One thing I nearly recorded wrong.** I was about to write that `issue.skill` renders nowhere. It renders: `buildDiscernmentModule` maps it to `module.bigIdea` and ChurchLearn draws it as "The big idea" one heading above the stages. So the block deliberately does **not** reprint it — a duplicate would be noise on the very surface this exists to unclutter. Checking before writing is the only reason that is a footnote and not a false claim in a decision record.

## What shipped

A **"Before you begin"** block at the top of the five-stage renderer, above Stage 1, in two columns: **Opportunities — what you get** and **Constraints — what this cannot do**.

Every line declares its own basis, and the basis is the whole design:

- **`counted`** — computed from the issue's arrays on every render. "8 facts are stated as DOCUMENTED, carrying 26 dated sources you can open yourself." These cannot drift from the lesson they describe, the way a hand-written "26 sources" would the first time a source was removed. A test reproduces exactly that drift: delete one evidence item and the block corrects itself with nobody remembering to.
- **`structural`** — true of every lesson of this class by construction (the Word is read first; a lesson naming living people is not a verdict on anyone).
- **`authored`** — the thing a count can never know: how the source was obtained and what that costs. This is the new `issue.limits` field, and it is **never derived**. Issue 17 authors three: nobody watched or heard the conversation; auto-generated captions are a machine's hearing and are not a warrant for quotation marks; the segments were joined, so nothing can be cited to a minute mark.

**The silence is reported.** When a lesson has authored no limits, the panel says so on the page — *"This lesson has not stated its source limits separately yet"* — rather than letting an empty column read as "there are none." DR-0076 §8: unknown never reads as fine.

**A stale field was corrected on the way past.** Issue 17's `source.medium` still said *"video, received as a written SUMMARY"* after DR-0556 put the speaker's own words in the repo, so the one-line medium disagreed with the corrected note directly beneath it. It now reads *"video, read as AUTO-GENERATED CAPTIONS (the recording itself unwatched)"*. A stale field beside a corrected one is how a reader learns to trust neither.

## Verification

- **27 new checks**, all green, plus the 39 existing discernment checks unchanged.
- **Proven-to-catch (DR-0076 §3):** the ordering case was run against a deliberately-broken renderer. The block was moved to sit *after* Stage 1 — the exact defect Darrell reported — and the suite went red on `expect(block).toBeLessThan(stageOne)`, 1 failed of 8. Restored, 8 of 8. A gate that only ever passes is itself a lie.
- **Measured against the real catalog, not a fixture:** every one of the 17 issues is mounted in jsdom and both columns are asserted non-empty. The numbers quoted in this record were printed by the real function over the real data, not estimated.

## Limits, stated

1. **Sixteen of seventeen issues have not authored their limits.** They predate the field. Backfilling them tonight would mean writing provenance limits for sources I have not re-checked — the exact fabrication DR-0076 forbids. So they are **recorded debt that may only shrink**: a test pins the count at 16 and fails if it grows, and each of the sixteen is visibly marked in the app until someone does the work. Same shape as the `services.json` witness ratchet and the age-band LEGACY list. `re-review: 2026-11-22` — by then the debt should be materially smaller, and the pin comes down as it does.
2. **The constraints are honest but not exhaustive.** A count can see disputed items and unlinked sources. It cannot see a perspective that was never written down, or a source nobody thought to look for. The authored `limits` field is where that belongs, which is why item 1 is the live obligation and not a footnote.
3. **This is the World Issues class only.** The other Learn tracks — courses, the Godhead Study, the lesson library — have their own provenance shapes and no equivalent block. Whether they need one is a real question this change does not answer. `re-review: 2026-10-22`.
