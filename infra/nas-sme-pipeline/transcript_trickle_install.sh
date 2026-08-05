#!/bin/sh
# transcript_trickle_install -- the transcript backfill riding the ALREADY-ARMED
# services-sync clock (the choir-dates / funnel-watchdog pattern: zero new DSM
# entries, no human hands). Born from the 2026-08-05 harvest review: the corpus
# sat at 81/858 transcribed for a month because the loader was parked on a
# manual app button (DR-0247 waiting-by-default) while the CI path is
# IP-blocked by YouTube (run #5, 2026-07-11) -- the NAS's residential IP is the
# working source.
#
# Idempotent per cycle: no-ops unless TRANSCRIPTS_TRICKLE_GAP_SECONDS (default
# 3h) has passed since the last fire, so the 15-min services-sync cadence
# becomes ~8 gentle fires/day x 4 videos = ~32/day -- small sips with short
# sleeps, well under the ~50-in-a-burst block YouTube applied 2026-07-03, and
# each fire finishes far inside services-sync's 480s per-installer timeout.
# ~770 transcript gaps drain in about 3-4 weeks, then it keeps pace with the
# channel's ~2-3 uploads/week forever.
#
# Brakes: services-sync's runner owns lock/timeout/cap; the loader adds its own
# --max budget, single-flight lock, and auto-pause after 3 consecutive
# all-blocked runs. The pause is honored HERE as a quiet no-op (exit 0) so a
# paused loader does not red every 15-min cycle -- the app's resume-transcripts
# ops job clears it, and the Harvest Ledger's transcribed count is the live
# witness either way. An all-blocked run exits 3 and reds the cycle loudly
# (ntfy) -- that is the alarm working, never a silent stall (DR-0076).
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
OUT="$REPO/infra/nas-sme-pipeline/out"
STAMP="$OUT/.transcript-trickle.last"
PAUSE="$OUT/.transcripts-paused"
GAP="${TRANSCRIPTS_TRICKLE_GAP_SECONDS:-10800}"

mkdir -p "$OUT"

if [ -f "$PAUSE" ]; then
  echo "transcript-trickle: paused ($PAUSE exists after repeated all-blocked runs) - no-op; clear it via the app's resume-transcripts job"
  exit 0
fi

now=$(date +%s)
last=0
if [ -f "$STAMP" ]; then
  last=$(cat "$STAMP" 2>/dev/null || echo 0)
fi
case "$last" in
  ''|*[!0-9]*) last=0 ;;
esac
if [ $((now - last)) -lt "$GAP" ]; then
  echo "transcript-trickle: fired $((now - last))s ago (< ${GAP}s gap) - no-op this cycle"
  exit 0
fi

echo "$now" > "$STAMP"
exec python3 "$REPO/infra/nas-sme-pipeline/load-transcripts.py" \
  --slug "${TRANSCRIPTS_SLUG:-colg}" \
  --max "${TRANSCRIPTS_MAX:-4}" \
  --sleep-min "${TRANSCRIPTS_SLEEP_MIN:-5}" \
  --sleep-max "${TRANSCRIPTS_SLEEP_MAX:-15}"
