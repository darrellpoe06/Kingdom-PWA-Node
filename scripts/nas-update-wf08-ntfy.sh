#!/bin/sh
# nas-update-wf08-ntfy.sh
# 2026-06-01: Update wf08 (Synology Chat inbound capture) to add ntfy push
# for family-voice senders, closing the INPUT-VISIBILITY-TO-CLAUDE gap.
# Before this update, Christina's @cpoe messages were captured to disk but
# Claude / Foundation Agent had no real-time signal -- only the 7am batch
# digest revealed them. After this update, family-voice senders (dpoe, cpoe,
# christiana, christian, christyn) get a priority-4 ntfy push the moment
# their message lands, same topic as wf30 (poetech-family-feedback).
#
# Run on the NAS host (not inside the n8n container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf08-ntfy.sh | sudo sh
#
# What it does, in order:
#   1. Fetches the clean wf08 JSON from the GitHub repo
#   2. Injects the existing n8n workflow id (b99N4hlBrsJTaxn9) so the import upserts
#   3. Hands ownership to uid 1000 (the n8n container user)
#   4. Imports into n8n (overwrites the existing wf08 record)
#   5. Re-activates wf08 (just in case the import deactivates it)
#   6. Restarts n8n so the webhook re-registers with the new Code node body
#   7. Lists active workflows to confirm wf08 is still in the list
#   8. Prints a brief verification message
#
# Idempotent: safe to re-run.

set -e

cd /volume1/PoeTech/finance-events

echo "==> 1. Fetching clean wf08 JSON from GitHub..."
wget -qO _c08.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/08-synology-chat-inbound-capture.json

echo "==> 2. Injecting existing n8n workflow id (b99N4hlBrsJTaxn9)..."
sed -i 's|^{|{"id": "b99N4hlBrsJTaxn9", |' _c08.json

echo "==> 3. Setting ownership for n8n container user..."
chown 1000:1000 _c08.json
chmod 644 _c08.json

echo "==> 4. Importing into n8n (upsert on existing id)..."
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c08.json

echo "==> 5. Re-activating wf08 (just in case)..."
/usr/local/bin/docker exec n8n n8n update:workflow --id=b99N4hlBrsJTaxn9 --active=true

echo "==> 6. Restarting n8n..."
/usr/local/bin/docker restart n8n

echo "==> 7. Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "=== Active workflow list (looking for wf08): ==="
echo "=========================================="
/usr/local/bin/docker exec n8n n8n list:workflow --active=true | grep -i "synology chat inbound" || echo "WARNING: wf08 not in active list!"

echo ""
echo "==> DONE."
echo ""
echo "To verify the ntfy push:"
echo "  - Open Synology Chat #PoeTech-PWA"
echo "  - Send a message starting with @nas from a family-voice account (cpoe, christiana, christian, christyn, or dpoe)"
echo "  - Within ~5 seconds, you should see a 'PoeTech family voice (chat)' notification arrive on any device subscribed to the ntfy topic 'poetech-family-feedback'"
echo ""
echo "Non-family senders still capture to disk silently, same as before."
echo "Per INPUT-VISIBILITY-TO-CLAUDE binding principle (foundation doc 2026-06-01)."
