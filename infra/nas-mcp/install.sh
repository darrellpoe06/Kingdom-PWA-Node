#!/bin/sh
# install.sh -- idempotent, self-running installer for the sovereign MCP server
# (DR-0244; DR-0236: nothing waits for a hand -- the NAS installs this ITSELF
# via the services-sync loop; merge to main IS the deploy).
#
# Safe to run every cycle: every step is a no-op when already done. It:
#   1. generates the bearer token once (mode 0600)
#   2. builds the venv + installs fastapi/uvicorn
#   3. installs + enables + starts poetech-mcp.service (systemd)
#   4. best-effort: drops the Caddy /mcp route snippet where an import dir
#      exists; otherwise prints the one-line route so it lands in the loop log
#      -- the service is still up on 127.0.0.1:8795 either way.
# It never edits a config it cannot verify (DR-0076): no blind Caddyfile writes.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-mcp"
VENV=/volume1/PoeTech/venvs/mcp
TOKEN_FILE=/volume1/PoeTech/secrets/mcp-token.txt
UNIT=/etc/systemd/system/poetech-mcp.service

echo "== mcp install: token =="
mkdir -p /volume1/PoeTech/secrets /volume1/PoeTech/venvs
if [ ! -s "$TOKEN_FILE" ]; then
  (openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n') > "$TOKEN_FILE"
  chmod 0600 "$TOKEN_FILE"
  echo "  generated $TOKEN_FILE"
fi

echo "== mcp install: venv =="
if [ ! -x "$VENV/bin/uvicorn" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet fastapi uvicorn
fi

echo "== mcp install: systemd unit =="
TOKEN="$(cat "$TOKEN_FILE")"
NEED_RELOAD=0
if [ ! -f "$UNIT" ] || ! grep -q "MCP_BRIDGE_TOKEN=$TOKEN" "$UNIT" 2>/dev/null; then
  sed -e "s|^Environment=MCP_BRIDGE_TOKEN=.*|Environment=MCP_BRIDGE_TOKEN=$TOKEN|" \
      "$SRC/poetech-mcp.service" > "$UNIT"
  NEED_RELOAD=1
fi
if [ "$NEED_RELOAD" = "1" ]; then
  systemctl daemon-reload
fi
systemctl enable poetech-mcp >/dev/null 2>&1 || true
systemctl is-active --quiet poetech-mcp || systemctl restart poetech-mcp

echo "== mcp install: caddy route (best-effort) =="
ROUTE='handle /mcp { reverse_proxy 127.0.0.1:8795 }'
DROPPED=0
for IMPORT_DIR in /volume1/PoeTech/caddy/conf.d /etc/caddy/conf.d; do
  if [ -d "$IMPORT_DIR" ]; then
    SNIPPET="$IMPORT_DIR/mcp.caddy"
    if [ ! -f "$SNIPPET" ]; then
      echo "$ROUTE" > "$SNIPPET"
      (command -v caddy >/dev/null 2>&1 && caddy reload 2>/dev/null) || \
        systemctl reload caddy 2>/dev/null || true
      echo "  wrote $SNIPPET"
    fi
    DROPPED=1
    break
  fi
done
if [ "$DROPPED" = "0" ]; then
  echo "  NO caddy import dir found -- add this route to the Caddyfile by hand:"
  echo "    $ROUTE"
fi

echo "== mcp install: funnel path mount (guarded, additive, reversible) =="
# The 2026-07-29 mcp-health probe proved the Funnel's public hostname routes
# to n8n at '/' — a Caddy snippet alone is unreachable from outside. A
# tailscale-serve PATH mount is additive per-path (never touches '/', the
# live transport) and reversible (tailscale serve --set-path /mcp off).
# Guarded per DR-0076: only when the CLI exists, only when /mcp is not
# already mounted; on an old CLI without --set-path this prints the manual
# line honestly instead of guessing.
if command -v tailscale >/dev/null 2>&1; then
  # RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md
  # This section is the ACTUATOR of the recorded public-transport baseline:
  # it verifies and restores BOTH rows idempotently. FUNNEL, never serve —
  # `tailscale serve` is tailnet-only and REPLACED the public exposure on
  # 2026-07-30 (probes 30507138138/30507540039: TLS resets; webhook transport
  # dark). funnel --set-path mounts are additive and public.
  FSTAT="$(tailscale funnel status 2>/dev/null || true)"
  if printf '%s' "$FSTAT" | grep -q "127.0.0.1:5678"; then
    echo "  funnel root -> 5678 (n8n legacy webhooks) present per RECORDED-STATE"
  else
    tailscale funnel --bg http://127.0.0.1:5678 \
      && echo "  RESTORED funnel root -> 127.0.0.1:5678 (the recorded baseline; was missing)" \
      || echo "  funnel root restore FAILED -- run by hand: tailscale funnel --bg http://127.0.0.1:5678"
  fi
  if printf '%s' "$FSTAT" | grep -q "/mcp"; then
    echo "  /mcp already mounted on the funnel"
  else
    tailscale funnel --bg --set-path /mcp http://127.0.0.1:8795 \
      && echo "  mounted /mcp -> 127.0.0.1:8795 on the PUBLIC funnel (additive)" \
      || echo "  mount FAILED -- run by hand: tailscale funnel --bg --set-path /mcp http://127.0.0.1:8795"
  fi
  tailscale funnel status 2>/dev/null || true
else
  echo "  no tailscale CLI on PATH -- mount by hand from DSM: tailscale serve --bg --set-path /mcp http://127.0.0.1:8795"
fi

echo "== mcp install: health (a real discover round-trip, DR-0076) =="
sleep 1
if command -v curl >/dev/null 2>&1; then
  curl -fsS -X POST http://127.0.0.1:8795/mcp \
    -H "Authorization: Bearer $TOKEN" \
    -H "MCP-Protocol-Version: 2026-07-28" \
    -H "Mcp-Method: server/discover" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"server/discover"}' \
    && echo "" || echo "  health check FAILED -- see: journalctl -u poetech-mcp -n 50"
fi
echo "== mcp install: done =="
