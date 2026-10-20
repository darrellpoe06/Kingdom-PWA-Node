#!/bin/sh
# install.sh -- idempotent, self-running installer for the photo-backup road
# (DR-1120; the Immich pilot DR-1119 named): Immich on loopback, its library on
# the pool, behind poetech-photo-backup.service (the locked door), mounted on
# the Funnel at /photo-backup.
#
# WHAT THIS CLOSES. Darrell 2026-10-19: "Bring Immich home by the Way now."
# The household pays Google One (2 TB) so the phones back up every new photo
# and video in the background. Immich does that job onto our own pool, and the
# files stay ours as plain folders if Immich is ever removed.
#
# THE WAY (THE-WAY-A-SERVICE-COMES-HOME), step by step, each leaving a proof:
#   2. Own the files: /volume1/PoeTech/immich on the pool (the library), the
#      database under /volume1/docker/immich. Both are made here, never inside
#      a container alone.
#   4. It installs itself, and the running forwarder follows the repo's code
#      on EVERY path -- the restart is one function, called before any step
#      that can stop this script, so a dark Immich still gets a door that says
#      so (the research road's stumble of 2026-10-19).
#   5. It says why: the forwarder's /health carries a reason in words.
# PROVE, NEVER ASSUME (DR-0076). Nothing is mounted on the Funnel until:
#   1. the token exists (an unlocked door is never started),
#   2. the pool has room (measured, printed, refused under the floor),
#   3. Immich answers /api/server/ping on 127.0.0.1:2283,
#   4. the forwarder answers /health 200 (which itself asks Immich and the
#      pool -- so a 200 proves the WHOLE road, not one process).
# A cycle that fails any step says which, mounts nothing, and exits 0 so
# services-sync keeps running; the next cycle tries again. The one exception
# is a compose failure, which exits 1 WITH the reason so the cycle records it.
#
# NEVER OVERWRITES A LIVE CONFIG. immich.env (the database password) is seeded
# ONLY when absent, with a fresh random password; the library and the database
# folders are never emptied by this script.
#
# Brakes: request-driven services (no timers); the inflight, body, time and
# pool-floor caps live in immich_forwarder.py; this installer does one image
# pull on its first run and a few loopback probes after.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (the /photo-backup row).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-immich"
DATA="${IMMICH_DATA:-/volume1/docker/immich}"
LIBRARY="${IMMICH_LIBRARY:-/volume1/PoeTech/immich}"
ENV_FILE="$DATA/immich.env"
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
UNIT=/etc/systemd/system/poetech-photo-backup.service
# 8803, not 8801: 127.0.0.1:8801 is Supabase Studio (infra/nas-supabase/docker-compose.yml),
# found by the first live witness run (39364279520, 2026-10-20): the forwarder could
# never bind, the unit sat "activating", and /photo-backup on the Funnel would have
# pointed at Studio. The next free loopback port in our own list.
PORT=8803
IMMICH=http://127.0.0.1:2283
# The forwarder refuses uploads under this many GB free; the installer refuses
# to START under it too, so a full pool never gets a new 2 TB tenant.
POOL_FLOOR_GB=50

echo "== photo-backup install: token =="
if [ ! -s "$TOKEN_FILE" ]; then
  echo "  $TOKEN_FILE is missing -- the forwarder refuses to start an unlocked door. Nothing done."
  exit 0
fi
command -v curl >/dev/null 2>&1 || { echo "  curl missing -- cannot probe; nothing done"; exit 0; }
PY="$(command -v python3 || true)"
[ -n "$PY" ] || { echo "  python3 not found -- nothing done"; exit 0; }
if sudo -n true 2>/dev/null; then SUDO="sudo -n"; else SUDO=""; fi

# The running forwarder must follow the code (the cameras lesson, DR-0770),
# on EVERY path that reaches it -- including "Immich is not up", where the
# new code is the one that tells the app why (THE-WAY-A-SERVICE-COMES-HOME,
# step 4; the research road's stumble of 2026-10-19).
forwarder_follows_code() {
  TMPU="$(mktemp)"
  sed -e "s|@PYTHON@|$PY|" -e "s|@SRC@|$SRC|" -e "s|@PORT@|$PORT|" -e "s|@LIBRARY@|$LIBRARY|" "$SRC/poetech-photo-backup.service" > "$TMPU"
  NEED_RESTART=0
  if [ ! -f "$UNIT" ] || ! cmp -s "$TMPU" "$UNIT"; then
    $SUDO cp "$TMPU" "$UNIT"
    $SUDO systemctl daemon-reload
    NEED_RESTART=1
    echo "  unit written"
  fi
  rm -f "$TMPU"
  CODE_SHA="$(sha256sum < "$SRC/immich_forwarder.py" | cut -c1-16)"
  STAMP="$DATA/.forwarder.code.sha"
  if [ "$($SUDO cat "$STAMP" 2>/dev/null)" != "$CODE_SHA" ]; then
    NEED_RESTART=1
    echo "  forwarder code changed ($CODE_SHA) -- restarting so the running process follows the code"
  fi
  $SUDO systemctl enable poetech-photo-backup >/dev/null 2>&1 || true
  if [ "$NEED_RESTART" = "1" ]; then
    $SUDO systemctl restart poetech-photo-backup && echo "$CODE_SHA" | $SUDO tee "$STAMP" >/dev/null
  else
    $SUDO systemctl is-active --quiet poetech-photo-backup || $SUDO systemctl restart poetech-photo-backup || true
  fi
}

echo "== photo-backup install: own the files (the library on the pool, the database beside the other services) =="
$SUDO mkdir -p "$DATA" "$DATA/postgres" "$DATA/model-cache" "$LIBRARY"
echo "  library: $LIBRARY  database: $DATA/postgres"

echo "== photo-backup install: forwarder unit (first, so the app hears the reason whatever follows) =="
forwarder_follows_code

echo "== photo-backup install: the pool must have room =="
FREE_GB="$(df -Pk "$LIBRARY" 2>/dev/null | awk 'NR==2 {printf "%d", $4/1024/1024}')"
echo "  $LIBRARY has ${FREE_GB:-?} GB free (floor $POOL_FLOOR_GB GB)"
if [ -z "$FREE_GB" ] || [ "$FREE_GB" -lt "$POOL_FLOOR_GB" ]; then
  echo "  under the floor -- NOT starting Immich; the forwarder says so at /health"
  exit 0
fi

echo "== photo-backup install: locate docker (binary present is not the same as allowed to run it) =="
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

echo "== photo-backup install: config (seed once, never overwrite) =="
if ! $SUDO test -s "$ENV_FILE"; then
  DBPW="$("$PY" -c 'import secrets, string; a = string.ascii_letters + string.digits; print("".join(secrets.choice(a) for _ in range(40)))')"
  TMPE="$(mktemp)"
  {
    echo "DB_USERNAME=postgres"
    echo "DB_DATABASE_NAME=immich"
    echo "DB_PASSWORD=$DBPW"
    echo "POSTGRES_USER=postgres"
    echo "POSTGRES_DB=immich"
    echo "POSTGRES_PASSWORD=$DBPW"
  } > "$TMPE"
  $SUDO cp "$TMPE" "$ENV_FILE"
  rm -f "$TMPE"
  $SUDO chmod 600 "$ENV_FILE"
  echo "  seeded $ENV_FILE (a fresh database password, never printed)"
else
  echo "  $ENV_FILE exists -- left exactly as it is"
fi

echo "== photo-backup install: compose up (pinned images; no-op when current) =="
# A first-ever pull can outlast the services-sync ceiling; that run fails
# LOUDLY and the next cycle resumes the pull and finishes.
# shellcheck disable=SC2086
if ! COMPOSE_OUT="$($COMPOSE -f "$SRC/docker-compose.yml" -p poetech-photo-backup up -d 2>&1)"; then
  echo "photo-backup install: compose up FAILED -- the reason follows" >&2
  echo "$COMPOSE_OUT" >&2
  exit 1
fi
echo "$COMPOSE_OUT"

echo "== photo-backup install: Immich must answer on 127.0.0.1:2283 =="
TRIES=0; UP=0
while [ "$TRIES" -lt 36 ]; do
  if curl -fsS -m 5 "$IMMICH/api/server/ping" 2>/dev/null | grep -q pong; then UP=1; break; fi
  TRIES=$((TRIES + 1)); sleep 5
done
if [ "$UP" != "1" ]; then
  echo "  Immich silent after 180s -- NOT mounting. See: $DOCKER logs poetech-immich"
  exit 0
fi
echo "  Immich answering: $(curl -fsS -m 5 "$IMMICH/api/server/version" 2>/dev/null | head -c 120)"

echo "== photo-backup install: the forwarder must answer 200 (it asks Immich and the pool) =="
sleep 2
HCODE="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/health" 2>/dev/null || echo 000)"
echo "  http://127.0.0.1:$PORT/health -> $HCODE"
echo "  $(curl -s -m 10 "http://127.0.0.1:$PORT/health" 2>/dev/null | head -c 300)"
if [ "$HCODE" != "200" ]; then
  echo "  not answering 200 -- NOT mounting. See: journalctl -u poetech-photo-backup -n 50"
  exit 0
fi
# Once more at the end: idempotent (the unit and the code stamp are compared,
# not rewritten), so a cycle where everything was already up still proves the
# running forwarder is the repo's, on this path as on the early-exit ones.
forwarder_follows_code

echo "== photo-backup install: funnel path mount (guarded, additive, reversible) =="
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  # A mount that exists but points ELSEWHERE is re-pointed, never left: on
  # 2026-10-20 a mount at 8801 would have put Supabase Studio on the public
  # Funnel under /photo-backup. set-path on an existing path replaces it.
  if printf '%s' "$FSTAT" | grep -A1 "/photo-backup" | grep -q "127.0.0.1:$PORT"; then
    echo "  /photo-backup already mounted on the funnel -> 127.0.0.1:$PORT"
  else
    printf '%s' "$FSTAT" | grep -q "/photo-backup" && echo "  /photo-backup is mounted at the WRONG backend -- re-pointing to 127.0.0.1:$PORT"
    $TSC funnel --bg --set-path /photo-backup "http://127.0.0.1:$PORT" \
      && echo "  mounted /photo-backup -> 127.0.0.1:$PORT on the PUBLIC funnel (additive; the forwarder holds the lock)" \
      || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /photo-backup http://127.0.0.1:$PORT"
  fi
else
  echo "  tailscale binary not found -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /photo-backup http://127.0.0.1:$PORT"
fi
echo "== photo-backup install: done =="
