# =============================================================================
# brakes.sh  --  the three brakes + the kill-switch (June-6 runaway rule).
# =============================================================================
# Binding rule (CLAUDE.md, "Autonomous Automation Requires Three Brakes"):
# no timer-driven / self-triggering automation runs autonomously without ALL
# THREE of these present. This file is the single place each brake is defined,
# so the supervisor can never act while one is missing.
#
#   1. BUDGET        per-task + daily $ ceiling for any vendor-LLM summoning.
#                    A run that reaches the ceiling refuses; it does not continue.
#   2. CONCURRENCY    single-instance lock. A second start that finds the lock
#                    held SKIPS; it never stacks on top of a live run.
#   3. KILL-SWITCH    a file that, when present, forces the orchestrator INERT
#                    (auto-pause). ENGAGED by default -- the bundle ships with it.
#
# Plus the ARM flag (default ABSENT = disarmed): autonomy + vendor-summoning stay
# OFF until someone explicitly arms. Shipping inert is non-negotiable.
#
# POSIX sh (busybox-compatible). All state is local files under ./state.
# =============================================================================

STATE_DIR="${STATE_DIR:-/state}"
LOCK_DIR="$STATE_DIR/orchestrator.lock"        # mkdir = atomic single-instance lock
KILL_SWITCH_FILE="$STATE_DIR/KILL_SWITCH"      # present  => INERT (engaged)
ARMED_FILE="$STATE_DIR/ARMED"                  # present  => armed (ships absent)

BUDGET_PER_TASK_USD="${BUDGET_PER_TASK_USD:-0}"
BUDGET_DAILY_USD="${BUDGET_DAILY_USD:-0}"

# --- 3. KILL-SWITCH ---------------------------------------------------------
kill_switch_engaged() { [ -f "$KILL_SWITCH_FILE" ]; }

# --- ARM flag ---------------------------------------------------------------
is_armed() { [ -f "$ARMED_FILE" ]; }

# --- 2. CONCURRENCY (single-instance) ---------------------------------------
# mkdir is atomic on POSIX filesystems: exactly one caller wins the create.
acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "$$" > "$LOCK_DIR/pid" 2>/dev/null || true
    return 0
  fi
  return 1
}
release_lock() { rm -rf "$LOCK_DIR" 2>/dev/null || true; }

# --- 1. BUDGET --------------------------------------------------------------
# Daily spend is accumulated in a per-day file (UTC). Skeleton: no vendor is
# summoned yet, so record_spend is wired but unused. The ceiling check is real
# and is the gate any future summon must pass FIRST.
_spend_file() { echo "$STATE_DIR/spend-$(date -u +%F).txt"; }

budget_spent_today() {
  _f="$(_spend_file)"
  if [ -f "$_f" ]; then cat "$_f"; else echo "0"; fi
}

# record_spend <usd-amount>  -- append to today's accumulator (integer cents-safe
# arithmetic kept simple here; the skeleton treats values as whole/dollar floats
# only for logging. A real summon path replaces this with exact accounting).
record_spend() {
  _amt="${1:-0}"
  _f="$(_spend_file)"
  _cur="$(budget_spent_today)"
  awk -v a="$_cur" -v b="$_amt" 'BEGIN{ printf "%.4f", a + b }' > "$_f"
}

# budget_ok  -- true only if BOTH ceilings are set (> 0) AND today's spend is
# below the daily ceiling. An unset/zero ceiling is treated as NOT-ok: a missing
# budget is a missing brake, and a missing brake means do not act.
budget_ok() {
  awk -v per="$BUDGET_PER_TASK_USD" -v day="$BUDGET_DAILY_USD" -v spent="$(budget_spent_today)" \
    'BEGIN{ if (per+0 <= 0 || day+0 <= 0) exit 1; if (spent+0 >= day+0) exit 1; exit 0 }'
}

# --- Composite gate ---------------------------------------------------------
# All brakes must be GO before the orchestrator may act autonomously. Returns 0
# only when: kill-switch CLEAR, ARM flag SET, and budget OK. (Lock is acquired
# once at startup, not re-checked per tick.)
all_brakes_go() {
  if kill_switch_engaged; then return 1; fi
  if ! is_armed;          then return 1; fi
  if ! budget_ok;         then return 1; fi
  return 0
}

# Human-readable reason the orchestrator is inert (for the event log).
inert_reason() {
  if kill_switch_engaged; then echo "kill-switch engaged"; return; fi
  if ! is_armed;          then echo "disarmed (no ARM flag)"; return; fi
  if ! budget_ok;         then echo "budget brake (ceiling unset or daily limit reached)"; return; fi
  echo "all brakes clear"
}
