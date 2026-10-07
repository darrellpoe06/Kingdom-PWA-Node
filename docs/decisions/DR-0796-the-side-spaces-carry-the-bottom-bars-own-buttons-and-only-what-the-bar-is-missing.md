# DR-0796 — The side spaces carry the bottom bar's own buttons, and only what the bar is missing

- **Status:** accepted
- **Tier:** A (the shape of the TV rails; the tall panel, the voice, the highlight and full screen are unchanged)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/reader-controller.js` (`DOCK_CARRIES`, `RAIL_BUTTONS`, `railButtonIds`, `nextInCycle`, `railWord`; `RAIL_WIDTH_REM` 15 → 6.5), `app/src/components/TTSControl.jsx` (`railSpec` / `RailButton`; the sides layout renders those instead of the panel's two halves), `app/src/index.css` (the matching inset), tests `the-sides-look-like-the-buttons-below.test.jsx` (new) and `reader-controller-pulls-out-on-tv.test.jsx` (re-aimed)
- **Principles:** DR-0785 (the controls stand beside the Word on a TV), DR-0716 (the bottom bar carries the reader), DR-0076, DR-0075
- **Grounds:** Darrell 2026-10-07, on the Firestick with two photographs of the screen: *"The sides are larger and not like the buttons below... the user just needs the functions to look like the buttons below... just the missing ones I specified in the small side spaces... until we say full screen... make sense?"*

## Context

SHOULD: on a TV every reader control is reachable without scrolling a box a remote cannot scroll (DR-0785), and the bottom bar is the shape a control takes in this app — a square, an icon, one word under it (DR-0716, `chrome-dock.js:144`). ARE: DR-0785 put the control panel's own two halves into the margins unchanged — section headings, sentences of explanation, a five-chip text-size row, a six-dot colour row, a voice `<select>`, a paragraph about what is saved on this device — in a 15rem box on each side. GAPS: three, and his two photographs show all of them. (1) The rails did not look like the bar: prose and chips beside squares with words. (2) They repeated what the bar already had — text size on the right rail while A- and A+ sat in the bar; Follow on the right rail while FOLLOWING sat in the bar. (3) At 15rem each they took 30rem from the Word, and in the reading photograph the two rails are narrow slivers of unreadable vertical text overlapping the lines. CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| rail width before | 15rem each, 30rem of a 1920px (120rem) screen | `RAIL_WIDTH_REM` |
| rail width after | 6.5rem each; the Word gains 17rem | the same constant, and the `index.css` inset pinned to it |
| controls the bar already carried that a rail repeated | 2 — text size, follow | the bar's buttons in the photograph against `renderRailRight` |
| controls the bar is missing, now on a rail | 15 — level, start, resume, tap-to-start, stop, talk, screen-on, panel, full screen; speed, voice, colors, highlight, where the sentence sits, the Word, keep offline | `RAIL_BUTTONS` minus `DOCK_CARRIES` |
| prose, headings, lists left in a rail | 0 paragraphs, 0 `<select>`, 0 section groups; every child of a rail is a `<button>` | asserted in the new gate against the mounted reader |

**Honest uncertainty.** This was measured in the test environment and against his two photographs, not on the Firestick itself — this sandbox has no route to poetech.us and no TV. How the column reads at Big Print on his screen is for the live pass after deploy.

## Impact

Unresolved: the margins held a shrunken copy of a mouse-and-scroll panel, so on a ten-foot screen a reader met sideways prose instead of controls, two of the controls were duplicates of the bar below, and the Word lost 30rem of width to it. Resolved: each side holds a single column of the same buttons as the bar, one per function the bar does not have, each one tap from a remote; the Word is 17rem wider; nothing is said twice.

## Decision

1. **A rail control is a bar button.** The same `DOCK_BTN` square, an icon, one word under it, a 2.75rem floor, the focus ring a D-pad needs. `railSpec(id)` in `TTSControl.jsx` says what each one shows and does; `RailButton` renders it.
2. **A rail carries only what the bar does not.** `DOCK_CARRIES` names what the bottom bar has; `RAIL_BUTTONS` names every reader function and its side; `railButtonIds(side)` is the second minus the first. Give the bar a function tomorrow and it leaves the rail the same day, by subtraction, with no second edit.
3. **More than two settings means one button that cycles.** The word under the icon IS the setting it is on — Midnight, 1.5×, Centre, Teen — and a tap moves to the next (`nextInCycle`, wrapping; `railWord` keeps the name to one word so it fits a square). A remote reaches one button, never a row of five chips.
4. **The tall panel is untouched.** Every chip, list, heading and line of prose still lives there for a mouse, and a Panel button on the left rail is one tap to it. Full screen still takes the rails, the bar and the header away — *"until we say full screen"* — and Back, Esc or the corner mark brings them back.

Proven to catch (DR-0076), in the new gate: adding `speed` to `DOCK_CARRIES` drops it off the right rail and shortens that rail by exactly one; a rail wide enough for prose fails the width bound; a paragraph, a `<select>`, any of the panel's seven named groups, or a non-button child left in a rail fails; a button missing the bar's square classes, its word, or its aria-label fails; a word longer than 14 characters fails (it caught the first cut, where the colours button read "Midnight · OLED black", 18 characters).

## Verification

- `the-sides-look-like-the-buttons-below.test.jsx` 11 green; `reader-controller-pulls-out-on-tv.test.jsx` 12 green; every reader, TV, dock and follow suite — 64 files, 643 tests — green on this head.
- On the Firestick after deploy: open a lesson, confirm each side is a column of the same buttons as the bar, that nothing in the bar is repeated there, that one tap on Colors / Speed / Teen moves the setting, and that Full takes them away.
- re-review 2026-10-21 with Darrell on the TV: whether the fifteen are the right fifteen, and whether any of them wants to move into the bar instead.
