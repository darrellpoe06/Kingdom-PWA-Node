#!/bin/sh
# nas-fix-vacation-workflows.sh
# 2026-06-01: Clean re-import + activation of wf30/wf31/wf32 from
# the canonical GitHub source. Fixes the case where the sed-modified
# JSON files used during the Maui-vacation phone import lost
# something n8n needs to actually execute workflow bodies (webhooks
# fire 200 OK but Code node never runs, no fb-*.json files created).
#
# Run on the NAS host (not inside the n8n container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-fix-vacation-workflows.sh | sudo sh
#
# What it does, in order:
#   1. Fetches the clean wf30/31/32 JSON from the GitHub repo
#   2. Injects the "id" field n8n requires for CLI import
#   3. Hands the files to uid 1000 (the n8n container user)
#   4. Imports each into n8n (upserts on matching ID)
#   5. Activates each
#   6. Restarts n8n so webhook registrations take effect
#   7. Waits 25 seconds for boot
#   8. Smoke-tests the family-feedback webhook end-to-end
#   9. Lists the family-feedback/ directory so you can see the
#      record actually landed on disk
#
# Idempotent: safe to re-run. Each step is independently sane.

set -e

cd /volume1/PoeTech/finance-events

echo "==> 1. Fetching clean workflow JSONs from GitHub..."
wget -qO _c30.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/30-family-feedback-intake.json
wget -qO _c31.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/31-daily-standup-digest.json
wget -qO _c32.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/32-daily-ship-summary.json

echo "==> 2. Injecting IDs..."
sed -i 's|^{|{"id": "wf30vacation0001", |' _c30.json
sed -i 's|^{|{"id": "wf31vacation0001", |' _c31.json
sed -i 's|^{|{"id": "wf32vacation0001", |' _c32.json

echo "==> 3. Setting ownership for n8n container user..."
chown 1000:1000 _c30.json _c31.json _c32.json
chmod 644 _c30.json _c31.json _c32.json

echo "==> 4. Importing into n8n (upsert on ID)..."
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c30.json
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c31.json
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c32.json

echo "==> 5. Activating workflows..."
/usr/local/bin/docker exec n8n n8n update:workflow --id=wf30vacation0001 --active=true
/usr/local/bin/docker exec n8n n8n update:workflow --id=wf31vacation0001 --active=true
/usr/local/bin/docker exec n8n n8n update:workflow --id=wf32vacation0001 --active=true

echo "==> 6. Restarting n8n..."
/usr/local/bin/docker restart n8n

echo "==> 7. Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "=== Webhook response: ==="
echo "=========================================="
wget -qO- --post-data='{"sender":"dpoe","type":"other","message":"NAS clean reimport verification"}' --header='Content-Type: application/json' http://localhost:5678/webhook/family-feedback
echo ""
echo ""

echo "=========================================="
echo "=== family-feedback directory contents: ==="
echo "=========================================="
ls -la /volume1/PoeTech/finance-events/family-feedback/

echo ""
echo "==> DONE."
echo ""
echo "Expected good state:"
echo "  - Webhook response shows {\"ok\":true,\"id\":\"fb-...\",\"captured_at\":\"...\",...}"
echo "  - Directory listing shows a new fb-*.json file"
echo ""
echo "If response is empty + only from-shell.txt in dir: the re-import"
echo "didn't fix it. Deeper diagnosis needed (likely connections"
echo "field issue or n8n schema mismatch — capture this output for"
echo "the next session)."
