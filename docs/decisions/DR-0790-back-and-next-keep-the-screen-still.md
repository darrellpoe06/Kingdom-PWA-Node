# DR-0790 — Back and Next keep the screen still: a manual jump reveals, it does not re-place

- **Status:** accepted
- **Tier:** A (the follow's scroll decision after a manual jump; the voice, the highlight and the chosen place are unchanged)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/read-follow.js` (`readingScrollDelta` and `followRange` take `mode: 'place' | 'reveal'`; `followRange` returns the move it made), `app/src/components/TTSControl.jsx` (`settleRef`: a jump enters reveal; the first needed move hands place back; a finished reading clears it), test `the-jump-keeps-the-screen-still.test.js`
- **Principles:** DR-0659 (how the reader follows the voice — the listener's own choices), DR-0769 (Back walks to the previous paragraph), DR-0076, DR-0075
- **Grounds:** Darrell 2026-10-07, reading L214 on his tablet with the Read Aloud panel open: *"Reader screen jumps and moves everytime a user selected the prev/next buttons... it makes it difficult to refind your place and is annoying.... fix it!!!!!"*

## Context

SHOULD: Back and Next move the voice by a paragraph (DR-0769), and the reader keeps their eye where it was. ARE: a jump restarts the voice at the paragraph before or after; the follow (DR-0659, `place: top` by default) then placed that sentence at the top of the readable band — `readingScrollDelta` with a place ALWAYS moves the sentence to its spot, with only a 12px slack — so the whole page lurched under a reader who had just looked at where the voice was, on every press. GAPS: the follow had no notion of "the reader just moved the voice on purpose; leave the page alone". CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| the placement after a jump | a sentence at y=400 in an 800px viewport with 60px of chrome is moved to y=102 (the band's top plus one line) — a 298px lurch | `readingScrollDelta({ place: 'top' })`, pinned in the new test |
| the slack that let it stay | 12px | `PLACE_SLACK` |
| the jump path | `jumpParagraph` → `jumpToSegment` → `beginRun` + `read(...)`; the first lit sentence then runs `scrollToVoice` → `followRange(r, { place })` | `TTSControl.jsx` |

## Decision

1. **Two modes in the follow's scroll.** `readingScrollDelta` and `followRange` take `mode`: `'place'` (the default, unchanged for every existing caller) honours the chosen place; `'reveal'` ignores the place and moves the page only when the sentence is hidden under the chrome or below the fold, and then by the least that shows it (the pre-DR-0659 reveal branch). `followRange` returns the move it made, 0 when none.
2. **A manual jump enters reveal.** `jumpToSegment` (Back, Next, a step-picker jump) sets `settleRef`; `scrollToVoice` passes `mode: 'reveal'` while it holds. The sentence the voice resumes at is lit where it is; if it is on screen the page does not move at all.
3. **The first needed move hands place back.** When reveal did have to move the page (the voice read on past the fold), the reader's eye had to move anyway, so the chosen place resumes from that sentence. A finished reading clears the flag; the jump's own not-reading flicker does not.
4. **Top stays Top.** The header's ↑ Top is an explicit scroll home and is unchanged.

Proven to catch: the math on real numbers (place pulls a mid-band sentence to the top by more than the slack; reveal moves it 0; reveal brings a sentence under the chrome or below the fold in by the least and less than placing would); `followRange` with a real rect and a counted `scrollBy` (reveal: 0 calls; place: one call carrying the returned delta; reveal below the fold: one smaller call); the reader's wiring read from its source (reveal set by the jump, place handed back on the first move, cleared when a reading ends, Top unchanged).

## Verification after merge

- On the tablet: open L214 with Read Aloud, press Next and Back several times; the page holds still while the lit sentence moves between paragraphs on screen, and moves only when the next paragraph is off the fold.
- `the-jump-keeps-the-screen-still.test.js` 9 plus the follow suites (8 files, 91) green on the merged head.
- re-review 2026-10-21 with the Firestick's Back / Next in the docked bar.

## Impact

Unresolved: every Back or Next moved the whole page to put the new sentence at the top. Resolved: the page stays where the reader left it; the highlight moves; the page follows only once the voice has genuinely read past what is on screen.
