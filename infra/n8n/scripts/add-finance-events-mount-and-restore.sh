#!/bin/bash
# ============================================================================
# add-finance-events-mount-and-restore.sh
# ============================================================================
# Root cause we confirmed via `ls -la /data` inside the n8n container:
#
#   /data is owned by root:root with mode 755. The n8n process runs as
#   user `node` (uid 1000) and CANNOT create new subdirectories at the
#   /data level. That's why workflow 16's
#       fs.mkdirSync('/data/finance-events/reconciled', { recursive: true })
#   fails with EACCES — it has to create /data/finance-events first.
#
# Also: /data/finance-events was wiped by tonight's multiple container
# force-recreates because it lived only in the container's writable
# layer, not on a host bind mount. The 1501 bank transactions workflow
# 15 wrote there earlier are gone.
#
# This script fixes both:
#   1. Adds bind mount /volume1/PoeTech/finance-events -> /data/finance-events
#      (so the directory exists with correct host-owner perms AND survives
#      future container recreates).
#   2. Moves any archived QFX files from bank-imports/_processed/ back to
#      bank-imports/ so workflow 15 re-parses them with the now-persistent
#      target directory.
#
# Run on Synology: sudo bash /tmp/add-finance-events-mount-and-restore.sh
# Idempotent.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
HOST_DIR="/volume1/PoeTech/finance-events"
BANK_IMPORTS="/volume1/PoeTech/bank-imports"

echo "=== Ensure host folder exists with correct ownership ==="
mkdir -p "$HOST_DIR"
mkdir -p "$HOST_DIR/bank"
mkdir -p "$HOST_DIR/gmail"
mkdir -p "$HOST_DIR/reconciled"
chown -R 1000:1000 "$HOST_DIR"
chmod -R 775 "$HOST_DIR"
ls -la "$HOST_DIR"

echo
echo "=== Check if mount already present in compose ==="
if grep -q "/volume1/PoeTech/finance-events:/data/finance-events" "$COMPOSE"; then
  echo "Mount already present — skipping insert."
  MOUNT_NEW="no"
else
  echo "Adding mount."
  MOUNT_NEW="yes"
  cp "$COMPOSE" "${COMPOSE}.bak-financeevents-$(date +%s)"
  # Insert after the existing chatin or bank-imports mount.
  awk '
    /\/volume1\/PoeTech\/bank-imports:\/data\/bank-imports/ {
      print
      print "      - /volume1/PoeTech/finance-events:/data/finance-events"
      next
    }
    { print }
  ' "$COMPOSE" > "${COMPOSE}.new"
  mv "${COMPOSE}.new" "$COMPOSE"
fi

if [ "$MOUNT_NEW" = "yes" ]; then
  echo
  echo "=== Recreate n8n container so the bind mount takes effect ==="
  cd /volume1/docker/n8n-stack
  "$DOCKER" compose up -d --force-recreate n8n

  echo
  echo "=== Wait for n8n to settle ==="
  sleep 6
fi

echo
echo "=== Verify mount inside n8n container ==="
"$DOCKER" exec n8n ls -la /data/finance-events 2>&1 || echo "(mount check failed)"

echo
echo "=== Restore archived QFX files so workflow 15 re-parses with the new mount ==="
if [ -d "$BANK_IMPORTS/_processed" ]; then
  PROCESSED_COUNT=$(ls -1 "$BANK_IMPORTS/_processed/" 2>/dev/null | wc -l)
  if [ "$PROCESSED_COUNT" -gt 0 ]; then
    echo "Found $PROCESSED_COUNT archived file(s) in _processed/. Moving back for re-parse..."
    for f in "$BANK_IMPORTS/_processed/"*; do
      base=$(basename "$f")
      # Strip the trailing .<timestamp> that the workflow adds during archive,
      # so the file becomes its original name again.
      original=$(echo "$base" | sed 's/\.[0-9]\{13\}$//')
      mv "$f" "$BANK_IMPORTS/$original"
      echo "  $base  ->  $original"
    done
  else
    echo "No archived files to restore."
  fi
else
  echo "No _processed/ folder yet."
fi

echo
echo "=== Done. ==="
echo "  - /data/finance-events is now bind-mounted at /volume1/PoeTech/finance-events"
echo "  - SMB clients see parsed data at \\\\192.168.1.26\\PoeTech\\finance-events"
echo "  - Any archived QFX has been moved back for re-parse"
echo "  - Workflow 15's next 2-min cron tick will re-parse and write to the persistent path"
echo "  - Workflow 16's next hourly cron will reconcile against the re-parsed data"
