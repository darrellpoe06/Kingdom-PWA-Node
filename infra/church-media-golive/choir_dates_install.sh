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
YTDLP="$STATE/yt-dlp"
if ! python3 -c "import yt_dlp" 2>/dev/null && [ ! -x "$YTDLP" ]; then
  echo "choir-dates: fetching standalone yt-dlp (one-time)"
  curl -fsSL -o "$YTDLP" https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod +x "$YTDLP" && "$YTDLP" --version >/dev/null 2>&1 || {
    rm -f "$YTDLP"
    echo "choir-dates: could not obtain a working yt-dlp (no module, no pip, download failed)" >&2
    exit 1
  }
fi
PATH="$STATE:$PATH"; export PATH

python3 "$DIR/choir_dates_sync.py" --commit --chunk 90 --time-budget 300 \
  --done-marker "$STATE/choir-dates.DONE"
