#!/bin/sh
# =============================================================================
# replay-on-clock.sh -- the sovereign database applies the mirror's migrations
# on the NAS's own clock (DR-1269)
# =============================================================================
# THE ROAD THIS ADDS. Until 2026-10-28 a merged migration reached the sovereign
# database by ONE road: db-migrate.yml, a GitHub runner joining the tailnet and
# running replay_migrations.sh over SSH. On 2026-10-28 the runner's Tailscale
# key was refused and that road closed for every migration, while the NAS
# itself stayed up, online on the tailnet, and pulling main every 15 minutes
# through the services-sync mirror. The files were already on the box; nothing
# on the box applied them.
#
# Now the box does. Every services-sync cycle this installer runs the SAME
# replay_migrations.sh the runner runs, against the SAME ledger
# (public._sovereign_replay), so a migration applies once whichever road
# reaches it first; the lock inside replay_migrations.sh keeps the two roads
# from running at the same moment. Steady state costs a few psql calls.
#
# Brakes (DR-0248, deterministic class: budget + lock): a wall clock inside
# the installer's own 480 s ceiling; a lock directory that clears itself once
# older than the wall clock; MAX_PER_RUN inside the replay. Stop-paths:
# enabled:false in services.json, or delete ARMED-BY-RECORD.
#
# Exit: 0 applied or nothing to apply; 1 a migration FAILED (the cycle reds,
# the way db-migrate reds); 3 could not run this cycle (busy, timed out,
# docker or the database not answering) -- DEGRADED, named, not failed.
# Witness: loops-health reads status.json; nothing here prints a secret.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
HOME_DIR="${SOVEREIGN_REPLAY_HOME:-/volume1/PoeTech/sovereign-replay}"
WALL="${SOVEREIGN_REPLAY_TIMEOUT:-420}"
REPLAY="$REPO/infra/nas-supabase/replay_migrations.sh"
LOCK="$HOME_DIR/.lock"
STATUS="$HOME_DIR/status.json"
LOG="$HOME_DIR/replay.log"

mkdir -p "$HOME_DIR" 2>/dev/null
chmod 0700 "$HOME_DIR" 2>/dev/null
[ -f "$REPLAY" ] || { echo "sovereign-replay: no replay script at $REPLAY"; exit 1; }

if [ -d "$LOCK" ]; then
  STALE_MIN=$(( (WALL + 120) / 60 + 1 ))
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +"$STALE_MIN" 2>/dev/null)" ]; then
    rmdir "$LOCK" 2>/dev/null
    echo "sovereign-replay: a stale lock (older than the wall clock) was cleared"
  else
    echo "sovereign-replay: a run is already in progress"
    exit 0
  fi
fi
mkdir "$LOCK" 2>/dev/null || { echo "sovereign-replay: a run is already in progress"; exit 0; }
trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM

TIMEOUT=""
command -v timeout >/dev/null 2>&1 && TIMEOUT="timeout $WALL"
HEAD=$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo unknown)
OUT=$($TIMEOUT sh "$REPLAY" 2>&1)
RC=$?

LINE=$(printf '%s\n' "$OUT" | grep '^replay: applied ' | tail -n 1)
APPLIED=$(printf '%s' "$LINE" | sed -n 's/^replay: applied \([0-9][0-9]*\) .*/\1/p')
[ -n "$APPLIED" ] || APPLIED=0
LEDGER=$(printf '%s' "$LINE" | sed -n 's/.* ledger \([0-9]*\/[0-9]*\).*/\1/p')
FRONTIER=$(printf '%s' "$LINE" | sed -n 's/.*frontier: //p' | tr -d '"\\' | cut -c1-300)
BUSY=false
printf '%s\n' "$OUT" | grep -q '^replay: BUSY' && BUSY=true
[ "$RC" = "124" ] && FRONTIER="timed out after ${WALL}s"
OK=false
[ "$RC" = "0" ] && OK=true

printf '{"at":"%s","ok":%s,"rc":%s,"applied":%s,"ledger":"%s","frontier":"%s","head":"%s","busy":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$OK" "$RC" "$APPLIED" "$LEDGER" "$FRONTIER" "$HEAD" "$BUSY" > "$STATUS"
{ echo "== $(date -u +%Y-%m-%dT%H:%M:%SZ) head=$HEAD rc=$RC"; printf '%s\n' "$OUT" | tail -n 20; } >> "$LOG"
if [ "$(wc -c < "$LOG" 2>/dev/null || echo 0)" -gt 200000 ]; then
  tail -c 100000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

if [ "$OK" = "true" ]; then
  echo "sovereign-replay: ${LINE:-no replay line} (head $HEAD)"
  exit 0
fi
printf '%s\n' "$OUT" | tail -n 3
case "$LINE" in
  *FAILED*)
    echo "sovereign-replay: a migration FAILED (exit $RC, head $HEAD): $FRONTIER"
    exit 1 ;;
esac
echo "sovereign-replay: could not run this cycle (exit $RC, head $HEAD): ${FRONTIER:-see $LOG}"
exit 3
