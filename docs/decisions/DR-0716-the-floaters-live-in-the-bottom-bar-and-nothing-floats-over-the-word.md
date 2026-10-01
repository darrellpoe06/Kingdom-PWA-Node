# DR-0716: The floaters live in the bottom bar, and nothing floats over the Word

- **Status:** accepted
- **Tier:** A (chrome placement only. Every control keeps its action. No data, no money, no schema.)
- **Type:** surface + gates
- **Date:** 2026-09-30
- **Scope:** `app/src/components/ChromeDock.jsx` (new: the bottom bar), `app/src/lib/chrome-dock.js` (new: the reader slot, the shared "scrolled deep" rule, the bar-button look), `app/src/components/TTSControl.jsx` (when the bar is mounted, the button, mini-bar, pill and "back to the voice" portal into the bar), `app/src/components/NetworkStatus.jsx` (`variant` = `floating` | `dock` | `inline`), `app/src/components/ChurchGiving.jsx` (`ChurchGiveDockButton` replaces `ChurchGiveFloater`), `app/src/components/AdminConsole.jsx` (Systems shows the network status inline), `app/src/poe-financial-mvp-v28.jsx` (mounts `ChromeDock` in place of the three floaters), `app/src/components/ComfortBarToggle.jsx` + `app/src/lib/comfort-bar.js` (the A44 bottom block folds, see the addendum), `app/src/index.css` (the reader's panel and passing prompts stand above the bar, the bar drops under an open modal, and on a phone the inline Top steps aside while the mini-bar fills the bar), `scripts/chrome-layout-probe.mjs` (the bar counts as chrome, and a new invariant says the bar stands on the comfort bar rather than over it), copy in `BigPictureDashboard.jsx` and `lib/word-out-course.js` that said "bottom-left", and tests.
- **Principles:** HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076 §3), the DR-0438 ratchet (chrome never grows, and the text dominates), DR-0276 rule 3 (big text is always reversible), REALITY-TRACE (DR-0061)
- **Grounds:** Darrell, 2026-09-30, with a screenshot of the L202 lesson reader on his Galaxy Fold 7 (open, about 900 CSS px, dark, A44): *"Put the feedback and other floating options on the task bars somewhere they make sense... they can still do what they do however it will make the reader better and less blocked... make sense?"* And then: *"Like the text size etc..."*

## Context

Five things floated over the lesson words:

- the Feedback pill, bottom left (`poe-financial-mvp-v28.jsx`, `fixed bottom-4 left-4`);
- the network status dot, left side, mid screen (`NetworkStatus.jsx`, `fixed bottom-20 left-4`);
- the Give pill, bottom right (`ChurchGiving.jsx`, `fixed bottom-4 right-20` / `sm:bottom-20 right-4`);
- back to top, bottom right (`TTSControl.jsx`, inside the fixed `.tts-controls` stack);
- the read-aloud button, mini-bar or pill (`TTSControl.jsx`, the same stack).

Each one worked. Taken together they covered the Word. The idle-dim rule (DR-0235) made them fainter, but they were still there.

## Decision

1. **One bar at the bottom, full width and solid.** `ChromeDock` is a fixed bar 48px tall. The page carries a spacer of the same height, so the last line of a lesson scrolls up above the bar instead of staying under it. At Largest and Big Print the text-size row is already a fixed bottom bar (`.ts-escape-hatch`), so the dock sits directly on top of it (`bottom: var(--ts-hatch-h)`) and the two read as one unit.
2. **Where each control went:**
   - **Feedback, Give (Church only, as before), the network status:** in the bar, on the left. Below 640px they fold into one **More** button, which opens them as a menu above it. A mark appears on More when a connection check is failing. There is still only one NetworkStatus instance, so the connection is probed once, not twice.
   - **Top:** in the bar, after the left group. It shows once the page is more than 1.25 screens deep, which is the same rule as before, now shared in `lib/chrome-dock.js`. On a phone, while the reader's mini-bar or pill fills the bar, the inline Top steps aside and the copy inside More takes over. The reader's open panel keeps its own "↑ Top".
   - **Read-aloud:** in the bar, on the right. `TTSControl` portals its speaker button, its mini-bar (Follow / Back / Pause / Next / Window / Read), its reading pill and "back to the voice" into the bar's slot. The open panel is still a panel, and it now stands above the bar (`.tts-controls.fixed` bottom = 16px + bar + comfort bar). The wrapper keeps `.tts-controls`, so the reading engine still treats it as the reader's own chrome: never read aloud, never a tap-to-start target.
3. **One family with the text-size chips.** Every bar control is a square button with a 2px `#E8E4DC` border that turns dark on hover, or filled when pressed or "on", with a short word under its icon. This is the same look as A / A+ / A++ / A+++ / A44. Each button is its own `.ts-chrome-region` sized in rem. That makes it 44x44px on screen at every text size, and the bar is 48px at Normal and at A44 alike. The bar itself is not a chrome region, because a zoomed bar around the reader's controls (which carry their own cap) would shrink them twice.
4. **Nothing idles or dims in the bar.** A bar button covers no words, so it has nothing to get out of the way of.
5. **Surfaces with no bar keep their corner.** The follow-along display, the public TLC door and the practice reader mount `TTSControl` without the app shell. They get no slot, so they render exactly as before.

### Why Top is in the bottom bar, not the lesson's top bar

It was suggested for the reader's top bar. I measured it there first. At 360px that row already holds ⌂, "← All lessons", the lesson number, ← and →: about 325px of the 342px inside it, with `flex-nowrap` (DR-0438 fought it down to one line). A 44px Top would overflow it or force a wrap mid-lesson. The bottom bar has the room. It is also where the thumb already is, and it puts Top in the same place on every screen, not only in a lesson.

## Measured (chrome-layout probe, `--sweep`, production build, real Chromium)

The lesson chrome union (header, lesson bar, comfort bar, the floaters, and now the bottom bar), L1 at 900px tall:

| Case | Before (DR-0707) | After |
|---|---|---|
| 360px, header open | 406px | 406px (bottom bar 48px) |
| 360px, header collapsed | 282px | 282px |
| 360px, Big Print | 376px | 348px |
| 360px, Big Print, collapsed | (not reported) | 218px |
| 360px, service window | 416px | 416px |
| 360px, service window, collapsed | 292px | 292px |

The bar replaced the floaters' band, so the chrome did not grow, and at Big Print it shrank. Widths 768 / 1440 / 1920 pass. The reader pass at 412 (Largest), 390 and 1920 has the pill and mini-bar on screen, and at 1920 the D-pad walk still works. Measured spot checks: the bar is 360 / 412 / 900 / 1440 px wide with no page overflow, and every bar button is 44px tall. At 360 + Big Print + collapsed, the bar sits at y 786, directly on the comfort bar.

## Gates

- `floaters-live-in-the-bars.test.jsx` (new) mounts the real `ChromeDock` with the real `TTSControl` over a lesson-shaped `<main>`. It checks that the only fixed box any of these controls sits in is the full-width bar, and that the spacer exists. It checks that each control is in the bar (Feedback, Give, the network dot, Top, the read-aloud button, and the mini-bar while reading). It checks that each still fires its action (`onFeedback`, the giving panel, the network detail, `scrollTo({ top: 0 })`, the reader panel, and pause through the same engine), that More opens and closes on Escape, and that every bar button is a `ts-chrome-region` square chip at 2.75rem. The shell no longer mounts the three floaters. Against the old shell, every placement assertion fails: the controls were `fixed` corner pills outside any bar.
- `church-giving-render.test.jsx` is updated on purpose. Its "floats bottom-right and idles to a dim circle" pins described the defect. It now pins the bar button and the same panel.
- `the-way-back-to-the-top.test.js` is updated on purpose. The corner ↑ also stands down while docked (`!docked`).
- The chrome-layout probe counts the bar in the chrome union. It also adds an invariant: the bar may not sit more than 1px over the fixed comfort bar. The Big Print selftest, which zeroes `--ts-hatch-h`, trips it.

## Addendum (2026-10-01): the A44 bottom block folds to one row

Darrell, 2026-10-01, a screenshot of the live L202 reader (build 35b3ffcc): *"How do I get rid of the below header?!!!!! I need a button!!!!"* At Largest and Big Print, the header's controls row becomes the fixed bottom block (`.ts-escape-hatch`, DR-0276). It holds the account row, Give, Subscribe, help, the five text sizes, the voice, the six swatches and the build line. On his Fold it took about the bottom fifth of the screen.

- **`ComfortBarToggle`** is mounted first in that row (`header-comfort-row`). It renders **"Hide ▾"**. Folded, it renders **"Show controls ▴"** plus the text-size dropdown, so big text stays reversible (DR-0276). Both are square bordered buttons in the text-size family: 2.75rem tall, with the standard focus ring.
- The fold is CSS over a block that stays mounted. `lib/comfort-bar.js` publishes `<html data-comfort-bar="collapsed|open">`, and `index.css` hides every other item in the row, only at Largest and Big Print. Nothing unmounts, and everything is one tap away. The bottom bar above it moves down by the new height, because the published `--ts-hatch-h` tracks the row.
- The choice is kept per device (`poe-comfort-bar-collapsed`, every access wrapped in try/catch). It is published as the module loads, so a reader who folded it once opens every lesson folded, with no flash of the open block.
- Gates: `comfort-bar-folds.test.jsx` checks that Hide folds, Show restores, the fold persists across a reload, and the family look and focus ring hold. The probe's new COMFORT pass, at 360px and at the Fold open (900px), at Big Print on the lesson, checks that the folded block is at most 64px, smaller than open, still fixed and still holding a text-size control, that it survives a reload, and that Show controls restores the whole block. Its selftest forces every item visible and must trip.

## Coordination

PR #1891 (DR-0698, `claude/text-size-everywhere`) adds `TextSizeQuick` (A- / A+) in the reader's idle row, next to the speaker button. In this design, that row is what ends the `TTSControl` chain (`... : fab`). Whichever PR merges second replaces the trailing `fab`, in both the corner chain and the docked chain, with the idle row. The A- / A+ pair then rides in the bottom bar too. Its `ts-chrome-region` pills fit beside the docked speaker at 360px (bar: More 48 + pair about 132 + Read 44).

## Left as it is, with a why

- The reader's **open panel**, its **"the screen went dark" and "take me back" notices**, and the **pop-out window** still float. A person opened each of them, each can be dismissed or closed, and the pop-out exists to be moved around. They now stand above the bar. Re-review: 2026-10-14, with Darrell's next lesson screenshot.

## Impact

The lesson reader's text has nothing floating over it. Every control is one tap away in the same place on every screen, in the same family as the text-size buttons.
