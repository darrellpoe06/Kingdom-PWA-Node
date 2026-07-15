#!/bin/sh
# =============================================================================
# test_run_ingest.sh -- proves the three brakes on run_ingest.sh actually CATCH
# (DR-0076 proven-to-catch). No network: the python loaders are replaced by a
# stub that exits 0, so this tests the BRAKE + CHAIN control flow only. POSIX sh.
#   sh test_run_ingest.sh
# =============================================================================
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Stub "python": ignores args, exits 0. Makes the chain "run" without network.
STUB="$TMP/py"
printf '#!/bin/sh\nexit 0\n' > "$STUB"
chmod +x "$STUB"

EV="$TMP/events/events.jsonl"
ok=0; fail=0
check() { # name  needle  present|absent
  _hay="$(cat "$EV" 2>/dev/null || true)"
  case "$3" in
    present) case "$_hay" in *"$2"*) echo "ok   $1"; ok=$((ok+1));; *) echo "FAIL $1 (missing: $2)"; fail=$((fail+1));; esac ;;
    absent)  case "$_hay" in *"$2"*) echo "FAIL $1 (present: $2)"; fail=$((fail+1));; *) echo "ok   $1"; ok=$((ok+1));; esac ;;
  esac
}
run() { # state-setup already done by caller
  rm -f "$EV" 2>/dev/null || true
  STATE_DIR="$TMP/state" EVENTS_DIR="$TMP/events" PY="$STUB" \
    sh "$HERE/run_ingest.sh" >/dev/null 2>&1 || true
}
reset_state() { rm -rf "$TMP/state"; mkdir -p "$TMP/state"; }

# --- Case A: SHIPS INERT -- kill-switch present (the shipped default) ----------
reset_state; touch "$TMP/state/KILL_SWITCH"; touch "$TMP/state/INGEST_ARMED"
run
check "A kill-switch => inert"        "kill-switch engaged" present
check "A kill-switch => never runs"   '"event":"go"'        absent
check "A kill-switch => no archive"   '"event":"done"'      absent

# --- Case B: not armed (no INGEST_ARMED) -> inert -----------------------------
reset_state   # no KILL_SWITCH, no INGEST_ARMED
run
check "B not armed => inert"          "not armed"           present
check "B not armed => never runs"     '"event":"go"'        absent

# --- Case C: ARMED (kill-switch removed + INGEST_ARMED) -> runs the chain ------
reset_state; touch "$TMP/state/INGEST_ARMED"
run
check "C armed => go"                 '"event":"go"'        present
check "C armed => dry-run by default" "mode=dry-run"        present
check "C armed => chain completes"    '"event":"done"'      present

# --- Case C2: armed + INGEST_COMMIT -> commit mode ----------------------------
reset_state; touch "$TMP/state/INGEST_ARMED"; touch "$TMP/state/INGEST_COMMIT"
run
check "C2 commit flag => commit mode" "mode=commit"         present

# --- Case D: SINGLE-FLIGHT LOCK held -> skip ----------------------------------
reset_state; touch "$TMP/state/INGEST_ARMED"; mkdir -p "$TMP/state/ingest.lock"
run
check "D lock held => skip"           "single-flight lock"  present
check "D lock held => does not run"   '"event":"go"'        absent

echo ""
if [ "$fail" -eq 0 ]; then echo "ALL PASS ($ok checks)"; exit 0; else echo "FAILURES: $fail"; exit 1; fi
