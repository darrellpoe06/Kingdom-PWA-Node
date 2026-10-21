# DR-1152: The openers sit in the header's own row, the hold survives a phone, and the door's answer is on screen

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a control moves within the header; a bug fix in a hold; no new road, no schema, no money)
**Type:** product (the header) + bug fix

**Area:** `app/src/components/GarageHeaderButton.jsx`, `app/src/components/OpenerButton.jsx` (the hold refuses the long-press menu, turns touch-action off, no longer ends on pointercancel; the answer and the early-release hint are visible), `app/src/components/TopNavRow.jsx` (the two mounts leave the tab row), `app/src/poe-financial-mvp-v28.jsx` (one import riding an existing line; one mount line before the bell; a stale two-line comment removed, so the shell is one line SHORTER), `app/src/__tests__/garage-in-the-header.test.jsx` (+1 proven-to-catch case), `app/src/__tests__/the-opener-is-in-the-header.test.js` (placement and phone-hold pins).

**Principles:** DR-0823 (the opener is held, not tapped); DR-0777 (the garage opens over Wyze's own cloud, no video in the way); DR-0078 (the frozen shell: a mount line, nothing more); DR-0076 (the answer is said, never assumed); DR-0438 (chrome stays chrome).
**Declared by:** Darrell, 2026-10-21, three messages minutes apart, on his Fold: *"The Garage Door will get pressed accidentally move it to the open space in the header... make sense?"*, *"The garage tab doesn't work!!!!!!!!!!"*, *"The new one does not work!!!!!!"*

---

## Context

#2324 (the same day) put a Wyze garage control in the header's TAB ROW, beside the household opener, pinned by the chevron. Two things were wrong with where and how it sat:

1. **Where.** The tab row is what a thumb scrolls through to reach Properties and Projects; a garage button in it is a garage button under a scrolling thumb. His screenshot shows the row at Fold width: `ALL` and `GARAGE` take the space the Properties tab was sliding under.
2. **How.** The press is a HOLD of 800 ms (DR-0823, so a brush never moves a door). On Android, a touch held about half a second raises `contextmenu` and then `pointercancel` as the browser takes the gesture, and both controls ended the hold on `pointercancel`. So on a phone the hold could never finish: the fill ran to about half and nothing was sent. And the answer was `sr-only`, so even a finished hold said nothing he could read.

## What was measured

- `GarageHeaderButton.jsx` and `OpenerButton.jsx` before: `onPointerCancel={cancelHold}`, no `touch-action`, no `contextmenu` handling, the status span `sr-only`.
- The shell: 5193 lines, exactly at the frozen budget. After: 5192 (one import on an existing line, one mount line, a two-line stale comment removed). `monolith-budget-guard: OK — 5192 lines, 1 UNDER`.
- The proof the browser cancels the hold is from how Android's long-press works and from the component's own code path (a `pointercancel` reached `cancelHold`); it was not timed on his phone from here. The proven-to-catch test dispatches exactly that sequence (pointerdown, 500 ms, `contextmenu`, `pointercancel`, the rest of the hold) and the first version fails it.

## Decision

1. **Both openers live in the header's own row**, mounted once by the shell right before the bell, in the open space his screenshot shows, and no longer in the tab row in either of its shapes. They are drawn only when the header is shown; a collapsed header hides them with the rest of the row, which is the same one tap that shows the text-size and voice controls.
2. **The hold survives a phone:** the button refuses the context menu, sets `touch-action: none` and no text selection, and no longer treats `pointercancel` as a thumb lifting. Letting go early still sends nothing (`pointerup` and `pointerleave` cancel), and now says "Hold it down for a moment to move the door."
3. **The answer is on screen,** in words beside the button (Wyze's own answer, or the household opener's), not only for a screen reader. The label reads "Hold · Garage" so the hold is not a secret.

## Impact

The garage leaves the row a thumb scrolls. A hold on a phone finishes. A driver reads what happened. Nothing changes on the NAS or in what is sent: the same one `POST /cams/action {mac, action:'garage'}` the Cameras tab sends, the same family key or door grant.

Still true and not changed here: the household-opener road (`/openers/press`) is shipped DISABLED on the NAS by design (DR-0823, `services.json`), so a household opener row presses nothing until it is armed by hand; the Wyze garage goes by the camera road and is live.

`re-review: 2026-10-28` — his hold on the Fold, on the deployed build, with the answer read back; and whether the collapsed header should keep the garage in its slim row.

## Verification

- `garage-in-the-header.test.jsx` (6): the phone long-press sequence finishes the hold and sends one action, the context menu is refused, the answer is not `sr-only`; letting go early sends nothing and says to hold it.
- `the-opener-is-in-the-header.test.js` (30): the tab row mounts neither opener; the shell mounts each once, on one line, right before the bell, and carries no other opener code; both files refuse the context menu, turn touch-action off, and no longer cancel on pointercancel.
- `one-tab-row-carries-the-brand`, `heritage-shell-navigation`, `feature-presence`: green. Lint and the shell's budget: green.
- The live proof is his: hold the button on the phone and read the line beside it.
