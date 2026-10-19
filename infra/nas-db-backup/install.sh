#!/bin/sh
# =============================================================================
# nas-db-backup/install.sh — rides the ALREADY-ARMED services-sync clock
# (the transcript-trickle pattern: zero new DSM entries, no human hands) and
# starts the nightly backup of the sovereign database when one is due (DR-1113).
# =============================================================================
# Each 15-minute services-sync cycle calls this. It costs milliseconds when no
# backup is due. A backup is due when BOTH:
#   * the local hour is inside BACKUP_HOURS (default 2-4, the family's night), and
#   * the last SUCCESSFUL run is older than BACKUP_GAP_HOURS (default 20), so
#     one night yields one backup even though the window spans several cycles.
#
# WHY IT DETACHES. run.mjs kills the whole services-sync tree at the registry's
# 600-second cycle ceiling (registry.json), and a full dump plus a weekly
# restore drill can outlast that. So this launches db_backup.sh in the
# background under its own wall clock (`timeout`, BACKUP_TIMEOUT, default 3600 s)
# and returns at once. db_backup.sh's own lock makes a second launch a no-op.
#
# It prints the last verdict on every cycle, so the services-sync log always
# says when the database was last backed up and whether that backup verified.
# =============================================================================
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
HERE="$REPO/infra/nas-db-backup"
DEST="${BACKUP_DIR:-/volume1/PoeTech/backups/db}"
HOURS="${BACKUP_HOURS:-2-4}"
GAP_HOURS="${BACKUP_GAP_HOURS:-20}"
WALL="${BACKUP_TIMEOUT:-3600}"
LOG="$DEST/backup.log"

mkdir -p "$DEST" 2>/dev/null
chmod 0700 "$DEST" 2>/dev/null

if [ -f "$DEST/status.json" ]; then
  echo "db-backup: last verdict $(cat "$DEST/status.json")"
else
  echo "db-backup: no backup has run yet on this box"
fi

H=$(date +%H | sed 's/^0//'); [ -n "$H" ] || H=0
LO=${HOURS%-*}; HI=${HOURS#*-}
if [ "$H" -lt "$LO" ] || [ "$H" -gt "$HI" ]; then
  echo "db-backup: not due (local hour $H is outside $HOURS)"
  exit 0
fi

STAMP="$DEST/.last-ok"
if [ -f "$STAMP" ] && [ -z "$(find "$STAMP" -mmin +"$((GAP_HOURS * 60))" 2>/dev/null)" ]; then
  echo "db-backup: not due (last success under ${GAP_HOURS}h ago)"
  exit 0
fi

if [ -d "$DEST/.lock" ]; then
  echo "db-backup: a run is already in progress"
  exit 0
fi

TIMEOUT=""
command -v timeout >/dev/null 2>&1 && TIMEOUT="timeout $WALL"
# The success stamp is touched only when db_backup.sh exits 0, so a failed
# night is retried on the next cycle inside the window, never silently skipped.
nohup sh -c "$TIMEOUT sh '$HERE/db_backup.sh' >> '$LOG' 2>&1 && touch '$STAMP'" >/dev/null 2>&1 &
echo "db-backup: started in the background (wall clock ${WALL}s); progress in $LOG"
exit 0
