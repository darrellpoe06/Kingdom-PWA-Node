#!/usr/bin/env bash
# =============================================================================
# sovereign-read-over-tailnet — ASK THE DATABASE THE APP ACTUALLY READS
# =============================================================================
# THE GAP THIS CLOSES, measured 2026-09-12. Since REPOINT-ARMED (2026-08-19) the
# app is built against the SOVEREIGN backend (DR-0310). Every agent-side tool in
# this repo reaches the HOSTED project instead. Two consequences, both live:
#
#   1. FEEDBACK. The newest row in the hosted `feedback` table is dated
#      2026-08-19 12:56 UTC — the repoint day itself. 151 rows, then nothing.
#      For 24 days every piece of feedback the family and the congregation
#      submitted has been invisible to the AI that DR-0067 decision 2 says must
#      work it FIRST: "Darrell is not the inbox for all user feedback; the AI
#      absorbs the volume and surfaces only the governor-grade calls." The Way
#      has been running backwards — Darrell reads it and carries it to the AI.
#
#   2. DEFINITIONS. DR-0368's re-review: every smoke and live-definition-witness
#      judges the hosted database. Nothing had ever asked the sovereign one what
#      it holds, so "production is correct" was a claim about the wrong system.
#
# One channel, two questions, because they are the same missing capability.
# The transport is the one nas-health.yml:339 and sovereign-replay-over-tailnet
# already use: tailnet -> ssh -> docker exec psql. Nothing new is trusted.
#
# WHAT IT WILL NOT DO, structurally rather than by habit:
#   * never selects `screenshot` or `screenshots` — a screenshot may hold
#     anything that was on someone's screen, and it never leaves the database;
#   * never returns a row marked `is_confidential` — those are COUNTED so their
#     existence is known, and their content stays where the person put it;
#   * masks email- and phone-shaped strings out of the text it prints, the same
#     convention nas-health.yml:501 already applies to its log tail.
# Each of those is asserted by sovereign-reader-guard.test.js against this file.
#
# Usage:  sovereign-read-over-tailnet.sh feedback [days]
#         sovereign-read-over-tailnet.sh definitions [functions]
# Requires NAS_SSH_KEY and a tailnet already joined by the calling workflow.
#
# ASKING ABOUT A FUNCTION THIS FILE DOES NOT ALREADY NAME (added 2026-09-13,
# DR-0374). The definitions list used to be hard-coded to seven church and
# property functions, so the only way to ask the live database about anything
# else was to edit this script -- which meant, in practice, that nobody asked.
# On 2026-09-13 that cost a real measurement: crm_capture_lead's pipeline
# allowlist was read off the HOSTED mirror and written up as the live state in
# a decision record. So `functions` is now an argument.
#
# It is a comma-separated list of unqualified public function names and it is
# validated against ^[a-z0-9_]+(,[a-z0-9_]+)*$ BEFORE it reaches any SQL. That
# character class cannot express a quote, a space, a semicolon or a comment
# marker, so there is no string a caller can pass that closes the IN list and
# starts a statement -- the input is rejected outright rather than escaped.
# Anything else exits 2 and reads nothing.
#
# Each function also reports md5(prosrc). That is the drift check this whole
# class needed: the same md5 on hosted and sovereign PROVES the two definitions
# are byte-identical, where "db-migrate exited 0" only reports that a script ran.
# =============================================================================
set -uo pipefail

MODE="${1:-feedback}"
DAYS="${2:-30}"
FUNCTIONS="${3:-}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

# The standing list. Asking for nothing in particular still asks these.
DEFAULT_FUNCTIONS='list_instance_members,my_church_instance_id,church_member_record_read,church_roll_read,my_church_access,claim_property_access,set_member_role'

case "$MODE" in
  feedback|definitions) ;;
  *) echo "::error::unknown mode '$MODE' (feedback|definitions)"; exit 2 ;;
esac
case "$DAYS" in
  ''|*[!0-9]*) echo "::error::days must be a whole number, got '$DAYS'"; exit 2 ;;
esac

# Reject rather than escape. Nothing matching this class can leave the IN list.
[ -n "$FUNCTIONS" ] || FUNCTIONS="$DEFAULT_FUNCTIONS"
# bash's own =~ and NOT grep: grep matches line by line, so an argument
# carrying a newline passes on its first line while smuggling a second one
# behind it. Caught by sovereign-reader-functions-arg.test.js, which runs this
# script rather than reading it. In [[ =~ ]] the anchors bind the whole string.
if ! [[ "$FUNCTIONS" =~ ^[a-z0-9_]+(,[a-z0-9_]+)*$ ]]; then
  echo "::error::functions must be comma-separated lowercase names matching [a-z0-9_], got '$FUNCTIONS' - nothing was read"
  exit 2
fi
# 'a,b' -> "'a','b'" for the IN list, built from the validated string only.
FUNC_IN="'$(printf '%s' "$FUNCTIONS" | sed "s/,/','/g")'"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## Sovereign read - NOT RUN"
  say ""
  say "NAS_SSH_KEY is not set, so the database the app reads could not be asked."
  say "An unasked database is never reported as known (DR-0076)."
  echo "::error::NAS_SSH_KEY missing - nothing was read"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT

# LogLevel=ERROR for the same reason sovereign-replay documents: a fresh runner
# has an empty known_hosts and ssh's "Permanently added" banner, merged into a
# captured value, reads as a failed probe on a working link.
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

if ! $SSH 'echo ok' 2>/dev/null | grep -q ok; then
  say "## Sovereign read - NAS UNREACHABLE"
  say ""
  say "The tailnet link to the NAS did not answer, so nothing was read."
  echo "::error::NAS unreachable - nothing was read"
  exit 3
fi

# QUOTED heredoc: what is written here is exactly what the NAS runs. An
# unquoted one expands locally first and a single missed backslash is a
# silently wrong answer rather than an error.
REMOTE_SCRIPT="$(mktemp)"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
ENV_FILE="${NAS_ENV:?NAS_ENV not passed through}"
MODE="${MODE:?MODE not passed through}"
DAYS="${DAYS:?DAYS not passed through}"
FUNC_IN="${FUNC_IN:?FUNC_IN not passed through}"

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

psql_q() {
  "$DOCKER" exec -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$1" 2>/dev/null && return 0
  sudo -n "$DOCKER" exec -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$1" 2>/dev/null
}

if [ "$MODE" = "feedback" ]; then
  # Content columns ONLY. No screenshot, no screenshots — not filtered out
  # later, never selected in the first place.
  echo "---ROWS---"
  psql_q "SELECT coalesce(json_agg(t ORDER BY t.submitted_at DESC), '[]'::json)::text FROM (
            SELECT submitted_at, display_name, app_version, which_tab,
                   feedback_text, sentiment, triage_status,
                   has_screenshot, screenshot_count
              FROM public.feedback
             WHERE coalesce(is_confidential, false) = false
               AND submitted_at >= now() - (${DAYS} || ' days')::interval
             ORDER BY submitted_at DESC
             LIMIT 200) t"
  echo "---COUNTS---"
  psql_q "SELECT 'total='||count(*)||
                 ' window='||count(*) FILTER (WHERE submitted_at >= now() - (${DAYS} || ' days')::interval)||
                 ' confidential_withheld='||count(*) FILTER (WHERE coalesce(is_confidential,false))||
                 ' newest='||coalesce(max(submitted_at)::text,'none')
            FROM public.feedback"
else
  echo "---DEFINITIONS---"
  # 'source_md5' is the drift check: identical md5 on hosted and sovereign
  # proves the two definitions are byte-identical (DR-0374). 'missing' names a
  # function the caller asked about that this database does not have at all --
  # silence would otherwise read as "fine".
  psql_q "SELECT coalesce(json_agg(json_build_object(
                   'name', p.proname,
                   'result', pg_get_function_result(p.oid),
                   'source_md5', md5(p.prosrc)) ORDER BY p.proname), '[]'::json)::text
            FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
             AND p.proname IN (${FUNC_IN})"
  echo "---MISSING---"
  psql_q "SELECT coalesce(string_agg(w.name, ' '), 'none')
            FROM (SELECT unnest(ARRAY[${FUNC_IN}]) AS name) w
           WHERE NOT EXISTS (
             SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = w.name)"
  echo "---LEDGER---"
  psql_q "SELECT 'sovereign_replay='||count(*) FROM public._sovereign_replay"
fi
REMOTE

OUT="$($SSH "NAS_ENV='$NAS_ENV' MODE='$MODE' DAYS='$DAYS' FUNC_IN=\"$FUNC_IN\" bash -s" < "$REMOTE_SCRIPT" 2>&1)"
RC=$?
rm -f "$REMOTE_SCRIPT"

if [ $RC -ne 0 ]; then
  say "## Sovereign read - FAILED"
  say ""
  say '```'
  say "$OUT"
  say '```'
  echo "::error::the sovereign read failed (rc=$RC)"
  exit "$RC"
fi

# MASKING, on the runner, over everything about to be printed. Same convention
# as nas-health.yml:501, widened to phone-shaped runs. A person writing feedback
# did not agree to have their address or number read into a CI log.
MASKED="$(printf '%s' "$OUT" \
  | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/<email masked>/g' \
  | sed -E 's/(\+?1[ .-]?)?\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}/<phone masked>/g')"

say "## Sovereign read - $MODE ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
say ""
say "Read from the database the APP reads, not the hosted project."
say ""
say '```'
say "$MASKED"
say '```'
