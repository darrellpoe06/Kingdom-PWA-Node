#!/bin/sh
# nas-update-wf42-batch-research-queue.sh
# 2026-06-02: Ship workflow 42 (Batch research queue) LIVE on the NAS.
#
# What this workflow does (see docs/00-foundations/_root/CLAUDE-BATCH-API-PATTERN.md):
#   - Webhook /webhook/batch-queue-add appends research queries to
#     /data/batch-queue/pending.jsonl all day.
#   - A cron at 11:00 PM America/Chicago reads the day's queue, submits ONE
#     Anthropic Message Batches API call (50% off), stores the batch id under
#     /data/batch-queue/submitted/, and clears the day's queue.
#   - If the queue is empty the 11pm run short-circuits (no empty batch, no
#     Anthropic call), so an empty night is harmless.
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf42-batch-research-queue.sh | sudo sh
#
# What it does, in order:
#   1. Resolves the docker binary (ContainerManager or /usr/local/bin)
#   2. Creates the persistent host queue dirs at /volume1/PoeTech/batch-queue
#      (pending file + submitted/ + archive/), owned by uid 1000 (n8n user)
#   3. Adds the bind mount /volume1/PoeTech/batch-queue -> /data/batch-queue
#      to docker-compose (so the queue survives container recreates) and
#      force-recreates n8n if the mount was newly added
#   4. Fetches the clean wf42 JSON from GitHub, injects a stable workflow id
#      so re-runs upsert, hands ownership to uid 1000, imports into n8n
#   5. Activates wf42, restarts n8n so the Code-node bodies re-register
#   6. Reminds about ANTHROPIC_API_KEY (a value only Darrell has)
#   7. Verifies wf42 is in the active list
#
# Idempotent: safe to re-run.

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
HOST_DIR="/volume1/PoeTech/batch-queue"
STAGE_DIR="/volume1/PoeTech/finance-events"
WF_ID="PoeBatch42Queue1"
WF_NAME_GREP="Batch research queue"
RAW_URL="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/42-batch-research-queue.json"

echo "==> 1. Resolve docker binary..."
if [ -x /var/packages/ContainerManager/target/usr/bin/docker ]; then
  DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
elif [ -x /usr/local/bin/docker ]; then
  DOCKER="/usr/local/bin/docker"
else
  DOCKER="docker"
fi
echo "    docker = $DOCKER"

echo "==> 2. Create persistent host queue dirs (owned by uid 1000)..."
mkdir -p "$HOST_DIR/submitted"
mkdir -p "$HOST_DIR/archive"
chown -R 1000:1000 "$HOST_DIR"
chmod -R 775 "$HOST_DIR"
ls -la "$HOST_DIR"

echo ""
echo "==> 3. Ensure bind mount /volume1/PoeTech/batch-queue -> /data/batch-queue..."
if grep -q "/volume1/PoeTech/batch-queue:/data/batch-queue" "$COMPOSE"; then
  echo "    Mount already present - skipping insert."
  MOUNT_NEW="no"
else
  echo "    Adding mount."
  MOUNT_NEW="yes"
  cp "$COMPOSE" "${COMPOSE}.bak-batchqueue-$(date +%s)"
  awk '
    /n8n-stack\/n8n:\/home\/node\/\.n8n/ {
      print
      print "      - /volume1/PoeTech/batch-queue:/data/batch-queue"
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
echo "==> 4. Fetch clean wf42 JSON, inject stable id, import..."
cd "$STAGE_DIR"
wget -qO _c42.json "$RAW_URL"
sed -i "s|^{|{\"id\": \"$WF_ID\", |" _c42.json
chown 1000:1000 _c42.json
chmod 644 _c42.json
"$DOCKER" exec n8n n8n import:workflow --input=/data/finance-events/_c42.json

echo ""
echo "==> 5. Activate wf42 and restart n8n..."
"$DOCKER" exec n8n n8n update:workflow --id="$WF_ID" --active=true
"$DOCKER" restart n8n
echo "    Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "==> 6. ANTHROPIC_API_KEY reminder"
echo "=========================================="
if "$DOCKER" exec n8n printenv ANTHROPIC_API_KEY >/dev/null 2>&1; then
  echo "    ANTHROPIC_API_KEY is present in the n8n container env. Good."
else
  echo "    WARNING: ANTHROPIC_API_KEY is NOT set in the n8n container."
  echo "    The queue still accepts items, and an empty night never calls Anthropic,"
  echo "    but the 11pm submit will fail for any queued item until the key is set."
  echo "    Add it to /volume1/docker/n8n-stack/.env as:"
  echo "      ANTHROPIC_API_KEY=sk-ant-..."
  echo "    then: cd /volume1/docker/n8n-stack ; $DOCKER compose up -d n8n"
fi

echo ""
echo "=========================================="
echo "==> 7. Active workflow check (looking for wf42):"
echo "=========================================="
"$DOCKER" exec n8n n8n list:workflow --active=true | grep -i "$WF_NAME_GREP" || echo "WARNING: wf42 not in active list - check the import output above."

echo ""
echo "==> DONE."
echo "    Queue add endpoint:  POST /webhook/batch-queue-add  body {\"query\":\"...\"}"
echo "    Submit cron:         11:00 PM America/Chicago (only fires if the queue has items)"
echo "    Persistent queue:    /volume1/PoeTech/batch-queue (survives container recreates)"
