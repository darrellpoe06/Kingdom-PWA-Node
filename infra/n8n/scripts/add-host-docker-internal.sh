#!/bin/bash
# ============================================================================
# add-host-docker-internal.sh — let n8n container resolve `host.docker.internal`
# ============================================================================
# By default, on Linux hosts (Synology counts), Docker does NOT automatically
# map `host.docker.internal` to the host. You have to add it explicitly via
# `extra_hosts` in docker-compose.
#
# Without this, n8n's HTTP node can't reach the Synology DSM web port via
# the natural-looking `host.docker.internal:5000` URL. With this, it can.
#
# Diagnosis source: workflow 10 execution 28 (2026-05-27 18:01) Post-ack
# node returned `getaddrinfo ENOTFOUND host.docker.internal` — confirmed
# root cause.
#
# Run on Synology: sudo bash /tmp/add-host-docker-internal.sh
# Idempotent.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"

echo "=== Check current compose for extra_hosts ==="
if grep -q "host.docker.internal:host-gateway" "$COMPOSE"; then
  echo "extra_hosts already present — no change needed."
  exit 0
fi

echo "Not present — adding."
cp "$COMPOSE" "${COMPOSE}.bak-extrahosts-$(date +%s)"

# Insert extra_hosts block right after the n8n service's image: or
# container_name: line — anywhere inside the n8n service block, before the
# next service. We append it just after the "n8n:" line at the top of the
# block.
awk '
  /^  n8n:/ {
    print
    print "    extra_hosts:"
    print "      - \"host.docker.internal:host-gateway\""
    next
  }
  { print }
' "$COMPOSE" > "${COMPOSE}.new"
mv "${COMPOSE}.new" "$COMPOSE"

echo
echo "=== Show n8n service block ==="
awk '/^  n8n:/,/^  [a-zA-Z]/' "$COMPOSE" | head -20

echo
echo "=== Recreate n8n container (extra_hosts requires recreation, not just restart) ==="
cd /volume1/docker/n8n-stack
"$DOCKER" compose up -d --force-recreate n8n

echo
echo "=== Wait for n8n to settle ==="
sleep 5

echo
echo "=== Verify host.docker.internal now resolves inside container ==="
"$DOCKER" exec n8n sh -c 'getent hosts host.docker.internal' 2>&1 || \
  "$DOCKER" exec n8n sh -c 'cat /etc/hosts | grep host.docker.internal' 2>&1 || \
  echo "(could not verify — container may still be starting)"

echo
echo "=== Done. ==="
echo "n8n should now resolve host.docker.internal to the Synology host."
echo "Re-test @nas in chat — workflow 10's ack should fire."
