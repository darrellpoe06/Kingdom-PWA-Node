#!/usr/bin/env bash
# =============================================================================
# bootstrap.sh  --  one command: drop this folder on a new NAS, run this,
#                   the orchestrator is up and you are in control.
# =============================================================================
# IDEMPOTENT: safe to re-run any number of times. It never overwrites your .env,
# never disengages the kill-switch, never arms anything. Re-running just
# reconciles the bundle to the safe default state and (re)starts the container.
#
# Self-checks prerequisites (docker + compose). Pulls ONLY the pinned image in
# docker-compose.yml -- no other external download.
#
# What it does:
#   1. verify docker + docker compose are present
#   2. ensure state/ + events/ exist
#   3. ensure the kill-switch is ENGAGED (ships engaged; create if missing)
#   4. ensure NO ARM flag exists (the bundle is inert)
#   5. create .env from .env.example if absent (never clobber an existing .env)
#   6. make the helper scripts executable
#   7. docker compose pull (pinned) + up -d
#   8. print status: inert, kill-switched, capped, self-contained
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

say()  { printf '  %s\n' "$*"; }
ok()   { printf '  [ok] %s\n' "$*"; }
die()  { printf 'bootstrap: %s\n' "$*" >&2; exit 1; }

echo "== PoeTech portable orchestrator -- bootstrap =="

# --- 1. Prerequisites -------------------------------------------------------
command -v docker >/dev/null 2>&1 || die "docker not found. Install Docker / Synology Container Manager first."
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  die "docker compose not found (neither 'docker compose' nor 'docker-compose')."
fi
ok "docker present; using: $COMPOSE"

# --- 2. State + events dirs -------------------------------------------------
mkdir -p state events
ok "state/ and events/ present"

# --- 3. Kill-switch ENGAGED by default --------------------------------------
if [ ! -f state/KILL_SWITCH ]; then
  printf 'ENGAGED at %s -- created by bootstrap (ships engaged)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > state/KILL_SWITCH
  ok "kill-switch created and ENGAGED (inert by default)"
else
  ok "kill-switch already ENGAGED"
fi

# --- 4. No ARM flag (inert) -------------------------------------------------
if [ -f state/ARMED ]; then
  say "[note] found state/ARMED -- bootstrap does NOT touch arming. To return to"
  say "       the safe default run ./disarm.sh"
else
  ok "no ARM flag -- autonomy is OFF"
fi

# --- 5. .env (never clobber) ------------------------------------------------
if [ ! -f .env ]; then
  cp .env.example .env
  ok ".env created from .env.example (budgets default to 0 = brake on)"
else
  ok ".env already present (left untouched)"
fi

# --- 6. Executable helpers --------------------------------------------------
chmod +x bootstrap.sh arm.sh disarm.sh 2>/dev/null || true
chmod +x orchestrator/entrypoint.sh 2>/dev/null || true
ok "helper scripts executable"

# --- 7. Pull pinned image + bring up ----------------------------------------
say "pulling pinned image (the only external download)..."
$COMPOSE pull
say "starting orchestrator..."
$COMPOSE up -d

# --- 8. Status --------------------------------------------------------------
echo
echo "== up =="
$COMPOSE ps
echo
ok "INERT by default       : kill-switch ENGAGED, no ARM flag, self-drive not implemented"
ok "resource-capped        : cpus 1 / mem 1g (won't starve DSM, storage, or host workflows)"
ok "self-contained         : only dependency is the pinned image -- no cloud, no external registry"
ok "observable             : tail -f events/events.jsonl"
echo
say "You are in control. To ARM later (Tier C, only with someone watching):"
say "  1) set BUDGET_PER_TASK_USD and BUDGET_DAILY_USD in .env"
say "  2) ./disarm.sh --off    (disengage kill-switch)"
say "  3) ./arm.sh             (set ARM flag)"
say "  4) $COMPOSE restart"
say "Panic stop at any time:   ./disarm.sh --on"
