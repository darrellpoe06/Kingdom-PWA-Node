# DR-0782 — The live road is chosen from what worked on this device

- **Status:** accepted
- **Tier:** A (app behaviour; a per-device preference and a per-device record; no NAS change)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/cameras.js` (`LIVE_ROADS`, `loadLiveRoad` / `saveLiveRoad`, `loadRoadStats` / `recordRoadResult` / `roadScore`, `chooseLiveRoad`, `roadLine`), `app/src/components/Cameras.jsx` (`LiveVideo` road chooser and record, `TileLive`), tests
- **Principles:** DR-0076 (measured, not asserted), DR-0774 / DR-0776 (sight; the device's own `<video>` is the judge), DR-0075 (perpetual improvement: a road that fails loses its place)
- **Grounds:** Darrell 2026-10-07: *"All options... HLS... rss feeds... ip addresses etc.... what works consistently... or a mixture so we can choose what seems to be the best option at that time?"*

## Context

A browser has two live roads from the restreamer: progressive MP4 and HLS. RTSP and a camera's own address are roads for apps like tinyCam, not for a browser; frames every five seconds are the third road that always works. The rule so far picked one road by engine family and never learned from the result on the device in front of the person.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| Samsung Internet on HLS | views ended at 6 s and 28 s with no NAS reason | DR-0776 |
| the same device on MP4 | ran | DR-0776 |
| the old build on Darrell's tablet today | HLS chosen, "Live view ended after 14 s" | screenshot (the old code; see DR-0781) |

## Impact

Unresolved: one rule for every device, and a device on which that rule is wrong fails the same way every time. Resolved: the device keeps a record per road (tries, opened, first picture, stalls), Auto picks the better record and swaps a road that failed to open on the next reconnect, and the person can pin MP4 or HLS; the record is shown under the player in plain words.

## Decision

Auto is the default. With nothing measured it is the engine rule (MP4 everywhere but Apple). Each open writes the road's record; a road that failed to open is avoided on the reconnect; the other road must be clearly better on the record to displace the default. A pinned road is itself. Frames remain the fallback the tiles already use.

## Verification

- `cameras.test.js`: the preference remembered and junk read as Auto; a pin is itself; Auto with nothing measured is the device default; the record written per road and read by Auto (a road failing three times loses to one that opened); the failed road swapped on reconnect; a good default keeps its place. `cameras-render.test.jsx`: the live view shows "Auto chose MP4".
- On Darrell's tablet after DR-0781 delivers the build: the live view header shows the chooser and the measured lines.

## Follow-ups

- WebRTC from go2rtc as a third browser road once the LAN-direct HTTPS road exists (it needs a direct path, not the Funnel). `re-review: 2026-10-21`.
