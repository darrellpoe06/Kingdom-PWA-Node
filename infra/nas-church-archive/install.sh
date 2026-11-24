#!/bin/sh
# church-archive -- the NAS keeps what the church office posts and reads its
# calendars and flyers onto their days ITSELF, on the already-armed
# services-sync clock (DR-1649, the DR-1360 direction: the NAS initiates).
#
# WHY. The daily reader (church-site-archive.yml, DR-1596; the read added by
# DR-1644) ran on a GitHub runner that joined the tailnet to reach the NAS.
# Every scheduled run since it merged died at the join ("invalid key: API key
# does not exist"): the runner road is retired by design (DR-1360, Darrell
# 2026-11-24: "No more auth keys"). So nothing was kept and nothing was read,
# and the Times calendar still said "Nothing is on the church calendar" for a
# day the office's own picture filled. The house does the whole pass now:
#   1. collect  read the church's public website with the app's own parser
#   2. keep     each new picture into the private church-archive bucket + a row
#   3. pull     the kept calendars and flyers not yet read onto the calendar
#   4. read     each one ONCE into dated events (vision model), checked
#   5. file     the events on their days (church_calendar_keep_read, 0343)
#
# BRAKES.
#   budget  stamp-gated to one pass per 6 hours (4/day). Per step: collect 60 s,
#           keep 90 s, pull 45 s, read 210 s (at most 3 pictures a pass, 60 s a
#           request, stop after 2 failures with nothing read), file 45 s --
#           450 s, under the 480 s each rider gets. A picture is read once ever
#           (church_calendar_reads), so the model is asked once per picture the
#           office posts; the backlog (Wayback, uploads) drains 3 a pass.
#   lock    the nas-loops runner's lock and cycle timeout above this rider,
#           and a lock directory on this pass (a second pass that finds it skips;
#           one older than an hour is stale and taken over).
#   stop    services.json "enabled": false (a PR) stops the whole pass;
#           CHURCH_CALENDAR_READ=off in church-archive.env stops only the read
#           (pictures are still kept). No key file = the read is a named no-op.
# The Anthropic key is the file the NAS lesson builder already reads
# (/volume1/PoeTech/secrets/anthropic-api-key.txt); it is handed to the reader
# in its environment and never printed.
set -u

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
DIR="$REPO/infra/nas-church-archive"
STATE="$DIR/state"
STAMP="$STATE/church-archive.last"
EVERY_SECONDS="${CHURCH_ARCHIVE_EVERY_SECONDS:-21600}"
KEY_FILE="${CHURCH_ARCHIVE_KEY_FILE:-/volume1/PoeTech/secrets/anthropic-api-key.txt}"
mkdir -p "$STATE"
[ -f "$DIR/church-archive.env" ] && . "$DIR/church-archive.env"

now=$(date +%s)
last=0
[ -f "$STAMP" ] && last=$(cat "$STAMP" 2>/dev/null || echo 0)
case "$last" in ''|*[!0-9]*) last=0 ;; esac
if [ $((now - last)) -lt "$EVERY_SECONDS" ]; then
  echo "church-archive: ran $(( (now - last) / 60 )) min ago; next in $(( (EVERY_SECONDS - (now - last)) / 60 )) min"
  exit 0
fi

PATH=/usr/local/bin:/opt/bin:/usr/bin:/bin:$PATH; export PATH
NODE=$(command -v node 2>/dev/null || true)
PY=$(command -v python3 2>/dev/null || true)
if [ -z "$NODE" ] || [ -z "$PY" ]; then
  echo "church-archive: node or python3 not found on the NAS -- nothing done" >&2
  exit 4
fi
# Stamp BEFORE the pass: a failing pass is retried on the next slot, never
# every 15 minutes (the budget holds on failure too).
echo "$now" > "$STAMP"

T=$(mktemp -d /tmp/church-archive.XXXXXX) || exit 5
trap 'rm -rf "$T"' EXIT
LOG="$STATE/church-archive.out"
: > "$LOG"
rc=0
step() { # step <name> <seconds> <command...>: run, log, remember the worst exit
  name="$1"; secs="$2"; shift 2
  if command -v timeout >/dev/null 2>&1; then timeout "$secs" "$@" >> "$LOG" 2>&1; else "$@" >> "$LOG" 2>&1; fi
  s=$?
  [ "$s" -ne 0 ] && { echo "church-archive: $name exited $s" >> "$LOG"; [ "$rc" -eq 0 ] && rc=$s; }
  return 0
}

LOCK="$STATE/church-archive.lock.d"
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +60 2>/dev/null)" ]; then
    rm -rf "$LOCK"; mkdir "$LOCK" 2>/dev/null || { echo "church-archive: lock busy; skipped"; exit 0; }
  else
    echo "church-archive: another pass holds the lock; skipped"; exit 0
  fi
fi
trap 'rm -rf "$T" "$LOCK"' EXIT

(
  cd "$REPO" || exit 6
  step collect 60 "$NODE" scripts/church-site-archive-collect.mjs --out "$T/archive" --mode site
  if [ -f "$T/archive/manifest.json" ]; then
    step keep 90 "$PY" infra/nas-church-archive/church_archive_keep.py "$T/archive"
  fi
  step pull 45 "$PY" infra/nas-church-archive/church_calendar_reads.py pull "$T/reads" --max 3
  if [ "${CHURCH_CALENDAR_READ:-on}" = "off" ]; then
    echo "church-archive: reading is OFF (CHURCH_CALENDAR_READ=off); pictures are still kept" >> "$LOG"
  elif [ ! -r "$KEY_FILE" ]; then
    echo "church-archive: no Anthropic key file at $KEY_FILE -- pictures kept, none read" >> "$LOG"
  else
    ANTHROPIC_API_KEY=$(cat "$KEY_FILE"); export ANTHROPIC_API_KEY
    CHURCH_CALENDAR_READ_MAX=3; CHURCH_CALENDAR_READ_TIMEOUT_MS=60000
    export CHURCH_CALENDAR_READ_MAX CHURCH_CALENDAR_READ_TIMEOUT_MS
    step read 210 "$NODE" scripts/church-calendar-read.mjs "$T/reads"
    unset ANTHROPIC_API_KEY
  fi
  if [ -f "$T/reads/reads.json" ]; then
    step file 45 "$PY" infra/nas-church-archive/church_calendar_reads.py file "$T/reads"
  fi
  exit "$rc"
)
rc=$?

grep -E '^(pages:|pictures:|ARCHIVE-RESULT|PULL-RESULT|CALENDAR-READ|READ-RESULT|read:|not read:|filed:|NOT READ|church-archive:)|::error::' "$LOG" | tail -30
if [ "$rc" -eq 0 ]; then
  echo "church-archive: OK"
else
  echo "church-archive: FAILED (exit $rc) -- see $LOG" >&2
fi
exit "$rc"
