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
#   5. restarts the service when its CODE changed (a hash stamp), so a merged
#      fix is the running fix -- before 2026-09-24 a running server was never
#      restarted, and a changed server stayed the old one until a reboot.
#   6. mounts /scribe on the PUBLIC funnel (additive; funnel, never serve), so
#      the app's same-origin /scribe/* reaches this server at all (DR-0622:
#      the flow graph found the route listed UNACTUATED since 2026-09-06).
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (actuates the /scribe row)
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
STAMP="$DATA/.server-code.sha"
CODE_SHA="$(cat "$SRC/scribe_ingest_server.py" "$SRC/scribe_results.py" 2>/dev/null | sha256sum | cut -c1-16)"
if [ "$NEED_RELOAD" = "1" ] || [ "$(cat "$STAMP" 2>/dev/null)" != "$CODE_SHA" ]; then
  systemctl restart poetech-scribe && echo "$CODE_SHA" > "$STAMP" && echo "  restarted (unit or code changed: $CODE_SHA)"
else
  systemctl is-active --quiet poetech-scribe || systemctl restart poetech-scribe
fi

echo "== scribe install: funnel path mount (guarded, additive, reversible) =="
# FUNNEL, never `serve` (RECORDED-STATE rule 1: serve is tailnet-only and would
# REPLACE the public exposure). Full DSM binary path -- the CLI is not on the
# non-login SSH PATH (diagnostic 30507928325). The same shape as /taxes.
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/scribe" \
    && echo "  /scribe already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /scribe http://127.0.0.1:8791 \
         && echo "  mounted /scribe -> 127.0.0.1:8791 on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /scribe http://127.0.0.1:8791"; }
else
  echo "  tailscale binary not found (checked PATH + /var/packages/Tailscale) -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /scribe http://127.0.0.1:8791"
fi

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
