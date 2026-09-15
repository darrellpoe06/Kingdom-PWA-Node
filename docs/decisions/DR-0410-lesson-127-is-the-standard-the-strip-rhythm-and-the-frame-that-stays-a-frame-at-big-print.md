# DR-0410 — Lesson 127 is the standard: the strip rhythm, and the frame that stays a frame at Big Print

- **Status:** accepted
- **Tier:** B (the reading surface every lesson renders through; no schema, no money)
- **Type:** ux
- **Date:** 2026-09-15
- **Scope:** `app/src/components/ChurchLearn.jsx` (`lessonSections` → block rhythm `SECTION_RHYTHM`; `data-block-lines` on each strip; `.ts-chrome-region` on the lesson-space bar and the catalog lessons-bar), `app/src/components/TTSControl.jsx` (pill + panel buttons `min-h` rem→em), `app/src/components/TextSizeControl.jsx` (panel chips' box fixed px), `scripts/chrome-layout-probe.mjs` (lesson pass: rhythm + Big Print chrome, selftest ×5), `app/src/__tests__/lesson-127-is-the-standard.test.jsx` (new), `app/src/__tests__/learn-flow-reads-clean-refs-below.test.jsx` (the no-heading case re-pinned to the rhythm)
- **Principles:** REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE / measure-don't-claim (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)
- **Pairs with:** DR-0406 (the Word waits green at the foot of its section — the mechanism this record tunes), DR-0402/0391/0392 (no boxed chips, no list at the end), DR-0276 / DR-0145 / DR-0147 (content scales, chrome is capped), DR-0265 (the reading pill)

## The report, in his words

Darrell 2026-09-15, listening to Lesson 127 at Big Print 44 on his phone:

> "I don't like the the buttons get way bigger on the bigger font choices!! Can we fix it!" (with a screenshot: ALL LESSONS / PREV / NEXT huge, the read-along pill huge, the text-size chips huge)
> "No I don't like the buttons fix nor the other one with the green... use lesson 127 that flows correctly... I'm listening to the whole thing now" — "As the standard..."

## Measured before building — the standard, taken from the thing he named

Rendered through the real `LessonProse` in jsdom (not recalled):

| lesson | headings | lines | green strips | chips per strip |
|---|---|---|---|---|
| **127** (flows) | 10 | 60 | 8 | 2–9 |
| 1 | 0 | 25 | 12 | 1–3, after almost every line |
| 128 | 5 | 212 | 4 | one strip of **141** |
| 126 | 18 | 189 | 15 | one strip of 51 |

44 of 151 lessons carry no headings at all. The difference between 127 and the rest was never the prose and never the green itself — it was the **rhythm** of the green. DR-0406 tied the strip to the author's markers: a lesson with headings got one strip per heading (however long the section — 141 chips), and a lesson without got one per line (a strip after every sentence). Lesson 127 happens to be authored in five-to-six-line sections with a modest strip at each foot. That is the rhythm the reader's eye — and the listener's ear — accepts.

And the chrome: the lesson bar, the reading pill's buttons, and the text-size panel's chips were sized in **rem**, so they rode the 2.75x root scale with the reading text. The cap that every nav row already carries (`.ts-chrome-region`, DR-0276) and the em-only rule the TTS panel's labels already obeyed (Pattern 2b) had simply not been applied to these three.

## Decisions

1. **The rhythm is 127's, for every lesson** — `SECTION_RHYTHM = { maxLines: 6, maxRefs: 9 }`. A section is still a heading and the lines under it, but its lines are grouped into blocks of at most six, and a block closes early rather than let its strip exceed nine chips. Each block carries its own strip at its foot. A reference is never further than a few lines from the sentence that named it; never a wall of chips; never a strip after every line. **Not one word of prose moves** — only where the green waits. The rendered rhythm is stamped on each strip (`data-block-lines`) so it can be measured, not assumed.
2. **The frame stays a frame at Big Print.** The lesson-space bar and the catalog lessons-bar take `.ts-chrome-region` (the one cap: ~1.4x at Big Print, exactly 1x at Normal). The reading pill's and panel's buttons drop their rem floor for em (44px at Normal, capped above). The text-size panel's chips fix their box in px as their labels already were (48px, every step). The words grow; the controls do not.
3. **The probe measures both, in a real browser, every push.** The lesson pass now asserts no strip over nine chips and no block over six lines (read from the DOM), and loads the lesson once more at Big Print to assert the bar's buttons and every text-size chip stay under 64px. Its selftest must now trip five ways (width, boxed control, chip wall, long block, ballooned bar) or the run is theater.

## Verification (measured, real Chromium, this branch's build)

- Selftest-break: **11 tripped — 4 chrome, 5 lesson, 2 textscale** (the two new rhythm breaks and the Big Print bar break all trip).
- Sweep: 33/33 chrome cases, **4/4 lesson cases**, 16 text-scale cases. Lesson 1 at 360/768/1440: prose full width, **4 strips, max 2 chips, max 6 lines per block** (was 12 strips). Lesson 1 at 360px **Big Print: bar buttons 47px, text-size chips 46px** (un-capped they measured ~100px and ~132px; the selftest's uncapped floor measured 308px).
- `lesson-127-is-the-standard.test.jsx` (10): the rhythm values pinned and matched to the probe's; L127 passes its own rhythm; L128's 141-chip wall proven gone; L1's strip-per-line proven gone; **every lesson in the catalog** within the rhythm; the blocks reproduce the lesson in order; both bars carry the cap; no rem floor in the pill/panel; the panel chips render 48px boxes with px labels.
- `learn-flow-reads-clean-refs-below` (13) re-pinned: each strip's chips were named in the ≤6 lines above it. `tts-control-chrome-cap`, `text-size`, `text-size-escape-hatch`, `reader-reads-content-not-chrome` green. Lint clean.

## Limits, stated

- The reading pill only appears while a voice is reading; the probe measures the bar and the chips (the pill's fix is the same em rule the panel's labels already proved, pinned at source). A live pill measurement needs speech synthesis in headless Chromium — **re-review: 2026-09-22** with a stubbed `speechSynthesis` if the pin proves insufficient.
- A single line naming more than nine references is its own block and carries them all (not one word moves, so a line cannot be split); the catalog has none today, and the all-lessons pin will say so if one arrives.
- The other Learn surfaces that render prose (Practice, Eternal Algorithms, Study, Torah map) still use the inline-chip `WordInline`; DR-0406's re-review date (2026-09-21) covers them.
