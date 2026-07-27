#!/bin/sh
# install.sh -- idempotent, self-running installer for the Scribe NAS stack
# (DR-0236: nothing waits -- the NAS installs this ITSELF via the services-sync
# loop; no human hand needed once the loop dispatcher is armed).
#
# Safe to run every cycle: every step is a no-op when already done. It:
#   1. creates the data dir + a token (generated once, mode 0600)
#   2. builds the venv + installs fastapi/uvicorn/python-multipart
#   3. installs + enables + starts poetech-scribe.service (systemd)
#   4. best-effort: drops a Caddy route snippet where an import dir exists;
#      otherwise prints the one-line route so it lands in the loop log --
#      the service is still up on 127.0.0.1:8791 either way.
# It never edits a config it cannot verify (DR-0076): no blind Caddyfile writes.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-scribe"
DATA="${SCRIBE_DATA:-/data/poetech-scribe}"
VENV=/volume1/PoeTech/venvs/scribe
TOKEN_FILE=/volume1/PoeTech/secrets/scribe-token.txt
UNIT=/etc/systemd/system/poetech-scribe.service

echo "== scribe install: data dir + token =="
mkdir -p "$DATA/sessions" /volume1/PoeTech/secrets /volume1/PoeTech/venvs
if [ ! -s "$TOKEN_FILE" ]; then
  # openssl is present on DSM; fall back to /dev/urandom.
  (openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n') > "$TOKEN_FILE"
  chmod 0600 "$TOKEN_FILE"
  echo "  generated $TOKEN_FILE"
fi

echo "== scribe install: venv =="
if [ ! -x "$VENV/bin/uvicorn" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet fastapi uvicorn python-multipart
fi

echo "== scribe install: systemd unit =="
TOKEN="$(cat "$TOKEN_FILE")"
NEED_RELOAD=0
if [ ! -f "$UNIT" ] || ! grep -q "SCRIBE_TOKEN=$TOKEN" "$UNIT" 2>/dev/null; then
  sed -e "s|^Environment=SCRIBE_TOKEN=.*|Environment=SCRIBE_TOKEN=$TOKEN|" \
      -e "s|^Environment=SCRIBE_DATA=.*|Environment=SCRIBE_DATA=$DATA|" \
      "$SRC/poetech-scribe.service" > "$UNIT"
  NEED_RELOAD=1
fi
if [ "$NEED_RELOAD" = "1" ]; then
  systemctl daemon-reload
fi
systemctl enable poetech-scribe >/dev/null 2>&1 || true
systemctl is-active --quiet poetech-scribe || systemctl restart poetech-scribe

echo "== scribe install: caddy route (best-effort) =="
ROUTE='handle /scribe/* { reverse_proxy 127.0.0.1:8791 }'
DROPPED=0
for IMPORT_DIR in /volume1/PoeTech/caddy/conf.d /etc/caddy/conf.d; do
  if [ -d "$IMPORT_DIR" ]; then
    SNIPPET="$IMPORT_DIR/scribe.caddy"
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

echo "== scribe install: health =="
sleep 1
if command -v curl >/dev/null 2>&1; then
  curl -fsS http://127.0.0.1:8791/health && echo "" || echo "  health check FAILED -- see: journalctl -u poetech-scribe -n 50"
fi
echo "== scribe install: done =="
