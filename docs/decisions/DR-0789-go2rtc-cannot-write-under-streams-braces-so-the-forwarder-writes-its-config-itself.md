# DR-0789 — go2rtc cannot add a stream under `streams: {}`, so the forwarder keeps the refusal and writes go2rtc.yaml itself

- **Status:** accepted
- **Tier:** A (the DR-0787 self-heal completed: the same streams, the same file; a direct write only when go2rtc refuses)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`persist_missing_streams` keeps go2rtc's refusal and falls back to `write_streams_block` + `write_config_atomically`; `yaml_quote`; `PERSIST_LAST` in `/health` as `config_persist`; selftest 8j extended with a refusing fake and a real temp file)
- **Principles:** DR-0076 (the refusal is measured, never swallowed; proven to catch), DR-0787 (what memory holds, the config must hold), DR-0779, DR-0621 (a flag is where the work starts)
- **Grounds:** cams-diag run 37643024375 (2026-10-07 15:20 UTC), the DR-0787 verification: the new forwarder (sha `7c1b904c`, running = on disk) started 10:16:02 CDT and its first self-heal said *"31 stream(s) lived in go2rtc's memory only; wrote 0 of them to its config (DR-0787)"*; the config SHAPE still read `streams defined: 0`. Every PUT failed and nothing said why.

## Context

SHOULD (DR-0787): the self-heal PUTs each stream memory holds and the file lacks; `PUT /api/streams` writes the config. ARE: all 31 PUTs failed on the real box, and the code swallowed the error. Read in go2rtc 1.9.14's source (`internal/streams/api.go`, `internal/app/config.go`, `pkg/yaml/yaml.go`): PUT calls `app.PatchConfig([]string{"streams", name}, src)`, which runs a TEXT patcher that inserts the new child on the line after the key; under the seed's `streams: {}` — a flow mapping on one line — the inserted `  name: src` is not valid YAML, the patch's own validation fails, and PUT answers 400. That is why the file has said `streams: {}` through every re-add, every sign-in and every self-heal since the service was born: no API write could ever land. GAPS: the refusal was invisible; the file was unreachable through the API. CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| the forwarder on the box | `"forwarder": "7c1b904c93796e89", "on_disk": "7c1b904c93796e89"`, started 10:16:02 CDT | cams-diag run 37643024375, `/health`, journal |
| the self-heal's first pass | `31 stream(s) lived in go2rtc's memory only; wrote 0` | the forwarder journal, 10:16:23 CDT |
| the config | `streams defined: 0`, `wyze block present: True`, top-level keys api/rtsp/webrtc/log/streams/wyze | SHAPE section |
| the seed | `streams: {}` | `infra/nas-cameras/go2rtc.seed.yaml` |
| go2rtc's PUT | `New(name, src)` then `PatchConfig(["streams", name], src)`; any error → HTTP 400; `PatchConfig` = `yaml.Patch` (text insertion after the key's line) + validation + `WriteFile` | go2rtc v1.9.14 source, read 2026-10-07 |
| the mount | `/volume1/docker/go2rtc:/config:rw` — a directory; the host-side forwarder can read and write the same file | `docker-compose.yml:44`, `GO2RTC_YAML_PATH` |

## Decision

1. **The refusal is kept.** Each failed PUT's status and (scrubbed) body is recorded once per pass; the journal line says *"go2rtc wrote N of them … (it refused: HTTP 400 yaml: …)"*, and `/health` carries `config_persist: {at, missing, wrote, direct, refused}`. The next cams-diag reads the cause, not a count.
2. **When go2rtc will not write its file, the forwarder does.** For the streams go2rtc refused, the forwarder reads go2rtc.yaml on the host, adds `  name: "url"` lines under the top-level `streams:` key — turning a `streams: {}` line into the block form, every other byte untouched, ids restricted to safe slugs, urls double-quoted — and writes the file whole, then renames it into place. go2rtc already holds the streams in memory; the file is for its next start. A file with no `streams:` key is never guessed at; a stream already defined is never written twice.
3. **The seed stays `streams: {}` for now.** Changing a live config's shape by hand is a Tier-B edit of the one file the cameras start from; with (2) in place the forwarder converts it to the block form the first time it writes, which is the same outcome with the streams present rather than a bare key. re-review below.

Proven to catch (selftest 8j, in CI): the block writer on the real seed text (nothing to add → byte-identical; no `streams:` key → `None`; `{}` → block with each url double-quoted, an unsafe id skipped, the `wyze:` block untouched; an already-defined stream not written twice); a fake go2rtc that answers 400 the way the real one does, with a real temp go2rtc.yaml: all three PUTs refused, the three written directly, the file's head and tail byte for byte, `/health`'s record carrying `HTTP 400 …` and `direct: 3`, no temp file left; and when go2rtc accepts, nothing is written directly.

## Verification after merge

- nas-clock `also_run_once` then cams-diag: `/health config_persist` shows `refused: "HTTP 400 …"` and `direct: 31` (or the live count); the SHAPE section reads `streams defined: 31`; a second pass reads `missing: 0`.
- re-review 2026-10-14: a planned container recreate (the 07:31 scenario, on purpose) comes back with every camera from the file; then decide whether the seed moves to the block form for new installs (DR-0789 §3).

## Impact

Unresolved: every API write to go2rtc's config has failed since the first day, silently, so the box has always been one restart away from zero cameras. Resolved: the refusal is on record, and the file is written by the process that can write it.
