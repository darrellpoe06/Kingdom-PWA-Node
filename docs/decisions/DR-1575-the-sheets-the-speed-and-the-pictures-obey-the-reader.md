# DR-1575: The sheets, the speed and the pictures obey the reader

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (congregation-facing surfaces; no schema, no money moving, no new road)
**Type:** decision
**Area:** `app/src/components/Modal.jsx` (the sheet shape); `app/src/components/shell/PersonalizeSheet.jsx`, `LoveCornerMenus.jsx`; `app/src/lib/tts.js`, `use-read-aloud.js`, `use-clip-rate.js`; `app/src/lib/picture-zoom.js`, `app/src/components/PictureZoom.jsx`, `lovecorner/ChurchOfficeBoard.jsx`, `DocumentViewer.jsx`; `app/src/components/UiIcon.jsx`; `app/src/index.css`; `scripts/chrome-layout-probe.mjs` (the sheets pass)
**Sent in by:** Darrell, 2026-11-18, from the live Love Corner door on a foldable tablet, night theme, large text: *"Look okay? Accessibility?"* (the ALL menu and Personalize); *"The reading speeds etc don't work... fix it"*; *"Larger text doesn't enlarge the fonts on the images.... or documents..."*
**Pairs with:** DR-1483 (the Love Corner header and its sheets), DR-1540 (the Aa button), DR-0654 / DR-1482 (a reading keeps its voice), DR-0438 (chrome never grows), DR-1550 (the church office board), DR-1078 (documents open in the app), DR-0239 dimension 4 (measured, not eyeballed)

## Context

Four things on one door did not do what the reader asked. All four were reproduced in a real Chromium on the built app before anything was changed.

## What was measured (before)

- **The sheets.** `Modal` portals to `<body>`, outside the themed shell: a white padded card round a dark sheet, a 21 to 25px white frame. The close was `#5A5751` on `#120909`, **2.73:1**, sized in rem (44px at Normal, **121px** at Big Print), over the sheet's first control (the search field, the title). The sheet was a second scroll box (`max-height:80vh`) inside the dialog's own.
- **The speeds.** `.lch-seg` was a one-line `inline-flex` with `overflow:hidden` holding eight speeds: **three to seven of the eight were not on screen** (four at 390px Normal, seven at Largest).
- **The speed did nothing.** Every `useTextToSpeech()` read the saved prefs once, at mount. The sheet wrote storage and told no one, so the Read button, the sheet's own Test and an open lesson kept their old speed, and the next save from any of them wrote the old speed back. The voice pick already broadcast (`lib/reading-voice.js`); the speed never did.
- **The Youth Zone glyph** (`sparkle`) used 9 of the 24 units, in the top half: **7.5px** of ink beside a 13.5px median.
- **Pictures.** `.lc-office-pic img` had `max-height:70vh; object-fit:contain`: on a 1024px tablet the calendar was drawn **415px wide in a 956px card (43%)**, its small print 6.8px. The full viewer was `max-width:100%` with no zoom at any text size. `DocumentViewer` drew a picture or a PDF page at its dialog's width, with no zoom.
- Found by the new probe pass, not by the report: at Largest and Big Print on a 390px phone, **ten tile labels ran past their tiles** (three fixed columns).

## Impact

An elder at Big Print can close a sheet, see every speed, and hear the speed he picked from the Read button without reloading. The office's calendar and letter are read at the size he reads everything else, and a team document or a PDF page can be made larger than the screen and scrolled. A layout fault in either sheet now fails the build instead of waiting for a screenshot.

## Decision

1. **`Modal` has a sheet shape** (`variant="sheet"`, `theme`): the panel carries the theme, has no padding, is the one scroll box, and its close is a 44px fixed-px themed button outside the scroll box. The default card is unchanged for every other caller.
2. **Every speed is drawn** in a wrapping grid, each named with its number. The tile grid drops columns as the text grows.
3. **A saved speed is announced.** `saveTTSPrefs` tells every subscriber in the tab (and other tabs by the `storage` event); each reader's engine takes it at once and its own copy follows the store. `use-read-aloud` carries it to a NAS-voice clip already playing. The voice is not touched here (DR-0654).
4. **A picture grows with the text size.** Inline pictures fill their card. Every full-size viewer (the office board, the document viewer's pictures and PDF pages) opens at the reader's text-size step (100 / 120 / 150 / 200 / 275%), has Smaller and Larger on screen at 44px, goes on to 600%, and scrolls both ways. A PDF page is redrawn at its new width, capped at 4096 device pixels.
5. The voice pick is written out in full under the picker, where a long name wraps.

## Verification

- After, same harness: close **15.05:1**, 44x44px at every size, over nothing; frame 1px (the border); one scroll box; 8 of 8 speeds; no tile glyph under 12.9px beside a 14.2px median. Calendar 954px of 956px (100%), small print 15.7px; viewer at Largest 200% (2016px on a 1024px screen), Big Print 275%, right and bottom edges reached by scrolling, no page overflow.
- `the-sheet-settings-reach-the-reader.test.jsx` (14): proven to catch, five speed tests fail on the pre-fix `tts.js` (`expected '1' to be '1.5'`). `a-picture-grows-with-the-text-size.test.jsx` (8).
- `chrome-layout-probe.mjs` sheets pass: 12 cases (two sheets, 390 and 1024px, Normal / Largest / Big Print), S1 to S5; its selftest puts the white card, the grey close and the one-line strip back and requires S1, S2 and S4 to trip. Sweep green locally; selftest trips.
- **Not verified:** nothing here was run on Darrell's Samsung foldable or with a real Android voice; speech was measured against a stand-in synth, and the NAS-clip path by reading the code. The live user-review pass (DR-0104) is the check.
- Not built here, by direction: the calendar as real text events (its own work).
- `re-review: 2026-12-03` — the live read on the tablet, and whether the per-voice pitch (`voice-shapes`) needs the same broadcast.
