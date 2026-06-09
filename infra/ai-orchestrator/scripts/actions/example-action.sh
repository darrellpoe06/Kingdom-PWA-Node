#!/usr/bin/env bash
# =============================================================================
# example-action.sh  --  Action contract TEMPLATE (safe no-op).
# =============================================================================
# Copy this to make a real action (e.g. update_dns_blacklist.sh). It implements
# the contract guarded-action.sh requires:
#
#     snapshot   reads params on stdin; prints a rollback token on stdout
#     apply      reads params on stdin; performs the change
#     rollback   reads the snapshot token on stdin; restores prior state
#
# This example only touches a LOCAL file under ./data -- it does NOT touch any
# real network gear. The two real actions (update_dns_blacklist.sh,
# isolate_mac_address.sh) are intentionally NOT shipped: their internals depend
# on the UniFi controller URL/auth, Netgate host, and exact VLAN IDs, which must
# come from real infrastructure -- inventing them risks black-holing a live VLAN.
# =============================================================================
set -euo pipefail

SUB="${1:-}"
STATE_FILE="${EXAMPLE_STATE_FILE:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/data/example_blacklist.txt}"
mkdir -p "$(dirname "$STATE_FILE")"
touch "$STATE_FILE"

case "$SUB" in
  snapshot)
    # Emit current state as a base64 token so rollback can restore it verbatim.
    base64 -w0 < "$STATE_FILE" 2>/dev/null || base64 < "$STATE_FILE"
    ;;
  apply)
    PARAMS="$(cat)"
    domain="$(echo "$PARAMS" | jq -r '.domain // empty')"
    [ -n "$domain" ] || { echo "example-action: .domain required" >&2; exit 1; }
    echo "$domain" >> "$STATE_FILE"
    echo "example-action: added '$domain' to $STATE_FILE" >&2
    ;;
  rollback)
    TOKEN="$(cat)"
    printf '%s' "$TOKEN" | base64 -d > "$STATE_FILE"
    echo "example-action: restored $STATE_FILE from snapshot" >&2
    ;;
  *)
    echo "usage: $0 {snapshot|apply|rollback}" >&2
    exit 2
    ;;
esac
