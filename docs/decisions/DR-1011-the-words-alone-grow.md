# DR-1011: The words alone grow — the frame holds at every text size

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `app/src/index.css` (`--ts-fixed`: one rem as it is at Normal, on the root; a plain rem inside a `.ts-chrome-region`)
- `app/tailwind-fixed-scale.js` (`fixedLength`, `fixedScale`, `FRAME_KEYS`), `app/tailwind.config.js` (padding, margin, gap, space and border radius written in the fixed unit; width, height and the font sizes left on the root)
- `app/src/components/PoePropertiesWelcome.jsx` (`WELCOME_CSS`: 90 frame lengths written in the fixed unit; the headline's clamp floor fixed)
- `app/src/__tests__/the-words-alone-grow.test.js` (6, proven to catch)

**Amends:** DR-0438 (the chrome never gets bigger — now the content's frame does not either), DR-0145 / DR-0147 (Largest at 2x and Big Print 44 still reach the words in full), DR-0276 (the three layout rules gain a fourth: the frame is written in the fixed unit)
**Declared by:** Darrell, 2026-10-14, with a screenshot of the Poe Properties door at A44: *"The words/text need to be the only thing getting bigger... make sense? At 44 it doesn't read well... make sense..."*

## Context

The large-print control (A, A+, A++, A+++, A44) scales the document root font-size, so every rem in the app grows with it. That is the right mechanism for the words: `text-sm`, the lesson bodies, the card copy all double at Largest and reach 44px at Big Print with no per-surface work. It was the wrong mechanism for everything else written in rem: Tailwind's padding, margins, gaps and radii are rem, and so were the welcome door's discs, rules, card paddings and photo radius. DR-0438 froze the chrome (headers, tabs, the comfort bar) with a zoomed region; the content's frame still rode the words, 2.75 times over at A44. His screenshot shows it: a 143px red disc beside a four-line title, card padding at 55px, the gold rule at 242px, the headline cut off at the phone's edge.

## What was measured

Measured in a real Chromium on the built door at 412px, with the control seeded per device (`poe-text-size`), reading computed styles of the signed-out welcome door.

| At A44 (root 44px) | before | after |
| --- | --- | --- |
| the option card's disc (`.pp-disc` width) | 187px | 68px |
| the option card's padding | 55px | 20px |
| the gold rule under the headline | 242px | 88px |
| the headline (`.pp-h`) | 99px, cut at the edge | 61.6px, fits |
| the lead copy | 44px | 44px |
| the card title | 55px | 55px |
| the comfort bar's padding (chrome) | 12px | 12px |

At Normal every number is identical before and after (disc 68px, padding 20px, rule 88px, headline 36px, lead 16px). At Largest the frame reads the same as Normal while the lead is 32px and the headline 44.8px.

- Tailwind's default spacing scale is rem (`4: 1rem`); `padding`, `margin`, `gap`, `space` and `borderRadius` all derive from it. Tailwind negates a `calc()` value as `calc(... * -1)`, so negative margins survive the rewrite.
- 86 arbitrary rem layout classes exist in `app/src` (`min-w-[12rem]` 19 of them, `min-h-[2.25rem]` 5); they bypass the theme and still ride the root. 50 fixed-height `h-8` to `h-14` boxes exist; a fixed height with growing words would clip them.
- Inside a `.ts-chrome-region` the zoom already divides every rem by the multiplier; a fixed unit applied there would be divided twice (a 4px padding would render at 1.5px).

## Impact

- Unresolved: every text step above Normal pushed the frame out with the words, so the biggest sizes, the ones the elders and the children use, read worst.
- The call obligates: pixel-identical at Normal (the default nobody chose to change); the chrome regions untouched; the words still reaching 44px; the headline never leaving the phone's width.

## Decision

1. **One fixed unit.** `--ts-fixed: calc(1rem / var(--ts-mult, 1))` on the root: one rem as it is at Normal, at every step. Inside a `.ts-chrome-region` it is a plain `1rem`, because the zoom there already undoes the root scale.
2. **Tailwind's frame scales are written in it.** `padding`, `margin`, `gap`, `space` and `borderRadius` map the default scale through `fixedScale`; `p-4` is `calc(1 * var(--ts-fixed, 1rem))`, 16px at every size. Font sizes, line heights, widths and heights stay on the root: a fixed box with growing words would clip them, which is the worse failure.
3. **The welcome door's own CSS is written in it** for every width, height, padding, margin, gap, radius and grid minimum (90 declarations); every font size stays in rem.
4. **The headline grows from a fixed floor.** `clamp(calc(2.25 * var(--ts-fixed,1rem)), max(6vw, 1.4rem), 4rem)`: 36px at Normal exactly as before, 61.6px at A44 on a phone, inside the width.

Not done, and said: the 86 arbitrary rem layout classes and the fixed-height boxes elsewhere in the app still ride the root; the chrome-layout probe in CI watches the doors and the lesson surfaces at Big Print for overflow. `re-review: 2026-10-21` — sweep the arbitrary rem layout classes into the fixed unit where they are frame, and measure three more surfaces (a lesson, the Doors board, the Books ledger) at A44 the same way.

## Verification

- **`the-words-alone-grow` (6):** the unit is published on the root and reset in a chrome region; `fixedLength` rewrites only rem; the resolved Tailwind theme carries `calc(1 * var(--ts-fixed, 1rem))` for `p-4`, `m-4`, `gap-4`, `space-4` and the radius scale while `text-base` stays `1rem` and `w-4` stays `1rem` (**proven to catch:** the plain spacing scale is what the frame used to ride); the welcome CSS carries no bare rem on a frame property and every font size stays in rem, with the headline floor the one named exception (**proven to catch:** a disc written back in plain rem is reported by property and value).
- **Measured in Chromium** on the built door at 412px before and after, at Normal, Largest and Big Print: the table above.
- The text-size suites (`text-size`, `text-size-on-every-screen`, `text-size-escape-hatch`, `large-print-guard`) and the welcome door's suite (`poe-properties-front-page`) green; lint and the guards green; the ledger (Next ID DR-1012) green.
