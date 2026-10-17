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

# AN INSTALLER THAT CHANGES THE CODE MUST RESTART WHAT IS RUNNING IT.
#
# THIS LINE USED TO BE, AND IT COST A WHOLE DAY'S FIX:
#
#   systemctl is-active --quiet poetech-announce || systemctl restart ...
#
# That is a START-IF-DEAD guard wearing a deploy step's clothes. The unit was
# already active, so the `||` branch never fired: services-sync copied the new
# announce_server.py onto disk every cycle and the RUNNING PROCESS never picked
# it up. Python reads its source at start, so the process kept serving the old
# file out of memory.
#
# MEASURED 2026-10-15, end to end, which is the only reason this was found:
#   mirror HEAD            8b5d0cac, committed 18:32:47Z  (HAS the fix)
#   services-sync          exit=0, "all services synced"
#   poetech-announce        active
#   POST /announce/ops-announce  502   <-- STILL BROKEN
# Every signal read fine and the thing actually serving was stale. That is the
# built-correct-never-connected class one layer deeper than the Funnel mount
# below: not an unmounted route, but a mounted route to a stale process.
#
# `is-active` cannot tell "active on the new code" from "active on the old
# code", so it is the wrong question. The right question is whether what we
# just installed differs from what the process started with, and the honest
# answer when we cannot know is to restart -- a restart of this service costs
# one dropped connection on a bell nobody is mid-ring on.
#
# So: restart when the payload or the unit changed, start when it is dead, and
# leave it alone only when nothing changed and it is already up.
NEED_RESTART="$NEED_RELOAD"
STAMP=/volume1/PoeTech/secrets/.announce-installed-sha
NEW_SUM="$(sha256sum "$SRC/announce_server.py" 2>/dev/null | cut -d' ' -f1)"
if [ -z "$NEW_SUM" ]; then
  # Cannot tell what changed -> restart rather than silently serve stale code.
  NEED_RESTART=1
  echo "  cannot checksum announce_server.py -- restarting rather than assume"
elif [ ! -f "$STAMP" ] || [ "$NEW_SUM" != "$(cat "$STAMP" 2>/dev/null)" ]; then
  NEED_RESTART=1
  echo "  announce_server.py changed since the running process started"
fi

if ! systemctl is-active --quiet poetech-announce; then
  systemctl restart poetech-announce
  echo "  started poetech-announce (it was not running)"
elif [ "$NEED_RESTART" = "1" ]; then
  systemctl restart poetech-announce
  echo "  RESTARTED poetech-announce onto the newly installed code"
else
  echo "  poetech-announce already running the installed code"
fi

# The stamp is written only AFTER a successful restart decision, so a crash
# before this line leaves the old sum and the next cycle tries again.
#
# The `[ -n ] &&` guard is SAFE under this script's `set -e`, and that was
# measured rather than reasoned about: a failing test at the head of an AND
# list does not abort, confirmed in sh, bash and dash. (This file's own
# neighbours record two `bash -e` traps that hid in three lines, so the habit
# here is to run it, not to argue it.)
[ -n "$NEW_SUM" ] && printf '%s' "$NEW_SUM" > "$STAMP" && chmod 0600 "$STAMP"

echo "== announce install: proving it answers =="
# Liveness only -- no token needed, and a failure here is LOUD (DR-0310).
sleep 1
if curl -sS --max-time 5 http://127.0.0.1:8796/healthz | grep -q '"ok"'; then
  echo "  announce relay is up on 127.0.0.1:8796"
else
  echo "  ANNOUNCE RELAY DID NOT ANSWER /healthz -- the bell is still dead" >&2
  exit 1
fi

echo "== announce install: funnel path mount (guarded, additive, reversible) =="
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md
# ACTUATOR of the /announce row added by the same merge (rule 2).
#
# WHY A MOUNT AT ALL, measured rather than assumed (DR-1047). The server binds
# 127.0.0.1 on purpose, and the caller is scripts/ops-announce.mjs running on a
# GitHub runner -- and site-health.yml does NOT join the tailnet (it checks the
# repo out solely for that script). So a tailnet-only road reaches nobody: the
# bell must answer from the PUBLIC Funnel, exactly as the eight rows above it
# do. Without this block the service is `active` on loopback and unreachable,
# which is the /nas-photos (7 weeks), /taxes (7 weeks) and /scribe (18 days)
# failure class the recorded state exists to stop.
#
# Same guarded idiom as infra/nas-property-photos/install.sh: FUNNEL (public,
# additive), never `serve` -- `serve` is tailnet-only and REPLACES the public
# exposure, which would tear down every route the app depends on (rule 1).
# Full DSM binary path (the CLI is not on the non-login SSH PATH); only when
# not already mounted; never touches the n8n root (DR-0218).
#
# AND IT RUNS ONLY AFTER /healthz PASSED, because the check above exits 1 on
# failure -- the same discipline voice-lite and cams use: mount nothing until
# the thing behind the mount has answered.
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/announce" \
    && echo "  /announce already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /announce http://127.0.0.1:8796 \
         && echo "  mounted /announce -> 127.0.0.1:8796 on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /announce http://127.0.0.1:8796"; }
else
  echo "  tailscale binary not found (checked PATH + /var/packages/Tailscale) -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /announce http://127.0.0.1:8796"
fi
echo "== announce install: done =="
