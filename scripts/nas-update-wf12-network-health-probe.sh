#!/bin/sh
# nas-update-wf12-network-health-probe.sh
# 2026-06-02: Fix wf12 (Network health probe, every 5 min) which was failing
# every single cron tick with "Module http is disallowed" in the Run probes
# Code node. The monitor that is supposed to watch the whole NAS could not
# watch itself -- a silent-failure inversion of EXECUTION-OUTCOME-OBSERVABILITY.
#
# Root cause: n8n's hardened Code-node sandbox blocks the raw http/https core
# modules. The Run probes node used require('http') + require('https') to fire
# its parallel probes, so it threw at require time on every run and never
# alerted on a real outage.
#
# Fix (this.helpers.httpRequest, sandbox-safe): the Run probes node now fires
# each probe with the n8n-builtin this.helpers.httpRequest API instead of the
# raw modules. Parallel Promise.all firing, per-target timing, the structured
# error envelope, and the telemetry file write (fs is allow-listed) are all
# preserved. The OLLAMA target's env read (also sandbox-blocked) was replaced
# with its hardcoded docker default per the wf30/31/32 precedent (commit
# 1edb8e1). See docs/99-session-notes/2026-06-01-research-review-n8n-fix-patterns.md.
#
# Run on the NAS host (not inside the n8n container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf12-network-health-probe.sh | sudo sh
#
# What it does, in order:
#   1. Fetches the clean wf12 JSON from the GitHub repo
#   2. Discovers wf12's existing n8n workflow id at runtime (by name) so the
#      import upserts instead of creating a duplicate
#   3. Injects that id into the JSON
#   4. Hands ownership to uid 1000 (the n8n container user)
#   5. Imports into n8n (overwrites the existing wf12 record)
#   6. Re-activates wf12 (the import can deactivate it)
#   7. Restarts n8n so the Code node body re-registers and the schedule re-arms
#   8. Lists active workflows to confirm wf12 is still present
#   9. Prints a brief verification message
#
# Idempotent: safe to re-run.

set -e

cd /volume1/PoeTech/finance-events

echo "==> 1. Fetching clean wf12 JSON from GitHub..."
wget -qO _c12.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/12-network-health-probe.json

echo "==> 2. Discovering wf12's existing n8n workflow id (by name)..."
WF_ID=$(/usr/local/bin/docker exec n8n n8n list:workflow | grep -i "network health probe" | head -n1 | cut -d'|' -f1 | tr -d ' \r\n')
if [ -z "$WF_ID" ]; then
  echo "ERROR: could not find an existing workflow named like 'network health probe'."
  echo "       Aborting so we do not create a duplicate. Run this to see the list:"
  echo "         /usr/local/bin/docker exec n8n n8n list:workflow"
  exit 1
fi
echo "    Found wf12 id: $WF_ID"

echo "==> 3. Injecting existing n8n workflow id ($WF_ID) so the import upserts..."
sed -i "s|^{|{\"id\": \"$WF_ID\", |" _c12.json

echo "==> 4. Setting ownership for n8n container user..."
chown 1000:1000 _c12.json
chmod 644 _c12.json

echo "==> 5. Importing into n8n (upsert on existing id)..."
/usr/local/bin/docker exec n8n n8n import:workflow --input=/data/finance-events/_c12.json

echo "==> 6. Re-activating wf12 (the import can deactivate it)..."
/usr/local/bin/docker exec n8n n8n update:workflow --id=$WF_ID --active=true

echo "==> 7. Restarting n8n..."
/usr/local/bin/docker restart n8n

echo "==> 8. Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "=== Active workflow list (looking for wf12): ==="
echo "=========================================="
/usr/local/bin/docker exec n8n n8n list:workflow --active=true | grep -i "network health probe" || echo "WARNING: wf12 not in active list!"

echo ""
echo "==> DONE."
echo ""
echo "To verify the fix:"
echo "  - wf12 fires every 5 minutes on the :00/:05/:10... wall clock."
echo "  - The next tick should run clean (no 'Module http is disallowed')."
echo "  - Check the executions list:"
echo "      http://192.168.1.26:5678 -> 12 Network health probe -> Executions"
echo "    The newest run should be green (Success), not red (Error)."
echo "  - A fresh telemetry file should land at /data/chatin/_telemetry/<ts>__probe.json"
echo "    (host: /volume1/PoeTech/finance-events ... mapped per your n8n mount)."
echo "  - If any probe target is actually down, the alert posts to Synology Chat"
echo "    #PoeTech-PWA. All green = quiet (no-op), which is the intended behavior."
echo ""
echo "Per EXECUTION-OUTCOME-OBSERVABILITY: the monitor can watch itself again."
