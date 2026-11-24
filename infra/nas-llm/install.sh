#!/bin/sh
# install.sh -- idempotent, self-running installer for Ari's road, /llm
# (DR-1649; the tax-upload pattern, by THE-WAY-A-SERVICE-COMES-HOME).
#
# WHAT THIS CLOSES. Darrell 2026-11-24, a child answered "Ari is resting right
# now" on a one-word question: "What happened?!!!! Kids can't ask simple
# questions?!!!" The house's own readout (nas-funnel-report run 45471214852)
# said why: fourteen ports listened and none answered /llm/health, and the
# Funnel had no /llm row. llm_server.py had NO installer and was in NO
# manifest; its README said "run it on the NAS", so nothing had ever started
# it. Ollama itself was listening on 11434 the whole time.
#
# Safe to run every cycle: every step no-ops when already done.
#   1. reads the EXISTING family bridge token; it never makes one (the
#      family-key and tax installers own that file). With no token it says so
#      and stops: the door would refuse every chat anyway.
#   2. builds the venv and installs fastapi + uvicorn
#   3. installs, enables and starts poetech-llm.service (127.0.0.1:8804)
#   4. PROVES the door answers on loopback BEFORE it mounts /llm on the public
#      Funnel (DR-0076: a path pointed at a dark port reads as mounted in every
#      check and answers nobody). The health door says why in words.
# Brakes: request-driven (no timers); one pip install on the first run.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (the /llm row).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-llm"
VENV=/volume1/PoeTech/venvs/llm
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
UNIT=/etc/systemd/system/poetech-llm.service
PORT=8804

# ONE FUNCTION, CALLED ON EVERY PATH (the Way, step 4): the running door
# follows the repo's code whether or not the venv step below succeeds. The
# stamp is written only when the restart succeeded.
door_follows_code() {
  if [ ! -x "$VENV/bin/uvicorn" ]; then echo "  venv not ready yet -- the unit cannot start until it is"; return 0; fi
  TOKEN="$(cat "$TOKEN_FILE" 2>/dev/null || true)"
  if [ -z "$TOKEN" ]; then echo "  no family key at $TOKEN_FILE -- the door is not started without one"; return 0; fi
  NEED_RESTART=0
  TMPU="$(mktemp)"
  sed -e "s|^Environment=LLM_BRIDGE_TOKEN=.*|Environment=LLM_BRIDGE_TOKEN=$TOKEN|" "$SRC/poetech-llm.service" > "$TMPU"
  if [ ! -f "$UNIT" ] || ! cmp -s "$TMPU" "$UNIT"; then
    cp "$TMPU" "$UNIT"
    chmod 0600 "$UNIT"
    systemctl daemon-reload
    NEED_RESTART=1
    echo "  unit written"
  fi
  rm -f "$TMPU"
  STAMP="$VENV/.code.sha"
  CODE_SHA="$(cat "$SRC/llm_server.py" "$SRC/ollama_health.py" | sha256sum | cut -c1-16)"
  if [ "$(cat "$STAMP" 2>/dev/null)" != "$CODE_SHA" ]; then
    NEED_RESTART=1
    echo "  door code changed ($CODE_SHA) -- restarting so the running process follows the code"
  fi
  systemctl enable poetech-llm >/dev/null 2>&1 || true
  if [ "$NEED_RESTART" = "1" ]; then
    systemctl restart poetech-llm && echo "$CODE_SHA" > "$STAMP"
  else
    systemctl is-active --quiet poetech-llm || systemctl restart poetech-llm || true
  fi
  return 0
}

echo "== llm install: the door, before anything that can stop this install =="
mkdir -p /volume1/PoeTech/venvs
door_follows_code

echo "== llm install: venv =="
if [ ! -x "$VENV/bin/uvicorn" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet fastapi uvicorn
fi

echo "== llm install: the door, once more now the venv is there =="
door_follows_code

echo "== llm install: the door must answer on loopback before it is mounted =="
command -v curl >/dev/null 2>&1 || { echo "  curl missing -- cannot prove the door; nothing mounted"; exit 0; }
TRIES=0; HCODE=000
while [ "$TRIES" -lt 10 ]; do
  HCODE="$(curl -s -m 10 -o /tmp/poetech-llm-health -w '%{http_code}' "http://127.0.0.1:$PORT/health" 2>/dev/null || echo 000)"
  [ "$HCODE" != "000" ] && break
  TRIES=$((TRIES + 1)); sleep 2
done
echo "  http://127.0.0.1:$PORT/health -> $HCODE"
echo "  $(head -c 300 /tmp/poetech-llm-health 2>/dev/null)"
rm -f /tmp/poetech-llm-health
if [ "$HCODE" = "000" ]; then
  echo "  the door did not answer -- NOT mounted. See: journalctl -u poetech-llm -n 50"
  exit 0
fi
# 200 is Ollama answering through the door; 502 is the door up and saying, in
# words, that Ollama did not answer. Either is the door's own answer, and the
# app needs to hear the reason, so both are mounted.

echo "== llm install: funnel path mount (guarded, additive; funnel, never serve) =="
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q -- "-- /llm " \
    && echo "  /llm already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /llm "http://127.0.0.1:$PORT" \
         && echo "  mounted /llm -> 127.0.0.1:$PORT on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /llm http://127.0.0.1:$PORT"; }
else
  echo "  tailscale binary not found -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /llm http://127.0.0.1:$PORT"
fi
echo "== llm install: done =="
