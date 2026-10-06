# DR-0766 — choir-dates finds the yt-dlp the NAS installed, instead of trusting the PATH

**Date:** 2026-10-06
**Status:** accepted
**Area:** NAS riders, the church media road
**Principle:** DR-0076 (measure, do not claim; proven-to-catch), DR-0621 (hold the hand of the process), DR-0723 (the sovereign yt-dlp for the road), DR-0075 (perpetual improvement)

## Context

The hourly in-app lesson intake found two recordings waiting and, while checking
whether the voice road was alive, `voice-intake-health.yml` printed the NAS's own
state. Two riders were failing every cycle, and one of them was failing for a
reason that is not a missing tool at all.

`choir_dates_sync.py` reads a YouTube page's publish timestamp so a choir or
sermon row can carry its real service date. It ran `yt-dlp` by bare name, then
fell back to `python -m yt_dlp`. On the NAS neither is reachable from the PATH
the installer gives the rider, so every cycle ended in
`RuntimeError: yt-dlp not available (pip install yt-dlp)` and the service was
reported DEGRADED. The message is honest about what the code saw and completely
misleading about what is true on the box: yt-dlp is installed, current, and
answering.

## What was measured

All of this is printed verbatim by the `voice-intake-health` run of
2026-10-06 21:30 UTC (run `37534349663`), read from the NAS, not from a runner:

- **The binary is there and works.** `installed recipe: v1 yt-dlp_linux 2026.08.19`;
  `/volume1/PoeTech/yt-dlp/yt-dlp --version -> exit 0: 2026.08.19`.
- **It reads the pages the rider needs.** The same binary, called with the
  rider's own arguments, dated two real videos in that run:
  `[default args] exit 0, stdout: B6aZq8dPRT0 1790524749` and
  `7GWOQdhced4 exit 0, stdout: 7GWOQdhced4 1791129451`.
- **The rider cannot find it.** Called in a cron-like environment with the PATH
  the installer sets, `PATH=".../church-media-golive/state:/usr/bin:/bin"`, the
  rider's exact call raised
  `rider-context raised: FileNotFoundError [Errno 2] No such file or directory: 'yt-dlp'`.
- **Why.** The only yt-dlp on that PATH would be the per-service copy, and the
  probe says `.../church-media-golive/state/yt-dlp absent`. The installed binary
  lives at `/volume1/PoeTech/yt-dlp/yt-dlp`, which is not on that PATH.
- **How long.** `choir-dates` last did real work on 2026-10-01
  (`{"processed": 2, "note": "committed; chunk 2"}`) and last drained clean on
  2026-10-02. Every `services-sync` cycle since has carried
  `choir-dates DEGRADED — yt-dlp not available (pip install yt-dlp)`.
- **What it costs.** `undated rows: 1` at the time of the read. Small today, and
  it grows by one per service that is posted while the rider is blind.

## Impact

- **A rider that was dead for four days does its work again**, without anything
  being installed, without a key, and without Darrell touching the NAS. The tool
  was already on the disk; only the lookup was wrong.
- **The error message stops lying.** "not available (pip install yt-dlp)" sent
  the reader toward installing something that was already installed and current.
  After this change that message means what it says: no yt-dlp could be started
  from any known location.
- **The same lookup is reusable.** `ytdlp_commands()` resolves the installed
  binary, honours `YTDLP_BIN` and `YTDLP_HOME`, and leaves out a path that is
  not an executable file, so a half-finished install reports a clean
  "not available" rather than an exec error.
- **Nothing else changes.** No scheduling, no new service, no second call to
  YouTube, no behaviour change on a box that does have yt-dlp on its PATH. This
  is one rider finding a file.

**Not fixed here, and named rather than buried:** the same health run shows
`transcript-trickle` in STALL — `754/874 videos transcribed (120 still owe a
transcript)`, `0 videos advanced while gaps remain`. That is a different rider
with a different cause, and guessing at it in this change would widen the work
past what was measured. **re-review: 2026-10-13.**

## Decision

- `choir_dates_sync.py` resolves its yt-dlp from a candidate list rather than
  trusting the PATH: `YTDLP_BIN` if set, then `$YTDLP_HOME/yt-dlp` (default
  `/volume1/PoeTech/yt-dlp`, which is what both installers write), then the
  per-service `state/yt-dlp`, then the bare name, then `python -m yt_dlp`.
- A candidate that is not an existing executable file is dropped before the
  call, so the two failures DR-0723 separates stay separate: "not available"
  still means nothing could be started, and "ran but printed nothing" still
  carries the tool's own last words.
- The bare name stays in the list. A box that has yt-dlp on its PATH, and a
  person running this by hand, behave exactly as before.
- `transcript-trickle` is left alone and carries its own dated re-review above.

## Verification

- `python3 choir_dates_sync.py --selftest` **17/17 PASS**, which is the gate
  `ci.yml` runs; four of those checks are new — the installed binary is tried
  before the bare name, a path that is not there is left out rather than
  executed, a path that is not executable is left out, and the bare name is
  still a candidate.
- **Proven to catch (DR-0076 §3), demonstrated rather than claimed:** with the
  candidate list put back to the bare name alone, the selftest fails with
  `FAIL - the installed binary is tried before the bare name`. That is the exact
  condition that produced the NAS's `FileNotFoundError`, so the check stands on
  the real failure and not on a hypothetical.
- Not verified from here, and it cannot be: that the next `services-sync` cycle
  on the NAS reports `choir-dates` healthy. This sandbox has no route to the NAS
  except through the workflows, the change reaches the NAS by the services-sync
  manifest, and the proof is one `voice-intake-health` run after the merge.
  **re-review: 2026-10-07** — dispatch it and read the choir-dates line.
