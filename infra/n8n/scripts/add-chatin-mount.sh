#!/bin/bash
# ============================================================================
# add-chatin-mount.sh - add /volume1/drive/PoeTech/ChatIn bind mount to n8n
# ============================================================================
# Adds the bind mount required by the Synology Chat inbound capture workflow
# (08-synology-chat-inbound-capture.json). After this runs, the n8n container
# can write JSON files to /data/chatin which surface on the host at
# /volume1/drive/PoeTech/ChatIn, where Synology Drive Client syncs them to
# the operator's Windows machine.
#
# Run on Synology as root: sudo bash /tmp/add-chatin-mount.sh
# Idempotent — safe to re-run.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
TARGET="/volume1/drive/PoeTech/ChatIn"
MOUNT_LINE="      - /volume1/drive/PoeTech/ChatIn:/data/chatin"

echo "=== Ensure target directory exists ==="
mkdir -p "$TARGET"
chown dpoe:users "$TARGET"
ls -la "$TARGET"

echo
echo "=== Backup current docker-compose ==="
cp "$COMPOSE" "${COMPOSE}.bak-$(date +%s)"

echo
echo "=== Check if mount already present ==="
if grep -q "/volume1/drive/PoeTech/ChatIn:/data/chatin" "$COMPOSE"; then
  echo "Mount already present — skipping insert."
else
  echo "Adding mount line after the existing n8n volume entry..."
  # Use awk to insert the new line after the matching existing mount
  awk '
    /n8n-stack\/n8n:\/home\/node\/\.n8n/ {
      print
      print "      - /volume1/drive/PoeTech/ChatIn:/data/chatin"
      next
    }
    { print }
  ' "$COMPOSE" > "${COMPOSE}.new"
  mv "${COMPOSE}.new" "$COMPOSE"
  echo "Inserted."
fi

echo
echo "=== n8n volumes section now: ==="
grep -B 1 -A 4 "n8n-stack/n8n" "$COMPOSE" | head -10

echo
echo "=== Restart n8n with new mount ==="
cd /volume1/docker/n8n-stack
"$DOCKER" compose up -d n8n

echo
echo "=== Wait for n8n to settle ==="
sleep 4

echo
echo "=== Verify mount inside container ==="
"$DOCKER" exec n8n ls -la /data/chatin 2>&1 || echo "(mount check failed — container may still be starting; rerun: docker exec n8n ls -la /data/chatin)"

echo
echo "=== Done. ==="
echo "Mount available inside n8n container at /data/chatin"
echo "Mount available on host at /volume1/drive/PoeTech/ChatIn"
echo "Next: import the workflow JSON into n8n and activate it."
