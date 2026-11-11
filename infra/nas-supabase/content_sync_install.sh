#!/bin/sh
# content-sync -- the NAS carries hosted-only content rows to the sovereign
# database ITSELF, on the already-armed services-sync clock (DR-1427).
#
# WHY. The Word -> Migdal reads the sovereign database; new services are filed
# on the hosted project and carried across by content_sync.py. That carry ran
# only from a GitHub runner (sovereign-content-sync.yml) that SSHes in over the
# tailnet, and it failed every day from 2026-11-04 to 2026-11-11 (eight runs)
# because the runner's tailnet key expired ("backend error: invalid key: API key
# does not exist"). November never reached the archive and the month list
# stopped at October (Darrell 2026-11-11: "the months are not populating in the
# next month!!!! ... this was an issue before" -- DR-0442, 2026-09-16, was the
# first time). DR-1360 names the permanent fix: the NAS initiates the road.
#
# BRAKES (DR-0248, deterministic class: budget + lock).
#   budget  stamp-gated to one run per 6 hours (4/day), each bounded by a 420-second
#           timeout on the sync itself (under the runner's 480 s per rider);
#   lock    the nas-loops runner's lock and cycle timeout above this rider.
#   stop    services.json "enabled": false (a PR).
# Idempotent: content_sync.py inserts ON CONFLICT DO NOTHING and updates only
# rows hosted edited later; a run with nothing to carry writes nothing.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
DIR="$REPO/infra/nas-supabase"
STATE="$DIR/state"
STAMP="$STATE/content-sync.last"
EVERY_SECONDS="${CONTENT_SYNC_EVERY_SECONDS:-21600}"
mkdir -p "$STATE"

now=$(date +%s)
last=0
[ -f "$STAMP" ] && last=$(cat "$STAMP" 2>/dev/null || echo 0)
case "$last" in ''|*[!0-9]*) last=0 ;; esac
if [ $((now - last)) -lt "$EVERY_SECONDS" ]; then
  echo "content-sync: ran $(( (now - last) / 60 )) min ago; next in $(( (EVERY_SECONDS - (now - last)) / 60 )) min"
  exit 0
fi
# Stamp BEFORE the run: a failing sync is retried on the next 6-hour slot,
# never every 15 minutes (the budget holds on failure too).
echo "$now" > "$STAMP"

cd "$DIR"
PATH=/usr/local/bin:/opt/bin:/usr/bin:/bin:$PATH; export PATH
if command -v timeout >/dev/null 2>&1; then
  RUN="timeout 420 python3 content_sync.py --commit"
else
  RUN="python3 content_sync.py --commit"
fi
echo "content-sync: carrying hosted-only rows to the sovereign database"
if $RUN > "$STATE/content-sync.out" 2>&1; then
  tail -12 "$STATE/content-sync.out"
  echo "content-sync: OK"
else
  rc=$?
  tail -20 "$STATE/content-sync.out"
  echo "content-sync: FAILED (exit $rc) -- see $STATE/content-sync.out" >&2
  exit "$rc"
fi
