#!/bin/sh
# install.sh -- idempotent, self-running installer for YT Zero (DR-0236:
# nothing waits -- the NAS installs this ITSELF via the services-sync loop;
# no human hand, no Portainer). Safe to run every cycle: every step no-ops
# when already done. It:
#   1. creates the data dir (/volume1/docker/ytzero -> /data in-container)
#   2. locates docker + compose (Synology sudo strips PATH -- the Container
#      Manager absolute path is the known fallback, INSTALL.md gotcha #5)
#   3. runs `compose up -d` against the PINNED compose file in the repo
#      checkout (the repo is the source of truth; no copy step to drift)
#   4. probes http://127.0.0.1:3701/ -- warns loudly on silence, scribe-style
# It never edits a config it cannot verify (DR-0076): no Caddy writes here;
# YT Zero is LAN/Tailscale-only until a proxy route is proven (README.md).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-ytzero"
DATA="${YTZERO_DATA:-/volume1/docker/ytzero}"

echo "== ytzero install: data dir =="
mkdir -p "$DATA"

echo "== ytzero install: locate docker =="
# FINDING THE BINARY IS NOT THE SAME AS BEING ALLOWED TO RUN IT (2026-08-14).
# This loop used `command -v` only, which succeeds whenever the binary is on
# PATH -- and nas-health run 31820238770 measured, on this exact box:
#     docker: DENIED unprivileged
#     docker: OK via sudo -n
# So a `command -v docker` hit could still be a permission error one line later,
# and `set -e` turns that into an exit 1 the cycle records as "ytzero failed"
# with no reason attached. Probe for a docker that ACTUALLY RUNS, and fall back
# to `sudo -n` exactly as nas-health and the scribe installer already do.
DOCKER=""
for CAND in docker /usr/local/bin/docker /var/packages/ContainerManager/target/usr/bin/docker; do
  command -v "$CAND" >/dev/null 2>&1 || continue
  RESOLVED="$(command -v "$CAND")"
  if "$RESOLVED" ps >/dev/null 2>&1; then
    DOCKER="$RESOLVED"
    break
  fi
  if sudo -n "$RESOLVED" ps >/dev/null 2>&1; then
    DOCKER="sudo -n $RESOLVED"
    echo "  docker denied unprivileged; using sudo -n"
    break
  fi
done
if [ -z "$DOCKER" ]; then
  echo "ytzero install: no docker that this user can actually run (binary may exist but the socket is denied, and sudo -n did not help)" >&2
  exit 1
fi

COMPOSE=""
if "$DOCKER" compose version >/dev/null 2>&1; then
  COMPOSE="$DOCKER compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
elif [ -x /var/packages/ContainerManager/target/usr/bin/docker-compose ]; then
  COMPOSE=/var/packages/ContainerManager/target/usr/bin/docker-compose
else
  echo "ytzero install: no compose plugin or docker-compose found" >&2
  exit 1
fi

echo "== ytzero install: compose up (pinned image; no-op when current) =="
# First-ever run pulls the image and can outlast the services-sync 480s
# ceiling; that run fails LOUDLY and the next cycle resumes the pull and
# finishes -- self-healing by design, never silent.
# Do not let `set -e` swallow the reason. Six consecutive cycle failures
# (2026-08-04 .. 2026-08-11) recorded only the service name; the compose error
# itself was never kept anywhere. Capture it and print it before exiting.
if ! COMPOSE_OUT="$($COMPOSE -f "$SRC/docker-compose.yml" -p ytzero up -d 2>&1)"; then
  echo "ytzero install: compose up FAILED -- the reason follows" >&2
  echo "$COMPOSE_OUT" >&2
  exit 1
fi
echo "$COMPOSE_OUT"

echo "== ytzero install: health =="
TRIES=0
UP=0
while [ "$TRIES" -lt 12 ]; do
  if curl -fsS -o /dev/null http://127.0.0.1:3701/ 2>/dev/null; then
    UP=1
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 5
done
if [ "$UP" = "1" ]; then
  echo "  ytzero answering on 127.0.0.1:3701"
  # READ-ONLY schema probe (DR-0108 — humans don't do anything): the follow-
  # the-channel + enable-downloads steps are UI clicks today ONLY because the
  # app's storage schema is unmeasured. This dumps it once into the loop log
  # (visible in-app via Dispatch Status) and to $DATA/SCHEMA-PROBE.txt, so the
  # follow-seed step ships written against MEASURED reality (DR-0076), zero
  # blind writes to another app's database.
  PROBE="$DATA/SCHEMA-PROBE.txt"
  if [ ! -s "$PROBE" ]; then
    DB="$(ls "$DATA"/*.db "$DATA"/*.sqlite "$DATA"/*.sqlite3 2>/dev/null | head -1)"
    if [ -n "$DB" ] && command -v sqlite3 >/dev/null 2>&1; then
      sqlite3 "$DB" '.schema' > "$PROBE" 2>/dev/null || true
    elif [ -n "$DB" ]; then
      "$DOCKER" run --rm -v "$DATA":/probe:ro alpine:3.20 sh -c 'apk add -q sqlite >/dev/null 2>&1 && sqlite3 /probe/'"$(basename "$DB")"' .schema' > "$PROBE" 2>/dev/null || true
    fi
    if [ -s "$PROBE" ]; then
      echo "  schema probe written ($PROBE); table list:"
      grep -oE 'CREATE TABLE [^(]+' "$PROBE" | head -20
    else
      echo "  schema probe pending (no db file yet or no sqlite3 reader) -- next cycle retries"
    fi
  fi
else
  echo "  health probe silent after 60s (start_period is 90s; first start can outlast this probe)"
  echo "  next services-sync cycle re-checks -- or see: $DOCKER logs ytzero"
fi
echo "== ytzero install: done =="
