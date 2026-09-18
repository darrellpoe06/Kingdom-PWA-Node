# DR-0509 — The Send-off was a heading with nothing under it

- **Status:** accepted
- **Tier:** B (content the whole school serves)
- **Type:** gate + content
- **Date:** 2026-09-18
- **Scope:** all five Real Estate course files (`benefits` authored, 40 lessons × 5 = 200), `app/src/__tests__/every-stage-reaches-the-reader.test.js` (new gate, 7 checks), `app/src/lib/stage-reaches-reader-baseline.json` (new, shrink-only)
- **Principles:** REALITY-TRACE (DR-0061 / P15), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §6), PERPETUAL-IMPROVEMENT (DR-0075), SPEAK-ESTABLISHED-FACT (DR-0100)
- **Grounds:** Darrell, 2026-09-18, from the app: *"Send off is not populated in the latest lessons..."* and *"Not to mention the quality of the lessons and depth of some lessons seem to be wanting..."*

## He was right, and it was not a rendering bug

`buildLessonArc` gives the send stage an AUDIENCE side carrying exactly one field — `benefits` — while the solo-task choreography lives on the FACILITATOR side, derived from `howToRun` (`lesson-flow.js`, the `send:` body).

Measured: **all 177 Living Lessons author `benefits`. Not one of the 40 Real Estate course lessons did.** So `hasContent` was `true` (the facilitator side had the solo task, so the stage rendered) and the reader's half of it was `{"benefits":[]}`. A populated heading with nothing underneath — exactly what he described.

On the second remark: `stories` is present on 82 of 177 Living Lessons and on none of the 40. That is the other structural gap between a Living Lesson and a course lesson, and it is **not** closed here (see the open item below).

## Why no existing gate caught it

Every course test measured the fields the **author** chose to write — reading level, band fullness, band overlap, verbatim spans, anchor prose, quotation integrity. **None compared a lesson's field set against what the renderer actually consumes.** Five courses shipped that way across one day, each one passing 36–39 of its own checks.

This is the reality-trace failure CLAUDE.md names precisely: the source was measured exhaustively and the **surface was never observed**. Every claim made about those courses was true about the data and silent about the reader.

## The gate now asks the renderer's question

`every-stage-reaches-the-reader.test.js` walks **every course in the catalog, every lesson, every one of the five age bands**, and asks of each stage that RENDERS: does it put anything on the learner's side? 1,000+ rendered stages per run.

Proven-to-catch on the exact reported defect: stripping `benefits` from a fixed lesson leaves `hasContent` **true** — the stage still renders — while the audience side goes empty. The test asserts both halves of that, because the stage continuing to render is what made this invisible for five courses. The predicate is separately pinned against `{}`, `{benefits: []}`, `null` and whitespace, so it cannot pass vacuously.

## The walk found 345 more, and they are recorded rather than hidden

The five Real Estate courses are fixed to **zero** here, with 200 authored benefits. The same walk found **345 empty reader-facing stages across eight other courses** that predate this work:

| course | empty stages (5 bands) |
|---|---|
| sovereign-ai | 80 |
| infrastructure | 50 |
| broadcast | 45 |
| ai | 40 |
| kingdom-economics | 40 |
| legacy-provisions | 35 |
| ai-legal-blueprint | 30 |
| handed-forward | 25 |

Recorded as a **shrink-only baseline** (the DR-0497 pattern): the numbers may only fall, a course that gets worse fails the build, and **a course not listed must stay at zero** — so no new course can ever ship a bare Send-off again.

Writing 345 more benefit lines in one sitting to clear the board would have produced exactly the thinness the second half of his message was complaining about. The reported defect is fixed now; the rest is visible, frozen, and gets authored properly.

## Open, with a date

- **The remaining 69 lessons across 8 courses** — author real `benefits` per lesson, course by course, at the quality of the Real Estate set rather than filled in to move a number. **re-review: 2026-10-02.**
- **`stories` on course lessons** — 82 of 177 Living Lessons carry it and no course lesson does. This is a genuine depth difference and a Governor call rather than a defect: a course lesson may legitimately be a different artifact. **re-review: 2026-10-02.**

## The lesson for every future course

A course test that measures only what the author wrote is measuring the author's intent, not the reader's experience. **Before a course ships, build its arc and look at what each stage hands the learner.** That check now runs on every push.
