#!/bin/sh
# install.sh -- idempotent, self-running installer for the sovereign /taxes/*
# backend (DR-0236: nothing waits; scribe + property-photos pattern).
#
# WHAT THIS CLOSES. Darrell, 2026-09-06, on the Books -> Taxes screen with a
# 2024 return selected: "I am also unable to upload my taxes." The screen said
# "Could not reach the NAS upload service" AND "NO RETURNS INDEXED YET" at the
# same time -- one cause, three missing pieces, none of them in the app:
#   1. tax_upload_server.py had NO installer and was in NO manifest, so nothing
#      on the NAS had ever started it. Its README said "run it on the NAS",
#      which is the hand step DR-0236 exists to delete.
#   2. The Funnel had no /taxes path mount (infra/nas-transport/RECORDED-STATE.md
#      listed only /, /mcp, /nas-photos), so even a running service was
#      unreachable from poetech.us.
#   3. The Caddy route in the server's docstring existed only in the docstring.
# The reads fell through the Funnel root to n8n, which is why the archive read
# empty while PDFs sat in the drop directory. Same class as the /nas-photos gap
# (DR-0268): built + correct, never actuated, silent for weeks.
#
# Safe to run every cycle: every step no-ops when already done.
#   1. reuses the EXISTING family bridge token (never regenerates over a live
#      one -- a new token would 401 every device that already has the old one)
#   2. builds the venv + installs fastapi/uvicorn/python-multipart
#   3. installs + enables + starts poetech-tax-upload.service (systemd)
#   4. ensures the drop + publish directories exist and runs the ingest once,
#      so a NAS that already has PDFs publishes them on this very cycle
#   5. mounts /taxes on the PUBLIC funnel (additive; funnel, never serve)
#   6. probes 127.0.0.1:8790/health and says loudly when it fails
# It never edits a config it cannot verify (DR-0076): no blind Caddyfile writes.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (actuates the /taxes row
# added by the same merge, per rule 2).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-tax-ingest"
VENV=/volume1/PoeTech/venvs/tax-upload
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
UNIT=/etc/systemd/system/poetech-tax-upload.service
DROP=/volume1/PoeTech/tax-documents
SITE=/volume1/PoeTech/caddy/site/poetech-app/taxes

echo "== tax-upload install: directories + token =="
mkdir -p "$DROP" "$SITE/files" /volume1/PoeTech/secrets /volume1/PoeTech/venvs
if [ ! -s "$TOKEN_FILE" ]; then
  # SHARED with the photo server on purpose -- one family bearer, provisioned to
  # devices by the 0128 RPC. Only generated when genuinely absent.
  (openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n') > "$TOKEN_FILE"
  chmod 0600 "$TOKEN_FILE"
  echo "  generated $TOKEN_FILE (NEW token -- devices provision via the 0128 RPC)"
fi

echo "== tax-upload install: venv =="
if [ ! -x "$VENV/bin/uvicorn" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet fastapi uvicorn python-multipart
fi

echo "== tax-upload install: systemd unit =="
TOKEN="$(cat "$TOKEN_FILE")"
NEED_RESTART=0
if [ ! -f "$UNIT" ] || ! grep -q "TAX_UPLOAD_TOKEN=$TOKEN" "$UNIT" 2>/dev/null; then
  sed -e "s|^Environment=TAX_UPLOAD_TOKEN=.*|Environment=TAX_UPLOAD_TOKEN=$TOKEN|" \
      "$SRC/poetech-tax-upload.service" > "$UNIT"
  systemctl daemon-reload
  NEED_RESTART=1
fi
systemctl enable poetech-tax-upload >/dev/null 2>&1 || true
if [ "$NEED_RESTART" = "1" ]; then
  systemctl restart poetech-tax-upload
else
  systemctl is-active --quiet poetech-tax-upload || systemctl restart poetech-tax-upload
fi

echo "== tax-upload install: publish whatever is already dropped =="
# Deterministic, idempotent, stdlib-only. A NAS that already holds returns
# publishes them on this cycle instead of waiting for the next upload -- the
# "NO RETURNS INDEXED YET" half of the report is fixed by this line, not by
# anything the browser does.
(cd "$SRC" && python3 tax_ingest.py) || echo "  ingest reported a problem (see above) -- service still starts"

echo "== tax-upload install: funnel path mount (guarded, additive, reversible) =="
# FUNNEL, never `serve` (RECORDED-STATE rule 1: serve is tailnet-only and would
# REPLACE the public exposure). Full DSM binary path -- the CLI is not on the
# non-login SSH PATH (diagnostic 30507928325).
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/taxes" \
    && echo "  /taxes already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /taxes http://127.0.0.1:8790 \
         && echo "  mounted /taxes -> 127.0.0.1:8790 on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /taxes http://127.0.0.1:8790"; }
else
  echo "  tailscale binary not found (checked PATH + /var/packages/Tailscale) -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /taxes http://127.0.0.1:8790"
fi

echo "== tax-upload install: health =="
sleep 1
if command -v curl >/dev/null 2>&1; then
  curl -fsS http://127.0.0.1:8790/health && echo "" || echo "  health check FAILED -- see: journalctl -u poetech-tax-upload -n 50"
fi
echo "== tax-upload install: done =="
