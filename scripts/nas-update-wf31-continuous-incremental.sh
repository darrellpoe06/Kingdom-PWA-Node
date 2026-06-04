#!/bin/sh
# nas-update-wf31-continuous-incremental.sh
# 2026-06-03: Continuous feedback reel - wf31 standup digest (full refactor).
#
# CONTEXT (per Darrell @nas 2026-06-03 evening): keep the routines moving ASAP,
# not next-day. wf31 now runs every 5 minutes instead of once at 7am Central.
# Feedback -> upgrade lag drops from ~24h to ~5 min. This is fix D23 in
# docs/99-session-notes/2026-06-02-fix-master-list.md.
#
# wf31 IS refactored (cron + incremental state + material-only-fire):
#   cron  "0 0 7 * * *"  ->  "0 */5 * * * *"
#   workflow + schedule node renamed to "Continuous standup digest".
#   NEW high-water-mark state file:
#     /data/finance-events/family-feedback/_digest_state.json  (last_processed_at)
#   Window is [last_processed_at, sweep_start); first run falls back to 24h.
#   MATERIAL-ONLY-FIRE: a zero-voice sweep writes state and returns SILENTLY
#   (no ntfy - 288 quiet pings/day would be spam). State advances every sweep
#   (quiet or material) so no voice is double-processed or skipped.
#   On-demand fire still available: GET /webhook/digest-fire (always returns JSON).
#
# The state file lives under /data/finance-events/family-feedback, which is the
# already-bind-mounted /volume1/PoeTech/finance-events tree, so it persists
# across container recreates. No new mount is required.
#
# What this script does, in order:
#   1. Resolves the docker binary (ContainerManager or /usr/local/bin)
#   2. Ensures the family-feedback dir exists on the host (owned by uid 1000)
#   3. Resolves wf31's EXISTING n8n id by name (so import upserts, never dupes)
#   4. Fetches the clean wf31 JSON from GitHub, injects that id, imports
#   5. Activates wf31, restarts n8n so the Code-node body re-registers
#   6. Verifies wf27 + wf31 are both in the active list
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf31-continuous-incremental.sh | sudo sh
#
# Idempotent: safe to re-run. The state file is created lazily by the workflow
# itself on its first sweep; this script only guarantees the parent dir exists.

set -e

STAGE_DIR="/volume1/PoeTech/finance-events"
FEEDBACK_HOST_DIR="/volume1/PoeTech/finance-events/family-feedback"
RAW_URL="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/31-daily-standup-digest.json"
NAME_GREP="standup digest"
TMP="_c31.json"

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
echo "==> 2. Ensure family-feedback dir exists on host (owned by uid 1000)..."
mkdir -p "$FEEDBACK_HOST_DIR"
chown -R 1000:1000 "$FEEDBACK_HOST_DIR"
chmod -R 775 "$FEEDBACK_HOST_DIR"
ls -la "$FEEDBACK_HOST_DIR" | head -5

cd "$STAGE_DIR"

echo ""
echo "==> 3. Resolve existing wf31 id by name ($NAME_GREP)..."
WID=$("$DOCKER" exec n8n n8n list:workflow 2>/dev/null | awk -F'|' -v n="$NAME_GREP" 'index($2, n) > 0 { gsub(/[[:space:]]/, "", $1); print $1; exit }')
if [ -z "$WID" ]; then
  echo "    ERROR: no existing workflow matched \"$NAME_GREP\"."
  echo "    Not creating a duplicate. Check: $DOCKER exec n8n n8n list:workflow"
  exit 1
fi
echo "    Found existing id: $WID"

echo ""
echo "==> 4. Fetch clean wf31 JSON, inject id, import (upsert)..."
wget -qO "$TMP" "$RAW_URL"
sed -i "s|^{|{\"id\": \"$WID\", |" "$TMP"
chown 1000:1000 "$TMP"
chmod 644 "$TMP"
"$DOCKER" exec n8n n8n import:workflow --input="/data/finance-events/$TMP"

echo ""
echo "==> 5. Activate wf31 and restart n8n..."
"$DOCKER" exec n8n n8n update:workflow --id="$WID" --active=true
"$DOCKER" restart n8n
echo "    Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "==> 6. Active workflow check (wf27 + wf31 should both appear):"
echo "=========================================="
"$DOCKER" exec n8n n8n list:workflow --active=true | grep -iE "foundation agent|standup digest" || echo "WARNING: expected workflows not in active list - check the import output above."

echo ""
echo "==> DONE."
echo "    wf31 now runs every 5 min (continuous, incremental, material-only-fire)."
echo "    State file (created on first sweep): /data/finance-events/family-feedback/_digest_state.json"
echo "    Quiet sweeps write state and stay silent; only new family voices push ntfy."
echo "    On-demand fire still available: GET /webhook/digest-fire."
