#!/bin/sh
# choir-dates -- the undated-backlog drainer riding the ALREADY-ARMED
# services-sync clock (DR-0247: agreed work starts itself; DR-0248 brakes:
# budget lives in choir_dates_sync.py's --chunk/--time-budget, the lock and
# outer timeout live in the nas-loops runner above this). Idempotent: a DONE
# marker (written only when the DB shows zero undated rows) makes every later
# cycle a no-op; until then each 15-min cycle dates one bounded chunk from the
# NAS's residential IP, where yt-dlp can read the watch pages CI cannot.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
DIR="$REPO/infra/church-media-golive"
STATE="$DIR/state"
mkdir -p "$STATE"

if [ -f "$STATE/choir-dates.DONE" ]; then
  echo "choir-dates: backlog drained (marker present); no-op"
  exit 0
fi

# Self-sufficient dependency (live cycles 2026-08-04: run 30904945110 proved
# DSM python3 ships without yt_dlp; run 30905809978 proved it ships without
# pip as well). No pip: fetch the standalone yt-dlp release — a self-contained
# zipapp the system python3 runs directly — into state/ once, validated by
# --version so a torn download can never be trusted. Idempotent: later cycles
# hit the -x check (or the import, wherever a site install exists).
# The NAS python is 3.8 and current yt-dlp needs >=3.10 (run 30910212723's
# traceback), so yt-dlp runs inside a python:3.12-slim container instead —
# docker is proven live on this NAS (ollama/ytzero run; this loop runs as
# root). The wrapper below lands on PATH as `yt-dlp`, so choir_dates_sync.py's
# existing lookup finds it unchanged. Fresh extractor every cycle (pip at
# container start, ~20s of the 300s budget); the image itself caches locally.
YTDLP="$STATE/yt-dlp"

# THE WRAPPER IS VERIFIED EVERY CYCLE, NOT ONLY WHEN IT IS CREATED.
#
# Measured 2026-08-11: services-sync died here with choir_dates_sync.py raising
# "yt-dlp not available (pip install yt-dlp)" -- while the wrapper file existed.
# Two faults met:
#
#   1. The guard was `[ ! -x "$YTDLP" ]`, so an EXISTING wrapper skipped the
#      whole block INCLUDING its --version check. A wrapper that worked the day
#      it was written and stopped working later was never re-tested; it simply
#      failed forever, one layer down, inside the python that shells out to it.
#   2. The wrapper called `docker run` bare. nas-health already established that
#      the docker socket denies dpoe's plain shell and needs `sudo -n` on this
#      box (run 30869376840). So the wrapper could be present, executable, and
#      unable to reach docker at all.
#
# Together those produce the exact observed shape: fetch_dates tries `yt-dlp`,
# the wrapper runs, docker is refused, stdout is empty and the status non-zero,
# so the lookup falls through to `python -m yt_dlp` (absent on DSM's 3.8) and
# raises. The health of the tool is now checked on EVERY cycle and the wrapper
# is rewritten when the check fails -- self-repairing rather than silently dead.
ytdlp_ok() { [ -x "$YTDLP" ] && "$YTDLP" --version >/dev/null 2>&1; }

if ! python3 -c "import yt_dlp" 2>/dev/null && ! ytdlp_ok; then
  echo "choir-dates: (re)writing docker-backed yt-dlp wrapper"
  # sudo -n first when the narrow grant covers it, plain docker otherwise. The
  # wrapper picks per invocation so it survives a change in the grant either way.
  cat > "$YTDLP" <<'WRAPEOF'
#!/bin/sh
DOCKER="docker"
if ! docker ps >/dev/null 2>&1 && sudo -n docker ps >/dev/null 2>&1; then DOCKER="sudo -n docker"; fi
exec $DOCKER run --rm python:3.12-slim sh -c 'pip install --quiet yt-dlp >/dev/null 2>&1 && exec yt-dlp "$@"' ytdlp "$@"
WRAPEOF
  chmod +x "$YTDLP"
  if ! ytdlp_ok; then
    rm -f "$YTDLP"
    echo "choir-dates: docker-backed yt-dlp failed its --version check (output above)" >&2
    exit 1
  fi
fi
PATH="$STATE:$PATH"; export PATH

python3 "$DIR/choir_dates_sync.py" --commit --chunk 90 --time-budget 300 \
  --done-marker "$STATE/choir-dates.DONE"
