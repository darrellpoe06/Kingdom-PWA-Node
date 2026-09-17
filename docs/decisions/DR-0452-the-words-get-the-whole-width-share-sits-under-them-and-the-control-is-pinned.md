# DR-0452 — The words get the whole width, Share sits under them, and the control is pinned

- **Status:** accepted
- **Tier:** A (one reported defect on the lesson card; layout only, no schema, no money)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/components/ChurchLearn.jsx` (three prose sections give their Share control its own line beneath the words; all five share controls on a lesson card are capped as chrome), `app/src/__tests__/the-words-get-the-whole-width.test.jsx` (new gate, 6 tests), `app/src/__tests__/word-inline-is-never-a-flex-item.test.js` (the anchor-wrapper assertion re-pinned to the guarantee rather than the old spelling)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS (DR-0011)
- **Grounds:** DR-0438 §1 (chrome never grows with the text; the text must dominate a phone), DR-0410 (the words grow, the frame stays a frame; `refsBelow` puts a section's chips at its foot), DR-0381 / the 2026-09-14 anchor fix (the anchor's references are real links and stay that way), DR-0427 (the small-content floor)

## The report, in his words

Darrell, 2026-09-17, from his phone at Big Print 44 on lesson 49, with a screenshot of the card:

> "The share button shouldn't make the words only fit to one side taking all that screen real-estate..."

He was describing the row's own shape, exactly.

## SHOULD → ARE → GAPS → CLOSE (DR-0219)

**SHOULD.** DR-0438 §1 is unambiguous: chrome never grows with the text, and on a phone the text must dominate. DR-0410 already established the shape for a section's own controls — the green verse strips sit at the **foot** of a section (`refsBelow`), not beside its prose.

**ARE (measured in real Chromium at 360px before any edit).** Three sections of the lesson card — the big idea, the hands-on line, and the anchor — rendered their prose and their Share control as **flex siblings** (`flex items-start justify-between gap-2`), the prose carrying `flex-1`. Two more rows (What this frees in you, the Lord's Matrix) put a share beside a short eyebrow label. None of the five was inside `.ts-chrome-region`, so every one of them rode the raw root scale.

| | prose width | share control |
|---|---|---|
| Normal | 177 of 336px (**53%**) | 117x32px |
| Big Print 44 | 207 of 294px (70%) | **177x184px** |

So on a phone the reading got barely half the width, and at Big Print the control beside it became a **184px-tall slab** — taller than six lines of the text it belonged to — with dead space beside the rest of the paragraph. That is what "taking all that screen real-estate" measures out to.

**GAPS.** Two, and fixing only the first would have left the second visible: the control occupied a **column** it had no claim to, and the control's own box **grew with the text** instead of being pinned like every other chrome row in the app.

**CLOSE.**

- **The prose takes the whole width** in all three sections, and its Share control sits on its own line beneath it, right-aligned — the same shape the verse strips already use at the foot of a section. `flex-1` is gone from those paragraphs, because there is no longer a row to flex in.
- **All five share controls are pinned as chrome** (`.ts-chrome-region`), so they render at their Normal size at every text step.
- **The anchor line keeps everything it gained** on 2026-09-14: its references are still real, tappable links rendered through `WordInline` with `refsBelow`, and its two siblings are still wrapped in one block item so they can never split into two columns.

## Verification

- **Measured in real Chromium at 360px, before and after**, on the built app:

| | prose width | share at Normal | share at Big Print |
|---|---|---|---|
| before | 177 of 336px (53%) | 117x32px | 177x184px |
| after | **302 of 302px (100%)** | 117x32px | **117x29px** |

  Nothing sits on the same line as the prose any more, at either size. The label rows' control went from 177x184px to 74x59px.
- **New gate `the-words-get-the-whole-width.test.jsx` — 6 tests**: no share control is a flex sibling of its prose; each of the three sections puts Share beneath the words; the paragraphs no longer carry `flex-1`; all five controls are capped; the anchor keeps its tappable references; and the reason is written where the next reader will look.
- **Proven to catch:** restoring the old side-by-side row fails 2; uncapping the controls fails 2.
- **Full suite: 1040 files, 15,532 passed, 1 skipped.** Lint clean. Probe sweep green — 33/33 chrome, 4/4 lesson, 16 text-scale, 2/2 presenter.
- **One existing gate pushed back and was right to.** `word-inline-is-never-a-flex-item` required the anchor's wrapper to read exactly `flex-1 min-w-0`. That was correct only while the anchor sat in a flex row beside its share — the very row being removed — and `flex-1` on a non-flex parent would be a leftover claiming a shape that no longer exists. The assertion now checks the **guarantee** (a single block wrapper, never a flex row that would split WordInline's two siblings) instead of the old spelling, and it is strictly stronger for it: it now also asserts the wrapper carries no `flex` at all.

## Limits, stated

- **The three prose sections and the two label rows are what changed.** Other share controls elsewhere in the app (the course-level share, Practice, the Eternal Algorithms study, hiring) were not touched and may carry the same rem-sized box. Nothing was reported about them, and a blind sweep would be a change without a measurement. `re-review: 2026-10-17`.
- **Measured on the catalog list, where these cards render.** The same components render inside a lesson's own space; the numbers there follow from the same classes but were not separately measured. `re-review: 2026-10-17`.
- **Right-aligned beneath the text is a judgement.** It keeps the control discoverable without interrupting the reading, and it matches the verse strips. If it reads as detached from its section, moving it to the section's leading edge is the alternative. `re-review: 2026-10-17`.
- **Measured in the browser, not on his own phone.** The live pass is the DR-0104 step after this deploys.
