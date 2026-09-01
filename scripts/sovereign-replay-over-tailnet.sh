#!/usr/bin/env bash
# =============================================================================
# sovereign-replay-over-tailnet.sh — land the repo's migrations on the database
# the APP READS, from a GitHub runner, over the team's own tailnet
# =============================================================================
# WHY THIS EXISTS. db-migrate.yml applies every migration through
# SUPABASE_DB_URL, which names the HOSTED project — while the app has read the
# SOVEREIGN stack since REPOINT-ARMED landed 2026-08-19. Nothing replayed
# migrations to the sovereign side, so a merged migration landed on a database
# the app no longer reads and CI stayed green either way (DR-0317).
#
# MEASURED 2026-09-01: 179 migrations in the repo, 151 on the sovereign
# database, 28 missing. 0150-0161 — the whole Poe Properties module — were among
# them, so rental_tenancies did not exist there and rentals had no
# showcase_order column. Darrell's Properties tab could not load at all, and his
# 13 properties sat behind a query the database was correctly rejecting.
# 0164-0166 (the Road-to-150 food log) were missing too: never only Properties.
#
# ONE SCRIPT, CALLED BY BOTH LANES, on purpose. db-migrate.yml calls it so every
# future migration lands on the live database automatically; sovereign-replay.yml
# calls it for a hand-dispatched backfill. Two copies of this ssh block in two
# workflows would be two things to keep in step, and the gap this closes was
# itself caused by two halves drifting apart.
#
# SAFE BY CONSTRUCTION, not by assertion:
#   * replay_migrations.sh is idempotent and ledger-driven — a file already in
#     public._schema_migrations is skipped, so a re-run is a no-op.
#   * ON_ERROR_STOP=1, filename order, stop-at-first-failure: a migration that
#     cannot apply NAMES ITSELF and nothing after it runs half-applied.
#   * The ledger is counted BEFORE and AFTER and both are printed, so the caller
#     reports what actually changed rather than that it "worked" (DR-0076 §1).
#   * Reads no human credential: the runner authenticates with NAS_SSH_KEY and
#     POSTGRES_PASSWORD is read from the NAS's own .env. Nobody types a password.
#
# Requires: NAS_SSH_KEY in the environment, and the tailnet already joined by
# the calling workflow (tailscale/github-action).
#
# Exits 0 only when the replay itself exited 0. Anything else is a real break
# and the caller must go red: a green lane over a database that is behind the
# repo is the exact lie this closes.
# =============================================================================
set -uo pipefail

NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_REPO="${NAS_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## Sovereign replay - NOT RUN"
  say ""
  say "NAS_SSH_KEY is not set, so the sovereign database could not be reached."
  say "An unmeasured database is never reported as up to date (DR-0076)."
  echo "::error::NAS_SSH_KEY missing - nothing was applied to the sovereign database"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT

# LogLevel=ERROR is correctness, not tidiness: a fresh runner has an empty
# known_hosts, so ssh prints a "Warning: Permanently added ..." banner on its
# first connection. Merged into a captured value it read as a failed probe on a
# working link, and would have entered the migration list as a phantom filename
# (both were live bugs in sovereign-drift.yml, fixed 2026-08-31). Reused here
# rather than rediscovered.
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

# Reachability first, separately, and never swallow the reason. MagicDNS is not
# always resolvable the instant tailscaled comes up, so one immediate attempt
# can fail on timing alone. Match on CONTAINS so no remote banner reads as a
# dead link.
probe=""
err=""
for _ in 1 2 3; do
  err=$($SSH "echo READY" 2>&1) || true
  case "$err" in *READY*) probe="READY"; break;; esac
  sleep 5
done

if [ "$probe" != "READY" ]; then
  say "## Sovereign replay - NOT RUN"
  say ""
  say "The NAS was not reachable over the tailnet after 3 attempts. Last error:"
  say ""
  say "    $err"
  say ""
  say "An unreachable database is never reported as up to date (DR-0076)."
  echo "::error::NAS unreachable - nothing was applied to the sovereign database"
  exit 3
fi

# QUOTED heredoc, and the two paths ride in as ENVIRONMENT on the ssh command
# line rather than being interpolated into the script body. An unquoted heredoc
# would expand locally first, so every remote $VAR needs a \$ and one missed
# backslash is a silently wrong result rather than an error — the three-quoting-
# layers hazard sovereign-drift.yml already documents. With the body quoted,
# what is written here is exactly what the NAS runs.
REMOTE_SCRIPT="$(mktemp)"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
REPO="${NAS_REPO:?NAS_REPO not passed through}"
ENV_FILE="${NAS_ENV:?NAS_ENV not passed through}"

PW=$(sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || PW=$(sudo -n sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" 2>/dev/null | tr -d '[:space:]')
[ -n "$PW" ] || { echo "could not read POSTGRES_PASSWORD from $ENV_FILE" >&2; exit 3; }

# DSM does not put docker on the PATH — "sudo: docker: command not found" is
# what sovereign-drift's run 33402087727 actually hit. This is the idiom the
# repo's own scripts already use (infra/nas-supabase/reset_phone_pin.sh).
DOCKER=$(command -v docker 2>/dev/null || true)
if [ -z "$DOCKER" ]; then
  for c in /usr/local/bin/docker /usr/bin/docker; do
    [ -x "$c" ] && DOCKER="$c" && break
  done
fi
[ -n "$DOCKER" ] || { echo "docker binary not found (PATH, /usr/local/bin, /usr/bin)" >&2; exit 4; }

count_ledger() {
  Q="select count(*) from public._schema_migrations"
  "$DOCKER" exec -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$Q" 2>/dev/null && return 0
  sudo -n "$DOCKER" exec -e PGPASSWORD="$PW" supabase-db psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A -c "$Q" 2>/dev/null
}

echo "LEDGER-BEFORE=$(count_ledger | tr -d '[:space:]')"

# The replay reads migration FILES from the NAS checkout, so it can only apply
# what that checkout actually holds. Pull first, and say which commit it is
# replaying from — a stale checkout would otherwise look like "no drift".
cd "$REPO" || { echo "repo not found at $REPO" >&2; exit 6; }
git pull --ff-only 2>&1 | tail -3
echo "REPO-HEAD=$(git rev-parse --short HEAD)"

echo "----- replay output -----"
sh "$REPO/infra/nas-supabase/replay_migrations.sh" 2>&1
rc=$?
echo "----- end replay (exit $rc) -----"

echo "LEDGER-AFTER=$(count_ledger | tr -d '[:space:]')"
exit $rc
REMOTE

ERRFILE="$(mktemp)"
OUT=$($SSH "NAS_REPO='$NAS_REPO' NAS_ENV='$NAS_ENV' bash -s" < "$REMOTE_SCRIPT" 2>"$ERRFILE")
rc=$?
errtxt=$(cat "$ERRFILE" 2>/dev/null)
rm -f "$REMOTE_SCRIPT" "$ERRFILE"

before=$(printf '%s\n' "$OUT" | sed -n 's/^LEDGER-BEFORE=//p' | tail -1)
after=$(printf '%s\n' "$OUT" | sed -n 's/^LEDGER-AFTER=//p' | tail -1)
head_sha=$(printf '%s\n' "$OUT" | sed -n 's/^REPO-HEAD=//p' | tail -1)

say "## Sovereign migration replay - $(date -u +%FT%TZ)"
say ""
say "- NAS checkout replayed from: ${head_sha:-unknown}"
say "- ledger rows BEFORE: ${before:-unknown}"
say "- ledger rows AFTER: ${after:-unknown}"
say ""
say "### replay output"
printf '%s\n' "$OUT" | while IFS= read -r l; do say "    $l"; done

if [ -n "$errtxt" ]; then
  say ""
  say "### stderr"
  printf '%s\n' "$errtxt" | while IFS= read -r l; do say "    $l"; done
fi

if [ "$rc" -ne 0 ]; then
  say ""
  say "The replay STOPPED at the first migration that could not apply. That file names itself in the output above, and nothing after it ran. The ledger numbers say exactly how far it got - this is the frontier, reported rather than rounded to zero (DR-0076)."
  echo "::error::sovereign replay exited $rc - the app's database is BEHIND the repo"
  exit 1
fi

say ""
say "The sovereign database now carries every migration this checkout holds."
exit 0
