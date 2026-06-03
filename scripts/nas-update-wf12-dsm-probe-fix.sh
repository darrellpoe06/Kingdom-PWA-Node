#!/bin/sh
# nas-update-wf12-dsm-probe-fix.sh   (NAS bash -- ConnectBot)
# 2026-06-03 L18: wf12 (Network health probe, every 5 min) has been firing
# CLEAN since the D3 deploy (commit 633755d) -- the monitor watches itself
# again. BUT the DSM probe target it inherited is wrong: it produced a
# false-positive 5s timeout on every single tick (same 5s-exact pattern at
# 7:00 AM and 4:05 PM Central the same day -> not intermittent, a wrong-target
# choice). The observability won; the target did not.
#
# Old DSM target: http://192.168.1.26:5000/  (the Synology admin web UI front
# page). Three plausible failure mechanisms, all rooted in choosing the admin
# UI as a probe target:
#   1. Most likely: the DSM 5000->5001 HTTPS redirect-follow stalls during the
#      cert handshake / renegotiation, blowing the 5s timeout budget.
#   2. Possible: the DSM login screen + session-cookie check renders slowly
#      before returning 200.
#   3. Possible: the large admin-UI HTML shell streams slowly over the Docker
#      bridge network.
#
# New DSM target (this fix):
#   https://192.168.1.26:5001/webapi/entry.cgi?api=SYNO.API.Info&version=1&method=query
# The Synology API-info endpoint:
#   - Returns lightweight JSON (~500 bytes), not HTML.
#   - Does NOT require authentication for the SYNO.API.Info.query method.
#   - Does NOT trigger a redirect.
#   - Completes in 50-200ms locally.
#   - Detects real DSM outages (DSM down -> no JSON -> probe fails as it should).
# The probe code already carries skipSslCertificateValidation: true (from the
# D3 fix), so the Synology self-signed cert on 5001 is tolerated.
#
# Binding: EXECUTION-OUTCOME-OBSERVABILITY -- the new target catches real DSM
# outages while eliminating the false positives, so the monitor reports truth.
#
# Run on the NAS host (not inside the n8n container):
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf12-dsm-probe-fix.sh | sudo sh
#
# What it does, in order:
#   1. Fetches the updated wf12 JSON from the GitHub repo (post-commit version)
#   2. Discovers wf12's existing n8n workflow id at runtime (by name) so the
#      import upserts instead of creating a duplicate
#   3. Injects that id into the JSON
#   4. Hands ownership to uid 1000 (the n8n container user)
#   5. Imports into n8n (overwrites the existing wf12 record)
#   6. Re-activates wf12 (the import can deactivate it)
#   7. Restarts n8n so the Code node body re-registers and the schedule re-arms
#   8. Waits 25 seconds for n8n to boot
#   9. Lists active workflows to confirm wf12 is still present
#  10. Prints a brief verification message
#
# Idempotent: safe to re-run.

set -e

cd /volume1/PoeTech/finance-events

echo "==> 1. Fetching updated wf12 JSON from GitHub (L18 DSM probe fix)..."
wget -qO _c12.json https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/12-network-health-probe.json

echo "==> 2. Discovering wf12's existing n8n workflow id (by name)..."
WF_ID=$(/usr/local/bin/docker exec n8n n8n list:workflow | grep -i "network health probe" | head -n1 | cut -d'|' -f1 | tr -d ' \r\n')
if [ -z "$WF_ID" ]; then
  echo "ERROR: could not find an existing workflow named like 'network health probe'."
  echo "       Aborting so we do not create a duplicate. Run this to see the list:"
  echo "         /usr/local/bin/docker exec n8n n8n list:workflow"
  exit 1
fi
echo "    Found wf12 id: $WF_ID  (expected ssIxY2nctM4tdr8g per the D3 deploy log)"

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
echo "To verify the fix (next :00/:05/:10 tick is the test):"
echo "  - wf12 fires every 5 minutes on the :00/:05/:10... wall clock."
echo "  - The next tick should show all FOUR probes green (internet, ollama,"
echo "    n8n_self, dsm) -- or DSM red ONLY when DSM is genuinely down."
echo "  - The 5s-exact DSM timeout that fired every prior tick should be GONE."
echo "    DSM should now report a fast 50-200ms green [200]."
echo "  - Check the executions list:"
echo "      http://192.168.1.26:5678 -> 12 Network health probe -> Executions"
echo "  - A fresh telemetry file lands at /data/chatin/_telemetry/<ts>__probe.json"
echo "    (host: /volume1/PoeTech/finance-events ... mapped per your n8n mount)."
echo "  - If DSM still shows the same 5s timeout pattern, the diagnosis was wrong:"
echo "    fall back to Option B (remove DSM from the probe list) on a follow-up."
echo ""
echo "Per EXECUTION-OUTCOME-OBSERVABILITY: the monitor catches real DSM outages"
echo "while no longer crying wolf every tick."
