# DR-0799 — A live tile stays live: the freeze watch reconnects it, the live-edge keeper pulls it back to now, and a grid tile plays the camera's own SD substream

- **Status:** accepted
- **Tier:** A (the live player's own tending; one more go2rtc stream per Wyze camera, started only while watched; no schema, no road changed)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/cameras.js` (`liveEdge`, `liveEdgeDecision`, `freezeStep`, `tendLiveVideo`, `LIVE_TEND_MS` 2 s, `FREEZE_SECONDS` 6, `LIVE_LAG_SEEK_S` 3, `LIVE_LAG_RATE_S` 1, `LIVE_CATCHUP_RATE` 1.08; `sdOf`, `wantsSd`, `liveStreamId(..., {sd})`; the list carries `sd`), `app/src/components/Cameras.jsx` (`LiveVideo` and `TileLive` tend their element every 2 s and reconnect on a freeze; `sd` and `released` props; the window and the view ask SD for a grid and HD for the one made largest; a hidden tile gives its stream back and re-opens in place), `infra/nas-cameras/cams_forwarder.py` (`sd_source`, `ensure_sd_twins`, `base_of`, `TWIN_SUFFIXES`; the sampler registers `<id>_sd` for every Wyze camera; `/list` hides it and marks the camera `sd: true`; `/streams/health` names a camera's `sd`), `app/src/lib/help-content.js`, selftest 8l, `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** DR-0776 (live in every tile; the link measured), DR-0782 (the live road chosen from what worked), DR-0788 (the full-size window), DR-0796 (one camera largest on a click — its "the others keep streaming" point is superseded here, below), DR-0798 (the stream health log, the twin pattern), DR-0076, DR-0621 (hold the hand of the process)
- **Grounds:** Darrell 2026-10-07, the Firestick window, two cameras whose own clocks read 17:08:31 and 17:08:3x and did not move: *"Cameras in the window don't stay live... the seconds timers show they are not live.... why?!!!!! Fix it!!!!!!"*

## Context

SHOULD: a live tile shows now — its picture moves, and what it shows trails the camera by the road's delay and no more; a tile that stops comes back by itself (DR-0776). ARE, measured against `Cameras.jsx` as it was:

1. **A silent freeze was never noticed.** `LiveVideo` and `TileLive` reconnected only on the element's `ended` or `error` events. A progressive MP4 element whose bytes stopped arriving (a slow link, a stalled connection the server never closed) or whose decoder fell behind simply held its last frame — `paused` false, no event — for ever. That is exactly the photo: two clocks stopped at 17:08:3x.
2. **A stall left the tile behind for good.** When an element stalls and resumes it plays on from where it stopped, so it trails the live edge by the length of the stall, and by more after each one; nothing moved it back to the edge of what had arrived.
3. **The window played every camera in HD.** A Wyze camera's HD stream is 1080p; two or more of them through the Funnel (out of the house and back, bounded by the home upload) on a Firestick is the heavy case for both the link and the decoder. go2rtc's Wyze source has one quality knob, `subtype=sd` (`internal/wyze/README.md`), and nothing used it.
4. **DR-0796's hidden tiles kept decoding** pictures nobody saw; on a Firestick that is decode budget taken from the one picture that is shown.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| what reconnected a tile (before) | `onEnded`, `onError` only | `Cameras.jsx` `LiveVideo`, `TileLive` |
| what kept a tile at the live edge (before) | nothing | the same |
| the freeze watch (after) | a `currentTime` that does not move for 6 s while playing is a freeze; a pause or the end resets it | `freezeStep`, `cameras.test.js` |
| the live edge (after) | the end of `buffered` for MP4, of `seekable` for HLS | `liveEdge`, `cameras.test.js` |
| the decision (after) | lag > 3 s → seek to edge − 0.5 s; lag > 1 s → play at 1.08× until under 1 s; caught up → 1× | `liveEdgeDecision`, `cameras.test.js` |
| the element is written only as decided (after) | seek, then rate 1.08, then rate 1; a paused element is never written and never frozen | `tendLiveVideo`, `cameras.test.js` |
| a frozen window tile (after) | after 4 tends with the same `currentTime` the tile asks a new ticket for its stream and reads "reconnected 1×" | `cameras-render.test.jsx` (DR-0799 case, fake timers) |
| SD for a grid (after) | the all-cameras tiles and both window tiles ask `<id>_sd`; the camera made largest re-opens as `<id>` (HD); put back, `<id>_sd` again | the same case |
| a hidden tile (after) | no `<video>`, "Paused while another camera is the largest.", no ticket; re-opens in its place with one new ticket when shown | the DR-0796 case, updated |
| the SD twin on the NAS (after) | `wyze://…&subtype=sd` (or `subtype=hd` → `sd`, a `#fragment` kept); one PUT per Wyze camera without one; rtsp/ring and existing twins left alone; `/list` hides it and marks `sd: true` | selftest 8l |
| suites | forwarder selftest green; `cameras.test.js` + `cameras-render.test.jsx` green | runs below |

## Decision

1. **Every live tile is tended** every 2 s (`tendLiveVideo`): a picture whose position has not moved for 6 s is a freeze, counted as a stall in the road's record (DR-0782) and reconnected on the same road with a new ticket; a position more than 3 s behind the live edge jumps to it; a smaller lag is run down at 1.08× until it is gone. The element is written only when the decision says so.
2. **A grid tile plays the camera's own SD substream.** The NAS registers `<id>_sd` for every Wyze camera (the camera's own second stream, go2rtc `subtype=sd`); the all-cameras tiles, the view with more than one camera, and the window with more than one tile open the SD twin; the one camera made largest, a single camera, and Big open HD. A camera without a twin plays its own stream as before.
3. **A hidden tile gives its stream back** (supersedes DR-0796's "the others keep streaming"): behind the one made largest it holds no stream and says so; the second click re-opens it in its place on the road the layout asks for. The order and the layout are kept exactly as DR-0796 decided.
4. **The road is not pre-empted (DR-0776 stands):** SD is chosen by the layout (how many pictures are shown), never by a guess about the link; the stream health log (DR-0798) now also records the SD twin's hour, so the next decision — for example a camera whose SD still starves — is made from numbers.

## Verification after merge

- CI: the forwarder selftest and the two camera suites.
- Deploy proof per DR-0107; the NAS picks up the forwarder on services-sync; `cams-diag.yml` then lists the `_sd` twins in `/api/streams`.
- `re-review: 2026-10-10` on the Firestick window with two cameras for ten minutes: the cameras' own clocks keep moving; a tile that freezes reads "reconnected n×" within ten seconds; `/streams/health` shows the `_sd` streams' rate and drops. If a tile still falls behind, the numbers say whether it is the link (rate below the stream) or the decoder (rate fine, freezes anyway).

## Impact

- **Family:** a window that stays live; a frozen picture comes back in seconds and says so; several cameras at once on a Firestick.
- **NAS:** one more stream per Wyze camera, started only while watched; the SD substream is lighter on the camera's uplink, the home upload, and the TV.
