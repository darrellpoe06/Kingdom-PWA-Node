#!/bin/bash
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md — this script sets the
# public funnel root (-> 127.0.0.1:5678, n8n legacy). Keep that row true; the
# n8n root is LEGACY and shrinks to zero (DR-0218), never grows. Never use
# `serve --set-path` to REPLACE the public exposure (the 2026-07-30 outage class).
# ============================================================================
# setup-tailscale-funnel.sh - expose n8n's webhook endpoint to the public
# internet via Tailscale Funnel, so the PWA can reach /webhook/* from any
# device on any network (cellular, public wifi, friend's house) without
# requiring the device to be on the tailnet.
# ============================================================================
# Why this exists:
#   QuickConnect (DSM's relay) only forwards the standard DSM web ports
#   (5000 / 5001 / 443). It does NOT forward port 4443 where n8n lives.
#   The PWA's Imported tab fetches from /webhook/imported-transactions, and
#   from cellular it currently gets "Failed to fetch" because there's no
#   public route to the n8n container.
#
#   Tailscale Funnel is the cleanest fix:
#     - Public HTTPS URL like  https://poetech.tail<tag>.ts.net
#     - Tailscale's edge does TLS termination + auth-free proxying
#     - Backend stays on the NAS, no port forward, no router config
#     - One command to turn on, one command to turn off
#
#   Funnel only proxies on TCP/443, 8443, or 10000. We use 443 (default).
#   Local target is the n8n container's host-exposed port 5678.
#
# Prereqs (one-time, in the Tailscale admin console at
# https://login.tailscale.com/admin/dns and /acls):
#   1. The tailnet must have Funnel feature enabled on the node (an "attr"
#      in the tailnet policy file). The script will TRY to enable it via
#      tailscale serve config but will print a clear message if the admin
#      console grant is missing.
#   2. The tailnet must have HTTPS certs enabled (MagicDNS + HTTPS in admin
#      DNS settings).
#
# What this script does:
#   1. Verifies Tailscale is installed + running + logged in.
#   2. Enables Funnel for the n8n container's port 5678 on the device.
#   3. Prints the public Funnel URL the PWA should target.
#   4. Writes a small status file at /volume1/PoeTech/finance-events/_funnel-url.txt
#      so any tool (or a follow-up workflow) can pick the current URL up
#      from disk.
#
# Run on Synology:  sudo bash /tmp/setup-tailscale-funnel.sh
# Idempotent - safe to re-run; tailscale serve / funnel apply current
# config on every call.
# ============================================================================

set -e

TAILSCALE_BIN="/var/packages/Tailscale/target/bin/tailscale"
N8N_LOCAL_PORT="5678"
FUNNEL_PORT="443"
STATUS_FILE="/volume1/PoeTech/finance-events/_funnel-url.txt"

echo "=== Verify Tailscale binary ==="
if [ ! -x "$TAILSCALE_BIN" ]; then
  echo "ERROR: tailscale binary not found at $TAILSCALE_BIN"
  echo "Run install-tailscale-on-nas.sh first."
  exit 1
fi
"$TAILSCALE_BIN" version | head -3

echo
echo "=== Verify daemon is up + logged in ==="
STATUS_JSON=$("$TAILSCALE_BIN" status --json 2>/dev/null || true)
if [ -z "$STATUS_JSON" ]; then
  echo "ERROR: tailscale status failed - daemon may be down."
  exit 1
fi
SELF_NAME=$(echo "$STATUS_JSON" | grep -oE '"DNSName"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
if [ -z "$SELF_NAME" ]; then
  echo "ERROR: could not determine this node's tailnet DNS name."
  echo "Make sure 'tailscale up' has been completed and the node is approved."
  exit 1
fi
echo "Tailnet DNS name: $SELF_NAME"

echo
echo "=== Verify n8n is listening on localhost:${N8N_LOCAL_PORT} ==="
if command -v curl >/dev/null 2>&1; then
  HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "http://localhost:${N8N_LOCAL_PORT}/" || true)
  echo "Local n8n probe -> HTTP $HTTP_CODE"
  if [ "$HTTP_CODE" = "000" ]; then
    echo "WARNING: nothing answering on localhost:${N8N_LOCAL_PORT}."
    echo "Funnel will still be enabled, but webhook calls will 502 until n8n is up."
  fi
fi

echo
echo "=== Reset any prior serve/funnel config ==="
"$TAILSCALE_BIN" serve reset 2>/dev/null || true
"$TAILSCALE_BIN" funnel reset 2>/dev/null || true

echo
echo "=== Configure serve mapping (HTTPS ${FUNNEL_PORT} -> localhost:${N8N_LOCAL_PORT}) ==="
# Newer tailscale CLIs prefer the `tailscale serve --bg` form; older ones
# use `tailscale serve https / proxy http://localhost:PORT`. Try the new
# form first, fall back to the older form on syntax error.
if ! "$TAILSCALE_BIN" serve --bg --https="${FUNNEL_PORT}" "http://localhost:${N8N_LOCAL_PORT}" 2>/tmp/ts-serve-err; then
  echo "Falling back to legacy serve syntax..."
  "$TAILSCALE_BIN" serve https / "http://localhost:${N8N_LOCAL_PORT}"
fi

echo
echo "=== Enable Funnel on HTTPS ${FUNNEL_PORT} ==="
if ! "$TAILSCALE_BIN" funnel --bg --https="${FUNNEL_PORT}" on 2>/tmp/ts-funnel-err; then
  # Older syntax: `tailscale funnel <port> on`
  echo "Falling back to legacy funnel syntax..."
  "$TAILSCALE_BIN" funnel "${FUNNEL_PORT}" on || {
    echo
    echo "ERROR: tailscale funnel command failed."
    echo "Possible causes:"
    echo "  1. Tailnet does not have Funnel enabled in the admin policy file."
    echo "     Fix: in https://login.tailscale.com/admin/acls add to the tailnet"
    echo "          policy:  \"nodeAttrs\": [{ \"target\": [\"${SELF_NAME%.}\"], \"attr\": [\"funnel\"] }]"
    echo "  2. MagicDNS + HTTPS certs not enabled."
    echo "     Fix: in https://login.tailscale.com/admin/dns - enable HTTPS Certificates."
    echo
    echo "Last error from tailscale: "
    cat /tmp/ts-funnel-err 2>/dev/null || true
    exit 1
  }
fi

echo
echo "=== Current serve + funnel status ==="
"$TAILSCALE_BIN" serve status 2>&1 || true
echo
"$TAILSCALE_BIN" funnel status 2>&1 || true

# Compose the public URL. Default Funnel HTTPS on 443 means no explicit port.
if [ "$FUNNEL_PORT" = "443" ]; then
  PUBLIC_URL="https://${SELF_NAME%.}"
else
  PUBLIC_URL="https://${SELF_NAME%.}:${FUNNEL_PORT}"
fi

echo
echo "=== Write status file for tools to pick up ==="
mkdir -p "$(dirname "$STATUS_FILE")"
{
  echo "tailscale_funnel_url=${PUBLIC_URL}"
  echo "tailnet_dns_name=${SELF_NAME%.}"
  echo "local_target=http://localhost:${N8N_LOCAL_PORT}"
  echo "funnel_port=${FUNNEL_PORT}"
  echo "enabled_at=$(date -Iseconds)"
} > "$STATUS_FILE"
chown 1000:1000 "$STATUS_FILE" 2>/dev/null || true
cat "$STATUS_FILE"

echo
echo "=== Done. ==="
echo
echo "Public n8n base URL:  ${PUBLIC_URL}"
echo "Test from any network (cellular OK):"
echo "  curl -sS \"${PUBLIC_URL}/webhook/imported-transactions?limit=1\" | head -100"
echo
echo "Then in Vercel - set this env var on the kingdom-pwa-node project and redeploy:"
echo "  VITE_N8N_WEBHOOK_BASE=${PUBLIC_URL}"
echo
echo "To turn Funnel off later:"
echo "  sudo ${TAILSCALE_BIN} funnel ${FUNNEL_PORT} off"
echo "  sudo ${TAILSCALE_BIN} serve reset"
