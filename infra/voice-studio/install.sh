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

# TAILSCALE WILL ONLY PROXY TO LOCALHOST. This file was first written with
# tlcmediadpt by MagicDNS in this list, on the assumption that a Funnel path
# mount can point anywhere the node can reach. It cannot, and the check was one
# search away: tailscale refuses a non-local target outright -- "only localhost
# or 127.0.0.1 proxies are currently supported" -- and the feature request to
# lift that (tailscale/tailscale#8751) has been open since 2023-07-31. So a
# mount at the GPU box would have failed on every cycle, quietly, with the
# actuation guard green the whole time because the row and the installer both
# existed. DR-0076: the premise gets verified before the code rides on it.
#
# What this means structurally: the studio lives on the 4070 and the Funnel
# lives on the NAS, so /voice needs a LOCAL forwarder on the NAS standing
# between them -- exactly the shape every other row here already has
# (127.0.0.1:8099 photos, 127.0.0.1:8790 taxes, 127.0.0.1:8800 supabase). That
# forwarder is the next piece of work and it is NOT in this file, because it
# also needs the bearer check those services have: /voice sits on the PUBLIC
# Funnel, and the studio has no authentication of its own, so mounting it open
# would put the family's GPU on the open internet for anyone to spend.
# re-review: 2026-09-21.
#
# Until then this mounts exactly one thing: a studio answering on THIS box.
# That is the only target tailscale will accept, so it is the only one offered.
CANDIDATES="${VOICE_STUDIO_URL:-} http://127.0.0.1:8770"

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
  echo "  no voice studio answered on 127.0.0.1 this cycle."
  echo "  NOTHING MOUNTED -- deliberately, for two reasons."
  echo "  1. A /voice path pointed at a dark host would HANG the reader rather"
  echo "     than fail them, and would read as armed in every check."
  echo "  2. If the studio is up on the 4070 rather than here, tailscale still"
  echo "     cannot mount it: only 127.0.0.1 targets are accepted (#8751). That"
  echo "     case needs the local forwarder, which is not built yet."
  echo "  Bring a local studio up and the next cycle mounts the path on its own."
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
