#!/bin/bash
# ============================================================================
# update-chatin-mount-to-poetech-share.sh
# ============================================================================
# After creating the PoeTech Synology Shared Folder and rsync'ing data from
# /volume1/drive/PoeTech to /volume1/PoeTech, n8n's container mount still
# points at the OLD path. Update the docker-compose to mount the new path
# so future chat captures land in the SMB-accessible share.
#
# Run on Synology: sudo bash /tmp/update-chatin-mount.sh
# Idempotent.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
OLD_MOUNT="/volume1/drive/PoeTech/ChatIn:/data/chatin"
NEW_MOUNT="/volume1/PoeTech/ChatIn:/data/chatin"

echo "=== Check current mount in docker-compose ==="
grep -n "PoeTech.*chatin" "$COMPOSE" || echo "(no PoeTech chatin mount line found)"

echo
echo "=== Backup compose ==="
cp "$COMPOSE" "${COMPOSE}.bak-mount-$(date +%s)"

echo
echo "=== Replace mount path ==="
if grep -q "/volume1/drive/PoeTech/ChatIn:/data/chatin" "$COMPOSE"; then
  sed -i "s|/volume1/drive/PoeTech/ChatIn:/data/chatin|/volume1/PoeTech/ChatIn:/data/chatin|g" "$COMPOSE"
  echo "Mount path updated."
elif grep -q "/volume1/PoeTech/ChatIn:/data/chatin" "$COMPOSE"; then
  echo "Already updated — no change needed."
else
  echo "WARNING: expected chatin mount line not found. Compose may be in unexpected state."
fi

echo
echo "=== Show updated n8n volumes ==="
awk '/^  n8n:/,/^  [a-zA-Z]/' "$COMPOSE" | grep -E "volumes|chatin|n8n:/home" | head -10

echo
echo "=== Ensure /volume1/PoeTech/ChatIn exists with correct ownership ==="
mkdir -p /volume1/PoeTech/ChatIn
chown 1000:1000 /volume1/PoeTech/ChatIn
chmod 775 /volume1/PoeTech/ChatIn
ls -la /volume1/PoeTech/ChatIn | head -5

echo
echo "=== Restart n8n with new mount ==="
cd /volume1/docker/n8n-stack
"$DOCKER" compose up -d n8n

echo
echo "=== Wait for n8n to settle ==="
sleep 5

echo
echo "=== Verify mount inside container ==="
"$DOCKER" exec n8n ls -la /data/chatin 2>&1 || echo "(mount check failed - container may still be starting)"

echo
echo "=== Done. ==="
echo "n8n now writes Synology Chat captures to /volume1/PoeTech/ChatIn"
echo "SMB clients see them at \\\\192.168.1.26\\PoeTech\\ChatIn"
echo "Old data at /volume1/drive/PoeTech remains intact (delete manually after verifying)"
