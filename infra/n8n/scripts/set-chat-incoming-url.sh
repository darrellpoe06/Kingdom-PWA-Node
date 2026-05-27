#!/bin/bash
# ============================================================================
# set-chat-incoming-url.sh - wire the Synology Chat Incoming Webhook URL
# into the n8n container so workflows can post back into #PoeTech-PWA.
# ============================================================================
# Pass the URL as the first argument. The script:
#   1. Adds SYNOLOGY_CHAT_INCOMING_URL to docker-compose.yml under n8n env
#      (idempotent — replaces existing line if present).
#   2. Restarts the n8n container.
#   3. Verifies the env var is visible inside the container.
#
# URL pattern (DSM serves both):
#   http://192.168.1.26:5000/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=<TOKEN>
#   https://192.168.1.26:5001/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=<TOKEN>
# HTTP on 5000 is recommended from inside the LAN — avoids self-signed-cert
# headaches in n8n's HTTP Request node.
#
# Run on Synology: sudo bash /tmp/set-chat-incoming-url.sh "<URL>"
# ============================================================================

set -e

URL="${1:-}"
if [ -z "$URL" ]; then
  echo "Usage: sudo bash $0 \"<incoming-webhook-url>\""
  exit 1
fi

COMPOSE="/volume1/docker/n8n-stack/docker-compose.yml"
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"

echo "=== Backup compose ==="
cp "$COMPOSE" "${COMPOSE}.bak-chatincoming-$(date +%s)"

echo
echo "=== Remove any existing SYNOLOGY_CHAT_INCOMING_URL line ==="
sed -i '/SYNOLOGY_CHAT_INCOMING_URL/d' "$COMPOSE"

echo
echo "=== Insert new SYNOLOGY_CHAT_INCOMING_URL line ==="
# Insert right after the n8n service's "environment:" key (matches the same
# pattern as allow-fs-in-code-node.sh). Use a placeholder we substitute later
# so awk doesn't have to interpolate the URL itself.
awk '
  /^  n8n:/ { in_n8n=1 }
  /^  [a-zA-Z]/ && !/^  n8n:/ { in_n8n=0 }
  in_n8n && /^    environment:/ {
    print
    print "      - SYNOLOGY_CHAT_INCOMING_URL=__URL_PLACEHOLDER__"
    next
  }
  { print }
' "$COMPOSE" > "${COMPOSE}.new"
mv "${COMPOSE}.new" "$COMPOSE"

# Now substitute the placeholder with the real URL. Use | as sed delimiter
# so URL slashes don't confuse it.
sed -i "s|__URL_PLACEHOLDER__|${URL}|" "$COMPOSE"

echo
echo "=== Show n8n environment section ==="
awk '/^  n8n:/,/^  [a-zA-Z]/' "$COMPOSE" | grep -A 20 'environment:' | head -25

echo
echo "=== Restart n8n ==="
cd /volume1/docker/n8n-stack
"$DOCKER" compose up -d n8n

echo
echo "=== Wait for n8n to settle ==="
sleep 5

echo
echo "=== Verify env var inside container ==="
"$DOCKER" exec n8n sh -c 'env | grep SYNOLOGY_CHAT_INCOMING_URL | sed "s/token=.*/token=<REDACTED>/"' 2>&1 || echo "(env check failed - container may still be starting)"

echo
echo "=== Done. ==="
echo "n8n now has SYNOLOGY_CHAT_INCOMING_URL set. Workflows 10 and 11 will use it."
