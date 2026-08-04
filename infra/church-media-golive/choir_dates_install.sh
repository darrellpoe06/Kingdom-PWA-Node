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

# Self-sufficient dependency (first live cycle 2026-08-04, bootstrap run
# 30904945110: "yt-dlp not available" — DSM python3 ships without it, and an
# installer that assumes its own dependency is not an installer). Idempotent:
# the import check passes in one process spawn on every later cycle.
if ! python3 -c "import yt_dlp" 2>/dev/null; then
  echo "choir-dates: installing yt-dlp (one-time, --user)"
  python3 -m pip install --user --quiet yt-dlp || {
    echo "choir-dates: pip install yt-dlp FAILED — cannot drain without it" >&2
    exit 1
  }
fi

python3 "$DIR/choir_dates_sync.py" --commit --chunk 90 --time-budget 300 \
  --done-marker "$STATE/choir-dates.DONE"
