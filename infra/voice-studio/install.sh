#!/bin/sh
# install.sh -- idempotent, self-running installer for the SOVEREIGN /voice
# road home (DR-0236; the /nas-photos + /taxes pattern).
#
# WHAT THIS CLOSES. Darrell, 2026-09-20, reading a lesson on a Fire TV: "No
# sounds yet for the tts... but it does click and do what it should." The
# device has no voice of its own, so the app routes the System voice to the
# church's OWN XTTS studio (DR-0382 / DR-0394) over the same-origin /voice
# transport -- and the Funnel had no /voice mount for it to arrive on. Same
# class as /nas-photos (DR-0268) and /taxes (DR-0330): built, correct, never
# actuated.
#
# TWO FACTS THIS FILE IS BUILT ON, both verified rather than assumed (the first
# version of this file assumed the opposite of the first one):
#   1. Tailscale will only proxy to localhost -- "only localhost or 127.0.0.1
#      proxies are currently supported" (tailscale/tailscale#8751, open since
#      2023-07-31). The studio runs on the 4070, so a Funnel path cannot reach
#      it directly. voice_forwarder.py answers on 127.0.0.1:8771 and carries
#      the request across; the Funnel mounts THAT.
#   2. The studio has no authentication of its own and /voice is on the PUBLIC
#      Funnel. The forwarder gates /speak on the family bridge bearer -- the
#      same token the photo and tax servers already require -- so the family's
#      GPU is not on the open internet for strangers to spend.
#
# WHY THIS INSTALLER DOES NOT START THE STUDIO. It is a GPU container on the
# 4070, brought up by .github/workflows/arm-voice-studio.yml. The NAS owns the
# Funnel and the forwarder; that is all this touches. The two halves arm
# independently and in either order: whichever runs second finds the other.
#
# PROVE, NEVER ASSUME (DR-0076). The forwarder is pointed ONLY at a studio that
# has ANSWERED /health on this cycle, and the Funnel is mounted only once the
# forwarder itself answers. A path mounted at a dark host is worse than no
# mount: it hangs the reader instead of failing them, and reads as actuated in
# every check. A cycle that finds no studio installs the unit (so the service
# exists and is enabled) but leaves it pointed where it was and mounts nothing,
# says exactly that, and exits 0 -- services-sync keeps running, and the NEXT
# cycle after the 4070 comes up makes the mount with no human involved.
#
# Safe to run every cycle: every step no-ops when already done.
#   1. finds a studio that answers (127.0.0.1:8770, then the 4070 three ways)
#   2. installs + enables poetech-voice-forwarder.service, pointed at it
#   3. mounts /voice -> 127.0.0.1:8771 on the PUBLIC funnel (additive)
#   4. probes the forwarder's /health, which passes the STUDIO's answer through
# It never edits a config it cannot verify (DR-0076): no blind Caddyfile writes.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (actuates the /voice
# row, per rule 2).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/voice-studio"
UNIT=/etc/systemd/system/poetech-voice-forwarder.service
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
FWD=http://127.0.0.1:8771

# Studio candidates, in order: this box first (no tailnet hop), then the 4070
# by MagicDNS name (survives an address change), by full tailnet name, then by
# its address as measured 2026-09-20 for the case where MagicDNS is off.
# These are targets for the FORWARDER, which may point anywhere -- never for
# the Funnel, which may point only at 127.0.0.1.
CANDIDATES="${VOICE_STUDIO_URL:-} http://127.0.0.1:8770 http://tlcmediadpt:8770 http://tlcmediadpt.tail5a2f35.ts.net:8770 http://100.69.19.13:8770"

echo "== voice install: token =="
if [ ! -s "$TOKEN_FILE" ]; then
  echo "  $TOKEN_FILE is missing or empty -- the forwarder refuses to start without a bearer,"
  echo "  and that is correct: a door with no lock in front of the GPU is worse than no door."
  echo "  (The photo/tax installers generate it; run either first, or seed it by hand.)"
  exit 0
fi

echo "== voice install: find a studio that is actually answering =="
if ! command -v curl >/dev/null 2>&1; then
  echo "  curl is not on this box -- cannot verify a backend, so nothing changes"
  exit 0
fi
BACKEND=""
for C in $CANDIDATES; do
  [ -n "$C" ] || continue
  CODE="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "$C/health" 2>/dev/null || echo 000)"
  echo "  $C/health -> $CODE"
  if [ "$CODE" = "200" ]; then BACKEND="$C"; break; fi
done

echo "== voice install: forwarder unit =="
NEED_RESTART=0
if [ -n "$BACKEND" ]; then
  # Point the unit at the studio that answered. Only rewrite when it changed,
  # so a stable box never restarts its forwarder mid-sentence.
  if [ ! -f "$UNIT" ] || ! grep -q "VOICE_STUDIO_UPSTREAM=$BACKEND\$" "$UNIT" 2>/dev/null; then
    sed -e "s|^Environment=VOICE_STUDIO_UPSTREAM=.*|Environment=VOICE_STUDIO_UPSTREAM=$BACKEND|" \
        "$SRC/poetech-voice-forwarder.service" > "$UNIT"
    systemctl daemon-reload
    NEED_RESTART=1
    echo "  unit written, upstream $BACKEND"
  else
    echo "  unit already points at $BACKEND"
  fi
elif [ ! -f "$UNIT" ]; then
  cp "$SRC/poetech-voice-forwarder.service" "$UNIT"
  systemctl daemon-reload
  echo "  no studio answered; unit installed with its default upstream so the service exists"
fi
systemctl enable poetech-voice-forwarder >/dev/null 2>&1 || true
if [ "$NEED_RESTART" = "1" ]; then
  systemctl restart poetech-voice-forwarder
else
  systemctl is-active --quiet poetech-voice-forwarder || systemctl restart poetech-voice-forwarder || true
fi

if [ -z "$BACKEND" ]; then
  echo "  no voice studio answered on this cycle."
  echo "  NOTHING MOUNTED -- deliberately. A /voice path in front of a dark studio"
  echo "  would hang the reader instead of failing them, and would read as armed."
  echo "  Bring the studio up (arm-voice-studio.yml, arm=true, once CI's key is"
  echo "  authorized on the 4070); the next services-sync cycle mounts on its own."
  exit 0
fi

echo "== voice install: the forwarder must itself answer before the Funnel points at it =="
sleep 1
FCODE="$(curl -s -m 8 -o /dev/null -w '%{http_code}' "$FWD/health" 2>/dev/null || echo 000)"
echo "  $FWD/health -> $FCODE (this is the STUDIO's answer, passed through)"
if [ "$FCODE" != "200" ]; then
  echo "  forwarder is not passing a 200 through -- NOT mounting. See: journalctl -u poetech-voice-forwarder -n 50"
  exit 0
fi

echo "== voice install: funnel path mount (guarded, additive, reversible) =="
# FUNNEL, never `serve` (RECORDED-STATE rule 1: serve is tailnet-only and would
# REPLACE the public exposure). Full DSM binary path -- the CLI is not on the
# non-login SSH PATH (diagnostic 30507928325). The target is 127.0.0.1 and
# nothing else: the only kind of target tailscale accepts.
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/voice" \
    && echo "  /voice already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /voice "$FWD" \
         && echo "  mounted /voice -> $FWD on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /voice $FWD"; }
else
  echo "  tailscale binary not found (checked PATH + /var/packages/Tailscale) -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /voice $FWD"
fi
echo "== voice install: done =="
