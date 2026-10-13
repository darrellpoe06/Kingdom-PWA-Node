#!/bin/sh
# install.sh -- idempotent, self-running installer for the sovereign property-
# photo image server (DR-0268; scribe pattern). Closes the "built + verified
# locally 2026-07-01; NAS deploy pending Darrell" gap for good: the services-
# sync loop installs/repairs/starts this on the NAS's own clock -- merge is
# the deploy, no hand. Safe to run every cycle; every step no-ops when done.
#   1. ensures the bridge-token secret exists (kept if present -- it is the
#      SAME family token the app devices carry; never regenerated over a
#      live one)
#   2. copies photo_server.py from the repo mirror when changed
#   3. installs + enables + starts poetech-photo-server.service (systemd)
#   4. probes http://127.0.0.1:8099/healthz -- warns loudly, scribe-style
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-property-photos"
SCRIPT=/volume1/PoeTech/scripts/photo_server.py
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
UNIT=/etc/systemd/system/poetech-photo-server.service

echo "== photo-server install: secrets =="
mkdir -p /volume1/PoeTech/scripts /volume1/PoeTech/secrets
if [ ! -s "$TOKEN_FILE" ]; then
  (openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n') > "$TOKEN_FILE"
  chmod 0600 "$TOKEN_FILE"
  echo "  generated $TOKEN_FILE (NEW token -- family devices provision via the 0128 RPC once a steward publishes it)"
fi

echo "== photo-server install: script =="
NEED_RESTART=0
if [ ! -f "$SCRIPT" ] || ! cmp -s "$SRC/photo_server.py" "$SCRIPT"; then
  cp "$SRC/photo_server.py" "$SCRIPT"
  NEED_RESTART=1
  echo "  updated $SCRIPT"
fi

echo "== photo-server install: systemd unit =="
if [ ! -f "$UNIT" ] || ! cmp -s "$SRC/poetech-photo-server.service" "$UNIT"; then
  cp "$SRC/poetech-photo-server.service" "$UNIT"
  systemctl daemon-reload
  NEED_RESTART=1
fi
systemctl enable poetech-photo-server >/dev/null 2>&1 || true
if [ "$NEED_RESTART" = "1" ]; then
  systemctl restart poetech-photo-server
else
  systemctl is-active --quiet poetech-photo-server || systemctl restart poetech-photo-server
fi

echo "== photo-server install: funnel path mount (guarded, additive, reversible) =="
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md
# ACTUATOR of the /nas-photos row added by the same merge (rule 2). Same
# guarded idiom as infra/nas-mcp/install.sh: FUNNEL (public, additive), never
# `serve`; full DSM binary path (the CLI is not on the non-login SSH PATH —
# diagnostic 30507928325); only when not already mounted; never touches the
# n8n root (DR-0218 — we do not prop up what we are removing).
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/nas-photos" \
    && echo "  /nas-photos already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /nas-photos http://127.0.0.1:8099 \
         && echo "  mounted /nas-photos -> 127.0.0.1:8099 on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /nas-photos http://127.0.0.1:8099"; }
else
  echo "  tailscale binary not found (checked PATH + /var/packages/Tailscale) -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /nas-photos http://127.0.0.1:8099"
fi

echo "== photo-server install: health =="
sleep 1
if command -v curl >/dev/null 2>&1; then
  curl -fsS http://127.0.0.1:8099/healthz && echo "" || echo "  health check FAILED -- see: journalctl -u poetech-photo-server -n 50"
fi
echo "== photo-server install: done =="
