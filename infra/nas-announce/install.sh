#!/bin/sh
# install.sh -- idempotent, self-running installer for the sovereign ops-announce
# relay (DR-0156 the bell; DR-0218 zero-n8n; DR-0236: nothing waits for a hand --
# the NAS installs this ITSELF via services-sync, merge to main IS the deploy).
#
# Replaces the deleted n8n workflow wf-ops-announce. Safe to run every cycle:
# every step no-ops when already done. Stdlib only -- no venv, no pip.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-announce"
TOKEN_FILE=/volume1/PoeTech/secrets/announce-token.txt
UNIT=/etc/systemd/system/poetech-announce.service

echo "== announce install: token =="
mkdir -p /volume1/PoeTech/secrets
# REUSE the bearer CI already holds so no new GitHub secret is needed; only
# generate when nothing is there. Never regenerate over a live token.
if [ ! -s "$TOKEN_FILE" ]; then
  if [ -s /volume1/PoeTech/secrets/n8n-bearer.txt ]; then
    cp /volume1/PoeTech/secrets/n8n-bearer.txt "$TOKEN_FILE"
    echo "  seeded from the existing CI bearer"
  else
    (openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n') > "$TOKEN_FILE"
    echo "  generated $TOKEN_FILE"
  fi
  chmod 0600 "$TOKEN_FILE"
fi

echo "== announce install: systemd unit =="
TOKEN="$(cat "$TOKEN_FILE")"
NEED_RELOAD=0
if [ ! -f "$UNIT" ] || ! grep -q "ANNOUNCE_TOKEN=$TOKEN" "$UNIT" 2>/dev/null; then
  sed -e "s|^Environment=ANNOUNCE_TOKEN=.*|Environment=ANNOUNCE_TOKEN=$TOKEN|" \
      "$SRC/poetech-announce.service" > "$UNIT"
  NEED_RELOAD=1
fi
[ "$NEED_RELOAD" = "1" ] && systemctl daemon-reload
systemctl enable poetech-announce >/dev/null 2>&1 || true
systemctl is-active --quiet poetech-announce || systemctl restart poetech-announce

echo "== announce install: proving it answers =="
# Liveness only -- no token needed, and a failure here is LOUD (DR-0306).
sleep 1
if curl -sS --max-time 5 http://127.0.0.1:8796/healthz | grep -q '"ok"'; then
  echo "  announce relay is up on 127.0.0.1:8796"
else
  echo "  ANNOUNCE RELAY DID NOT ANSWER /healthz -- the bell is still dead" >&2
  exit 1
fi
