# DR-0404 — The lesson words are not blocked; the Word waits, green, at the foot of its section; and the lesson takes the full width of the page

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (the lesson reading surface — the one elderly church founders actually read)
- **Type:** orchestration
- **Scope:** `app/src/components/ChurchLearn.jsx` (`LessonProse` + new `lessonSections`, the storyline block, the paced Open anchor, the card anchor, `TutorPanel`/`AgePacedLesson` `flush`, the card `li`), `app/src/components/LessonFlow.jsx` (`LessonFlowAudience` blurbs + `flush`), `app/src/components/WordInline.jsx` (`refsBelow`, `alsoRefs`), `app/src/components/VerseChips.jsx` (`tone`, `lead`, `data-*` pass-through), `scripts/chrome-layout-probe.mjs` (the lesson pass), `app/src/__tests__/learn-flow-reads-clean-refs-below.test.jsx`, `app/src/__tests__/word-inline.test.jsx` (one pin re-pointed)
- **Supersedes:** DR-0402 Decision 1 **for lesson prose** — see "What this changes in earlier records"
- **Keeps:** DR-0402 D2 (the load-bearing landmarks), D3 (`anchorIsRun`), D4 (Send-off is last), D5 (the record guard); DR-0340 (a reference opens the Word in place); DR-0341 (Show the Word opens them all, in order); DR-0391 (a list is not a sentence); DR-0264 (the lesson's own space)
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), COMPREHENSIVE-REVIEW (DR-0239), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS (DR-0011)

## The report

Darrell, 2026-09-14, after #1582/#1583 (DR-0402) deployed, with lesson screenshots and his readers in mind:

> "Don't block the lesson words... just have them below each section they refer to like in the storyline section... sometimes there would be up to 4 scriptures and again the green button on top to open all at once... so I or users don't have to click each one separately... however they can if they want to... scripture stays green goes to the bottom of that section that it was referring to."

> "The width of the pages need the full width of the page to be used!!!! Old required procedures!!!"

> "We have old people as our main user currently.... I'm trying to get my learn flow back!!!! Period!!!!"

And, sharpening through the coordinator: *"No tabs, none ever — it's not good, undermines readers."* — the inline boxed chips ARE the tabs.

## What was actually wrong, measured rather than guessed (DR-0061 / DR-0076 §4)

Driven in a real Chromium (Playwright, headless, the dev build with the CI's stub Supabase env), deep-linked into Living Lessons → Lesson 1, guide open, arc stepped to TEACH:

| | window | prose column | lost per side | controls INSIDE paragraphs | strips at section feet |
|---|---|---|---|---|---|
| **before, 1440px** | 1440 | **1272** (88%) | 84 | **4** | 0 |
| **before, 390px (phone)** | 390 | **262** (67%) | 64 | 4 | 0 |
| **after, 1440px** | 1440 | **1376** (96% — the page's own 32px gutter, same as `<main>`) | 32 | **0** | 6 |
| **after, 390px** | 390 | **366** (94% — the page's own 12px gutter) | 12 | 0 | 6 |

**1. The "tabs" were WordInline's inline chips.** `LessonProse` piped every paragraph through `WordInline` (DR-0402 D1), whose `CHIP` renders each in-sentence reference as a bordered inline `<button>` — "1 John 1:8", "Matthew 5:48", "Genesis 17:1" boxed mid-sentence on Lesson 1 (the before screenshot). `LessonFlowAudience` rendered both stage blurbs the same way, in the one-at-a-time view and the whole-lesson (`showAll`) view he photographed.

**2. No `max-width` was left; the width was eaten by five nested boxes.** The 2026-09-14 pass that removed `max-w-3xl` was right about the catalog and the ancestor chain: `<main>` is `w-full`, the section is `w-full`. What remained was padding compounding down the reading path — `<main px-8>` → the lesson card `li p-4` → the guide `p-3` → the stage box `p-3` → the paced box `p-2`, each with a 1px border. On a laptop that is 84px a side; on a phone it left **262px of 390** for large-type readers. The ancestor chain was walked element by element in the browser to establish this; it is in the record rather than assumed.

**3. What DR-0402 had named and dated as un-built** — *"the per-section '4 scriptures with a button up top that opens them together' … re-review: 2026-09-21"* — is the thing he asked for again the same day. This record builds it.

## Decisions

**Decision 1 — the lesson prose reads clean; nothing interactive sits inside a sentence.** `LessonProse` renders every heading and line as a plain `<p>` again. The reference stays in the sentence as the author's own words — not one character changes — and it is not a control.

**Decision 2 — the references a SECTION named are a green chip strip at that section's foot.** `lessonSections(items)` groups a numbered heading with the lines beneath it; a lesson with no headings treats each line as its own section, so a reference is never further than the paragraph that named it and there is never a list at the end (DR-0392 finding 5 / DR-0402 for the reading view). The strip is `VerseChips` with the new `tone="word"` (the storyline's green, `#5A6E3D`) and `lead` (the storyline's "—"), sorted by `sortRefs` (DR-0341 D2), each chip openable on its own — the verbatim KJV opens beneath, same card, no navigation (DR-0340) — with `data-testid="section-refs"`.

**Decision 3 — the green button on top still opens every one at once.** Nothing about `ShowTheWordToggle` / `useOpenRefs` changed; the strip reads the same page-wide switch, so a reader who does not want to tap each one taps once (DR-0341 D1), and a chip still toggles on top of it. Proven in the browser: one tap on `Genesis 17:1` opened exactly `[Genesis 17:1]` with the KJV text *"…walk before me, and be thou perfect."*; Show the Word opened 6 regions.

**Decision 4 — `WordInline` gains `refsBelow` (and `alsoRefs`); the inline mode is untouched elsewhere.** `refsBelow` renders the paragraph plain and hands its references to the same green strip. Used on the two `LessonFlowAudience` blurbs, the storyline body (whose "— verse" line now rides the same strip via `alsoRefs`, so nothing is listed twice), the lesson card's anchor line, and — new — the paced Open stage's anchor, which had been a green line that never opened (DR-0391's hollow-surface class). The Torah map, Study, the Godhead study and PracticeLearn keep the inline mode this record did not review — see Limits.

**Decision 5 — the landmarks DR-0402 D2 protected survive.** `data-point-index` / `data-point-n` / `tabIndex=-1` and the number badge on a heading; `data-para-index` on a line. The speaker index, the paragraph stepper and the keyboard jump are unchanged (`lesson-reader-speaker.test.jsx` still green).

**Decision 6 — in the lesson's own space the reading column takes the page's full width.** While a lesson is open alone (`focusModule`, DR-0264), the card `li` sheds its box (the space bar above already frames the one lesson) and passes `flush` to `TutorPanel` → `LessonFlowAudience` / `AgePacedLesson`, whose boxes keep only their top and bottom rules (`border-y` / `py-*`). The stacked list outside the space keeps its cards. Result: the prose meets the same gutter as every other page — 1376 of 1440, 366 of 390.

**Decision 7 — the width has a real-browser gate.** `scripts/chrome-layout-probe.mjs` gains a LESSON pass (rides `--sweep`, and `--selftest-break` proves it can fail): the built dist is deep-linked into Lesson 1 at 360 / 768 / 1440, the arc stepped to TEACH, and it asserts (a) the prose column reaches `<main>`'s content edge within 2px, and (b) no control sits inside a prose paragraph. The self-test injects a 60% `max-width` on the paragraphs and a button into one of them, and requires BOTH to trip. jsdom cannot measure this; the probe is the instrument dimension 4 exists for (DR-0239).

## What this changes in earlier records

**DR-0402 Decision 1 is superseded for lesson prose.** DR-0402 recorded, honestly, that *"the Word opening inside the sentence is the one thing this adds rather than restores"* and that *"if he wants it held, it is one line at each of two call sites."* He wants it held: the reference in the sentence is plain again; the Word still opens — one section lower. DR-0402's D2–D5 stand. Its dated un-built item (the per-section grouping, re-review 2026-09-21) is closed by this record.

**DR-0340 / DR-0341 are kept, not weakened.** A reference still opens the verbatim KJV in place; Show the Word still opens them all in timeline-then-flow order; the reader is still told. Only the control's position moved — out of the sentence, to the foot of the section.

**`word-inline.test.jsx` — one pin re-pointed, not deleted** (the DR-0392 discipline): "Learn: a story and its verse line" now asserts the storyline body is `refsBelow` with `alsoRefs`, and that the old separate "— verse" `WordInline` line is gone.

**`layout-probe-reports-its-passes.test.js` — one pin re-pointed from 2 to 3**: it counts the probe's per-case snapshot/compare pairs; the lesson pass is a third, built the same way, and the pin now also requires the `lesson ok ` line. Caught by the full suite, not by reading.

**`the-word-is-in-the-sentence.test.jsx` still passes unchanged** — its assertions ("a control labelled Open Lamentations 3:22-23 exists", "the real L151 body renders > 10 controls") are satisfied by the section strips, which is the point: the Word is exactly as openable as before.

## Verification

- **Proven-to-catch (DR-0076 §3).** `learn-flow-reads-clean-refs-below.test.jsx` (13 cases) run against the pre-change components (`main@3311b3f`) FAILS on: no-control-in-a-paragraph (4 buttons sat inside Lesson 1's paragraphs), the strip at the section foot (none existed), the blurb case, and both `flush` cases. The probe's lesson self-test tripped 2/2 on the injected break.
- **Measured, not claimed.** The table above; screenshots `lesson-before-1440-prose.png`, `lesson-after-1440-prose.png`, `lesson-after-one-chip-open.png`, `lesson-after-show-the-word.png` were taken in the session (scratchpad, not committed — the numbers are the record).
- Full suite + lint green before push (counts in the PR).

## Limits, stated

- **The other WordInline surfaces keep inline chips.** The Torah pattern map (3 sites), Study (3), the Godhead study (13) and PracticeLearn (9) were not in his screenshots and were not reviewed on a screen; changing 28 call sites unseen is the over-application DR-0391 warns against. If "no tabs, none ever" is the house rule everywhere, it is one prop per call site. **re-review: 2026-09-21** — drive those four surfaces and decide per surface.
- The section strip repeats a reference two paragraphs name twice (Lesson 1 names Matthew 5:48 in two lines). That is what "the bottom of the section it was referring to" means; if it reads as noise on a long lesson, a lesson-wide dedupe is one line in `lessonSections`.
- The probe's lesson pass adds ~3 page loads per width to CI; it rides `--sweep` only.
