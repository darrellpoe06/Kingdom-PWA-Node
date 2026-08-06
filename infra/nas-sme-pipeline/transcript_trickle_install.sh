#!/bin/sh
# transcript-trickle -- the transcript backfill riding the ALREADY-ARMED
# services-sync clock (the choir-dates / funnel-watchdog pattern: zero new DSM
# entries, no human hands). Born from the 2026-08-05 harvest review: the corpus
# sat at 81/858 transcribed for a month because the loader was parked on a
# manual app button (DR-0247 waiting-by-default) while the CI path is
# IP-blocked by YouTube (run #5, 2026-07-11) -- the NAS's residential IP is the
# working source.
#
# PACE (measured, not guessed -- corrected 2026-08-06 after the ways review):
#   * 4 videos per fire, ~5-15s between attempts => ~60-75s wall clock.
#   * Stamp-gated to one fire per TRANSCRIPTS_TRICKLE_GAP_SECONDS (default 3h)
#     on the 15-min services-sync clock => ~8 fires/day => ~32 videos/day.
#   * Each video costs 2-3 HTTP calls to YouTube (watch page + timedtext), so
#     the TRUE request rate is ~64-96/day against the ~180/day IpBlocked
#     threshold this NAS actually hit on 2026-07-03 (load-transcripts.py
#     build_api docstring). Roughly half the budget -- not a fifth. Burst size
#     stays 4 spread over a minute, far under the ~50-in-a-burst block.
#   * ~770 gaps therefore drain in ~4 weeks (only if attempts succeed; --max
#     counts blocked attempts too), then it keeps pace with ~2-3 uploads/week.
#
# TIMEOUT REALITY: services-sync gives each installer 480s (services-sync.sh),
# but run.mjs kills the WHOLE services-sync tree at the registry's
# timeout_seconds -- that cycle-wide ceiling, not the per-installer one, is what
# actually bounds this. The trickle is registered EARLY in services.json so a
# slow sibling (docker pulls, the choir-dates drain) can never starve it, and a
# stamp-gated no-op costs milliseconds on the cycles it skips.
#
# BRAKES: services-sync's runner owns lock + timeout + daily cap; the loader adds
# its own --max budget, single-flight lock, and a TIME-DECAYED backoff that
# clears ITSELF (DR-0248 -- the 2026-08-05 review found the previous
# human-cleared pause had NO reachable clear path: it pointed at the app's
# resume-transcripts job, which routes through ops-runner.py, which is installed
# by nothing. A pause would have stopped the drain permanently and silently.)
#
# EXIT DISCIPLINE: a paused (backing-off) loader is exit 4 and is mapped to a
# quiet 0 here, so a cooling-off IP does not red every 15-min cycle. EVERY other
# non-zero propagates and reds the cycle loudly (reel + ntfy) -- an all-blocked
# run (3) and a config failure (2) are alarms, never silence (DR-0076).
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
OUT="$REPO/infra/nas-sme-pipeline/out"
STAMP="$OUT/.transcript-trickle.last"
GAP="${TRANSCRIPTS_TRICKLE_GAP_SECONDS:-10800}"

mkdir -p "$OUT"

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

# Stamp BEFORE running, deliberately: a run that dies for any reason still burns
# its slot, so a broken config backs off to ~8 attempts/day instead of hammering
# YouTube every 15 minutes. The loudness comes from the exit code, not retries.
echo "$now" > "$STAMP"

python3 "$REPO/infra/nas-sme-pipeline/load-transcripts.py" \
  --slug "${TRANSCRIPTS_SLUG:-colg}" \
  --max "${TRANSCRIPTS_MAX:-4}" \
  --sleep-min "${TRANSCRIPTS_SLEEP_MIN:-5}" \
  --sleep-max "${TRANSCRIPTS_SLEEP_MAX:-15}" \
  --start-jitter "${TRANSCRIPTS_START_JITTER:-60}"
rc=$?

if [ "$rc" -eq 4 ]; then
  echo "transcript-trickle: loader is in its self-clearing backoff (auto-resumes) - quiet no-op"
  exit 0
fi
exit "$rc"
