# =============================================================================
# eventlog.sh  --  append-only JSONL event log (local to the bundle).
# =============================================================================
# Observability for the portable orchestrator. One JSON object per line, append
# only, never rewritten. Lives under the bundle's mounted ./events volume so it
# survives container restarts and travels WITH the bundle (no external sink, no
# database, no network -- the self-contained guarantee).
#
# POSIX sh (busybox-compatible). No jq, no external tools.
#
#   log_event <event> <detail>
#
# Fields: ts (UTC ISO-8601), node, agent, event, armed, kill_switch, detail.
# =============================================================================

EVENTS_DIR="${EVENTS_DIR:-/events}"
EVENT_LOG="${EVENT_LOG:-$EVENTS_DIR/events.jsonl}"

# Minimal JSON-string escaper: backslash, double-quote, tab, newline -> safe.
_json_escape() {
  printf '%s' "$1" \
    | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/\\t/g' \
    | tr '\n' ' '
}

log_event() {
  _event="$1"
  _detail="${2:-}"
  mkdir -p "$EVENTS_DIR" 2>/dev/null || true

  _ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  # Gate state, read fresh each event so the log reflects reality at write time.
  if [ -f "${STATE_DIR:-/state}/KILL_SWITCH" ]; then _ks="engaged"; else _ks="clear"; fi
  if [ -f "${STATE_DIR:-/state}/ARMED" ]; then _armed="true"; else _armed="false"; fi

  printf '{"ts":"%s","node":"%s","agent":"%s","event":"%s","armed":%s,"kill_switch":"%s","detail":"%s"}\n' \
    "$_ts" \
    "$(_json_escape "${NODE_NAME:-portable-node}")" \
    "$(_json_escape "${AGENT_NAME:-orchestrator}")" \
    "$(_json_escape "$_event")" \
    "$_armed" \
    "$_ks" \
    "$(_json_escape "$_detail")" \
    >> "$EVENT_LOG"
}
