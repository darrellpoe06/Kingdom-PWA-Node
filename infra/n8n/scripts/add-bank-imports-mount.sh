#!/bin/bash
# ============================================================================
# add-bank-imports-mount.sh — bind /volume1/PoeTech/bank-imports into n8n
# ============================================================================
# Workflow 15 (bank OFX/QFX/CSV watcher) reads from /data/bank-imports inside
# the n8n container. This script:
#   1. Creates /volume1/PoeTech/bank-imports/ on the host with correct owner.
#   2. Adds a bind mount to the n8n service in docker-compose.
#   3. Recreates the n8n container so the mount takes effect.
#
# After this, any .ofx / .qfx / .csv file dropped in the host folder (over
# SMB at \\192.168.1.26\PoeTech\bank-imports, or via Drive Client, or via
# direct SSH put) gets ingested by workflow 15 within 2 minutes.
#
# Run on Synology: sudo bash /tmp/add-bank-imports-mount.sh
# Idempotent.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
HOST_DIR="/volume1/PoeTech/bank-imports"
MOUNT_LINE="      - /volume1/PoeTech/bank-imports:/data/bank-imports"

echo "=== Ensure host folder exists ==="
mkdir -p "$HOST_DIR"
mkdir -p "$HOST_DIR/_processed"
chown -R 1000:1000 "$HOST_DIR"
chmod -R 775 "$HOST_DIR"
ls -la "$HOST_DIR"

echo
echo "=== Check if mount already present in compose ==="
if grep -q "/volume1/PoeTech/bank-imports:/data/bank-imports" "$COMPOSE"; then
  echo "Mount already present — no change needed."
  MOUNT_NEW="no"
else
  echo "Adding mount."
  MOUNT_NEW="yes"
  cp "$COMPOSE" "${COMPOSE}.bak-bankimports-$(date +%s)"
  # Insert after the existing n8n /data/chatin mount which already exists.
  awk '
    /\/volume1\/PoeTech\/ChatIn:\/data\/chatin/ {
      print
      print "      - /volume1/PoeTech/bank-imports:/data/bank-imports"
      next
    }
    { print }
  ' "$COMPOSE" > "${COMPOSE}.new"
  mv "${COMPOSE}.new" "$COMPOSE"
fi

if [ "$MOUNT_NEW" = "yes" ]; then
  echo
  echo "=== Recreate n8n container with the new mount ==="
  cd /volume1/docker/n8n-stack
  "$DOCKER" compose up -d --force-recreate n8n

  echo
  echo "=== Wait for n8n to settle ==="
  sleep 5
fi

echo
echo "=== Verify mount inside n8n container ==="
"$DOCKER" exec n8n ls -la /data/bank-imports 2>&1 || echo "(mount check failed)"

echo
echo "=== Done. ==="
echo "Drop .qfx / .ofx / .csv exports into:"
echo "  Host: /volume1/PoeTech/bank-imports/"
echo "  SMB:  \\\\192.168.1.26\\PoeTech\\bank-imports"
echo "Workflow 15 will pick them up within 2 minutes."
