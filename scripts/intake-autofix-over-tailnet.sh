#!/usr/bin/env bash
# =============================================================================
# intake-autofix-over-tailnet — read the intake state from the database the app
# reads, and apply one planned transaction to it (DR-0622)
# =============================================================================
# The same proven transport as sovereign-read-over-tailnet.sh and nas-health:
# tailnet -> ssh -> docker exec psql, the password read ON the NAS and never
# echoed. Two verbs:
#
#   read  <out.json>   every non-confidential feedback row (the columns the
#                      categorizer needs, no screenshots) and every fix-queue
#                      row, as ONE JSON document written to a file on the
#                      runner. Nothing is printed: the rows are data.
#   apply <file.sql>   one transaction (BEGIN ... COMMIT) planned by
#                      scripts/intake-autofix.mjs, fed on stdin with
#                      ON_ERROR_STOP, so it lands whole or not at all.
#
# A query that fails says so and exits non-zero; an unreadable answer is never
# reported as an empty one (DR-0076).
# =============================================================================
set -uo pipefail
VERB="${1:-}"
ARG="${2:-}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

case "$VERB" in
  read|apply) ;;
  *) echo "::error::usage: intake-autofix-over-tailnet.sh read <out.json> | apply <file.sql>"; exit 2 ;;
esac
[ -n "$ARG" ] || { echo "::error::$VERB needs a file"; exit 2; }
[ -n "${NAS_SSH_KEY:-}" ] || { echo "::error::NAS_SSH_KEY missing - nothing was read or written"; exit 2; }

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

# The remote side: find the password and docker, then run psql with stdin as
# the SQL. Quoted heredoc: what is written here is exactly what the NAS runs.
REMOTE='set -u
PW=$(sed -n "s/^POSTGRES_PASSWORD=//p" "$NAS_ENV" 2>/dev/null | tr -d "[:space:]")
[ -n "$PW" ] || PW=$(sudo -n sed -n "s/^POSTGRES_PASSWORD=//p" "$NAS_ENV" 2>/dev/null | tr -d "[:space:]")
[ -n "$PW" ] || { echo "could not read POSTGRES_PASSWORD" >&2; exit 3; }
DOCKER=$(command -v docker 2>/dev/null || true)
for c in /usr/local/bin/docker /usr/bin/docker; do [ -n "$DOCKER" ] || { [ -x "$c" ] && DOCKER="$c"; }; done
[ -n "$DOCKER" ] || { echo "docker not found" >&2; exit 4; }
SQL=$(mktemp); cat > "$SQL"
run() { "$@" exec -i -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q -t -A -f - < "$SQL"; }
run "$DOCKER" || run sudo -n "$DOCKER"; rc=$?; rm -f "$SQL"; exit $rc'

if [ "$VERB" = "read" ]; then
  QUERY="SELECT json_build_object(
    'feedback', (SELECT coalesce(json_agg(t ORDER BY t.submitted_at), '[]'::json) FROM (
       SELECT id, instance_id, submitted_at, which_tab, feedback_text, triage_status, triage_notes,
              has_screenshot, screenshot_count, intake_category, intake_basis, reply_to
         FROM public.feedback WHERE coalesce(is_confidential, false) = false) t),
    'queue', (SELECT coalesce(json_agg(q), '[]'::json) FROM (
       SELECT id, instance_id, feedback_id, rule, scope, status, attempts, branch, pr_number,
              created_at, claimed_at, finished_at FROM public.intake_fix_queue) q)
  )::text;"
  if ! printf '%s\n' "$QUERY" | $SSH "NAS_ENV='$NAS_ENV' bash -c '$REMOTE'" > "$ARG" 2> /tmp/intake-read.err; then
    echo "::error::the intake read failed: $(head -c 400 /tmp/intake-read.err | tr '\n' ' ')"
    exit 3
  fi
  grep -q '"feedback"' "$ARG" || { echo "::error::the intake read returned no JSON document"; exit 3; }
  echo "intake state read ($(wc -c < "$ARG") bytes; not printed)"
else
  grep -q '^BEGIN;' "$ARG" && grep -q '^COMMIT;' "$ARG" || { echo "::error::refusing to apply a file that is not one transaction"; exit 2; }
  if ! $SSH "NAS_ENV='$NAS_ENV' bash -c '$REMOTE'" < "$ARG" > /tmp/intake-apply.out 2>&1; then
    echo "::error::the intake transaction did not apply: $(head -c 400 /tmp/intake-apply.out | tr '\n' ' ')"
    exit 3
  fi
  echo "intake transaction applied ($(grep -c '' "$ARG") lines)"
fi
