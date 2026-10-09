# DR-0779 — go2rtc kept the cameras only in memory; every camera is written to its config

- **Status:** accepted
- **Tier:** A (one behaviour change in the forwarder's Wyze registration; proven by selftest; the self-heal of DR-0777 already covered the symptom)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`_setup_wyze`: every listed camera is `PUT /api/streams`, the one already in memory too; `persisted` in the answer; selftests 8b, 8g)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: the diag read the file's shape, not a guess), DR-0219 (SHOULD / ARE / GAPS / CLOSE), DR-0777 (the self-heal is the cover; this is the cause), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621: the flag is where the work starts)
- **Grounds:** Darrell 2026-10-07, screenshot: "NAS restreamer up · go2rtc 1.9.14 · 0 streams" after a container recreate; *"I better not need to resign in!"*

## Context

DR-0777 recorded the 07:31 CDT loss and said what emptied go2rtc's config was not yet known, with the self-heal as cover and a cams-diag change to read the config's shape. The next diag answered.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| go2rtc.yaml after the self-heal re-added 31 cameras | `streams: {}`, `streams defined: 0`, `wyze block present: True`, 29 lines, mtime 08:01 CDT | cams-diag run 37625766143 (config shape, never a value) |
| go2rtc's stream list at the same moment | 31 streams | the same run |
| the forwarder's own log | `self-heal: go2rtc had no streams; re-added 0 camera(s) from the kept Wyze sign-in` | the same run, forwarder journal 08:01:30 |
| what writes the config | `PUT /api/streams` and `POST /api/wyze` both call `app.PatchConfig`; `POST /api/wyze` ALSO registers the listed cameras in memory as it answers | go2rtc v1.9.14 `internal/streams/api.go`, `internal/wyze/wyze.go` (read) |

So: the sign-in went to go2rtc, go2rtc listed the cameras and put them in memory, the forwarder read its stream list, saw every camera "existing", skipped the one call that writes the file, and reported them added. The file held the `wyze:` block (written by `/api/wyze`) and an empty `streams: {}`. Every container restart emptied the cameras; the self-heal brought them back the same memory-only way.

## Impact

Unresolved: the cameras exist only until the next restart, and the self-heal runs every time instead of once. Resolved: the config on disk carries every camera; a restart comes back with 31 streams by itself; the self-heal finds streams and touches nothing.

## Decision

Every camera the Wyze sign-in lists is `PUT /api/streams` whether or not go2rtc already has it in memory. The PUT is idempotent; it is the call that writes the config. The answer carries `persisted` beside `added`; a camera already in memory is reported `existing: true, persisted: true`.

## Verification

- Selftest 8b: both cameras are PUT with their exact source url, the new one and the one already in memory. Selftest 8g: the re-add from the kept sign-in reports `persisted: 2` and the existing camera's PUT is seen by the fake go2rtc.
- After merge: nas-clock `also_run_once`; the self-heal (or one press of Add my cameras again) PUTs all 31; the next cams-diag reads `streams defined: 31` in the config shape. Recorded on the PR when observed.

## Follow-ups

- The seed's `streams: {}` is a flow mapping; go2rtc patched beside it fine (the `wyze:` block landed), and the PUT writes into it. If the next diag shows the count still 0, the seed is rewritten block-style and the live file corrected by the installer. `re-review: 2026-10-08`.
