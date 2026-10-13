#!/usr/bin/env bash
# =============================================================================
# live-sql.sh -- run SQL on the database the app actually reads (DR-0618)
# =============================================================================
# The app has read the NAS's own Supabase since REPOINT-ARMED (2026-08-19,
# DR-0310). Five monitors still read the hosted project through the
# SUPABASE_DB_URL secret, so their green and red described a database nobody
# uses (measured 2026-09-24: harvest-health, ops-queue-health, rls-isolation,
# corpus-reconcile, site-health's backend step). This is the one path they
# share now: the same road every sovereign lane already uses -- tailnet -> ssh
# -> docker exec psql inside supabase-db -- so nothing new is trusted.
#
# USAGE (the runner must already have joined the tailnet):
#   printf '%s' "SELECT 1, 2" | NAS_SSH_KEY=... bash scripts/live-sql.sh '|'
#   bash scripts/live-sql.sh < some-smoke.sql            # whole files work too
# Output is psql -At with the given field separator (default '|'), exactly what
# the monitors parsed from `psql "$URL" -At -F '|'` before, so their parsing is
# unchanged. ON_ERROR_STOP=1: a failed statement is a non-zero exit, never an
# empty answer that reads like "the database holds none" (DR-0076). The exit
# code is psql's: 0 ok, 1-3 a real failure; 10 = the NAS did not answer.
# =============================================================================
set -uo pipefail
SEP="${1:-|}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"
[ -n "${NAS_SSH_KEY:-}" ] || { echo "live-sql: NAS_SSH_KEY is not set" >&2; exit 10; }

SQL="$(cat)"
[ -n "$SQL" ] || { echo "live-sql: no SQL on stdin" >&2; exit 2; }
SQL_B64="$(printf '%s' "$SQL" | base64 -w0)"
SEP_B64="$(printf '%s' "$SEP" | base64 -w0)"

KEYFILE="$(mktemp)"
REMOTE="$(mktemp)"
trap 'rm -f "$KEYFILE" "$REMOTE"' EXIT
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
chmod 600 "$KEYFILE"
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

$SSH 'echo ok' 2>/dev/null | grep -q ok || { echo "live-sql: the NAS did not answer over the tailnet" >&2; exit 10; }

# QUOTED heredoc: what is written here is exactly what the NAS runs.
cat > "$REMOTE" <<'REMOTE_EOF'
set -u
PW=$(sed -n 's/^POSTGRES_PASSWORD=//p' "$NAS_ENV" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || PW=$(sudo -n sed -n 's/^POSTGRES_PASSWORD=//p' "$NAS_ENV" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || { echo "live-sql: could not read POSTGRES_PASSWORD from $NAS_ENV" >&2; exit 3; }
DOCKER=$(command -v docker 2>/dev/null || true)
[ -n "$DOCKER" ] || for c in /usr/local/bin/docker /usr/bin/docker; do [ -x "$c" ] && DOCKER="$c" && break; done
[ -n "$DOCKER" ] || { echo "live-sql: docker binary not found" >&2; exit 4; }
SEP=$(printf '%s' "$SEP_B64" | base64 -d)
run() {
  printf '%s' "$SQL_B64" | base64 -d | "$@" exec -i -e PGPASSWORD="$PW" supabase-db \
    psql -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q -At -F "$SEP" -f -
}
run "$DOCKER" && exit 0
rc=$?
# Docker on DSM can need root; retry once with sudo before calling it a failure.
if [ "$rc" -eq 1 ] && ! "$DOCKER" ps >/dev/null 2>&1; then
  run sudo -n "$DOCKER"
  exit $?
fi
exit "$rc"
REMOTE_EOF

$SSH "NAS_ENV='$NAS_ENV' SQL_B64='$SQL_B64' SEP_B64='$SEP_B64' bash -s" < "$REMOTE"
