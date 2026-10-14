#!/usr/bin/env bash
# =============================================================================
# place-doors-over-tailnet.sh — the lane places the family's doors on the map,
# on the database the APP READS, from a GitHub runner (DR-1015)
# =============================================================================
# Three moves, each said:
#   1. READ  every door with an address and no area from the sovereign
#            database (ssh over the tailnet, psql inside supabase-db — the
#            same road sovereign-replay-over-tailnet.sh uses).
#   2. PLACE them on the runner: scripts/place-doors.mjs looks each BUILDING
#            up once (the app's own placeDoorsOnTheMap, the same address
#            check, the same rounding, the same nearby rules, bus stops
#            included) and prints one UPDATE per door.
#   3. WRITE those updates back, one statement each, on the same road; the
#            database's trigger rounds the area and refuses a line naming the
#            street. A door with an area is never touched.
#
# Bounded: at most PLACE_MAX_LOOKUPS lookups a run (place-on-map.js), one per
# second; nothing spawned; exits 0 with "nothing to place" when every door is
# already on the map. Exits non-zero when the database could not be reached or
# the write failed — an unplaced door is never reported as placed (DR-0076).
#
# Requires: NAS_SSH_KEY in the environment, the tailnet already joined.
# =============================================================================
set -uo pipefail

NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## Place doors - NOT RUN: NAS_SSH_KEY is not set, so the sovereign database could not be reached."
  echo "::error::NAS_SSH_KEY missing - no door was placed"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
WORK="$(mktemp -d)"
trap 'rm -rf "$KEYFILE" "$WORK"' EXIT
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

probe=""; err=""
for _ in 1 2 3; do
  err=$($SSH "echo READY" 2>&1) || true
  case "$err" in *READY*) probe="READY"; break;; esac
  sleep 5
done
if [ "$probe" != "READY" ]; then
  say "## Place doors - NOT RUN: the NAS was not reachable over the tailnet after 3 attempts: $err"
  echo "::error::NAS unreachable - no door was placed"
  exit 3
fi

# The remote half: a QUOTED heredoc, so what is written here is what the NAS
# runs. MODE=read prints the doors as one JSON line; MODE=write applies the SQL
# handed over in SQL_B64, one statement at a time, and prints each result.
REMOTE_SCRIPT="$WORK/remote.sh"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
ENV_FILE="${NAS_ENV:?NAS_ENV not passed through}"
MODE="${MODE:?MODE not passed through}"
PW=$(sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || PW=$(sudo -n sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || { echo "could not read POSTGRES_PASSWORD from $ENV_FILE" >&2; exit 3; }
DOCKER=$(command -v docker 2>/dev/null || true)
if [ -z "$DOCKER" ]; then
  for c in /usr/local/bin/docker /usr/bin/docker; do
    [ -x "$c" ] && DOCKER="$c" && break
  done
fi
[ -n "$DOCKER" ] || { echo "docker binary not found" >&2; exit 4; }
psql_run() {
  "$DOCKER" exec -i -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A "$@" 2>/dev/null && return 0
  sudo -n "$DOCKER" exec -i -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A "$@"
}
if [ "$MODE" = "read" ]; then
  Q="select coalesce(json_agg(json_build_object('id', id, 'instance_id', instance_id, 'address', address, 'unit', unit, 'city', city, 'state', state) order by address, unit), '[]'::json) from public.rentals where area_lat is null and nullif(btrim(coalesce(address, '')), '') is not null"
  echo "DOORS-JSON=$(psql_run -c "$Q" | tr -d '\n')"
  exit 0
fi
if [ "$MODE" = "write" ]; then
  SQL_FILE=$(mktemp)
  printf '%s' "${SQL_B64:?SQL_B64 not passed through}" | base64 -d > "$SQL_FILE"
  # One statement per line, each its own transaction: a line the trigger
  # refuses names itself and the others still land.
  n=0; ok=0
  while IFS= read -r stmt; do
    [ -n "$stmt" ] || continue
    n=$((n + 1))
    res=$(printf '%s\n' "$stmt" | psql_run -f - 2>&1)
    case "$res" in
      *"UPDATE 1"*) ok=$((ok + 1)); echo "STMT $n: UPDATE 1";;
      *) echo "STMT $n: $(printf '%s' "$res" | tr '\n' ' ' | cut -c1-200)";;
    esac
  done < "$SQL_FILE"
  rm -f "$SQL_FILE"
  echo "WRITE-RESULT=$ok/$n"
  exit 0
fi
echo "unknown MODE $MODE" >&2; exit 5
REMOTE

# 1. READ
OUT=$($SSH "NAS_ENV='$NAS_ENV' MODE=read bash -s" < "$REMOTE_SCRIPT" 2>"$WORK/err")
rc=$?
if [ "$rc" -ne 0 ]; then
  say "## Place doors - NOT RUN: reading the doors failed (exit $rc): $(cat "$WORK/err")"
  echo "::error::could not read the doors - no door was placed"
  exit 4
fi
printf '%s\n' "$OUT" | sed -n 's/^DOORS-JSON=//p' | tail -1 > "$WORK/doors.json"
count=$(node -e "const v=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')||'[]');console.log(Array.isArray(v)?v.length:0)" "$WORK/doors.json" 2>/dev/null || echo "?")
say "## Place doors - $(date -u +%FT%TZ)"
say ""
say "- doors with an address and no area: ${count}"
if [ "$count" = "0" ]; then
  say "- nothing to place: every door with an address is on the map."
  exit 0
fi

# 2. PLACE (on the runner)
node scripts/place-doors.mjs "$WORK/doors.json" > "$WORK/updates.sql" 2>"$WORK/place.log"
rc=$?
say "- $(cat "$WORK/place.log" | tr '\n' ' ')"
if [ "$rc" -ne 0 ]; then
  echo "::error::place-doors.mjs exited $rc"
  exit 5
fi
stmts=$(grep -c '^UPDATE ' "$WORK/updates.sql" || true)
if [ "${stmts:-0}" = "0" ]; then
  say "- no door could be placed this run (the lookups found no house that matched); nothing written. The next run tries again."
  exit 0
fi

# 3. WRITE
SQL_B64=$(base64 -w0 < "$WORK/updates.sql")
OUT=$($SSH "NAS_ENV='$NAS_ENV' MODE=write SQL_B64='$SQL_B64' bash -s" < "$REMOTE_SCRIPT" 2>"$WORK/err")
rc=$?
printf '%s\n' "$OUT" | while IFS= read -r l; do say "    $l"; done
result=$(printf '%s\n' "$OUT" | sed -n 's/^WRITE-RESULT=//p' | tail -1)
if [ "$rc" -ne 0 ] || [ -z "$result" ]; then
  say "- the write did not report a result (exit $rc): $(cat "$WORK/err")"
  echo "::error::the placements were not confirmed written"
  exit 6
fi
say "- written: ${result} door(s) placed on the database the app reads."
case "$result" in 0/*) echo "::error::no placement was written"; exit 7;; esac
exit 0
