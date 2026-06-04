#!/bin/sh
# nas-update-wf-dispatch-status-pair.sh
# 2026-06-03: Ship the NAS-hosted Dispatch Status surface LIVE (sovereign per
# nas-as-governance-point / ai-foundation-internal-ops). Internal-only surfaces
# live on the NAS, NOT on Vercel/poetech.us. This imports BOTH workflows:
#
#   wf-dispatch-status-page  GET /webhook/dispatch-status-page
#       Returns the complete self-contained live-readout HTML page (inline CSS +
#       JS, one CDN script for the ntfy QR). This is the URL Darrell opens.
#
#   wf-dispatch-status       GET /webhook/dispatch-status?section=reel|tasks
#       JSON data endpoints the page fetches on the same origin:
#         reel  -> last 50 entries of /data/poetech-briefing/_reel.jsonl  (missing -> [])
#         tasks -> /data/poetech-briefing/_dispatch_state.json (missing -> {snapshot_at:null,tasks:[]})
#
# Access control = the NAS being Tailscale/LAN-only reachable. No public surface.
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf-dispatch-status-pair.sh | sudo sh
#
# What it does, in order:
#   1. Resolves the docker binary
#   2. Confirms (or adds) the poetech-briefing bind mount (shipped as D19)
#   3. Writes the stub _dispatch_state.json (one demo task) if absent
#   4. Fetches both workflow JSONs, injects stable ids (upsert, never duplicate),
#      imports both
#   5. Activates both, restarts n8n
#   6. Verifies both in the active list and curls the page + both data sections
#
# Idempotent: safe to re-run.

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
HOST_BRIEFING="/volume1/PoeTech/poetech-briefing"
STAGE_DIR="/volume1/PoeTech/finance-events"
RAW_BASE="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows"

PAGE_ID="PoeDispatchPage01"
PAGE_FILE="wf-dispatch-status-page.json"
PAGE_NAME_GREP="Dispatch status PAGE"

DATA_ID="PoeDispatchData01"
DATA_FILE="wf-dispatch-status.json"
DATA_NAME_GREP="Dispatch status API"

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
  "note": "Stub written by nas-update-wf-dispatch-status-pair.sh. The real tasks-feed flow overwrites this.",
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
echo "==> 4. Fetch both workflow JSONs, inject stable ids, import..."
mkdir -p "$STAGE_DIR"
cd "$STAGE_DIR"

import_one() {
  TMP="$1"; RAW_FILE="$2"; WID="$3"
  wget -qO "$TMP" "$RAW_BASE/$RAW_FILE"
  sed -i "s|^{|{\"id\": \"$WID\", |" "$TMP"
  chown 1000:1000 "$TMP"
  chmod 644 "$TMP"
  "$DOCKER" exec n8n n8n import:workflow --input="/data/finance-events/$TMP"
}

import_one "_cdispatch_page.json" "$PAGE_FILE" "$PAGE_ID"
import_one "_cdispatch_data.json" "$DATA_FILE" "$DATA_ID"

echo ""
echo "==> 5. Activate both workflows and restart n8n..."
"$DOCKER" exec n8n n8n update:workflow --id="$PAGE_ID" --active=true
"$DOCKER" exec n8n n8n update:workflow --id="$DATA_ID" --active=true
"$DOCKER" restart n8n
echo "    Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "==> 6. Active workflow check + endpoint smoke test:"
echo "=========================================="
"$DOCKER" exec n8n n8n list:workflow --active=true | grep -i "$PAGE_NAME_GREP" || echo "WARNING: page wf not in active list - check import output above."
"$DOCKER" exec n8n n8n list:workflow --active=true | grep -i "$DATA_NAME_GREP" || echo "WARNING: data wf not in active list - check import output above."
echo ""
echo "    page (first line of HTML):"
wget -qO- "http://127.0.0.1:5678/webhook/dispatch-status-page" | head -1 || echo "    (page curl failed - check n8n logs)"
echo ""
echo "    reel section:"
wget -qO- "http://127.0.0.1:5678/webhook/dispatch-status?section=reel" || echo "    (reel curl failed)"
echo ""
echo "    tasks section:"
wget -qO- "http://127.0.0.1:5678/webhook/dispatch-status?section=tasks" || echo "    (tasks curl failed)"

echo ""
echo "==> DONE."
echo "    OPEN THIS ON YOUR PHONE:"
echo "      LAN:       http://192.168.1.26:5678/webhook/dispatch-status-page"
echo "      Tailscale: https://poetech.tail5a2f35.ts.net/webhook/dispatch-status-page"
echo "    Reel file:   $HOST_BRIEFING/_reel.jsonl (orchestrator writes; missing -> [])"
echo "    State:       $STATE_FILE (stub now; real feed overwrites)"
