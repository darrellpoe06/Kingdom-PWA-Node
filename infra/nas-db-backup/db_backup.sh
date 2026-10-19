#!/bin/sh
# =============================================================================
# db_backup.sh — the sovereign database's own backup (DR-1113)
# =============================================================================
# infra/nas-supabase/README.md has said since the stack was stood up:
#   "Backups. Hosted Supabase did this invisibly. On the NAS it is ours, and
#    it is not optional for the family's data."
# Nothing built one. Every other layer of the system can be rebuilt from git;
# the family's data cannot. The 2026-10-19 system ledger
# (docs/99-session-notes/2026-10-19-the-system-inside-and-out.md, §12) named
# this the single largest risk to reversibility.
#
# WHAT ONE RUN DOES, IN ORDER, AND STOPS AT THE FIRST FAILURE:
#   1. takes the single-flight lock (a mkdir lock: DSM ships no flock promise);
#   2. refuses to start without room for TWICE the last dump (or 1 GiB);
#   3. pg_dump of the WHOLE database (every schema: public, auth, storage...)
#      in custom format, from inside the supabase-db container, so the client
#      version always equals the server's;
#   4. verifies the archive: pg_restore --list must read it and must list the
#      auth.users table and at least one public table;
#   5. writes its sha256 beside it, then renames it into place (a half-written
#      file never carries a final name);
#   6. ONLY THEN deletes the oldest verified dumps beyond KEEP. A failed run
#      deletes nothing, so the last good copy is never lost to a bad night;
#   7. on drill days, restores the new dump into a scratch database, counts
#      auth.users and public tables against the live database, and drops the
#      scratch database. A backup that has never been restored is a claim.
#   8. writes status.json, which nas-health reads and judges.
#
# WHAT IT DOES NOT BACK UP, said plainly: Storage objects (uploaded files)
# live on the storage volume, not in the database. This archive holds their
# rows, not their bytes. Hyper Backup of /volume1/docker/supabase is the road
# for those, and it is a separate step (DR-1113, carried).
#
# BRAKES: one run at a time (the lock); a wall clock (BACKUP_TIMEOUT, applied
# by install.sh with `timeout`); a free-space floor; KEEP bounds the disk. It
# never writes to the live database: pg_dump reads, and the drill restores
# only into its own scratch database.
#
# Exit: 0 ok · 2 config (no docker / no password) · 3 busy (lock held)
#       4 no room · 5 dump failed · 6 archive did not verify · 7 drill failed
# =============================================================================
set -u
umask 077

DATA="${SUPABASE_DATA:-/volume1/docker/supabase}"
ENV_FILE="${BACKUP_ENV_FILE:-$DATA/.env}"
DEST="${BACKUP_DIR:-/volume1/PoeTech/backups/db}"
KEEP="${BACKUP_KEEP:-14}"
CONTAINER="${BACKUP_CONTAINER:-supabase-db}"
DRILL="${BACKUP_DRILL:-auto}"          # auto (weekly) | always | never
DRILL_EVERY_DAYS="${BACKUP_DRILL_EVERY_DAYS:-7}"
LOCK="$DEST/.lock"
STATUS="$DEST/status.json"
NOW="$(date -u +%Y%m%dT%H%M%SZ)"
NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$DEST" || { echo "db-backup: cannot create $DEST"; exit 2; }

status() { # ok file bytes toc drilled kept error
  printf '{"ok":%s,"at":"%s","file":"%s","bytes":%s,"toc_entries":%s,"drill":"%s","kept":%s,"error":"%s"}\n' \
    "$1" "$NOW_ISO" "$2" "${3:-0}" "${4:-0}" "$5" "${6:-0}" "$(printf '%s' "$7" | tr -d '"\\' | tr '\n' ' ' | cut -c1-300)" > "$STATUS.tmp" \
    && mv "$STATUS.tmp" "$STATUS"
}
fail() { # code message
  status false "" 0 0 "not-run" "$(ls "$DEST"/*.dump 2>/dev/null | wc -l | tr -d ' ')" "$2"
  echo "db-backup: FAILED ($1): $2"
  rm -f "$DEST/.partial-$NOW.dump"
  rmdir "$LOCK" 2>/dev/null
  exit "$1"
}

# --- 1. single flight --------------------------------------------------------
if ! mkdir "$LOCK" 2>/dev/null; then
  # A lock older than six hours belongs to a run that died; clear it once.
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +360 2>/dev/null)" ]; then
    rmdir "$LOCK" 2>/dev/null && mkdir "$LOCK" 2>/dev/null || { echo "db-backup: busy (stale lock could not be cleared)"; exit 3; }
  else
    echo "db-backup: busy (another run holds $LOCK)"; exit 3
  fi
fi

# --- docker and the password, the way replay_migrations.sh finds them -------
if [ -z "${DOCKER_BIN:-}" ]; then
  DOCKER_BIN=$(command -v docker 2>/dev/null || true)
  [ -n "$DOCKER_BIN" ] || for c in /usr/local/bin/docker /usr/bin/docker; do [ -x "$c" ] && { DOCKER_BIN="$c"; break; }; done
fi
[ -n "${DOCKER_BIN:-}" ] || fail 2 "docker binary not found"
DOCKER="$DOCKER_BIN"
"$DOCKER_BIN" ps >/dev/null 2>&1 || DOCKER="sudo -n $DOCKER_BIN"
PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2-)
[ -n "$PW" ] || fail 2 "no POSTGRES_PASSWORD in $ENV_FILE"
PG() { $DOCKER exec -i -e PGPASSWORD="$PW" "$CONTAINER" "$@"; }

# --- 2. room for the dump ----------------------------------------------------
LAST=$(ls -1t "$DEST"/*.dump 2>/dev/null | head -1)
NEED_KB=1048576
if [ -n "$LAST" ]; then
  LAST_KB=$(( $(wc -c < "$LAST") / 1024 ))
  [ $((LAST_KB * 2)) -gt "$NEED_KB" ] && NEED_KB=$((LAST_KB * 2))
fi
FREE_KB=$(df -Pk "$DEST" | awk 'NR==2 {print $4}')
[ -n "$FREE_KB" ] && [ "$FREE_KB" -ge "$NEED_KB" ] || fail 4 "only ${FREE_KB:-?} KiB free at $DEST; need $NEED_KB"

# --- 3. the dump -------------------------------------------------------------
PART="$DEST/.partial-$NOW.dump"
if ! PG pg_dump -h 127.0.0.1 -U supabase_admin -d postgres -Fc > "$PART" 2> "$DEST/.dump.err"; then
  fail 5 "pg_dump: $(tail -3 "$DEST/.dump.err" 2>/dev/null)"
fi
BYTES=$(wc -c < "$PART" | tr -d ' ')
[ "$BYTES" -gt 0 ] || fail 5 "pg_dump wrote an empty file"

# --- 4. verify the archive ---------------------------------------------------
TOC=$(PG pg_restore --list < "$PART" 2> "$DEST/.verify.err") || fail 6 "pg_restore --list could not read the archive: $(tail -2 "$DEST/.verify.err" 2>/dev/null)"
TOC_N=$(printf '%s\n' "$TOC" | grep -c '^[0-9]')
printf '%s\n' "$TOC" | grep -q 'TABLE auth users ' || fail 6 "archive does not list auth.users (sign-in accounts would be lost)"
printf '%s\n' "$TOC" | grep -q 'TABLE public ' || fail 6 "archive lists no public table"

# --- 5. checksum, then the final name ----------------------------------------
FINAL="$DEST/poetech-db-$NOW.dump"
( cd "$DEST" && sha256sum "$(basename "$PART")" | sed "s#$(basename "$PART")#$(basename "$FINAL")#" > "$(basename "$FINAL").sha256" ) \
  || fail 6 "sha256sum failed"
mv "$PART" "$FINAL" || fail 6 "could not move the verified archive into place"

# --- 6. retention, only after a verified new dump ----------------------------
KEPT=0
ls -1t "$DEST"/poetech-db-*.dump 2>/dev/null | while read -r f; do
  KEPT=$((KEPT + 1))
  if [ "$KEPT" -gt "$KEEP" ]; then rm -f "$f" "$f.sha256"; echo "db-backup: retired $(basename "$f")"; fi
done
KEPT_NOW=$(ls -1 "$DEST"/poetech-db-*.dump 2>/dev/null | wc -l | tr -d ' ')

# --- 7. the restore drill ----------------------------------------------------
DRILLED="skipped"
due_drill() {
  case "$DRILL" in always) return 0 ;; never) return 1 ;; esac
  [ ! -f "$DEST/.last-drill" ] && return 0
  [ -n "$(find "$DEST/.last-drill" -mtime +"$((DRILL_EVERY_DAYS - 1))" 2>/dev/null)" ]
}
if due_drill; then
  SCRATCH="poetech_restore_drill"
  PSQL() { PG psql -h 127.0.0.1 -U supabase_admin -d "$1" -t -A -q -c "$2"; }
  PSQL postgres "DROP DATABASE IF EXISTS $SCRATCH;" >/dev/null 2>&1
  if PSQL postgres "CREATE DATABASE $SCRATCH;" >/dev/null 2> "$DEST/.drill.err" \
     && PG pg_restore -h 127.0.0.1 -U supabase_admin -d "$SCRATCH" --no-owner --no-privileges < "$FINAL" >/dev/null 2>> "$DEST/.drill.err"; then :; fi
  # pg_restore exits non-zero on harmless "already exists" notices for roles and
  # extensions, so the drill is judged by what arrived, not by that exit code.
  LIVE_U=$(PSQL postgres "SELECT count(*) FROM auth.users;" 2>/dev/null)
  DRILL_U=$(PSQL "$SCRATCH" "SELECT count(*) FROM auth.users;" 2>/dev/null)
  LIVE_T=$(PSQL postgres "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>/dev/null)
  DRILL_T=$(PSQL "$SCRATCH" "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>/dev/null)
  PSQL postgres "DROP DATABASE IF EXISTS $SCRATCH;" >/dev/null 2>&1
  if [ -n "$LIVE_U" ] && [ "$LIVE_U" = "$DRILL_U" ] && [ -n "$LIVE_T" ] && [ "$LIVE_T" = "$DRILL_T" ]; then
    DRILLED="passed: auth.users $DRILL_U of $LIVE_U, public tables $DRILL_T of $LIVE_T"
    touch "$DEST/.last-drill"
  else
    DRILLED="FAILED: auth.users ${DRILL_U:-?} of ${LIVE_U:-?}, public tables ${DRILL_T:-?} of ${LIVE_T:-?}"
    status false "$(basename "$FINAL")" "$BYTES" "$TOC_N" "$DRILLED" "$KEPT_NOW" "the archive is kept, but it did not restore whole: $(tail -2 "$DEST/.drill.err" 2>/dev/null)"
    echo "db-backup: DRILL $DRILLED"
    rmdir "$LOCK" 2>/dev/null
    exit 7
  fi
fi

# --- 8. the verdict nas-health reads -----------------------------------------
status true "$(basename "$FINAL")" "$BYTES" "$TOC_N" "$DRILLED" "$KEPT_NOW" ""
echo "db-backup: ok $(basename "$FINAL") ${BYTES} bytes, ${TOC_N} archive entries, drill $DRILLED, ${KEPT_NOW} kept"
rmdir "$LOCK" 2>/dev/null
exit 0
