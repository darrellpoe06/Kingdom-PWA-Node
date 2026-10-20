#!/bin/sh
# install.sh -- idempotent, self-running installer for the libraries road
# (DR-1121; the Jellyfin and Audiobookshelf pilots of DR-1119, corrected):
# the household's own video and audio served to its own screens and phones.
#
# WHAT THIS CLOSES. Darrell 2026-10-19: "Why can't we use them for our audio
# tts... etc..." The libraries existed on the pool (the lesson readings, the
# spoken lessons, the harvested sermons) and nothing could browse them.
#
# THE WAY (THE-WAY-A-SERVICE-COMES-HOME), with the one exception it names:
#   2. Own the files: the household's own shelves at /volume1/PoeTech/library
#      /{video,audio}; the servers' own state under /volume1/docker/{jellyfin,
#      audiobookshelf}. The loops' folders are mounted READ-ONLY.
#   3. One door, locked -- the exception: the TV and phone apps cannot carry
#      the family key, so neither server is on the Funnel. Each listens on
#      loopback; this script serves it on the TAILNET on its own port
#      (tailscale serve, never funnel). The Funnel gets the health door only.
#   4. The running health door follows the repo's code on EVERY path (the
#      restart is called before any step that can stop this script, and once
#      more at the end).
#   5. It says why: /health carries each server's reason in words.
# PROVE, NEVER ASSUME (DR-0076). Nothing is served until Jellyfin answers
# /System/Info/Public, Audiobookshelf answers /status, and the door is 200.
# A cycle that fails a step says which, serves nothing new, and exits 0; a
# compose failure exits 1 with the reason.
#
# Brakes: request-driven services (no timers); this installer does one image
# pull on its first run and a few loopback probes after.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (the /libraries row).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-libraries"
LIB="${LIBRARY_ROOT:-/volume1/PoeTech/library}"
JF_DATA="${JELLYFIN_DATA:-/volume1/docker/jellyfin}"
ABS_DATA="${ABS_DATA:-/volume1/docker/audiobookshelf}"
STAMP_DIR="${LIBRARIES_DATA:-/volume1/docker/libraries}"
UNIT=/etc/systemd/system/poetech-libraries.service
PORT=8802
JELLYFIN=http://127.0.0.1:8096
ABS=http://127.0.0.1:13378
SHELVES="$LIB/video:$LIB/audio:/volume1/docker/ytzero/downloads:/volume1/PoeTech/lesson-voice"

echo "== libraries install: prerequisites =="
command -v curl >/dev/null 2>&1 || { echo "  curl missing -- cannot probe; nothing done"; exit 0; }
PY="$(command -v python3 || true)"
[ -n "$PY" ] || { echo "  python3 not found -- nothing done"; exit 0; }
if sudo -n true 2>/dev/null; then SUDO="sudo -n"; else SUDO=""; fi

# The running door must follow the code (DR-0770), on EVERY path.
door_follows_code() {
  TMPU="$(mktemp)"
  sed -e "s|@PYTHON@|$PY|" -e "s|@SRC@|$SRC|" -e "s|@PORT@|$PORT|" -e "s|@SHELVES@|$SHELVES|" "$SRC/poetech-libraries.service" > "$TMPU"
  NEED_RESTART=0
  if [ ! -f "$UNIT" ] || ! cmp -s "$TMPU" "$UNIT"; then
    $SUDO cp "$TMPU" "$UNIT"
    $SUDO systemctl daemon-reload
    NEED_RESTART=1
    echo "  unit written"
  fi
  rm -f "$TMPU"
  CODE_SHA="$(sha256sum < "$SRC/libraries_forwarder.py" | cut -c1-16)"
  STAMP="$STAMP_DIR/.forwarder.code.sha"
  if [ "$($SUDO cat "$STAMP" 2>/dev/null)" != "$CODE_SHA" ]; then
    NEED_RESTART=1
    echo "  door code changed ($CODE_SHA) -- restarting so the running process follows the code"
  fi
  $SUDO systemctl enable poetech-libraries >/dev/null 2>&1 || true
  if [ "$NEED_RESTART" = "1" ]; then
    $SUDO systemctl restart poetech-libraries && echo "$CODE_SHA" | $SUDO tee "$STAMP" >/dev/null
  else
    $SUDO systemctl is-active --quiet poetech-libraries || $SUDO systemctl restart poetech-libraries || true
  fi
}

echo "== libraries install: own the files (the shelves on the pool, the servers' state beside the other services) =="
$SUDO mkdir -p "$LIB/video" "$LIB/audio" "$JF_DATA/config" "$JF_DATA/cache" "$ABS_DATA/config" "$ABS_DATA/metadata" "$STAMP_DIR" /volume1/docker/ytzero/downloads /volume1/PoeTech/lesson-voice
echo "  shelves: $SHELVES"

echo "== libraries install: health door (first, so the app hears the reason whatever follows) =="
door_follows_code

echo "== libraries install: locate docker (binary present is not the same as allowed to run it) =="
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
  echo "  no docker this user can actually run -- nothing served"
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
  echo "  no compose plugin or docker-compose found -- nothing served"
  exit 0
fi

echo "== libraries install: compose up (pinned images; no-op when current) =="
# shellcheck disable=SC2086
if ! COMPOSE_OUT="$($COMPOSE -f "$SRC/docker-compose.yml" -p poetech-libraries up -d 2>&1)"; then
  echo "libraries install: compose up FAILED -- the reason follows" >&2
  echo "$COMPOSE_OUT" >&2
  exit 1
fi
echo "$COMPOSE_OUT"

echo "== libraries install: both servers must answer on loopback =="
TRIES=0; JF=0; AB=0
while [ "$TRIES" -lt 24 ]; do
  [ "$JF" = "1" ] || { curl -fsS -m 5 "$JELLYFIN/System/Info/Public" 2>/dev/null | grep -q Version && JF=1; }
  [ "$AB" = "1" ] || { curl -fsS -m 5 "$ABS/status" 2>/dev/null | grep -q isInit && AB=1; }
  [ "$JF" = "1" ] && [ "$AB" = "1" ] && break
  TRIES=$((TRIES + 1)); sleep 5
done
echo "  jellyfin answering: $JF  audiobookshelf answering: $AB"
if [ "$JF" != "1" ] || [ "$AB" != "1" ]; then
  echo "  a server is silent after 120s -- NOT serving on the tailnet yet. See: $DOCKER logs poetech-jellyfin / poetech-audiobookshelf"
  exit 0
fi

echo "== libraries install: the health door must answer 200 =="
sleep 2
HCODE="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/health" 2>/dev/null || echo 000)"
echo "  http://127.0.0.1:$PORT/health -> $HCODE"
echo "  $(curl -s -m 10 "http://127.0.0.1:$PORT/health" 2>/dev/null | head -c 300)"
if [ "$HCODE" != "200" ]; then
  echo "  not answering 200 -- NOT serving on the tailnet yet. See: journalctl -u poetech-libraries -n 50"
  exit 0
fi

echo "== libraries install: tailnet serve (never funnel) for the two servers; funnel for the health door only =="
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  SSTAT="$($TSC serve status 2>/dev/null || true)"
  printf '%s' "$SSTAT" | grep -q ":8096" \
    && echo "  jellyfin already served on the tailnet at :8096" \
    || { $TSC serve --bg --https=8096 "http://127.0.0.1:8096" && echo "  jellyfin served on the TAILNET at https://poetech.tail5a2f35.ts.net:8096 (not the funnel)" || echo "  tailnet serve for jellyfin FAILED -- by hand: sudo $TS serve --bg --https=8096 http://127.0.0.1:8096"; }
  printf '%s' "$SSTAT" | grep -q ":13378" \
    && echo "  audiobookshelf already served on the tailnet at :13378" \
    || { $TSC serve --bg --https=13378 "http://127.0.0.1:13378" && echo "  audiobookshelf served on the TAILNET at https://poetech.tail5a2f35.ts.net:13378 (not the funnel)" || echo "  tailnet serve for audiobookshelf FAILED -- by hand: sudo $TS serve --bg --https=13378 http://127.0.0.1:13378"; }
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/libraries" \
    && echo "  /libraries already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /libraries "http://127.0.0.1:$PORT" \
         && echo "  mounted /libraries -> 127.0.0.1:$PORT on the PUBLIC funnel (health only)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /libraries http://127.0.0.1:$PORT"; }
else
  echo "  tailscale binary not found -- by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale serve --bg --https=8096 http://127.0.0.1:8096"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale serve --bg --https=13378 http://127.0.0.1:13378"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /libraries http://127.0.0.1:$PORT"
fi
# Once more at the end (idempotent): this path too proves the running door is the repo's.
door_follows_code
echo "== libraries install: done =="
