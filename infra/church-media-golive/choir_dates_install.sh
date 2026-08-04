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
# State lives OUTSIDE the repo tree (proven run 30938520538: the bootstrap's
# auto-stash swept the in-repo state/ — wrapper, attempts, marker — on every
# mirror freshen, so each bootstrap amnesia'd the drainer; DR-0272/REV-0230).
# /volume1/PoeTech/state is the fleet's standing state ground (cron log lives
# there too). One-time migrate: adopt any surviving in-repo state, then leave
# the old dir behind for the stash to keep.
STATE="${POETECH_STATE:-/volume1/PoeTech/state}/church-media"
OLD_STATE="$DIR/state"
mkdir -p "$STATE"
for f in choir-dates.DONE choir-dates.attempts.json yt-dlp; do
  [ -e "$OLD_STATE/$f" ] && [ ! -e "$STATE/$f" ] && cp -p "$OLD_STATE/$f" "$STATE/$f" || true
done

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
if ! python3 -c "import yt_dlp" 2>/dev/null && [ ! -x "$YTDLP" ]; then
  echo "choir-dates: writing docker-backed yt-dlp wrapper (one-time)"
  cat > "$YTDLP" <<'WRAPEOF'
#!/bin/sh
exec docker run --rm python:3.12-slim sh -c 'pip install --quiet yt-dlp >/dev/null 2>&1 && exec yt-dlp "$@"' ytdlp "$@"
WRAPEOF
  chmod +x "$YTDLP"
  "$YTDLP" --version || {
    rm -f "$YTDLP"
    echo "choir-dates: docker-backed yt-dlp failed its --version check (output above)" >&2
    exit 1
  }
fi
PATH="$STATE:$PATH"; export PATH

python3 "$DIR/choir_dates_sync.py" --commit --chunk 90 --time-budget 300 \
  --done-marker "$STATE/choir-dates.DONE"
