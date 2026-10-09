# DR-0833 — A live view never stops trying, and never asks a hand for Resume

- **Status:** accepted
- **Tier:** A (the player's own retry; nothing on the NAS changes, nothing is fetched that was not fetched before)
- **Type:** fix
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/cameras.js` (`LIVE_RECONNECT_MAX` removed; `LIVE_RECONNECT_DELAY_MAX_MS`, `reconnectDelayMs`), `app/src/components/Cameras.jsx` (`LiveVideo`, `TileLive`: no `exhausted`, no Resume; the wait shown; the first-frame deadline reconnects; a hidden page waits the long step), `app/src/__tests__/cameras.test.js` (+1), `app/src/__tests__/cameras-render.test.jsx` (two cases rewritten or added).
- **Principles:** DR-0774 (a live view keeps itself alive), DR-0799 (the tile is tended), DR-0808 (every reconnection is its own address), DR-0111 and Drive-Don't-Delegate (a step the app can take is never handed to a person), DR-0076 (the counts below are from the witness and the diag, not the screenshot alone), DR-0100 (the open question is named narrowly).
- **Grounds:** Darrell, 2026-10-09, a photograph of the family TV: four tiles reading *"Stopped after 6 reconnects ... Press Resume to try again."* — *"This should never happen.... you push resume!!!! Why should the user even need to!!!!!!"* and *"And its working in Wyze!!!!!!!!! Fix that!!!!!!!!!!!!! We should have video!!!!!!!!!!!"*

## Context

DR-0774 gave the live view six reconnects 1.5 s apart and then a Resume button. Six tries is nine seconds. A camera that drops for ten seconds, a NAS that restarts, a Firestick that loses Wi-Fi for a moment, all land on a screen nobody is standing next to, and the wall then waits for a hand that is asleep. The TV is exactly where a hand is not.

## What was measured

- The photograph: `basketball cam · reconnected 6×` and `outside 7 · reconnected 6×` stopped on *the browser could not open this stream*; `front door view · reconnected 6×` and `garage front yard · reconnected 6×` stopped on *the picture froze for 6 s*. Two cameras had been showing a picture and froze; two never opened.
- camera-health run 37879234248 (03:26 UTC, every stream probed): 9 of 31 answer a frame. `front_door_view` answered in 2.7 s with 128,572 bytes and `garage_front_yard` in 1.5 s with 54,720 bytes: the two that froze on the TV were streaming again by then, and the tiles had already given up. `basketball_cam` and `outside_7` silent at 5 s.
- cams-diag run 37879231884: go2rtc on `basketball_cam`: *wyze: connect failed: discovery timeout* (the direct road cannot find it on the LAN); the bridge's own listing shows only `great-room` and `kitchen-2` connected; its log at 22:2x CDT reads `IOTC_ER_DEVICE_OFFLINE` for the 805 cameras, Kitchen Cam, Living Room and North East Cam, as in DR-0809's sixth read.
- The player as it was (`Cameras.jsx` 773-779 and 1048-1054 before this change): `n < LIVE_RECONNECT_MAX` or `exhausted: true`; the 20 s first-frame deadline set an error and reconnected nothing.

## Impact

- Unresolved: every camera hiccup longer than nine seconds puts a Resume button on the wall, and the wall is where no one is; the app does what tinyCam never does, which is stop.
- The call obligates: the player keeps trying for as long as the tile is shown. A camera that is truly off is asked again every half minute rather than every second, so the NAS is not hammered for tickets; a page nobody is looking at waits the long step. The open question stays named (below), not papered over.

## Decision

1. **No cap, no Resume.** `LIVE_RECONNECT_MAX` and `exhausted` are gone from both players. A view that ends on its own is always re-armed.
2. **The wait grows only while the camera gives no picture.** `reconnectDelayMs(blankInARow)`: 1.5 s after a picture or one blank try, then 3, 6, 12, 24, then 30 s, the ceiling. A picture resets it. The status reads *Reconnecting in N s (why)...* and the count still shows.
3. **The first-frame deadline reconnects.** No picture after 20 s is a reason to try again, not a sentence to leave on the screen.
4. **A hidden page waits the long step** before looking again, so tickets are not asked for pictures nobody sees; the moment it is shown the next try runs.
5. **The tile tells the tab once**, after three blank tries, so the frames record carries the reason and Why? can show it; the tile itself keeps trying.
6. **Named, not answered here (DR-0100 tier 2):** why the Wyze app shows video from cameras Wyze's own peer service reports `IOTC_ER_DEVICE_OFFLINE` to the bridge, and why go2rtc's direct road cannot discover `basketball_cam`, `outside_7`, `front_cam` and `front_yard` on the LAN tonight. The next record this session takes the NAS side: a direct-road camera that stays undiscoverable is handed to the bridge road, and a camera whose address moved is re-addressed from Wyze's own device list.

## Verification

- `cameras.test.js`: the wait is the first step after a picture or one blank try, doubles while blank, never passes the ceiling, and a non-number reads as the first step.
- `cameras-render.test.jsx`: a view that ends on its own comes back with a new ticket and the count; ten failures in a row each come back by themselves, the wait doubling to the ceiling and staying there, and nothing ever reads Stopped, Gave up or Resume; a view with no picture by the first-frame deadline comes back by itself. The frozen-tile case (DR-0799) still reconnects after 6 s on the short step.
- 143 cases green across the two camera files; eslint clean at zero warnings on the four files.
- `re-review: 2026-10-16`: the stream health log for the four TV cameras, read against this change: how many reconnections per hour each one makes and whether any wait reached the ceiling while the camera answered the witness.
