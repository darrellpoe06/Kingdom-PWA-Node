# DR-0803 — The wall says why in one line, instead of twenty-seven presses

- **Status:** accepted
- **Tier:** A (one line added over the camera wall from reasons the tiles already hold; no network, no camera, no tile changed)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/cameras.js` (`FAULT_LABELS`, `groupCameraFaults`, `faultSummaryLine`), `app/src/components/Cameras.jsx` (the line above the grouped sections), test `the-wall-says-why-in-one-line.test.js`
- **Principles:** P15 / DR-0381 (a surface is never blank and never makes a person count), DR-0774 (why a tile is blank), DR-0076
- **Grounds:** Darrell 2026-10-07, at full volume: *"Non of the 805 cameras work!!!!!!!! Why?!!!!!!!!"*

## Context

SHOULD: when the cameras are down, the app says why, plainly, where the person is looking. ARE: every tile already carries a **Why?** button, and `classifySnapError` / `humanizeCameraError` already turn go2rtc's log line into plain words — including the two faults that were actually live that night. GAPS: the reasons existed one tile at a time and nothing added them up. With 31 streams and 27 down for exactly two causes, learning what was wrong meant pressing Why? twenty-seven times. A person who opens the wall and sees grey squares writes what he wrote. CLOSE: below.

**A correction for the record.** Earlier the same evening I told Darrell the tiles "go blank instead of saying any of this." That was wrong, and I had not read the component when I said it: the Why? button and the plain-words path were already there (`Cameras.jsx:1422`, `cameras.js:408-437`). The real gap was the summing up, which is what this record builds.

## What was measured

Measured on the NAS, `cams-diag` run 37694253134, 2026-10-07 22:09 UTC:

| what | measured | basis |
| --- | --- | --- |
| streams defined | 31 | go2rtc `go2rtc.yaml`, `streams defined: 31` |
| producing media | 4 (`back_yard_north`, `back_yard_south`, `basketball_cam`, `front_door_view`, 3 tracks each) | `/api/streams` |
| the ten `805_*` cameras | addressed on `10.0.0.2/.5/.39/.151/.170/.171/.180/.183/.225/.57` | `/api/streams`, host column |
| the NAS's own networks | `192.168.1.26/24` (eth0), `169.254.x` link-local, `10.8.0.1` tun, docker bridges | `ip addr` on the NAS |
| what go2rtc logged for them | `streams: wyze: connect failed: discovery timeout`, repeatedly | `/api/log` |
| what it logged for the rest | `streams: wyze: only DTLS cameras are supported` | `/api/log` |
| presses needed to learn this before | 27 | one Why? per down tile |
| presses needed now | 0 | the line is on the wall |

**Honest uncertainty.** There is no route from the NAS to `10.0.0.0/24`, so those ten cannot be reached from where the restreamer sits; whether the existing `tun0` peer could carry that subnet is untested and is a network change, not an app change. The DTLS refusal is go2rtc 1.9.14's Wyze source rejecting those models; whether a firmware update or a different bridge fixes it is likewise untested. This record makes the state legible; it does not fix either cause.

## Impact

Unresolved: the wall showed grey squares and made the person interrogate it one camera at a time, so "none of them work" was the only summary available — and it was nearly right, which is worse. Resolved: the wall states how many are showing a picture and how many are down for each cause, in the words that name the fix, biggest cause first, with the per-tile Why? still there for the one camera a person cares about.

## Decision

1. **The wall adds up what the tiles already know.** `groupCameraFaults(cameras, frames)` runs each tile's own error text through the same `humanizeCameraError` the tile uses and counts by cause. One source of truth, no second opinion.
2. **The label names the fix, not the log.** "on a network the NAS cannot reach", "firmware has no DTLS yet", "the camera refused the sign-in" — never "discovery timeout".
3. **It never over-claims.** A camera with no frame record yet is `waiting`, neither live nor down. Nothing down means no line at all.
4. **Biggest cause first**, and the sentence reads as a list when there are three or more.

Proven to catch (DR-0076): the real night is the fixture — 31 cameras, 4 live, 17 firmware, 10 other-network — and the gate pins the exact sentence it produces; the two real log lines are told apart rather than lumped as unknown; a label that leaked a log word would fail; every kind `humanizeCameraError` can return has a label, and an unrecognised error still lands somewhere readable; a camera not yet asked is counted as waiting; nothing handed in at all returns zeroes and says nothing.

## Verification

- `the-wall-says-why-in-one-line.test.js` 7 green, against the measured shape of that night; the camera suites and `ui-standards-set` green on this head.
- On the live wall after deploy: open Cameras and read the line before touching anything; it should say 4 of 31 until the network or the firmware changes.
- re-review 2026-10-21 with the two real causes: whether a route to `10.0.0.0/24` over the existing tunnel brings the 805 group back, and whether a bridge other than go2rtc's wyze source answers the DTLS refusal.
