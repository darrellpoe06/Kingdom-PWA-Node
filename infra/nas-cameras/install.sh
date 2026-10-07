#!/bin/sh
# install.sh -- idempotent, self-running installer for the family camera road
# (DR-0756): go2rtc (one restreamer for Wyze / Ring / ONVIF / RTSP) behind
# poetech-cams.service (the locked door), mounted on the Funnel at /cams.
#
# WHAT THIS CLOSES. Darrell 2026-10-06: "I want to be able to see my wyze cam
# feeds inside my PoeTech App... and any system I own..." The Observation
# board has said "RTSP - registered, awaiting NAS bridge" since 2026-06-16
# (lib/observation-cameras.js). This is the bridge.
#
# PROVE, NEVER ASSUME (DR-0076). Nothing is mounted on the Funnel until:
#   1. the token exists (an unlocked door is never started),
#   2. go2rtc answers /api on 127.0.0.1:1984 on THIS box,
#   3. the forwarder answers /health 200 (which itself passes go2rtc's own
#      answer through -- so a 200 proves the WHOLE road, not one process).
# A cycle that fails any step says which, mounts nothing, and exits 0 so
# services-sync keeps running; the next cycle tries again. The one exception
# is a compose failure, which exits 1 WITH the reason so the cycle records it
# (the ytzero lesson: six silent failures recorded only the service name).
#
# NEVER OVERWRITES A LIVE CONFIG. go2rtc.yaml is seeded ONLY when absent; after
# that go2rtc's WebUI writes the Wyze stream lines into it and we keep hands
# off. The wyze: credentials block is added ONCE, only when the secrets file
# exists and the config has no wyze: block yet.
#
# Brakes: request-driven services (no timers); live/snapshot caps + the live
# time ceiling live in cams_forwarder.py; this installer does one image pull
# on its first run and nothing heavy after.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (the /cams row).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-cameras"
DATA="${GO2RTC_DATA:-/volume1/docker/go2rtc}"
CFG="$DATA/go2rtc.yaml"
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
WYZE_ENV=/volume1/PoeTech/secrets/wyze.env
UNIT=/etc/systemd/system/poetech-cams.service
PORT=8773
GO2RTC_API=http://127.0.0.1:1984/api

echo "== cameras install: token =="
if [ ! -s "$TOKEN_FILE" ]; then
  echo "  $TOKEN_FILE is missing -- the forwarder refuses to start an unlocked door. Nothing done."
  exit 0
fi
command -v curl >/dev/null 2>&1 || { echo "  curl missing -- cannot probe; nothing done"; exit 0; }

echo "== cameras install: locate docker (binary present is not the same as allowed to run it) =="
DOCKER=""
for CAND in docker /usr/local/bin/docker /var/packages/ContainerManager/target/usr/bin/docker; do
  command -v "$CAND" >/dev/null 2>&1 || continue
  RESOLVED="$(command -v "$CAND")"
  if "$RESOLVED" ps >/dev/null 2>&1; then
    DOCKER="$RESOLVED"; break
  fi
  if sudo -n "$RESOLVED" ps >/dev/null 2>&1; then
    DOCKER="sudo -n $RESOLVED"; echo "  docker denied unprivileged; using sudo -n"; break
  fi
done
if [ -z "$DOCKER" ]; then
  echo "  no docker this user can actually run -- nothing mounted"
  exit 0
fi
COMPOSE=""
if $DOCKER compose version >/dev/null 2>&1; then
  COMPOSE="$DOCKER compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
elif [ -x /var/packages/ContainerManager/target/usr/bin/docker-compose ]; then
  COMPOSE=/var/packages/ContainerManager/target/usr/bin/docker-compose
else
  echo "  no compose plugin or docker-compose found -- nothing mounted"
  exit 0
fi

echo "== cameras install: config (seed once, never overwrite) =="
if sudo -n true 2>/dev/null; then SUDO="sudo -n"; else SUDO=""; fi
$SUDO mkdir -p "$DATA"
if [ ! -s "$CFG" ]; then
  $SUDO cp "$SRC/go2rtc.seed.yaml" "$CFG"
  $SUDO chmod 600 "$CFG"
  echo "  seeded $CFG (loopback-only listeners, empty streams)"
else
  echo "  $CFG exists -- left exactly as it is"
fi
# The Wyze sign-in block, once. The values are a secret only Darrell holds
# (his Wyze email, password, API ID + API Key from the Wyze developer portal);
# he places them in $WYZE_ENV as WYZE_EMAIL / WYZE_PASSWORD / WYZE_API_ID /
# WYZE_API_KEY (README.md has the paste-ready block). Without the file, go2rtc
# still runs for every non-Wyze system and the app says plainly what is missing.
if [ -s "$WYZE_ENV" ]; then
  if $SUDO grep -q '^wyze:' "$CFG" 2>/dev/null; then
    echo "  wyze: block already present -- not touched"
  else
    # shellcheck disable=SC1090
    . "$WYZE_ENV"
    if [ -n "$WYZE_EMAIL" ] && [ -n "$WYZE_PASSWORD" ] && [ -n "$WYZE_API_ID" ] && [ -n "$WYZE_API_KEY" ]; then
      TMPC="$(mktemp)"
      {
        printf '\n# Wyze sign-in (added once by install.sh from %s; edit there, not here)\n' "$WYZE_ENV"
        printf 'wyze:\n  "%s":\n    api_id: "%s"\n    api_key: "%s"\n    password: "%s"\n' "$WYZE_EMAIL" "$WYZE_API_ID" "$WYZE_API_KEY" "$WYZE_PASSWORD"
      } > "$TMPC"
      $SUDO sh -c "cat '$TMPC' >> '$CFG'"
      rm -f "$TMPC"
      echo "  wyze: block added (the WebUI's Add > Wyze can now list the cameras)"
    else
      echo "  $WYZE_ENV is present but incomplete (needs WYZE_EMAIL WYZE_PASSWORD WYZE_API_ID WYZE_API_KEY) -- wyze: not added"
    fi
  fi
else
  echo "  no $WYZE_ENV yet -- Wyze cameras wait on the sign-in: type it once in the app's Cameras tab (or place this file); every other system works now"
fi

echo "== cameras install: compose up (pinned image; no-op when current) =="
# A first-ever pull can outlast the services-sync ceiling; that run fails
# LOUDLY and the next cycle resumes the pull and finishes.
if ! COMPOSE_OUT="$($COMPOSE -f "$SRC/docker-compose.yml" -p poetech-cameras up -d 2>&1)"; then
  echo "cameras install: compose up FAILED -- the reason follows" >&2
  echo "$COMPOSE_OUT" >&2
  exit 1
fi
echo "$COMPOSE_OUT"

echo "== cameras install: go2rtc must answer on 127.0.0.1:1984 =="
TRIES=0; UP=0
while [ "$TRIES" -lt 12 ]; do
  if curl -fsS -m 5 -o /dev/null "$GO2RTC_API" 2>/dev/null; then UP=1; break; fi
  TRIES=$((TRIES + 1)); sleep 5
done
if [ "$UP" != "1" ]; then
  echo "  go2rtc silent after 60s -- NOT mounting. See: $DOCKER logs poetech-go2rtc"
  exit 0
fi
echo "  go2rtc answering: $(curl -fsS -m 5 "$GO2RTC_API" 2>/dev/null | head -c 200)"

echo "== cameras install: forwarder unit =="
PY="$(command -v python3 || true)"
[ -n "$PY" ] || { echo "  python3 not found -- nothing mounted"; exit 0; }
TMPU="$(mktemp)"
sed -e "s|@PYTHON@|$PY|" -e "s|@SRC@|$SRC|" -e "s|@PORT@|$PORT|" "$SRC/poetech-cams.service" > "$TMPU"
NEED_RESTART=0
if [ ! -f "$UNIT" ] || ! cmp -s "$TMPU" "$UNIT"; then
  $SUDO cp "$TMPU" "$UNIT"
  $SUDO systemctl daemon-reload
  NEED_RESTART=1
  echo "  unit written"
fi
rm -f "$TMPU"
# THE RUNNING PROCESS MUST FOLLOW THE CODE (2026-10-07, DR-0770 landing).
# This used to restart the forwarder only when the UNIT changed, so a merge
# that changed cams_forwarder.py left the OLD process serving: the app's new
# Wyze sign-in (POST /setup/wyze) answered 404 from the NAS an hour after the
# merge, with the new file already on disk. The lesson builder's installer
# had the right pattern all along (a code sha beside the service); same here.
CODE_SHA="$(sha256sum < "$SRC/cams_forwarder.py" | cut -c1-16)"
STAMP="$DATA/.forwarder.code.sha"
if [ "$(cat "$STAMP" 2>/dev/null)" != "$CODE_SHA" ]; then
  NEED_RESTART=1
  echo "  forwarder code changed ($CODE_SHA) -- restarting the service so the running process follows the code"
fi
$SUDO systemctl enable poetech-cams >/dev/null 2>&1 || true
if [ "$NEED_RESTART" = "1" ]; then
  $SUDO systemctl restart poetech-cams && echo "$CODE_SHA" | $SUDO tee "$STAMP" >/dev/null
else
  $SUDO systemctl is-active --quiet poetech-cams || $SUDO systemctl restart poetech-cams || true
fi

echo "== cameras install: the forwarder must answer 200 (it passes go2rtc's own answer through) =="
sleep 2
HCODE="$(curl -s -m 8 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/health" 2>/dev/null || echo 000)"
echo "  http://127.0.0.1:$PORT/health -> $HCODE"
if [ "$HCODE" != "200" ]; then
  echo "  not answering 200 -- NOT mounting. See: journalctl -u poetech-cams -n 50"
  exit 0
fi
echo "  $(curl -s -m 8 "http://127.0.0.1:$PORT/health" 2>/dev/null | head -c 200)"

echo "== cameras install: funnel path mount (guarded, additive, reversible) =="
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/cams" \
    && echo "  /cams already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /cams "http://127.0.0.1:$PORT" \
         && echo "  mounted /cams -> 127.0.0.1:$PORT on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /cams http://127.0.0.1:$PORT"; }
else
  echo "  tailscale binary not found -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /cams http://127.0.0.1:$PORT"
fi
echo "== cameras install: done =="
