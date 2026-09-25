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
#         sovereign-read-over-tailnet.sh definitions [days] [functions]
#         sovereign-read-over-tailnet.sh tables [days] [functions] [tables]
#         sovereign-read-over-tailnet.sh instances [days] [functions] [tables]
#
# WHICH INSTANCE HOLDS THE ROWS (added 2026-09-14, after real data loss). Every
# sync in the app filters `.eq('instance_id', <the instance it resolves>)`, so a
# row in the WRONG instance is invisible to the surface that owns it -- and
# indistinguishable, on screen, from a row that does not exist. A row count
# cannot see this: 13 rentals rows read as healthy whether or not the family
# instance can reach any of them. `instances` mode reports each instance's slug
# beside how many rows of the asked-about tables point at it, so "the doors are
# no longer where the books are" is a measurement rather than a deduction from
# a migration file. Slugs and counts only; no row contents.
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
TABLES="${4:-}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

# The standing list. Asking for nothing in particular still asks these.
DEFAULT_FUNCTIONS='list_instance_members,my_church_instance_id,church_member_record_read,church_roll_read,my_church_access,claim_property_access,set_member_role'

# The standing TABLE list. A function can exist while the table it reads does
# not, and a feature whose table is missing on the sovereign side fails on the
# first write with no error the user ever sees -- which is how the Guest ready
# checklist could have shipped writing into nothing. Asking for nothing in
# particular still asks these.
DEFAULT_TABLES='board_tasks,rentals,rental_tenancies,property_rooms,feedback'

case "$MODE" in
  feedback|definitions|tables|instances|intake) ;;
  *) echo "::error::unknown mode '$MODE' (feedback|definitions|tables|instances|intake)"; exit 2 ;;
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
# Same rule for tables: REJECT rather than escape. [a-z0-9_] cannot express a
# quote, a space, a semicolon or a comment marker, so no caller input can close
# the IN list and start a statement. Anchored in [[ =~ ]], not grep, so an
# argument carrying a newline cannot smuggle a second line past the first.
[ -n "$TABLES" ] || TABLES="$DEFAULT_TABLES"
if ! [[ "$TABLES" =~ ^[a-z0-9_]+(,[a-z0-9_]+)*$ ]]; then
  echo "::error::tables must be comma-separated lowercase names matching [a-z0-9_], got '$TABLES' - nothing was read"
  exit 2
fi

# 'a,b' -> "'a','b'" for the IN list, built from the validated string only.
FUNC_IN="'$(printf '%s' "$FUNCTIONS" | sed "s/,/','/g")'"
TABLE_IN="'$(printf '%s' "$TABLES" | sed "s/,/','/g")'"

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
TABLE_IN="${TABLE_IN:?TABLE_IN not passed through}"

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

# A FAILED QUERY MUST NOT LOOK LIKE AN EMPTY ANSWER (2026-09-14). Both attempts
# sent stderr to /dev/null and returned whatever they had, so a query with a
# syntax error printed NOTHING under its own section heading -- and nothing,
# under a heading, reads exactly like "asked, and the database holds none."
# That is the failure this whole script exists to prevent, living inside the
# script itself: it was caught the first time the new instances mode ran and
# printed an empty ---INSTANCES--- block. A query that did not run now says so.
psql_q() {
  local out err rc
  err=$(mktemp)
  out=$("$DOCKER" exec -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$1" 2>"$err")
  rc=$?
  if [ "$rc" -ne 0 ]; then
    out=$(sudo -n "$DOCKER" exec -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$1" 2>"$err")
    rc=$?
  fi
  if [ "$rc" -ne 0 ]; then
    echo "---QUERY-FAILED--- $(head -c 400 "$err" | tr '\n' ' ')"
    rm -f "$err"
    return 1
  fi
  rm -f "$err"
  printf '%s\n' "$out"
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
elif [ "$MODE" = "intake" ]; then
  # INTAKE CENSUS (DR-0625): every non-confidential feedback row, and every
  # door_feedback row when that table exists, handed to the RUNNER as one JSON
  # document between markers. The runner categorizes them with the app's own
  # module (scripts/intake-census.mjs) and prints counts only; these raw rows
  # are cut out of the output before anything is printed (see INTAKE below).
  echo "---INTAKE-JSON-BEGIN---"
  psql_q "SELECT json_build_object(
            'feedback', (SELECT coalesce(json_agg(t ORDER BY t.submitted_at DESC), '[]'::json) FROM (
               SELECT id, submitted_at, which_tab, feedback_text, triage_status, triage_notes,
                      has_screenshot, screenshot_count
                 FROM public.feedback
                WHERE coalesce(is_confidential, false) = false) t),
            'door', CASE WHEN to_regclass('public.door_feedback') IS NULL THEN '[]'::json
                         ELSE (SELECT coalesce(json_agg(d), '[]'::json) FROM (SELECT id, body, status, created_at FROM public.door_feedback) d) END
          )::text"
  echo "---INTAKE-JSON-END---"
elif [ "$MODE" = "instances" ]; then
  echo "---INSTANCES---"
  # Each instance, with how many rows of each asked-about table point at it.
  # This is the question a row count cannot answer: rentals held 13 rows while
  # the family-OS sync -- which filters on the FAMILY instance -- could reach
  # none of them, because 0207 moved every door into a landlord instance of its
  # own. On screen that is identical to having no doors.
  # A FIXED set of instance-scoped tables, not the `tables` argument: the point
  # is WHERE the family's own records live, and that set is known. Counts and
  # slugs only -- no row contents, same withholding as tables mode.
  psql_q "SELECT coalesce(json_agg(s ORDER BY s.slug), '[]'::json)::text FROM (
            SELECT i.slug,
                   i.name,
                   i.instance_type,
                   (SELECT count(*) FROM public.instance_members m WHERE m.instance_id = i.id) AS members,
                   (SELECT count(*) FROM public.rentals r      WHERE r.instance_id  = i.id) AS rentals,
                   (SELECT count(*) FROM public.transactions t WHERE t.instance_id  = i.id) AS transactions,
                   (SELECT count(*) FROM public.accounts a     WHERE a.instance_id  = i.id) AS accounts,
                   (SELECT count(*) FROM public.entities e     WHERE e.instance_id  = i.id) AS entities,
                   (SELECT count(*) FROM public.leases l       WHERE l.instance_id  = i.id) AS leases,
                   (SELECT count(*) FROM public.renters rn     WHERE rn.instance_id = i.id) AS renters
              FROM public.instances i) s"
  echo "---DEFAULT-INSTANCE-FN---"
  # Which instance the app's own resolver hands a caller. Every family-OS sync
  # filters on this, so it is half of the answer -- the other half is the rows
  # above. Reported as the function's existence + md5, never executed here:
  # running it would join or create an instance as whoever this ssh session is.
  psql_q "SELECT coalesce(string_agg(p.proname||' md5='||md5(p.prosrc), ' '), 'absent')
            FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'join_default_instance'"
  echo "---LEDGER---"
  psql_q "SELECT 'sovereign_replay='||count(*) FROM public._sovereign_replay"
elif [ "$MODE" = "tables" ]; then
  echo "---TABLES---"
  # Does the table EXIST here, is RLS on, and does it carry policies? A table
  # present with RLS off, or on with zero policies, is a different and worse
  # answer than absent -- so all three are reported rather than a bare boolean.
  # No row CONTENTS are read in this mode; a count is not a record.
  #
  # WHY 'rows' IS NOT ENOUGH (added 2026-09-14, after a real data-loss report).
  # Darrell reported his wife's rental doors and tenant information gone. Asked
  # of this database, every tenant table answered 'rows: 0' -- and n_live_tup
  # ALONE CANNOT TELL THE TWO CASES APART:
  #
  #   nothing was ever written here      -> 0 live, 0 inserted, 0 deleted
  #   rows were written, then deleted    -> 0 live, N inserted, N deleted
  #
  # Those are opposite findings. One is a feature that never saved; the other is
  # data loss. Reporting only the live count leaves the question a person asked
  # unanswerable, and an unanswerable question gets answered by guessing -- which
  # is what DR-0076 exists to stop. So the counters come too: ever_inserted,
  # ever_updated, ever_deleted, from the same stats view.
  #
  # Their honest limit, stated because it changes how they are read: these are
  # cumulative counters that a statistics RESET or a fresh replica sets back to
  # zero, and TRUNCATE empties a table without incrementing ever_deleted. So
  # nonzero ever_inserted is PROOF a write reached the table; zero is strong but
  # not absolute evidence that none ever did. stats_reset is reported alongside
  # so nobody reads a reset counter as history (unknown provenance never reads
  # as fact -- DR-0125's freshness rule, one layer down).
  psql_q "SELECT coalesce(json_agg(json_build_object(
                   'name', c.relname,
                   'columns', (SELECT count(*) FROM pg_attribute a
                                WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped),
                   'rls_enabled', c.relrowsecurity,
                   'policies', (SELECT count(*) FROM pg_policy pol WHERE pol.polrelid = c.oid),
                   'rows', (SELECT n_live_tup FROM pg_stat_user_tables st WHERE st.relid = c.oid),
                   'ever_inserted', (SELECT n_tup_ins FROM pg_stat_user_tables st WHERE st.relid = c.oid),
                   'ever_updated', (SELECT n_tup_upd FROM pg_stat_user_tables st WHERE st.relid = c.oid),
                   'ever_deleted', (SELECT n_tup_del FROM pg_stat_user_tables st WHERE st.relid = c.oid)
                 ) ORDER BY c.relname), '[]'::json)::text
            FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r'
             AND c.relname IN (${TABLE_IN})"
  echo "---POLICIES---"
  # WHAT IS ACTUALLY ENFORCED (Darrell, 2026-09-22: "What's enforced?!").
  #
  # The count above said voice_profiles carries ELEVEN policies while migration
  # 0047 creates FOUR, and no other migration in this repo names that table --
  # the two dynamic policy loops (0077, 0082) iterate explicit arrays that
  # exclude it, and there is no catalog-driven loop. A count cannot close that
  # gap. Seven policies existing that the repo does not create is either
  # harmless history or a live rule nobody can read in source control, and the
  # difference matters on a table that holds consent.
  #
  # So the NAMES come back, with the command each one covers, the roles it
  # applies to, and the USING / WITH CHECK expressions -- which is the whole of
  # what a policy enforces. Read-only catalog query; no row contents.
  psql_q "SELECT c.relname || ' | ' || pol.polname
                 || ' | ' || CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                                             WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                                             ELSE 'ALL' END
                 || ' | roles=' || coalesce((SELECT string_agg(r.rolname, ',' ORDER BY r.rolname)
                                               FROM pg_roles r WHERE r.oid = ANY(pol.polroles)), 'public')
                 || ' | using=' || coalesce(pg_get_expr(pol.polqual, pol.polrelid), '-')
                 || ' | check=' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '-')
            FROM pg_policy pol
            JOIN pg_class c ON c.oid = pol.polrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relname IN (${TABLE_IN})
           ORDER BY c.relname, pol.polname"
  echo "---GRANTS---"
  # RLS gates ROWS; a GRANT is what reaches the table at all, and the two fail
  # in completely different ways. This is also the open question from the same
  # day: nas-health's UUID census hit 'permission denied for table
  # voice_profiles' as supabase_admin while the catalog read fine, which is the
  # signature of a missing table-level grant rather than a policy refusal.
  psql_q "SELECT table_name || ' | ' || grantee || ' | ' || string_agg(privilege_type, ',' ORDER BY privilege_type)
            FROM information_schema.role_table_grants
           WHERE table_schema = 'public' AND table_name IN (${TABLE_IN})
           GROUP BY table_name, grantee
           ORDER BY table_name, grantee"
  echo "---MISSING---"
  # Names the caller asked about that this database does not have. Silence would
  # otherwise read as "fine" -- the exact failure this mode exists to prevent.
  psql_q "SELECT coalesce(string_agg(w.name, ' '), 'none')
            FROM (SELECT unnest(ARRAY[${TABLE_IN}]) AS name) w
           WHERE NOT EXISTS (
             SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = w.name)"
  echo "---STATS-RESET---"
  # When these counters last started from zero. 'never' means they are the full
  # history of the database; a date means ever_inserted counts only since then.
  psql_q "SELECT coalesce(max(stats_reset)::text, 'never') FROM pg_stat_database WHERE datname = current_database()"
  echo "---LEDGER---"
  psql_q "SELECT 'sovereign_replay='||count(*) FROM public._sovereign_replay"
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

OUT="$($SSH "NAS_ENV='$NAS_ENV' MODE='$MODE' DAYS='$DAYS' FUNC_IN=\"$FUNC_IN\" TABLE_IN=\"$TABLE_IN\" bash -s" < "$REMOTE_SCRIPT" 2>&1)"
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

# INTAKE: the rows above are data for the census, never for the log. Cut them
# out, categorize them here on the runner, and print the census in their place.
if [ "$MODE" = "intake" ]; then
  ROWS_FILE="$(mktemp)"
  printf '%s\n' "$OUT" | sed -n '/^---INTAKE-JSON-BEGIN---$/,/^---INTAKE-JSON-END---$/p' | sed '1d;$d' > "$ROWS_FILE"
  if ! grep -q '^{' "$ROWS_FILE"; then
    rm -f "$ROWS_FILE"
    say "## Sovereign read - intake FAILED"
    say ""
    say "The rows did not come back as one JSON document, so nothing is counted (DR-0076)."
    say '```'
    say "$(printf '%s\n' "$OUT" | grep -v '^{' | head -20)"
    say '```'
    echo "::error::intake rows unreadable"
    exit 4
  fi
  CENSUS="$(node "$(dirname "$0")/intake-census.mjs" "$ROWS_FILE" 2>&1)"
  CRC=$?
  rm -f "$ROWS_FILE"
  OUT="$(printf '%s\n' "$OUT" | sed '/^---INTAKE-JSON-BEGIN---$/,/^---INTAKE-JSON-END---$/d')
---INTAKE-CENSUS---
$CENSUS"
  if [ $CRC -ne 0 ]; then echo "::error::the intake census failed (rc=$CRC)"; fi
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
