# =============================================================================
# brakes.sh  --  the Cage brakes for the on-church-network agent runner.
# =============================================================================
# Binding rule (CLAUDE.md, "Autonomous Automation Requires Three Brakes"): no
# timer-driven / self-triggering automation runs autonomously without ALL THREE
# of budget + concurrency-lock + kill-switch present. This runner is timer-fired
# (DSM Task Scheduler), so it obeys the rule even though its core capability --
# the LAN probe -- is strictly read-only.
#
# This file mirrors infra/ai-orchestrator/portable/orchestrator/lib/brakes.sh,
# specialized for the runner's TWO privilege tiers:
#
#   PROBE    (read-only LOOK at the church LAN) needs:
#              kill-switch CLEAR + PROBE_ARMED + step budget set/not-exceeded
#              + the single-flight lock.
#   DISPATCH (send work to a GPU tower / summon an LLM worker) needs ALL of the
#              probe brakes PLUS DISPATCH_ARMED + a $ budget set and under ceiling.
#
# SHIPS INERT: state/KILL_SWITCH present (engaged) + no PROBE_ARMED + no
# DISPATCH_ARMED + zero budgets => every gate is closed. Nothing runs until
# Darrell removes the kill-switch and arms, with someone watching.
#
# POSIX sh (busybox-compatible). All state is local files under ./state. ASCII only.
# =============================================================================

STATE_DIR="${STATE_DIR:-/state}"
LOCK_DIR="$STATE_DIR/church-runner.lock"          # mkdir = atomic single-instance lock
KILL_SWITCH_FILE="$STATE_DIR/KILL_SWITCH"         # present  => INERT (engaged; ships present)
PROBE_ARMED_FILE="$STATE_DIR/PROBE_ARMED"         # present  => may LOOK   (ships absent)
DISPATCH_ARMED_FILE="$STATE_DIR/DISPATCH_ARMED"   # present  => may DISPATCH (ships absent)

# Step budget: the probe plan may emit at most this many read-only steps per run.
# 0 = unset = a missing brake = do not run (fail closed).
PROBE_MAX_STEPS="${PROBE_MAX_STEPS:-0}"
# $ budget for the dispatch tier only (vendor/LLM-worker summoning).
BUDGET_PER_TASK_USD="${BUDGET_PER_TASK_USD:-0}"
BUDGET_DAILY_USD="${BUDGET_DAILY_USD:-0}"

# --- KILL-SWITCH ------------------------------------------------------------
kill_switch_engaged() { [ -f "$KILL_SWITCH_FILE" ]; }

# --- ARM flags --------------------------------------------------------------
probe_armed()    { [ -f "$PROBE_ARMED_FILE" ]; }
dispatch_armed() { [ -f "$DISPATCH_ARMED_FILE" ]; }

# --- CONCURRENCY (single-instance) ------------------------------------------
acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "$$" > "$LOCK_DIR/pid" 2>/dev/null || true
    return 0
  fi
  return 1
}
release_lock() { rm -rf "$LOCK_DIR" 2>/dev/null || true; }

# --- BUDGET (steps) ---------------------------------------------------------
# The probe's "budget" is a deterministic step ceiling (not a $ amount): a run is
# bounded to at most PROBE_MAX_STEPS read-only checks and then stops.
step_budget_ok() {
  awk -v max="$PROBE_MAX_STEPS" 'BEGIN{ if (max+0 <= 0) exit 1; exit 0 }'
}

# --- BUDGET ($, dispatch tier) ----------------------------------------------
_spend_file() { echo "$STATE_DIR/spend-$(date -u +%F).txt"; }
budget_spent_today() {
  _f="$(_spend_file)"
  if [ -f "$_f" ]; then cat "$_f"; else echo "0"; fi
}
record_spend() {
  _amt="${1:-0}"; _f="$(_spend_file)"; _cur="$(budget_spent_today)"
  awk -v a="$_cur" -v b="$_amt" 'BEGIN{ printf "%.4f", a + b }' > "$_f"
}
usd_budget_ok() {
  awk -v per="$BUDGET_PER_TASK_USD" -v day="$BUDGET_DAILY_USD" -v spent="$(budget_spent_today)" \
    'BEGIN{ if (per+0 <= 0 || day+0 <= 0) exit 1; if (spent+0 >= day+0) exit 1; exit 0 }'
}

# --- Composite gates --------------------------------------------------------
# PROBE may proceed only when: kill-switch CLEAR + PROBE_ARMED + step budget set.
# (Lock is acquired once per run by run.sh, not re-checked here.)
probe_brakes_go() {
  if kill_switch_engaged; then return 1; fi
  if ! probe_armed;       then return 1; fi
  if ! step_budget_ok;    then return 1; fi
  return 0
}
# DISPATCH is a strict superset: probe gate PLUS DISPATCH_ARMED + $ budget.
dispatch_brakes_go() {
  if ! probe_brakes_go;   then return 1; fi
  if ! dispatch_armed;    then return 1; fi
  if ! usd_budget_ok;     then return 1; fi
  return 0
}

# Human-readable reason the runner is inert (for the event log).
inert_reason() {
  if kill_switch_engaged; then echo "kill-switch engaged"; return; fi
  if ! probe_armed;       then echo "disarmed (no PROBE_ARMED flag)"; return; fi
  if ! step_budget_ok;    then echo "step budget brake (PROBE_MAX_STEPS unset)"; return; fi
  echo "probe brakes clear"
}
