#!/bin/sh
# nas-update-wf13-noise-suppression.sh
# 2026-06-02: Update wf13 (Chat action router) to suppress empty-payload
# noise spam to the Synology Chat #PoeTech-PWA channel.
#
# Before this update, the "Scan + route" Code node pushed every routable
# chatin record -- including ones with empty/undefined text and an
# undefined sender -- through to the "Fallback to review queue" HTTP node,
# which posted "Need review (no handler matched) -- undefined -- from
# @undefined" to the channel once per cron tick. 20+ identical spam messages
# trained the family to ignore the channel.
#
# After this update (three-layer fix, per Darrell's 2026-06-02 "Always-Now
# Viable Fix + Anti-Noise" / "Data attached to solution or KPI" directives):
#   1. Early skip in Scan + route: items with empty/undefined text OR
#      empty/undefined/unknown sender exit before reaching the Fallback node.
#   2. Null-safe Fallback body: the literal word "undefined" can no longer
#      appear; header renamed from "Need review (no handler matched)" to the
#      clearer "Captured for review".
#   3. Defensive coerce in routables.push so raw_text + sender always carry
#      safe string defaults.
#
# Run on the NAS host (not inside the n8n container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf13-noise-suppression.sh | sudo sh
#
# What it does, in order:
#   1. Fetches the clean wf13 JSON from the GitHub repo
#   2. Injects the existing n8n workflow id (kcT7GZ9xdAp8Nz2h) so the import upserts
#   3. Hands ownership to uid 1000 (the n8n container user)
#   4. Imports into n8n (overwrites the existing wf13 record)
#   5. Re-activates wf13 (just in case the import deactivates it)
#   6. Restarts n8n so the Code node body re-registers
#   7. Lists active workflows to confirm wf13 is still in the list
#   8. Prints a brief verification message
#
# Idempotent: safe to re-run.

set -e

cd /volume1/PoeTech/finance-events

echo "==> 1. Fetching clean wf13 JSON from GitHub..."
wget -qO _c13.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/13-chat-action-router.json

echo "==> 2. Injecting existing n8n workflow id (kcT7GZ9xdAp8Nz2h)..."
sed -i 's|^{|{"id": "kcT7GZ9xdAp8Nz2h", |' _c13.json

echo "==> 3. Setting ownership for n8n container user..."
chown 1000:1000 _c13.json
chmod 644 _c13.json

echo "==> 4. Importing into n8n (upsert on existing id)..."
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c13.json

echo "==> 5. Re-activating wf13 (just in case)..."
/usr/local/bin/docker exec n8n n8n update:workflow --id=kcT7GZ9xdAp8Nz2h --active=true

echo "==> 6. Restarting n8n..."
/usr/local/bin/docker restart n8n

echo "==> 7. Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "=== Active workflow list (looking for wf13): ==="
echo "=========================================="
/usr/local/bin/docker exec n8n n8n list:workflow --active=true | grep -i "chat action router" || echo "WARNING: wf13 not in active list!"

echo ""
echo "==> DONE."
echo ""
echo "To verify the noise is gone:"
echo "  - Watch Synology Chat #PoeTech-PWA for the next few cron ticks (fires every minute)."
echo "  - The empty 'Need review (no handler matched) -- undefined -- from @undefined' spam should stop."
echo "  - Real routable requests now post as '📥 Captured for review:' with the actual text + sender."
echo ""
echo "Per the 'Data attached to solution or KPI' binding principle (Darrell 2026-06-02):"
echo "every chat post must carry actual purpose -- no empty-payload noise."
