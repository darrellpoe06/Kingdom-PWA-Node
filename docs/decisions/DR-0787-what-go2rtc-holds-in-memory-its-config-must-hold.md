# DR-0787 — What go2rtc holds in memory, its config must hold: the self-heal writes the streams the file lacks

- **Status:** accepted
- **Tier:** A (one more pass in an existing NAS self-heal; idempotent PUTs of what go2rtc already runs; no new route, no new secret)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`config_stream_names`, `persist_missing_streams`, `self_heal_once` writes what memory holds and the config lacks; selftest 8j; the fake go2rtc answers `/api/config`)
- **Principles:** DR-0076 (measured on the box, proven to catch), DR-0779 (every camera is written to go2rtc's config), DR-0219 (SHOULD / ARE / GAPS / CLOSE), DR-0621 (hold the hand of the process: a flag is where the work starts)
- **Grounds:** the DR-0779 verification itself. cams-diag run 37639442649 (2026-10-07 14:46 UTC, after #1993 merged and the NAS pulled the new forwarder, sha `729f3319` running and on disk): `/health` said `"streams": 31, "wyze_cloud": "ready"`, and the config SHAPE said `streams defined: 0`, `wyze block present: True`.

## Context

SHOULD (DR-0779): every camera go2rtc runs is written to `go2rtc.yaml`, so a container recreate brings them back. ARE: the DR-0779 fix PUTs every camera during a sign-in or a re-add — but nothing ran a sign-in after it deployed. The 31 cameras lived in go2rtc's memory from a `/api/wyze` listing made BEFORE the fix, the file still said `streams: {}`, and the self-heal re-adds only when memory is EMPTY. GAPS: a box whose memory is full and whose file is empty is exactly the 07:31 CDT state one restart away, and no path led out of it except a human pressing "Add my cameras again". CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| forwarder code on the box | `"forwarder": "729f3319a4fb14aa", "on_disk": "729f3319a4fb14aa"` — the DR-0779 build, restarted 09:46:05 CDT by services-sync | cams-diag run 37639442649, `/health`, forwarder journal |
| streams in memory | 31 | `/health` |
| streams the config defines | 0 (`top-level keys: ['api','rtsp','webrtc','log','streams','wyze']`, `wyze block present: True`) | the SHAPE section of the same run |
| the self-heal's condition | re-add only when `len(parsed) == 0` | `cams_forwarder.py` `self_heal_once` before this record |
| one camera's live road | `front_door_view` frame HTTP 200 in 4.6 s; `/why` probe 200 in 5.3 s | the same run |

## Decision

Every self-heal tick (20 s after start, then every 10 minutes) that finds streams in memory now also reads go2rtc's own config through `GET /api/config`, lists the ids the file defines (`config_stream_names`: the keys under the top-level `streams:` block; `streams: {}` defines none), and PUTs each stream memory holds that the file lacks, with the source url go2rtc itself reports for it (`persist_missing_streams`). `PUT /api/streams` writes the config (`app.PatchConfig`) and is idempotent; the urls never leave the process. A stream with no producer url is skipped; a go2rtc without `/api/config` is left alone, never guessed at. `self_heal_once` answers `wrote-N` when it wrote, `has-streams` otherwise, so the journal says what happened.

Proven to catch (selftest 8j, run in CI): the yaml shape parser on `streams: {}` and on quoted and unquoted keys with a comment; memory 4 / config 0 → exactly the three streams with a url are PUT with go2rtc's exact url and the answer is `wrote-3`; a config that defines them all → `has-streams` and no PUT; no `/api/config` → `has-streams` and no PUT. The DR-0779 checks (8b, 8g) still hold.

## Verification after merge

- nas-clock `also_run_once` after the merge, then cams-diag: the SHAPE section reads `streams defined: 31` (or the live count) and the forwarder journal carries one `self-heal: … wrote N of them to its config (DR-0787)` line, once.
- re-review 2026-10-14: a second cams-diag shows the count holding with no further `wrote` lines, and a planned container recreate (the 07:31 scenario, on purpose) comes back with every camera.

## Impact

Unresolved: the box sat one restart away from zero cameras with every safeguard green. Resolved: within 20 s of the forwarder starting, and every 10 minutes after, the config is made to hold what memory holds, with no sign-in and no cloud call.
