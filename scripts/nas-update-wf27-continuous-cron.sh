#!/bin/sh
# nas-update-wf27-continuous-cron.sh
# 2026-06-03: Continuous feedback reel - wf27 Foundation Agent.
#
# CONTEXT (per Darrell @nas 2026-06-03 evening): keep the routines moving ASAP,
# not next-day. wf27 now polls every 5 minutes instead of 4x/day (7am/12pm/5pm/9pm).
# Feedback -> upgrade lag drops from ~16-24h to ~5 min. This is fix D23 in
# docs/99-session-notes/2026-06-02-fix-master-list.md.
#
# wf27 needs NO code refactor for this: its existing "if (counts.total > 0)"
# digest gate plus per-file response/queue dedupe already make it
# material-only-fire and idempotent by design. This change is cron-only:
#   cron  "0 0 7,12,17,21 * * *"  ->  "0 */5 * * * *"
#   node  "Scheduled (7am ...)"   ->  "Scheduled (every 5 min ...)"
#
# What this script does, in order:
#   1. Resolves the docker binary (ContainerManager or /usr/local/bin)
#   2. Resolves wf27's EXISTING n8n id by name (so import upserts, never dupes)
#   3. Fetches the clean wf27 JSON from GitHub, injects that id, imports
#   4. Activates wf27, restarts n8n so the Code-node body re-registers
#   5. Verifies wf27 + wf31 are both in the active list
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf27-continuous-cron.sh | sudo sh
#
# Idempotent: safe to re-run.

set -e

STAGE_DIR="/volume1/PoeTech/finance-events"
RAW_URL="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/27-foundation-agent.json"
NAME_GREP="Foundation Agent"
TMP="_c27.json"

echo "==> 1. Resolve docker binary..."
if [ -x /var/packages/ContainerManager/target/usr/bin/docker ]; then
  DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
elif [ -x /usr/local/bin/docker ]; then
  DOCKER="/usr/local/bin/docker"
else
  DOCKER="docker"
fi
echo "    docker = $DOCKER"

cd "$STAGE_DIR"

echo ""
echo "==> 2. Resolve existing wf27 id by name ($NAME_GREP)..."
WID=$("$DOCKER" exec n8n n8n list:workflow 2>/dev/null | awk -F'|' -v n="$NAME_GREP" 'index($2, n) > 0 { gsub(/[[:space:]]/, "", $1); print $1; exit }')
if [ -z "$WID" ]; then
  echo "    ERROR: no existing workflow matched \"$NAME_GREP\"."
  echo "    Not creating a duplicate. Check: $DOCKER exec n8n n8n list:workflow"
  exit 1
fi
echo "    Found existing id: $WID"

echo ""
echo "==> 3. Fetch clean wf27 JSON, inject id, import (upsert)..."
wget -qO "$TMP" "$RAW_URL"
sed -i "s|^{|{\"id\": \"$WID\", |" "$TMP"
chown 1000:1000 "$TMP"
chmod 644 "$TMP"
"$DOCKER" exec n8n n8n import:workflow --input="/data/finance-events/$TMP"

echo ""
echo "==> 4. Activate wf27 and restart n8n..."
"$DOCKER" exec n8n n8n update:workflow --id="$WID" --active=true
"$DOCKER" restart n8n
echo "    Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "==> 5. Active workflow check (wf27 + wf31 should both appear):"
echo "=========================================="
"$DOCKER" exec n8n n8n list:workflow --active=true | grep -iE "foundation agent|standup digest" || echo "WARNING: expected workflows not in active list - check the import output above."

echo ""
echo "==> DONE."
echo "    wf27 now polls every 5 min (continuous feedback reel)."
echo "    Material-only-fire by design: it pushes a digest only when counts.total > 0."
echo "    On-demand fire still available: POST /webhook/agent-fire."
