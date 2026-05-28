#!/bin/bash
# ============================================================================
# set-n8n-external-url.sh — point n8n at its QuickConnect external URL
# ============================================================================
# Google's OAuth client registration rejects LAN IPs and HTTP URLs for
# redirect URIs. They require a public domain + HTTPS. So we register the
# QuickConnect HTTPS hostname with Google:
#   https://192-168-1-26.poetech.direct.quickconnect.to:4443/rest/oauth2-credential/callback
#
# For Google's OAuth callback to actually reach n8n, n8n needs to KNOW that
# its external URL is the QuickConnect one — not the bare 192.168.1.26:5678
# that it sees from inside the container. Setting these env vars makes
# n8n's redirect-URL generation match what Google has registered:
#   N8N_EDITOR_BASE_URL: web UI base URL
#   WEBHOOK_URL:         webhook callback base URL (used for OAuth callbacks)
#
# Run on Synology: sudo bash /tmp/set-n8n-external-url.sh
# Idempotent.
# ============================================================================

set -e

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
EXTERNAL_URL="https://192-168-1-26.poetech.direct.quickconnect.to:4443/"

echo "=== Backup compose ==="
cp "$COMPOSE" "${COMPOSE}.bak-externalurl-$(date +%s)"

echo
echo "=== Remove any existing N8N_EDITOR_BASE_URL / WEBHOOK_URL lines ==="
sed -i '/N8N_EDITOR_BASE_URL/d' "$COMPOSE"
sed -i '/WEBHOOK_URL/d' "$COMPOSE"

echo
echo "=== Insert N8N_EDITOR_BASE_URL + WEBHOOK_URL into n8n service ==="
awk -v url="$EXTERNAL_URL" '
  /^  n8n:/ { in_n8n=1 }
  /^  [a-zA-Z]/ && !/^  n8n:/ { in_n8n=0 }
  in_n8n && /^    environment:/ {
    print
    print "      - N8N_EDITOR_BASE_URL=" url
    print "      - WEBHOOK_URL=" url
    next
  }
  { print }
' "$COMPOSE" > "${COMPOSE}.new"
mv "${COMPOSE}.new" "$COMPOSE"

echo
echo "=== Show n8n environment section ==="
awk '/^  n8n:/,/^  [a-zA-Z]/' "$COMPOSE" | grep -E 'N8N_EDITOR|WEBHOOK|environment:' | head -10

echo
echo "=== Recreate n8n container with new env vars ==="
cd /volume1/docker/n8n-stack
"$DOCKER" compose up -d --force-recreate n8n

echo
echo "=== Wait for n8n to settle ==="
sleep 6

echo
echo "=== Verify env vars inside container ==="
"$DOCKER" exec n8n sh -c 'env | grep -E "N8N_EDITOR_BASE_URL|WEBHOOK_URL"' 2>&1 || echo "(env check failed)"

echo
echo "=== Done. ==="
echo "n8n's OAuth callback URL is now:"
echo "  ${EXTERNAL_URL}rest/oauth2-credential/callback"
echo "This matches the redirect URI registered with Google for the n8n OAuth client."
