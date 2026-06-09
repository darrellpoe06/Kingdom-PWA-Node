#!/bin/sh
# nas-update-wf36-quality-gatekeeper.sh   (NAS bash -- ConnectBot)
# 2026-06-03 L5: import + activate wf36 (Quality Gatekeeper) on the NAS n8n.
#
# wf36 is the deploy-time POLICY GATE (Role 10). It runs four ethical tests --
# Deuteronomy 8:18 (Yahweh-source), John 10:10 (abundant-life-not-thief),
# James 1:27 (care-and-unstained), and the Grace and Mercy Standard -- against
# any surface snapshot POSTed to it, and returns PASS / WARN / BLOCK with the
# cited test, plain-language reasoning, and a Scripture anchor. It logs every
# decision to /data/chatin/_telemetry/qg/<ts>__gate.json and posts to Synology
# Chat #PoeTech-PWA on BLOCK. See QUALITY-GATEKEEPER.md.
#
# Webhook (after activation):
#   https://<your-n8n-host>/webhook/quality-gatekeeper-check   (POST)
#
# Optional env (set in the n8n container for the chat alert to fire):
#   SYNOLOGY_CHAT_INCOMING_URL = the #PoeTech-PWA incoming-webhook URL.
#   If unset, wf36 still returns the decision; it just stays quiet (no chat post).
#
# Run on the NAS host (not inside the n8n container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf36-quality-gatekeeper.sh | sudo sh
#
# What it does, in order:
#   1. Fetches the updated wf36 JSON from the GitHub repo (post-commit version)
#   2. Looks for an existing wf36 record by name; if found, injects its id so
#      the import upserts instead of creating a duplicate (first run will not
#      find one -- that is expected; it imports fresh)
#   3. Hands ownership to uid 1000 (the n8n container user)
#   4. Imports into n8n
#   5. Discovers wf36's id post-import and activates it
#   6. Ensures the telemetry dir exists on the bind mount
#   7. Restarts n8n so the Code node body registers and the webhook arms
#   8. Waits 25 seconds for n8n to boot
#   9. Lists active workflows to confirm wf36 is present
#
# Idempotent: safe to re-run.

set -e

cd /volume1/PoeTech/finance-events

echo "==> 1. Fetching wf36 JSON from GitHub (L5 Quality Gatekeeper)..."
wget -qO _c36.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/36-quality-gatekeeper.json

echo "==> 2. Looking for an existing wf36 record by name (upsert if present)..."
WF_ID=$(/usr/local/bin/docker exec n8n n8n list:workflow | grep -i "quality gatekeeper" | head -n1 | cut -d'|' -f1 | tr -d ' \r\n')
if [ -n "$WF_ID" ]; then
  echo "    Found existing wf36 id: $WF_ID  (will upsert)"
  sed -i "s|^{|{\"id\": \"$WF_ID\", |" _c36.json
else
  echo "    No existing wf36 found -- importing fresh (first deploy)."
fi

echo "==> 3. Setting ownership for n8n container user..."
chown 1000:1000 _c36.json
chmod 644 _c36.json

echo "==> 4. Importing into n8n..."
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c36.json

echo "==> 5. Discovering wf36 id post-import and activating..."
WF_ID=$(/usr/local/bin/docker exec n8n n8n list:workflow | grep -i "quality gatekeeper" | head -n1 | cut -d'|' -f1 | tr -d ' \r\n')
if [ -z "$WF_ID" ]; then
  echo "ERROR: could not find wf36 after import. Check the list manually:"
  echo "         /usr/local/bin/docker exec n8n n8n list:workflow"
  exit 1
fi
echo "    wf36 id: $WF_ID"
/usr/local/bin/docker exec n8n n8n update:workflow --id=$WF_ID --active=true

echo "==> 6. Ensuring the gatekeeper telemetry dir exists on the bind mount..."
mkdir -p /volume1/PoeTech/finance-events/chatin/_telemetry/qg 2>/dev/null || true
chown -R 1000:1000 /volume1/PoeTech/finance-events/chatin/_telemetry 2>/dev/null || true

echo "==> 7. Restarting n8n..."
/usr/local/bin/docker restart n8n

echo "==> 8. Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "=== Active workflow list (looking for wf36): ==="
echo "=========================================="
/usr/local/bin/docker exec n8n n8n list:workflow --active=true | grep -i "quality gatekeeper" || echo "WARNING: wf36 not in active list!"

echo ""
echo "==> DONE."
echo ""
echo "To verify the gate (POST a known-drift snapshot -> expect BLOCK):"
echo "  curl -s -X POST https://<your-n8n-host>/webhook/quality-gatekeeper-check \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"surface_type\":\"pwa-feature\",\"content_snapshot\":\"Sow a seed of \$100 and God guarantees a hundredfold return. Name it and claim it.\",\"metadata\":{\"surface_id\":\"smoke-test\"}}'"
echo ""
echo "  Expect: {\"ok\":true,\"decision\":\"BLOCK\", ... ,\"scripture_anchor\":{\"ref\":\"Deuteronomy 8:18\", ...}}"
echo "  A known-good snapshot (no drift phrases) returns decision PASS."
echo "  A fresh decision file lands at /volume1/PoeTech/finance-events/chatin/_telemetry/qg/<ts>__gate.json"
echo "  On BLOCK, if SYNOLOGY_CHAT_INCOMING_URL is set, #PoeTech-PWA gets the alert."
echo ""
echo "Per PERPETUAL-PIPELINE-HEALTH Role 10: policy is enforced at deploy time,"
echo "advisory not absolute -- a governor may override and log the override."
