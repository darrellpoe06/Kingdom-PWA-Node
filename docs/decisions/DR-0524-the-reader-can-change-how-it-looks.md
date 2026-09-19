# DR-0524 — The reader can change how it looks, from inside the lesson

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** defect
- **Relates to:** DR-0276 (text-size controls are chrome, so the size is always changeable), DR-0438 (controls never grow; they shrink or drop), DR-0426 (the level is switchable from the reader), DR-0076 (measure, do not claim — a first reading of this was wrong and a measurement corrected it), DR-0061 (reality-trace before building a surface)

## The report

Darrell, 2026-09-19, two screenshots from his phone — L179 open, the Read Aloud panel up, dark theme, ADULT selected:

> "Can't change the text side nor etc on o cellphone reader fix it"

"Text side" is text SIZE. The second screenshot is the panel he went looking in: screen-awake, four read buttons, **Who is learning**, Show the Word, **Speed**, **Voice** — and no text size anywhere in it.

## MY FIRST TRACE WAS WRONG, and that is the more useful half of this record

The first reading of the code said: the lesson's own bar is `sticky top-0 z-30` and the app header is not sticky, so a reader scrolled into the words has the bar pinned at the top and the comfort row gone above it — nothing reachable. That was written into four comments before anything was measured.

**The header is `position: sticky` at top 0.** Measured at 360px, mid-lesson, Normal size:

| header state | text-size controls in the DOM | on screen |
| --- | --- | --- |
| open | 5 | 5 |
| **tucked away (the hideaway)** | **0** | **0** |

So with the top bar open the controls never leave the screen. The real trap is the **hideaway** — and that is exactly what his screenshot shows: the lesson bar at the very top with no comfort row above it.

The hideaway unmounts the whole comfort row (account, voice, font, theme). `TextSizeEscapeHatch` exists for precisely that, but it rendered **nothing at Normal**, on the reasoning written in its own header: *"at 1x there is no trap, so a reader who tucked the top bar away for room gets exactly the clean surface they asked for."* That reasoning is true of getting **out** of big text and false of getting **into** it. A reader at Normal with the bar tucked away had no way to make the words bigger, anywhere in the app.

All four wrong comments were corrected to the measured numbers rather than quietly deleted.

## THE INSTRUMENT WAS BLIND TWICE OVER

`chrome-layout-probe.mjs` is the instrument for this class, and it missed this in two separate ways:

1. Its **textscale** pass loads the app at page top and never opens a lesson.
2. Its **lesson** pass opens a lesson — and only ever loaded with the header **OPEN**, the one state where the controls survive. Had it looked, it would have reported comfort as reachable and been telling the truth about a state Darrell was not in.

The pass's own law, written in this same file about this same class on 2026-08-30 — *"a state the user can reach is a state the probe must load in"* — had not been applied here.

## What changed

1. **`TTSControl.jsx` — the reading panel carries text size and theme.** A **How it looks** section, first among the panel's settings because it is the one he went looking for and did not find. Re-rendered rather than imported, for exactly the reason the panel's Show-the-Word comment already records: `TextSizeControl` sizes labels in fixed px and its box in rem, and this panel is deliberately em-sized so its chrome rides the capped chrome multiplier. The **stores** are shared, so this and the header are one switch.

2. **`TextSizeEscapeHatch` renders at every size while the header is tucked away.** Zero controls is a trap whichever direction the reader wanted to go. The hideaway still hides what Darrell built it to hide — the account row, the voice picker, the theme swatches, the date and build lines; one thin row is not the dashboard.

3. **`text-size.js` gained a subscriber set.** `useTextSize` kept its own `useState`, which was harmless while exactly one control existed. A second control would have shown a **stale highlighted chip** — a comfort control telling the reader a size he is not on. Every consumer now reflects one published value.

4. **`theme-css.js` gained the same store**, and the monolith's `useState` became `useThemePref`. Theme was React state inside `poe-financial-mvp-v28.jsx`, so a picker in another tree could not move it. The DOM application did not move: the monolith still owns `data-theme` on its wrapper.

5. **The app header's theme row had lost cream.** It was a hardcoded list of five — white, slate, sapphire, rose, midnight — and **cream is the first-run default**, so a reader who chose any other palette could never get back to it from the header. Measured against `lib/theme-css.js` while adding the reader's swatches: six in the registry, five in the header. Both business doors already mapped `THEMES`; only the app's own header carried the copy. It maps the registry now.

6. **The probe's lesson pass runs the collapsed cases** — Normal and Big Print at 360px with the top bar tucked away — and asserts that a text-size control **and** a theme swatch are on screen after scrolling into the words and opening the reading panel. The never-bigger chrome baseline is now keyed by header state, because comparing Big-Print-open against Normal-collapsed would have failed for a reason that is not a defect.

## Verification (DR-0076)

- **Proven-to-catch, twice.** Deleting the panel block and the store trips **9 of 13** checks in the new suite; breaking **only** the store trips exactly **1** — the stale-chip case, which is the subtle one and the one a hand review would miss.
- **Proven-to-catch in the real browser.** With the reader's comfort row hidden, the probe's self-test reports:
  `LAYOUT FAIL lesson@360px [header collapsed]: scrolled into the lesson, 5 text-size control(s) exist but none is on screen` — 17 invariants tripped, up from 16.
- **The real app passes in the state that failed.** `--sweep`, all six lesson cases green, including `lesson@360px [header collapsed] — mid-lesson at y1986: 10/10 size + 7/7 theme controls on screen` and the same at Big Print.
- **One existing test asserted the wrong behaviour and was inverted, not weakened.** `text-size-escape-hatch.test.jsx` pinned "renders nothing at Normal." It now pins the opposite, with the measurement that overturned it written above the case so a future reader sees why it flipped.

## Gate

`app/src/__tests__/the-reader-can-change-how-it-looks.test.jsx` — 13 checks, 3 of them proven-to-catch. It pins the two controls in the panel, that a tap really changes the applied size and not just the chip, that the mark moves, that a change made anywhere else moves this control too, every theme including cream, the way back to cream, a refused nonsense palette, and the em-only sizing that keeps this block from ballooning at A+++/A44.

Plus the probe's mid-lesson assertions, which are the real instrument for reachability — jsdom cannot measure geometry.

## Honest limits

- **Not yet confirmed on his own phone.** This is the structural fix, measured in a real Chromium at 360px in the failing state. On-device confirmation on his fold is the outstanding step, and this record claims no more than that — the same discipline DR-0258 and its successors kept.
- **The reader panel is the lesson's fix; the hatch is the app-wide one.** Surfaces outside a lesson rely on the hatch, and the hatch is a thin row rather than a prominent control. If a tucked-away header still feels short of a way to resize on some surface, that is the next thing to measure. **re-review: 2026-10-03.**
