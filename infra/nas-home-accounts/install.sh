#!/bin/sh
# nas-home-accounts/install.sh -- rides the ALREADY-ARMED services-sync clock
# (DR-1121): every family member's logins on the home servers are made for
# them and shown to them in the app.
#
# Darrell 2026-10-19: "Your do everything so users can just use them... End to
# end workflows" and "Ready logins for the app automatically gets access....
# right". Each cycle runs ONE pass of home_accounts_sync.py: it reads the family
# roster from the app's database, makes a missing account on each home server
# that is up (Immich, Jellyfin, Audiobookshelf), and writes a home_accounts
# row per (person, service). Idempotent; never deletes.
#
# WHY A RIDER AND NOT A registry.json LOOP: the same reason as lesson-voice --
# install-clock.sh clocks services-sync, so a rider needs no new DSM entry.
#
# Brakes (DR-0248, deterministic class): budget 240 s inside the 480 s
# installer ceiling (SIGALRM inside the script, `timeout` around it), a
# single-flight lock, at most 12 accounts per pass. No credential = a named,
# quiet no-op (exit 0 with the why).
#
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (no transport of its
# own: it writes rows the app reads through /sb, and talks to the servers on
# loopback only).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-home-accounts"
STATE="${HOME_ACCOUNTS_STATE:-/volume1/docker/home-accounts}"
DB_SECRETS="${HOME_ACCOUNTS_DB_SECRETS:-/volume1/PoeTech/secrets/supabase.json}"
HOME_SECRETS="${HOME_ACCOUNTS_SECRETS:-/volume1/PoeTech/secrets/home-accounts.json}"
WALL=300

echo "== home-accounts: one pass =="
PY="$(command -v python3 || true)"
[ -n "$PY" ] || { echo "  python3 not found -- nothing done"; exit 0; }
if sudo -n true 2>/dev/null; then SUDO="sudo -n"; else SUDO=""; fi
$SUDO mkdir -p "$STATE"
if [ ! -s "$DB_SECRETS" ] && [ -z "$SUPABASE_URL" ] && [ ! -e "$REPO/infra/nas-loops/ARMED-BY-RECORD" ]; then
  echo "  no database credential ($DB_SECRETS absent, no SUPABASE_URL, not armed) -- quiet no-op"
  exit 0
fi
TIMEOUT=""
command -v timeout >/dev/null 2>&1 && TIMEOUT="timeout $WALL"
# shellcheck disable=SC2086
$TIMEOUT "$PY" -u "$SRC/home_accounts_sync.py" --run --db-secrets "$DB_SECRETS" --home-secrets "$HOME_SECRETS" --state "$STATE" || echo "  pass ended with status $? (the ledger at $STATE/last-pass.json says what it did)"
echo "== home-accounts: done =="
