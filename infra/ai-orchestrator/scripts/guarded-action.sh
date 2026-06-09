#!/usr/bin/env bash
# =============================================================================
# guarded-action.sh  --  The Cage. Every autonomous action passes through here.
# =============================================================================
# Implements the Sovereign AI Engine "Immutable Rules":
#   1. ALLOWLIST     : only pre-approved action scripts may run.
#   2. VLAN GUARD    : refuse any action whose params touch a protected VLAN
#                      (tithing/financials, live production). Non-negotiable.
#   3. AUDIT         : write an append-only ledger row at each lifecycle step
#                      (proposed -> executed | rolled_back | refused).
#   4. HEALTH GATE   : after apply, the action only "sticks" if Uptime Kuma
#                      reports healthy within ROLLBACK_DEADLINE seconds (120);
#                      otherwise the action's own `rollback` runs automatically.
#
# An action script (in actions/) MUST implement three subcommands:
#     <script> snapshot   # capture current state for rollback (stdout = token)
#     <script> apply      # perform the change
#     <script> rollback   # restore from the snapshot token (passed on stdin)
#
# Usage:
#   guarded-action.sh --action update_dns_blacklist \
#       --params '{"domain":"bad.example"}' \
#       --justification "Detected C2 beacon in DNS logs (wf telemetry)."
#
# Config via env (see ../node1/.env or a dedicated cage.env):
#   REGISTRY_HOST REGISTRY_PORT REGISTRY_DB AI_AGENT_USER AI_AGENT_PASSWORD
#   UPTIME_KUMA_URL UPTIME_KUMA_SLUG
#   PROTECTED_VLANS   (comma list, e.g. "10,20")
#   ACTIONS_ALLOWLIST (comma list of action names permitted to run)
#   NODE_NAME AGENT_NAME ROLLBACK_DEADLINE(=120)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTIONS_DIR="${ACTIONS_DIR:-$SCRIPT_DIR/actions}"
ROLLBACK_DEADLINE="${ROLLBACK_DEADLINE:-120}"
NODE_NAME="${NODE_NAME:-node-1}"
AGENT_NAME="${AGENT_NAME:-orchestrator}"

die() { echo "guarded-action: $*" >&2; exit 1; }

# --- Parse args -------------------------------------------------------------
ACTION="" ; PARAMS="{}" ; JUSTIFICATION=""
while [ $# -gt 0 ]; do
  case "$1" in
    --action)        ACTION="$2"; shift 2 ;;
    --params)        PARAMS="$2"; shift 2 ;;
    --justification) JUSTIFICATION="$2"; shift 2 ;;
    *) die "unknown arg: $1" ;;
  esac
done
[ -n "$ACTION" ]        || die "--action is required"
[ -n "$JUSTIFICATION" ] || die "--justification is required (audit demands a why)"
command -v jq    >/dev/null || die "jq is required"
command -v psql  >/dev/null || die "psql is required"
command -v curl  >/dev/null || die "curl is required"
echo "$PARAMS" | jq -e . >/dev/null 2>&1 || die "--params is not valid JSON"

# --- Ledger writer (append-only; ai_agent role has INSERT+SELECT only) -------
ledger() {  # ledger <decision> <health_status>
  local decision="$1" health="${2:-}"
  PGPASSWORD="$AI_AGENT_PASSWORD" psql \
    -h "$REGISTRY_HOST" -p "${REGISTRY_PORT:-5432}" \
    -U "${AI_AGENT_USER:-ai_agent}" -d "${REGISTRY_DB:-poetech_registry}" \
    -v ON_ERROR_STOP=1 -qtA \
    --set node="$NODE_NAME" --set agent="$AGENT_NAME" \
    --set action="$ACTION" --set params="$PARAMS" \
    --set justification="$JUSTIFICATION" \
    --set decision="$decision" --set health="$health" \
    -c "INSERT INTO ai_audit_ledger
          (node, agent, action, params, justification, decision, health_status)
        VALUES
          (:'node', :'agent', :'action', :'params'::jsonb,
           :'justification', :'decision', NULLIF(:'health',''));" \
    >/dev/null
}

# --- Health gate: poll Uptime Kuma status-page heartbeat ---------------------
# Healthy = every monitor's latest heartbeat status == 1 (UP).
health_ok() {
  local body
  body="$(curl -fsS --max-time 10 \
            "$UPTIME_KUMA_URL/api/status-page/heartbeat/$UPTIME_KUMA_SLUG" 2>/dev/null)" || return 1
  # Any latest heartbeat not equal to 1 => unhealthy.
  echo "$body" | jq -e '
    [.heartbeatList[]? | (last // empty) | .status] as $latest
    | ($latest | length > 0) and (all($latest[]; . == 1))
  ' >/dev/null 2>&1
}

# === 1. ALLOWLIST ===========================================================
case ",${ACTIONS_ALLOWLIST:-}," in
  *",$ACTION,"*) : ;;
  *) ledger refused "allowlist"; die "action '$ACTION' is not in ACTIONS_ALLOWLIST" ;;
esac
ACTION_SCRIPT="$ACTIONS_DIR/$ACTION.sh"
[ -x "$ACTION_SCRIPT" ] || { ledger refused "missing"; die "no executable action at $ACTION_SCRIPT"; }

# === 2. VLAN GUARD ==========================================================
# Refuse if params reference any protected VLAN (by .vlan or .vlan_id, scalar
# or array). The AI cannot alter routing on the tithing / production VLANs.
if [ -n "${PROTECTED_VLANS:-}" ]; then
  IFS=',' read -ra _prot <<< "$PROTECTED_VLANS"
  for v in "${_prot[@]}"; do
    if echo "$PARAMS" | jq -e --arg v "$v" '
        [.. | objects | (.vlan? , .vlan_id?)] | flatten
        | map(select(. != null) | tostring) | index($v)' >/dev/null 2>&1; then
      ledger refused "vlan_guard"
      die "BLOCKED: action references protected VLAN $v (routing changes forbidden)"
    fi
  done
fi

# === 3/4. PROPOSE -> SNAPSHOT -> APPLY -> HEALTH GATE -> STICK | ROLLBACK =====
ledger proposed ""

echo "guarded-action: snapshotting state for '$ACTION'..." >&2
SNAPSHOT="$("$ACTION_SCRIPT" snapshot <<< "$PARAMS")" \
  || { ledger refused "snapshot_failed"; die "snapshot failed; nothing applied"; }

echo "guarded-action: applying '$ACTION'..." >&2
if ! "$ACTION_SCRIPT" apply <<< "$PARAMS"; then
  echo "guarded-action: apply failed; rolling back..." >&2
  "$ACTION_SCRIPT" rollback <<< "$SNAPSHOT" || echo "guarded-action: ROLLBACK ALSO FAILED -- escalate" >&2
  ledger rolled_back "apply_failed"
  die "apply failed; rolled back"
fi

echo "guarded-action: health gate (up to ${ROLLBACK_DEADLINE}s)..." >&2
deadline=$(( $(date +%s) + ROLLBACK_DEADLINE ))
while [ "$(date +%s)" -lt "$deadline" ]; do
  if health_ok; then
    ledger executed "healthy"
    echo "guarded-action: '$ACTION' executed and healthy." >&2
    exit 0
  fi
  sleep 5
done

echo "guarded-action: health gate FAILED within ${ROLLBACK_DEADLINE}s; rolling back..." >&2
"$ACTION_SCRIPT" rollback <<< "$SNAPSHOT" || echo "guarded-action: ROLLBACK ALSO FAILED -- escalate" >&2
ledger rolled_back "unhealthy"
die "health gate failed; '$ACTION' rolled back"
