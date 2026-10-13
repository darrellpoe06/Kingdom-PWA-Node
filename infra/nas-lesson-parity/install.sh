#!/bin/sh
# lesson-parity -- the tower parity loop (DR-0671), riding the ALREADY-ARMED
# services-sync clock (the lesson-voice pattern: zero new DSM entries).
#
# EACH CYCLE (every 15 minutes):
#   1. one deterministic measure pass (parity_core, no model): parity per tower
#      version against the Claude reference, the all-pairs cross-reference, and
#      the promotion state. Budget 90 s (the services-sync cycle is shared, 600 s for
#      every installer together),
#      single-flight lock. No count cap on lessons: the next pass continues.
#   2. the braked fix step, DETACHED so it can never hold the services-sync
#      cycle: at most one Claude fix run, killed at PARITY_FIX_MAX_SECONDS by
#      `timeout` AND by the subprocess ceiling inside, with its own lock and a
#      time-decayed auto-pause after 3 failures in a row.
#
# STOP-PATHS (the lane's own, DR-0247/0248): set this entry enabled:false in
# infra/nas-loops/services.json (everything stops), fix_enabled:false (only the
# Claude step stops), or delete infra/nas-loops/ARMED-BY-RECORD.
#
# NAS config (never in the repo): /volume1/PoeTech/secrets/lesson-parity.env
#   PARITY_FIX_CMD         the headless writer, e.g. the builder's Claude Code path;
#                          {max_turns} is replaced with the turn budget
#   PARITY_FIX_MODEL_LABEL the label recorded on each fix row
#   PARITY_FIX_WORKDIR     a repo checkout the writer may make worktrees from
# With no PARITY_FIX_CMD the fix step stores the ready prompt as
# 'awaiting-writer' and the app shows it; the measure pass runs either way.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-lesson-parity"
DATA="${PARITY_DATA:-/volume1/PoeTech/lesson-parity}"
ENVFILE=/volume1/PoeTech/secrets/lesson-parity.env
SECRETS=/volume1/PoeTech/secrets/supabase.json

mkdir -p "$DATA"
if [ -f "$ENVFILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENVFILE"
  set +a
fi

if [ ! -s "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ] && [ ! -s /volume1/docker/supabase/.env ]; then
  echo "lesson-parity: no credential (no secrets file, no env key, no sovereign stack) - nothing to measure with"
  exit 0
fi

cd "$SRC" || exit 1
PARITY_DATA="$DATA" PARITY_MEASURE_MAX_SECONDS="${PARITY_MEASURE_MAX_SECONDS:-90}" \
  python3 parity_loop.py > "$DATA/last-measure.json.tmp"
rc=$?
cat "$DATA/last-measure.json.tmp"
mv -f "$DATA/last-measure.json.tmp" "$DATA/last-measure.json"

FIXMAX="${PARITY_FIX_MAX_SECONDS:-1800}"
# Detached in its own session (setsid) so the services-sync tree kill at its
# ceiling cannot reach it, and with every stream redirected so the installer's
# captured stdout closes at once. The fix step's own lock makes a second launch
# a no-op skip.
SETSID=""
command -v setsid > /dev/null 2>&1 && SETSID="setsid"
PARITY_DATA="$DATA" $SETSID nohup timeout "$((FIXMAX + 60))" python3 parity_loop.py --fix-step \
  > "$DATA/last-fix.json" 2>> "$DATA/fix.log" < /dev/null &
exit $rc
