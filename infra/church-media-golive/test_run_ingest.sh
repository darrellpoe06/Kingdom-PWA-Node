#!/bin/sh
# =============================================================================
# test_run_ingest.sh -- proves run_ingest.sh RUNS by default and that its
# malfunction brakes still catch (DR-0076 proven-to-catch, DR-0186). No network:
# the python loaders are a stub that exits 0, so this tests brake + chain control
# flow only. POSIX sh.  sh test_run_ingest.sh
# =============================================================================
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

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
run() {
  rm -f "$EV" 2>/dev/null || true
  STATE_DIR="$TMP/state" EVENTS_DIR="$TMP/events" PY="$STUB" \
    sh "$HERE/run_ingest.sh" >/dev/null 2>&1 || true
}
reset_state() { rm -rf "$TMP/state"; mkdir -p "$TMP/state"; }

# --- Case A: RUNS by default (no arming ceremony) -> commits to production -----
reset_state
run
check "A default => runs"                 '"event":"go"'   present
check "A default => commit (production)"  "mode=commit"    present
check "A default => chain completes"      '"event":"done"' present

# --- Case B: DRY-RUN override (rehearsal, no writes) ---------------------------
reset_state
rm -f "$EV" 2>/dev/null || true
STATE_DIR="$TMP/state" EVENTS_DIR="$TMP/events" PY="$STUB" INGEST_DRYRUN=1 \
  sh "$HERE/run_ingest.sh" >/dev/null 2>&1 || true
check "B dryrun flag => dry-run mode"      "mode=dry-run"  present
check "B dryrun flag => still runs"        '"event":"go"'  present

# --- Case C: KILL-SWITCH (the stop valve) -> halts instantly -------------------
reset_state; touch "$TMP/state/KILL_SWITCH"
run
check "C kill-switch => stopped"           "kill-switch engaged" present
check "C kill-switch => does NOT run"      '"event":"go"'  absent
check "C kill-switch => no archive"        '"event":"done"' absent

# --- Case D: SINGLE-FLIGHT LOCK held -> skip (never stacks) --------------------
reset_state; mkdir -p "$TMP/state/ingest.lock"
run
check "D lock held => skip"                "single-flight lock" present
check "D lock held => does not run"        '"event":"go"'  absent

echo ""
if [ "$fail" -eq 0 ]; then echo "ALL PASS ($ok checks)"; exit 0; else echo "FAILURES: $fail"; exit 1; fi
