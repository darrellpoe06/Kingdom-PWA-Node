#!/bin/sh
# install.sh -- idempotent, self-running installer for the SOVEREIGN /voice
# road home (DR-0236; the /nas-photos + /taxes pattern).
#
# WHAT THIS CLOSES. Darrell, 2026-09-20, reading a lesson on a Fire TV: "No
# sounds yet for the tts... but it does click and do what it should." The
# clicking was real -- the control worked; there was simply nothing anywhere
# that could produce audio for that device. Two reasons, and this file is the
# second one:
#   1. Fire OS's Silk may carry no speechSynthesis voice at all, so the browser
#      stand-in has nothing to say the words with. That is why the app now
#      routes the System voice to the church's OWN studio instead (DR-0382 /
#      DR-0394), which is device-independent by construction.
#   2. ...and the road to that studio did not exist. app/functions/voice's
#      same-origin transport forwards /voice/* to the Funnel, and the Funnel had
#      NO /voice mount -- infra/nas-transport/RECORDED-STATE.md listed /, /mcp,
#      /nas-photos, /sb and /taxes and nothing else. Every layer this repo can
#      see was green while the request fell through the root to n8n.
# That is the exact failure class RECORDED-STATE.md documents twice already:
# built, correct, never actuated, silent for weeks. This is its close.
#
# WHY THIS INSTALLER DOES NOT START ANYTHING. The studio is a GPU container and
# it does not live on this box -- it runs on the 4070 (tlcmediadpt), brought up
# by .github/workflows/arm-voice-studio.yml. What the NAS owns is the Funnel,
# and the Funnel is all this touches. The two halves arm independently and in
# either order: whichever runs second finds the other already there.
#
# PROVE, NEVER ASSUME (DR-0076). The mount is only made against a backend that
# has ANSWERED on this cycle. A path mounted at a dark host is worse than no
# mount: it turns a clean "no route" into a hanging request, and it would read
# as actuated in every check while serving nothing. So a cycle that finds no
# studio mounts nothing, says exactly that, and exits 0 -- services-sync keeps
# running, and the NEXT cycle after the GPU box comes up makes the mount with
# no human involved at any point.
#
# Safe to run every cycle: every step no-ops when already done.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (actuates the /voice row
# added by the same merge, per rule 2).
set -e

# Candidate backends, in order. 127.0.0.1 first so a studio that is ever run on
# this box wins without a tailnet hop; then the GPU box by MagicDNS name, which
# survives a DHCP/tailnet address change in a way a literal address does not;
# then its address as measured 2026-09-20, for the case where MagicDNS is off.
# VOICE_STUDIO_URL overrides the lot for a box that is somewhere else entirely.
CANDIDATES="${VOICE_STUDIO_URL:-} http://127.0.0.1:8770 http://tlcmediadpt:8770 http://tlcmediadpt.tail5a2f35.ts.net:8770 http://100.69.19.13:8770"

echo "== voice-studio install: find a studio that is actually answering =="
BACKEND=""
for C in $CANDIDATES; do
  [ -n "$C" ] || continue
  if command -v curl >/dev/null 2>&1; then
    CODE="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "$C/health" 2>/dev/null || echo 000)"
  else
    echo "  curl is not on this box -- cannot verify a backend, so nothing is mounted"
    exit 0
  fi
  echo "  $C/health -> $CODE"
  if [ "$CODE" = "200" ]; then BACKEND="$C"; break; fi
done

if [ -z "$BACKEND" ]; then
  echo "  no voice studio answered on this cycle."
  echo "  NOTHING MOUNTED -- deliberately. A /voice path pointed at a dark host"
  echo "  would hang the reader instead of failing it, and would read as armed."
  echo "  Bring the studio up with the 'Arm voice studio' workflow (arm=true);"
  echo "  the next services-sync cycle mounts the path on its own."
  exit 0
fi
echo "  using $BACKEND"

echo "== voice-studio install: funnel path mount (guarded, additive, reversible) =="
# FUNNEL, never `serve` (RECORDED-STATE rule 1: serve is tailnet-only and would
# REPLACE the public exposure). Full DSM binary path -- the CLI is not on the
# non-login SSH PATH (diagnostic 30507928325).
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/voice" \
    && echo "  /voice already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /voice "$BACKEND" \
         && echo "  mounted /voice -> $BACKEND on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /voice $BACKEND"; }
else
  echo "  tailscale binary not found (checked PATH + /var/packages/Tailscale) -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /voice $BACKEND"
fi

echo "== voice-studio install: done =="
