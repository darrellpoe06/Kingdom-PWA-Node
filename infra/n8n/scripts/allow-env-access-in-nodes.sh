#!/bin/bash
# ============================================================================
# allow-env-access-in-nodes.sh - let n8n expressions read process.env vars
# ============================================================================
# By default n8n DENIES access to host env vars from expressions to prevent
# accidental secret leakage through workflow JSON exports. Setting
# N8N_BLOCK_ENV_ACCESS_IN_NODE=false re-enables {{ $env.VAR }} access in
# nodes and expressions.
#
# Required by workflow 10 (capture+ack) and 11 (vercel-deploy-to-chat),
# both of which read SYNOLOGY_CHAT_INCOMING_URL via $env.
#
# Diagnosis source: execution 19 (2026-05-27 15:50) Post-ack node error
# "[ERROR: access to env vars denied]" + AxiosError timeout — confirmed
# root cause.
#
# Run on Synology: sudo bash /tmp/allow-env-access-in-nodes.sh
# Idempotent.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"

echo "=== Check if env var already present ==="
if grep -q "N8N_BLOCK_ENV_ACCESS_IN_NODE" "$COMPOSE"; then
  echo "N8N_BLOCK_ENV_ACCESS_IN_NODE already in docker-compose — ensuring it is false."
  cp "$COMPOSE" "${COMPOSE}.bak-envaccess-$(date +%s)"
  sed -i 's|N8N_BLOCK_ENV_ACCESS_IN_NODE=.*|N8N_BLOCK_ENV_ACCESS_IN_NODE=false|' "$COMPOSE"
else
  echo "Not present — adding."
  cp "$COMPOSE" "${COMPOSE}.bak-envaccess-$(date +%s)"
  awk '
    /^  n8n:/ { in_n8n=1 }
    /^  [a-zA-Z]/ && !/^  n8n:/ { in_n8n=0 }
    in_n8n && /^    environment:/ {
      print
      print "      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false"
      next
    }
    { print }
  ' "$COMPOSE" > "${COMPOSE}.new"
  mv "${COMPOSE}.new" "$COMPOSE"
fi

echo
echo "=== n8n environment section ==="
awk '/^  n8n:/,/^  [a-zA-Z]/' "$COMPOSE" | grep -A 25 'environment:' | head -30

echo
echo "=== Restart n8n ==="
cd /volume1/docker/n8n-stack
"$DOCKER" compose up -d n8n

echo
echo "=== Wait for n8n to settle ==="
sleep 5

echo
echo "=== Verify env var visible to expressions ==="
"$DOCKER" exec n8n sh -c 'env | grep N8N_BLOCK_ENV_ACCESS_IN_NODE' 2>&1 || echo "(env check failed — container may still be starting)"

echo
echo "=== Done. ==="
echo "n8n expressions can now read {{ \$env.SYNOLOGY_CHAT_INCOMING_URL }}."
echo "Re-run the @nas test in chat; workflow 10 should now post the ack back."
