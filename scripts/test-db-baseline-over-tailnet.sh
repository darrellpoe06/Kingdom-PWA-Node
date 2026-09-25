#!/usr/bin/env bash
# =============================================================================
# test-db-baseline-over-tailnet — the SHAPE of the live database, for a
# throwaway copy the isolation proofs can break freely (2026-09-25)
# =============================================================================
# WHY. The rls-isolation matrix used to re-apply each feature's migration chain
# and run its smokes against SUPABASE_DB_URL, a real database. On 2026-09-25 a
# leg's pre-step DROP FUNCTION public_vacancies() left that database without
# the function for ~40 s, and db-migrate's live-definition witness read the gap
# (run 36090407494). A test lane must never mutate a database anyone depends
# on. The legs now run on a disposable supabase/postgres container on the
# runner, and this script hands them the one thing the repo's files cannot:
# the schema the migrations actually built.
#
# Why a dump and not a replay of the files: replaying migrations-auto from 0001
# does NOT reproduce the schema -- measured, and written down in
# infra/nas-supabase/replay_migrations.sh (v2.1 renamed live tables in place,
# v2.2.1 depended on v2.8, the dashboard era left hand-applied state). The
# sovereign database was itself built from a dump for that reason.
#
# WHAT IT READS, and nothing else:
#   * pg_dump --schema-only --schema=public   (tables, functions, policies, grants)
#   * pg_dump --data-only --table=public.instances  (slugs + names of the
#     instances; the smokes find the family and office instances by slug)
# No person's record, message, money or document is ever read: every other
# table crosses as an empty shape. READ-ONLY by construction: pg_dump opens a
# read-only snapshot and writes nothing.
#
# Reaches the live database, so it may only be called from a lane that is
# registered for that in scripts/live-db-reach-guard.mjs (db-migrate,
# sovereign-read). The test lanes consume its OUTPUT, never its access.
#
# Usage: test-db-baseline-over-tailnet.sh <out.sql.gz>
# Requires NAS_SSH_KEY and a tailnet already joined by the calling workflow.
# =============================================================================
set -uo pipefail

OUT="${1:?usage: test-db-baseline-over-tailnet.sh <out.sql.gz>}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

if [ -z "${NAS_SSH_KEY:-}" ]; then
  echo "::error::NAS_SSH_KEY missing - no baseline was taken"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

if ! $SSH 'echo ok' 2>/dev/null | grep -q ok; then
  echo "::error::NAS unreachable - no baseline was taken"
  exit 3
fi

# QUOTED heredoc: what is written here is exactly what the NAS runs.
REMOTE_SCRIPT="$(mktemp)"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
ENV_FILE="${NAS_ENV:?NAS_ENV not passed through}"
PW=$(sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || PW=$(sudo -n sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || { echo "could not read POSTGRES_PASSWORD from $ENV_FILE" >&2; exit 3; }
DOCKER=$(command -v docker 2>/dev/null || true)
if [ -z "$DOCKER" ]; then
  for c in /usr/local/bin/docker /usr/bin/docker; do
    [ -x "$c" ] && DOCKER="$c" && break
  done
fi
[ -n "$DOCKER" ] || { echo "docker binary not found (PATH, /usr/local/bin, /usr/bin)" >&2; exit 4; }
"$DOCKER" ps >/dev/null 2>&1 || DOCKER="sudo -n $DOCKER"
DUMP() { $DOCKER exec -e PGPASSWORD="$PW" supabase-db pg_dump -h 127.0.0.1 -U supabase_admin -d postgres "$@"; }
set -o pipefail
{ DUMP --schema-only --schema=public --no-owner \
  && echo "-- ===== instances (slugs and names only; every other table crosses empty) =====" \
  && echo "SET session_replication_role = replica;" \
  && DUMP --data-only --table=public.instances --no-owner \
  && echo "SET session_replication_role = origin;"; } | gzip -c
REMOTE

$SSH "NAS_ENV='$NAS_ENV' bash -s" < "$REMOTE_SCRIPT" > "$OUT"
RC=$?
rm -f "$REMOTE_SCRIPT"
if [ $RC -ne 0 ] || ! gzip -t "$OUT" 2>/dev/null; then
  echo "::error::the baseline dump failed (rc=$RC) - nothing usable was written"
  rm -f "$OUT"
  exit 5
fi
LINES=$(gzip -dc "$OUT" | wc -l | tr -d ' ')
TABLES=$(gzip -dc "$OUT" | grep -c '^CREATE TABLE ' || true)
FUNCS=$(gzip -dc "$OUT" | grep -c '^CREATE FUNCTION ' || true)
echo "baseline: $LINES lines, $TABLES tables, $FUNCS functions ($(wc -c < "$OUT" | tr -d ' ') bytes gzipped)"
if [ "${TABLES:-0}" -lt 50 ]; then
  echo "::error::the baseline holds only $TABLES tables - refusing to hand the proofs a hollow database"
  exit 6
fi
