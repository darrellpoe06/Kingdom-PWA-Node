#!/bin/sh
# cf-tunnel.sh — thin shim to cf_tunnel.py (the funnel-watchdog pattern).
# The NAS's second road out, a Cloudflare Tunnel (DR-1653, decided in DR-1622).
# Does nothing until /volume1/PoeTech/secrets/cloudflared-token.txt exists.
set -eu
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
exec python3 -u "$REPO/infra/nas-loops/loops/cf_tunnel.py"
