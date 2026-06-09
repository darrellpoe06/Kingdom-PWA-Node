#!/bin/sh
# nas-update-wf-autonomous-builder.sh
# 2026-06-02: Ship the Autonomous Builder workflow LIVE on the NAS.
#
# What this workflow does (see docs/00-foundations/_root/AUTONOMOUS-BUILDER-LIFECYCLE.md):
#   - Every 30 minutes it scans /data/cowork-builds/pending/ for the oldest PRD,
#     claims it into /data/cowork-builds/in-progress/, records the state
#     transition to /data/cowork-builds/events.jsonl, and pushes a ntfy alert
#     to the self-hosted ntfy server (topic poe-autonomous-builder).
#   - With an empty pending/ queue (the normal state) it ends quietly every cycle.
#
# KNOWN LIMITATION (accepted, per Darrell 2026-06-02 "ship it live"):
#   The actual build TRIGGER is an out-of-band placeholder httpRequest to
#   {{ $env.COWORK_BUILD_WEBHOOK }} (continueOnFail). There is no in-n8n Cowork
#   API yet. So if a PRD is dropped into pending/ before that trigger is real,
#   the workflow claims it into in-progress/ and notifies, but no build starts -
#   the PRD parks in in-progress/ until the post-vacation trigger lands or a
#   human runs it out-of-band. Empty pending/ = a quiet, ready heartbeat.
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf-autonomous-builder.sh | sudo sh
#
# What it does, in order:
#   1. Resolves the docker binary
#   2. Creates the persistent host queue dirs at /volume1/PoeTech/cowork-builds
#      (pending/ in-progress/ done/ failed/ archive/), owned by uid 1000
#   3. Adds the bind mount /volume1/PoeTech/cowork-builds -> /data/cowork-builds
#      and force-recreates n8n if newly added
#   4. Fetches the clean workflow JSON from GitHub, injects a stable id so
#      re-runs upsert, imports into n8n
#   5. Activates the workflow, restarts n8n
#   6. Verifies it is in the active list
#
# Idempotent: safe to re-run.

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
HOST_DIR="/volume1/PoeTech/cowork-builds"
STAGE_DIR="/volume1/PoeTech/finance-events"
WF_ID="PoeAutoBuild0001"
WF_NAME_GREP="Autonomous builder"
RAW_URL="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows/wf-autonomous-builder.json"

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
mkdir -p "$HOST_DIR/pending"
mkdir -p "$HOST_DIR/in-progress"
mkdir -p "$HOST_DIR/done"
mkdir -p "$HOST_DIR/failed"
mkdir -p "$HOST_DIR/archive"
chown -R 1000:1000 "$HOST_DIR"
chmod -R 775 "$HOST_DIR"
ls -la "$HOST_DIR"

echo ""
echo "==> 3. Ensure bind mount /volume1/PoeTech/cowork-builds -> /data/cowork-builds..."
if grep -q "/volume1/PoeTech/cowork-builds:/data/cowork-builds" "$COMPOSE"; then
  echo "    Mount already present - skipping insert."
  MOUNT_NEW="no"
else
  echo "    Adding mount."
  MOUNT_NEW="yes"
  cp "$COMPOSE" "${COMPOSE}.bak-coworkbuilds-$(date +%s)"
  awk '
    /n8n-stack\/n8n:\/home\/node\/\.n8n/ {
      print
      print "      - /volume1/PoeTech/cowork-builds:/data/cowork-builds"
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
echo "==> 4. Fetch clean workflow JSON, inject stable id, import..."
cd "$STAGE_DIR"
wget -qO _cautobuilder.json "$RAW_URL"
sed -i "s|^{|{\"id\": \"$WF_ID\", |" _cautobuilder.json
chown 1000:1000 _cautobuilder.json
chmod 644 _cautobuilder.json
"$DOCKER" exec n8n n8n import:workflow --input=/data/finance-events/_cautobuilder.json

echo ""
echo "==> 5. Activate the workflow and restart n8n..."
"$DOCKER" exec n8n n8n update:workflow --id="$WF_ID" --active=true
"$DOCKER" restart n8n
echo "    Waiting 25 seconds for n8n to boot..."
sleep 25

echo ""
echo "=========================================="
echo "==> 6. Active workflow check (looking for the builder):"
echo "=========================================="
"$DOCKER" exec n8n n8n list:workflow --active=true | grep -i "$WF_NAME_GREP" || echo "WARNING: builder not in active list - check the import output above."

echo ""
echo "==> DONE."
echo "    Cadence:           every 30 minutes (cron 0 */30 * * * *)"
echo "    Queue (drop PRDs): /volume1/PoeTech/cowork-builds/pending/"
echo "    State + events:    /volume1/PoeTech/cowork-builds/ (in-progress, done, failed, events.jsonl)"
echo "    ntfy topic:        poe-autonomous-builder (self-hosted ntfy on the NAS)"
echo ""
echo "    REMINDER: with pending/ empty the builder is a quiet heartbeat."
echo "    Do NOT drop a PRD into pending/ until the Cowork build trigger is wired"
echo "    (post-vacation) unless you intend to run that build out-of-band yourself -"
echo "    otherwise it will park in in-progress/ without building."
