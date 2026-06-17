# =============================================================================
# wake.sh  --  the always-on wake-scheduler (INERT skeleton, POSIX sh, no GPU).
# =============================================================================
# The lightweight, dependency-free half of the wake / handoff bridge. It runs
# inside the capped 1-CPU alpine supervisor every tick: scan the handoff inbox,
# decide which handoffs are DUE, and log intent to the append-only event log.
#
# It NEVER summons a vendor. The self-contained bundle carries no HTTP/vendor
# stack (the self-contained guarantee); the live summon is host-side Node
# (scripts/wake-router.mjs), invoked only when fully armed + all brakes GO. Here,
# the scheduler logs `wake_due` / `wake_pending` / `wake_deferred` and stands by.
#
# Time comparison is dependency-free: UTC ISO-8601 strings in the canonical
# `YYYY-MM-DDTHH:MM:SSZ` form sort LEXICOGRAPHICALLY in the same order as time,
# so `at`/`not_before` are evaluated with plain string comparison -- no `date -d`
# (busybox can't parse arbitrary ISO). `after_seconds` + `condition` drivers are
# DEFERRED to the host router (handoff.mjs has the tested, authoritative logic).
#
# Contract: ../../handoff/HANDOFF-CONTRACT.md  +  ../../handoff/schema.json
# POSIX sh (busybox). No jq, no node, no network.
# =============================================================================

STATE_DIR="${STATE_DIR:-/state}"
HANDOFF_INBOX="${HANDOFF_INBOX:-$STATE_DIR/handoffs}"
WAKE_SUMMON_FILE="$STATE_DIR/WAKE_SUMMON"   # dedicated consent for vendor-summon

# Extract the first JSON string value for an EXACT top-or-nested key. Matches
# `"key"<spaces>:<spaces>"value"`. The quoted-key form avoids false hits (e.g.
# `"at"` never matches inside `"issued_at"`). Returns empty if absent.
_json_str() {
  _key="$1"; _file="$2"
  grep -oE "\"$_key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$_file" 2>/dev/null \
    | head -n1 | sed -E "s/.*:[[:space:]]*\"([^\"]*)\"$/\1/"
}

# Does the handoff have a given key at all (even non-string)? Used to detect
# after_seconds / condition drivers without parsing them here.
_json_has() {
  grep -qE "\"$1\"[[:space:]]*:" "$2" 2>/dev/null
}

# wake_summon_consented -- the dedicated 4th gate. Even ARMED, the bridge will
# not summon vendors on wake unless this explicit flag is present (defense in
# depth; arming standby and consenting to summon are separate deliberate acts).
wake_summon_consented() { [ -f "$WAKE_SUMMON_FILE" ]; }

# scan_handoffs  -- evaluate every handoff in the inbox, log one event each.
# Logs (never acts):
#   wake_invalid   missing a required field -> refuse (do not schedule garbage)
#   wake_due       a time-based `at` wake whose time has arrived (+ not_before ok)
#   wake_pending   a time-based wake still in the future
#   wake_deferred  after_seconds / condition driver -> host router decides
scan_handoffs() {
  [ -d "$HANDOFF_INBOX" ] || return 0
  _now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  _summon="standby"; wake_summon_consented && _summon="consented"

  for _f in "$HANDOFF_INBOX"/*.json; do
    [ -e "$_f" ] || continue   # no matches => glob stays literal; skip
    _id="$(_json_str id "$_f")"
    _lane="$(_json_str lane "$_f")"
    _task="$(_json_str task "$_f")"
    _at="$(_json_str at "$_f")"
    _notbefore="$(_json_str not_before "$_f")"
    [ -n "$_id" ] || _id="$(basename "$_f")"

    # Minimal required-field guard (full validation is the router's job).
    if [ -z "$_lane" ] || [ -z "$_task" ]; then
      log_event "wake_invalid" "handoff $_id: missing required lane/task; refusing to schedule"
      continue
    fi

    # not_before floor (lexicographic ISO compare).
    if [ -n "$_notbefore" ] && [ "$_now" \< "$_notbefore" ]; then
      log_event "wake_pending" "handoff $_id lane=$_lane: before not_before floor ($_notbefore); summon=$_summon"
      continue
    fi

    if [ -n "$_at" ]; then
      # Due when now >= at  (string compare: NOT (now < at)).
      if [ "$_now" \< "$_at" ]; then
        log_event "wake_pending" "handoff $_id lane=$_lane: waiting until $_at; summon=$_summon"
      else
        log_event "wake_due" "handoff $_id lane=$_lane: DUE (at $_at reached). Host router summons when armed+WAKE_SUMMON+budget. summon=$_summon"
      fi
    elif _json_has after_seconds "$_f" || _json_has condition "$_f"; then
      log_event "wake_deferred" "handoff $_id lane=$_lane: after_seconds/condition driver -> host router (wake-router.mjs) evaluates; summon=$_summon"
    else
      log_event "wake_invalid" "handoff $_id lane=$_lane: wake_at has no driver (at/after_seconds/condition); refusing"
    fi
  done
}
