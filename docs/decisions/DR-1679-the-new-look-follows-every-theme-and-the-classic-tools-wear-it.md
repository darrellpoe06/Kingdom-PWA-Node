# DR-1679: The new look follows every theme, the classic tools wear it, and Personalize keeps the page in view

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's Learn, lesson screen, record card and Personalize sheet; no schema)
**Type:** fix
**Area:** `app/src/lib/learn-theme.js` (new), `app/src/components/learn-studio/learn-studio.css`, `LearnStudioPreview.jsx`, `LessonExperience.jsx`, `app/src/components/RecordStrip.jsx`, `record-strip.css`, `app/src/components/Modal.jsx`, `app/src/components/shell/PersonalizeSheet.jsx`; test `the-new-look-follows-every-theme.test.js`
**Sent in by:** Darrell, 2026-11-26: "Don't look like our new standard and app views..." (the Every Learn Tool panel's Latest, in the classic page's mono type, mint green and square boxes); "Should fit with any change of the looks based on our options!?!!!!!!" (with the twelve themes); "Why does it kill the page... too?!!!!!!" (the Personalize sheet over a page gone dark).
**Pairs with:** DR-1662 (the new look), DR-1678 (Your record in the new look)

## Context

The new look (Learn Studio, the Lesson Experience, Your record) was drawn in one fixed dark palette, whatever theme a member chose. The classic Learn tools render inside the new look's tools panel in the classic page's type and colors. The Personalize sheet opened over a 95% dark backdrop.

## What was measured

- `learn-studio.css`, `lesson-experience.css` and `record-strip.css` set their colors on `.ls-root`, `.le-root` and `.rs` with fixed hex values; nothing read the theme. Every theme already carries its background and accent (`THEMES`: `color`, `border`).
- In a light theme, `.ls-root button { color: inherit }` (specificity 0,1,1) outranked the photo buttons' own white text (0,1,0), and photo lettering used the theme accent.
- `Modal` drew `bg-[#1A1815]/95` behind every dialog, Personalize included.

## Decision

1. **The new look's colors come from the chosen theme** (`learn-theme.js`): its background, panels and lines tinted from it, its accent where the new look used gold, text and dim text chosen to read on it, and text on an accent button chosen for contrast. One block per theme, generated from `THEMES`, so a theme added later is covered.
2. **Low light reads first** ("Make sure that accessibility and backgrounds work well with white words for low light"): dark themes carry light words (a soft ivory warmed by the theme's accent: "Lighter text is good.. not just white"), a bright second tone, and an accent at 7:1; every word on every theme reaches 7:1 (WCAG AAA) on its background and panels; a phone set to ask for more contrast (`prefers-contrast: more`) gets the second tone at full strength. Measured: words 15.2 to 21.0:1, second tone 7.7 to 14.6:1, dark-theme accent 8.9 to 10.6:1.
3. **The member chooses the words on dark** ("We like stark white too... why limitations!?"; "We like options... especially when they are low hanging fruit"): Personalize > Accessibility offers Words on dark themes: Soft light (default) or Bright white, saved on the device and applied at once. Dark themes only; white words on a light page would not read. Bright white reads at 7:1 or more on every dark theme's background and panels.
4. **Photo-safe colors stay fixed** where words sit on a photo (cover lettering gold, badges and photo buttons white); the general button rule is `:where(.ls-root) button`, so a button's own style always wins.
5. **The classic tools wear the new look** inside the panel: the app's sans type in place of the mono, rounded controls and cards, and the classic greens and rust in the theme's accent.
6. **Personalize keeps the page in view**: a light backdrop (`scrim="light"`), so a theme is seen on the page as it is chosen. Every other dialog keeps the heavy backdrop.

## Impact

- Learn, the lesson screen and Your record look like the rest of the app in every theme.
- Rendered in Chromium at 390 px in Love Corner (red and white), Heritage (forest and gold) and Midnight: words, accents and photo lettering all read.

## Verification after merge

- `the-new-look-follows-every-theme.test.js` (13): for each of the 12 themes, words and the second tone reach 7:1 (AAA) on background and panels, the accent 7:1 on dark themes and 4.5:1 on light, text on the accent 4.5:1, dark themes read light (luminance above 0.85); every theme has its scoped block and the more-contrast rule; Bright white is offered on every dark theme at 7:1 and never on a light one, and the choice is saved and applied. `lovecorner-header-render.test.jsx`: Personalize offers Soft light and Bright white, and Bright white saves and applies.
- Live: switch themes in Personalize with Learn open; the page stays in view and Learn changes with it.

`re-review: 2026-12-03`
