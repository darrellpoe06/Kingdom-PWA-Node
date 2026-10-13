#!/usr/bin/env bash
# =============================================================================
# lessons-sync-over-tailnet.sh — land the code's lessons on the NAS copy, then
# read the copy back and prove it matches, lesson by lesson (DR-0677)
# =============================================================================
# The code is the master (Darrell 2026-09-29: "The apps code is needed to keep
# context!!!!!!!%"); the sovereign database holds a synchronized copy (0242).
#
# WHY THIS PATH, AND NOT THE NAS SERVICES-SYNC LOOP. Two lanes already write to
# the sovereign database; this rides the one that is PROVEN for it:
#   * db-migrate.yml's "Replay onto the sovereign database" step
#     (scripts/sovereign-replay-over-tailnet.sh): a GitHub runner joins the
#     tailnet, authenticates with NAS_SSH_KEY, and runs psql inside the
#     supabase-db container with the box's own POSTGRES_PASSWORD. It has landed
#     every migration since DR-0317, witnessed by sovereign-drift.
#   * The services-sync loop (infra/nas-loops/services.json) runs Python on the
#     NAS's own clock. Building the snapshot needs the course files EVALUATED
#     (they are JavaScript), and node on the NAS is not established — the NAS
#     lesson builder itself says its node layer runs "when node is on the box"
#     (PR #1837). So the runner, which has node, builds and gates the snapshot,
#     and only SQL crosses the tailnet.
#
# WHAT IT DOES (every step says what it saw; nothing is rounded to "ok"):
#   1. reachability probe (3 tries, the reason kept);
#   2. the table exists? (0242 lands through db-migrate on the same merge; if it
#      has not yet, this says so and exits 4 — the copy is UNKNOWN, not in step);
#   3. upload the gated sync SQL, apply it in ONE transaction (the gate trigger
#      refuses any row without a passed verdict over exactly its content);
#   4. read the whole copy back FROM THE NAS DATABASE, compare it with the code
#      on the runner (scripts/curriculum-cli.mjs --parity), and record the
#      verdict in curriculum_sync_runs on the NAS.
#
# Inputs (env): NAS_SSH_KEY, SYNC_SQL, READBACK_SQL, READBACK_OUT, COMMIT.
# Exit: 0 in step · 1 drift or a failed apply · 2 no key · 3 unreachable ·
#       4 the table is not there yet.
# =============================================================================
set -uo pipefail

NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## Lessons sync - NOT RUN"
  say "NAS_SSH_KEY is not set, so the NAS copy could not be reached. Its state is UNKNOWN, never reported as in step (DR-0076)."
  echo "::error::NAS_SSH_KEY missing - the NAS lesson copy is unknown"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

probe=""; err=""
for _ in 1 2 3; do
  err=$($SSH "echo READY" 2>&1) || true
  case "$err" in *READY*) probe="READY"; break;; esac
  sleep 5
done
if [ "$probe" != "READY" ]; then
  say "## Lessons sync - NOT RUN"
  say "The NAS was not reachable over the tailnet after 3 attempts. Last error: $err"
  echo "::error::NAS unreachable - the NAS lesson copy is unknown"
  exit 3
fi

# The NAS-side helper: psql inside the container, with the box's own password
# (the replay's idiom). QUOTED heredoc, so what is written here is exactly what
# the NAS runs; files ride up first and each step is one short ssh call.
HELPER="$(mktemp)"
cat > "$HELPER" <<'REMOTE'
set -u
NAS_ENV="${NAS_ENV:?}"
PATH=$PATH:/usr/local/bin:/usr/bin:/bin
PW=$(sed -n 's/^POSTGRES_PASSWORD=//p' "$NAS_ENV" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || PW=$(sudo -n sed -n 's/^POSTGRES_PASSWORD=//p' "$NAS_ENV" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || { echo "could not read POSTGRES_PASSWORD from $NAS_ENV" >&2; exit 3; }
DOCKER=$(command -v docker 2>/dev/null || true)
if [ -z "$DOCKER" ]; then for c in /usr/local/bin/docker /usr/bin/docker; do [ -x "$c" ] && DOCKER="$c" && break; done; fi
[ -n "$DOCKER" ] || { echo "docker binary not found" >&2; exit 4; }
SUDO=""
"$DOCKER" ps >/dev/null 2>&1 || SUDO="sudo -n"
run() { $SUDO "$DOCKER" exec -i -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -At "$@"; }
case "$1" in
  probe) run -c "select to_regclass('public.curriculum_lessons') is not null" ;;
  file)  run -f - < "$2" ;;
  *) echo "unknown step $1" >&2; exit 9 ;;
esac
REMOTE

RDIR="/tmp/poetech-lessons-sync-$$"
up() { $SSH "umask 077; mkdir -p $RDIR; cat > $RDIR/$2" < "$1"; }
step() { $SSH "NAS_ENV='$NAS_ENV' bash $RDIR/helper.sh $*"; }
cleanup_remote() { $SSH "rm -rf $RDIR" > /dev/null 2>&1 || true; rm -f "$HELPER"; }
trap 'rm -f "$KEYFILE"; cleanup_remote' EXIT
up "$HELPER" helper.sh || { say "could not place the helper on the NAS"; exit 1; }

# 2) Is the table there?
present=$(step probe 2>&1 | tail -1)
if [ "$present" != "t" ]; then
  say "## Lessons sync - NOT RUN"
  say "public.curriculum_lessons is not on the NAS database yet (migration 0242 lands through db-migrate on the same merge). Probe said: $present"
  echo "::error::0242 not on the sovereign database yet - the NAS lesson copy is unknown"
  exit 4
fi

# 3) Upload and apply, one transaction.
up "$SYNC_SQL" sync.sql || { say "upload of the sync SQL failed"; exit 1; }
APPLY=$(step file "$RDIR/sync.sql" 2>&1)
arc=$?
written=$(printf '%s\n' "$APPLY" | sed -n 's/^WRITTEN=//p' | tail -1)
removed=$(printf '%s\n' "$APPLY" | sed -n 's/^REMOVED=//p' | tail -1)
say "## Lessons sync - $(date -u +%FT%TZ)"
say ""
say "- code commit: ${COMMIT:-unknown}"
say "- lessons written (changed or new): ${written:-unknown}"
say "- public lessons withdrawn (no longer in the code): ${removed:-unknown}"
if [ "$arc" -ne 0 ]; then
  say ""
  say "The apply FAILED and rolled back (one transaction). Output:"
  printf '%s\n' "$APPLY" | tail -20 | while IFS= read -r l; do say "    $l"; done
  echo "::error::lessons sync apply failed - the NAS copy is unchanged"
  exit 1
fi

# 4) Read back FROM the NAS database; compare on the runner.
up "$READBACK_SQL" readback.sql
step file "$RDIR/readback.sql" > "$READBACK_OUT" 2>/dev/null
say "- read back from the NAS: $(wc -c < "$READBACK_OUT" | tr -d ' ') bytes"
( cd app && npx vite-node ../scripts/curriculum-cli.mjs --parity "$READBACK_OUT" ) > "$RUNNER_TEMP/parity.txt" 2>&1
prc=$?
grep -v '^PARITY-JSON=' "$RUNNER_TEMP/parity.txt" | head -60 | while IFS= read -r l; do say "    $l"; done
pj=$(sed -n 's/^PARITY-JSON=//p' "$RUNNER_TEMP/parity.txt" | tail -1)
verdict="in-step"; [ "$prc" -eq 0 ] || verdict="drift"
[ -n "$pj" ] || { pj='{"drift":[]}'; verdict="drift"; }
# The receipt, on the NAS itself (the OpsBoard reads curriculum_sync_runs).
DRIFT_JSON=$(printf '%s' "$pj" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(JSON.stringify(j.drift||[]).replace(/\x27/g,"\x27\x27"))})')
LESSONS=$(printf '%s' "$pj" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(String(JSON.parse(s).lessons||0))})')
printf "insert into curriculum_sync_runs (source_commit, kind, lessons, written, removed, drift, verdict) values ('%s', 'sync', %s, %s, %s, '%s'::jsonb, '%s');\n" \
  "$(printf '%s' "${COMMIT:-}" | tr -cd '0-9a-f')" "${LESSONS:-0}" "${written:-0}" "${removed:-0}" "$DRIFT_JSON" "$verdict" > "$RUNNER_TEMP/receipt.sql"
{ up "$RUNNER_TEMP/receipt.sql" receipt.sql && step file "$RDIR/receipt.sql" > /dev/null 2>&1; } \
  || say "(the receipt row could not be written; the verdict above stands)"
say ""
say "Verdict: **${verdict}**"
if [ "$prc" -ne 0 ]; then
  echo "::error::the NAS lesson copy DRIFTS from the code - see the findings above (lesson id and field)"
  exit 1
fi
exit 0
