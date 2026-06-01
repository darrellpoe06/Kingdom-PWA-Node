#!/bin/bash
# ============================================================================
# allow-fs-in-code-node.sh - let n8n's Code node use require('fs')
# ============================================================================
# By default n8n sandboxes the Code node JavaScript and DISALLOWS
# require('fs'), require('path'), etc. The Synology Chat inbound capture
# workflow needs fs to write JSON files to /data/chatin.
#
# Fix: set NODE_FUNCTION_ALLOW_BUILTIN env var on the n8n container so
# fs + path + crypto are explicitly allowed.
#
# Diagnosis source: n8n execution 12 (2026-05-27 18:42 UTC) returned
# "Module 'fs' is disallowed [line 8]" — confirmed root cause, not a guess.
#
# Run on Synology: sudo bash /tmp/allow-fs-in-code-node.sh
# Idempotent.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"

echo "=== Check if env var already present ==="
if grep -q "NODE_FUNCTION_ALLOW_BUILTIN" "$COMPOSE"; then
  echo "NODE_FUNCTION_ALLOW_BUILTIN already in docker-compose — no edit needed."
else
  echo "Not present — adding."
  cp "$COMPOSE" "${COMPOSE}.bak-fs-$(date +%s)"

  # Insert the line right after the n8n service's "environment:" key.
  # Use awk to identify the n8n service block specifically.
  awk '
    /^  n8n:/ { in_n8n=1 }
    /^  [a-zA-Z]/ && !/^  n8n:/ { in_n8n=0 }
    in_n8n && /^    environment:/ {
      print
      print "      - NODE_FUNCTION_ALLOW_BUILTIN=fs,path,crypto"
      next
    }
    { print }
  ' "$COMPOSE" > "${COMPOSE}.new"
  mv "${COMPOSE}.new" "$COMPOSE"
  echo "Inserted."
fi

echo
echo "=== n8n environment section (first 15 lines) ==="
awk '/^  n8n:/,/^  [a-zA-Z]/' "$COMPOSE" | grep -A 15 'environment:' | head -20

echo
echo "=== Restart n8n with new env var ==="
cd /volume1/docker/n8n-stack
"$DOCKER" compose up -d n8n

echo
echo "=== Wait for n8n to settle ==="
sleep 5

echo
echo "=== Verify env var inside container ==="
"$DOCKER" exec n8n sh -c 'env | grep NODE_FUNCTION' 2>&1 || echo "(env check failed — container may still be starting)"

echo
echo "=== Done. ==="
echo "n8n container restarted with NODE_FUNCTION_ALLOW_BUILTIN=fs,path,crypto"
echo "Test: curl POST to /webhook/synology-chat-inbound, then ls /volume1/drive/PoeTech/ChatIn"
