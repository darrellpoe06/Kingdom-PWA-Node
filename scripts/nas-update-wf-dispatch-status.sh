#!/bin/sh
# nas-update-wf-dispatch-status.sh
# 2026-06-03: Ship the Dispatch Status API workflow LIVE on the NAS.
#
# What this workflow does (see app/src/components/DispatchStatus.jsx +
# the /dispatch-status PWA route):
#   ONE GET webhook at path 'dispatch-status' serves the family-private live
#   readout PWA. It branches on the ?section= query param:
#     section=reel  -> last 50 entries of /data/poetech-briefing/_reel.jsonl,
#                      newest-first, as a JSON array. Missing file -> [].
#     section=tasks -> /data/poetech-briefing/_dispatch_state.json verbatim.
#                      Missing file -> { snapshot_at: null, tasks: [] }.
#   Read-only; CORS Access-Control-Allow-Origin: * on both responses.
#
# The poetech-briefing bind mount (/volume1/PoeTech/poetech-briefing ->
# /data/poetech-briefing) already shipped as D19. This script confirms it and,
# if absent, adds it and force-recreates n8n.
#
# It also writes a STUB _dispatch_state.json (one demo task) so the PWA renders
# something tonight. The real tasks-feed flow lands in a follow-up and will
# overwrite this file.
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf-dispatch-status.sh | sudo sh
#
# What it does, in order:
#   1. Resolves the docker binary
#   2. Confirms (or adds) the poetech-briefing bind mount
#   3. Writes the stub _dispatch_state.json (owned by uid 1000) if absent
#   4. Fetches the workflow JSON from GitHub, injects a stable id so re-runs
#      upsert (never duplicate), imports into n8n
#   5. Activates the workflow, restarts n8n
#   6. Verifies it is in the active list and curls both sections
#
# Idempotent: safe to re-run.

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
HOST_BRIEFING="/volume1/PoeTech/poetech-briefing"
STAGE_DIR="/volume1/PoeTech/finance-events"
WF_ID="PoeDispatch0001"
WF_NAME_GREP="Dispatch status"
RAW_URL="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/wf-dispatch-status.json"

echo "==> 1. Resolve docker binary..."
if [ -x /var/packages/ContainerManager/target/usr/bin/docker ]; then
  DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
elif [ -x /usr/local/bin/docker ]; then
  DOCKER="/usr/local/bin/docker"
else
  DOCKER="docker"
fi
echo "    docker = $DOCKER"

echo ""
echo "==> 2. Confirm poetech-briefing bind mount (shipped as D19)..."
mkdir -p "$HOST_BRIEFING"
chown 1000:1000 "$HOST_BRIEFING"
chmod 755 "$HOST_BRIEFING"
if grep -q "/volume1/PoeTech/poetech-briefing:/data/poetech-briefing" "$COMPOSE"; then
  echo "    Mount already present - skipping insert."
  MOUNT_NEW="no"
else
  echo "    Adding mount."
  MOUNT_NEW="yes"
  cp "$COMPOSE" "${COMPOSE}.bak-dispatchstatus-$(date +%s)"
  awk '
    /n8n-stack\/n8n:\/home\/node\/\.n8n/ {
      print
      print "      - /volume1/PoeTech/poetech-briefing:/data/poetech-briefing"
      next
    }
    { print }
  ' "$COMPOSE" > "${COMPOSE}.new"
  mv "${COMPOSE}.new" "$COMPOSE"
fi

if [ "$MOUNT_NEW" = "yes" ]; then
  echo "    Recreating n8n so the bind mount takes effect..."
  cd /volume1/docker/n8n-stack
  "$DOCKER" compose up -d --force-recreate n8n
  echo "    Waiting 20 seconds for n8n to settle..."
  sleep 20
fi

echo ""
echo "==> 3. Write stub _dispatch_state.json if absent (one demo task)..."
STATE_FILE="$HOST_BRIEFING/_dispatch_state.json"
if [ -f "$STATE_FILE" ]; then
  echo "    State file already present - leaving it (real feed may own it)."
else
  cat > "$STATE_FILE" <<'JSON'
{
  "snapshot_at": null,
  "note": "Stub written by nas-update-wf-dispatch-status.sh. The real tasks-feed flow overwrites this.",
  "tasks": [
    {
      "id": "demo-1",
      "title": "Dispatch status surface live",
      "turns": 1,
      "latest": "Stub task so the readout renders. Real Code Task feed lands in a follow-up.",
      "last_seen": null
    }
  ]
}
JSON
  chown 1000:1000 "$STATE_FILE"
  chmod 644 "$STATE_FILE"
  echo "    Wrote $STATE_FILE"
fi

echo ""
echo "==> 4. Fetch clean workflow JSON, inject stable id, import..."
mkdir -p "$STAGE_DIR"
cd "$STAGE_DIR"
wget -qO _cdispatch.json "$RAW_URL"
sed -i "s|^{|{\"id\": \"$WF_ID\", |" _cdispatch.json
chown 1000:1000 _cdispatch.json
chmod 644 _cdispatch.json
"$DOCKER" exec n8n n8n import:workflow --input=/data/finance-events/_cdispatch.json

echo ""
echo "==> 5. Activate the workflow and restart n8n..."
"$DOCKER" exec n8n n8n update:workflow --id="$WF_ID" --active=true
"$DOCKER" restart n8n
echo "    Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "==> 6. Active workflow check + endpoint smoke test:"
echo "=========================================="
"$DOCKER" exec n8n n8n list:workflow --active=true | grep -i "$WF_NAME_GREP" || echo "WARNING: dispatch-status not in active list - check the import output above."
echo ""
echo "    reel section:"
wget -qO- "http://127.0.0.1:5678/webhook/dispatch-status?section=reel" || echo "    (reel curl failed - check n8n logs)"
echo ""
echo "    tasks section:"
wget -qO- "http://127.0.0.1:5678/webhook/dispatch-status?section=tasks" || echo "    (tasks curl failed - check n8n logs)"

echo ""
echo "==> DONE."
echo "    Webhook:   GET /webhook/dispatch-status?section=reel|tasks"
echo "    Reel file: $HOST_BRIEFING/_reel.jsonl (orchestrator writes; missing -> [])"
echo "    State:     $STATE_FILE (stub now; real feed overwrites)"
echo "    PWA route: /dispatch-status (hostname-gated; open via Tailscale URL)"
