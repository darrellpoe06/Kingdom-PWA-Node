# DR-0798 — The stream health log: every camera's last hour from go2rtc's own numbers, and the H.264 twin a device without an H.265 decoder plays

- **Status:** accepted
- **Tier:** A (a read-only sampler of go2rtc's own API every 15 s; one on-demand transcode stream per H.265-only camera, started by go2rtc only while watched; the app reads a new bearer route)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`StreamHealth` — observe / camera / summary / snapshot; `codecs_of`, `producer_bytes`; `ensure_h264_twins`, `write_stream_entry`; `sample_streams_once`, `start_stream_sampler`; `GET /streams/health` (bearer or grant); `/list` hides a twin and marks its base `h264: true`; `/health` carries `stream_health`; a `stream-health.json` beside go2rtc.yaml), `.github/workflows/cams-diag.yml` (prints the file), `app/src/lib/cameras.js` (`fetchStreamHealth`, `deviceCanPlayHevc`, `liveStreamId`, `twinOf`, `streamHealthLine`, `dropKindText`, `dropLines`), `app/src/components/Cameras.jsx` (`useStreamHealth` every 15 s; the health line under every tile; Why? on a camera that dropped; the Why panel's last hour and drops; `LiveVideo` / `TileLive` open the twin where the device cannot decode H.265), `infra/nas-cameras/README.md`, selftest 8l, `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** DR-0076 (measure, don't claim), DR-0774 (why a tile is blank, from go2rtc's own mouth), DR-0776 (the link measured, not pre-empted), DR-0782 (the live road chosen from what worked), DR-0787 / DR-0789 (what memory holds the config holds; the forwarder writes when go2rtc refuses), DR-0108 (review our ways)
- **Grounds:** Darrell 2026-10-07: *"Are there some type of logs we can use to make the cameras stream more continuous? If so, based on the information cameras provided can we make sure we optimize the videos streams of their camera streams?"*

## Context

SHOULD: when a camera's picture stutters or drops, the NAS can say so with numbers — how fast the camera was sending, how often its connection fell while someone watched, what codecs it sends — and the one decision those facts make (an H.264 stream for a device that cannot decode H.265) is made by the system, not by a person. ARE, before this: three records existed and none was a log over time. The device kept per-road outcomes (first picture, stalls, failures; DR-0782). `GET /why/<id>` asked go2rtc once about one camera (DR-0774). `cams-diag.yml` dumped `/api/streams` and `/api/log` when dispatched. go2rtc itself exposes, per stream, each producer's `bytes_recv`, whether it is connected, its `medias` (codecs as "video, recvonly, H264 …") and the consumers watching (`pkg/core/connection.go`, `media.go`, read from the v1.9.14 source) — nobody wrote it down over time, and codec information decided nothing. The Wyze source documents `subtype=hd|sd` as its only quality knob (`internal/wyze/README.md`); "optimize" therefore means: measure first, and use the one fact that decides a road today.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| go2rtc's fields | producers carry `bytes_recv`, `medias` (strings), consumers a list | `pkg/core/connection.go`, `media.go` at v1.9.14 |
| a rate | 2000 bytes in 15 s → 1 kbit/s (`int(round(delta*8/dt/1000))`) | selftest 8l |
| a drop | bytes frozen while watched; a producer gone while watched; a producer whose count fell back while watched (restart) — three kinds, counted only while someone watched | selftest 8l |
| not a drop | a producer let go while nobody watched (go2rtc's idle); moving bytes with no watcher | selftest 8l |
| up% | healthy watched samples over watched samples: 100 → 50 → 60 through the scenario | selftest 8l |
| the hour | samples and drops older than 3600 s age out | selftest 8l |
| codecs | "video, recvonly, H264 High 4.1, H265" → H264+H265; "HEVC" reads as H265; H265 without H264 → `hevc_only` | selftest 8l |
| the twin | `PUT /api/streams?name=<id>_h264&src=ffmpeg:<id>#video=h264`; not added twice; when go2rtc refuses (the `streams: {}` case) it is written into the config directly, quoted, every other line kept | selftest 8l |
| the routes | `/streams/health` 401 without the bearer, 200 with the log and events; `/list` hides the twin and marks the base `h264: true`; `/health` carries `stream_health` | selftest 8l |
| the file | one sample writes `stream-health.json` with the cameras (twins folded into their base) | selftest 8l |
| the device | H.265 is asked of `<video>.canPlayType("video/mp4; codecs=\"hvc1…\"")`, never a UA sniff; a camera with a twin plays the twin only where that answer is empty | `cameras.test.js` |
| suites | forwarder selftest green; `cameras.test.js` + `cameras-render.test.jsx` green | runs below |

## Decision

1. **The NAS keeps a stream health log.** Every `CAMS_STREAM_SAMPLE_SECONDS` (15) the forwarder reads `GET /api/streams` and keeps, per camera, the last hour: kbit/s while watched (now and average), up%, every drop while watched (producer-gone, bytes-frozen, producer-restarted), the codecs, when it was last seen. `GET /streams/health` serves it (the owner all cameras, a grant its own); `/health` carries a summary; `stream-health.json` beside go2rtc.yaml is printed by cams-diag.
2. **A drop is only a drop while someone watched.** go2rtc releases an unwatched producer on purpose; counting that would be noise. The rule is in the sampler, proven by the selftest.
3. **The one optimization the data decides today:** a camera that sends only H.265 gets `<id>_h264: ffmpeg:<id>#video=h264` in go2rtc (its own ffmpeg, running only while that twin is watched), added by PUT or written into the config when go2rtc refuses (DR-0789). The twin is hidden from the camera list; its base says `h264: true`. On the device, `LiveVideo` and `TileLive` ask the `<video>` whether it decodes H.265 and open the twin only when it does not. (`CAMS_H264_TWINS=0` turns the twin off.)
4. **The app shows the log where the camera is.** A line under every tile (rate, codecs, up%, drops); Why? appears on a camera that dropped; the Why panel adds the last hour and the drops in words with their times.
5. **Not decided yet, on purpose (re-review below):** turning the health numbers into automatic road or quality changes (for Wyze, `subtype=sd` when a camera's rate starves the link). That needs the measured hour first; the log now exists to decide it from.

## Verification after merge

- Forwarder selftest and the camera suites in CI.
- Deploy proof per DR-0107; the NAS picks up the forwarder on its services-sync cycle; then dispatch `cams-diag.yml` and read `stream-health.json`: which cameras dropped, how often, their codecs — and whether any `_h264` twin was added.
- `re-review: 2026-10-14`: with a week of the log, decide the next optimization from the numbers (Wyze `subtype=sd` for a starving camera; a lower-rate road for the Firestick), as a new DR.

## Impact

- **Family:** a tile that says how its camera is doing, and a Why? that names the drops with times; a camera that sends only H.265 plays on a device that cannot decode it.
- **NAS:** one `GET /api/streams` every 15 s; a twin's ffmpeg runs only while watched; the log is in memory plus one small file.
