#!/bin/sh
# install.sh -- idempotent, self-running installer for the research road
# (DR-1101; the Vane pilot DR-1099 named first): SearxNG + Vane slim on
# loopback, behind poetech-research.service (the locked door), mounted on the
# Funnel at /research.
#
# WHAT THIS CLOSES. Darrell 2026-10-18 asked when the repos he sent would be
# "operational and test ready for me to use them and see their capabilities".
# DR-1099 put Vane first, on the NAS, behind a forwarder. This is that road.
#
# PROVE, NEVER ASSUME (DR-0076). Nothing is mounted on the Funnel until:
#   1. the token exists (an unlocked door is never started),
#   2. an Ollama this box can reach serves BOTH a qwen chat model and
#      nomic-embed-text (Vane cannot answer without both),
#   3. SearxNG answers /healthz on 127.0.0.1:8798,
#   4. Vane answers /api/providers on 127.0.0.1:3017,
#   5. the forwarder answers /health 200 (which itself asks Vane for its
#      models -- so a 200 proves the WHOLE road, not one process).
# A cycle that fails any step says which, mounts nothing, and exits 0 so
# services-sync keeps running; the next cycle tries again. The one exception
# is a compose failure, which exits 1 WITH the reason so the cycle records it.
#
# NEVER OVERWRITES A LIVE CONFIG. SearxNG's settings.yml is seeded ONLY when
# absent, with a fresh random secret. vane.env is rewritten only when the
# reachable Ollama changes, and says so.
#
# Brakes: request-driven services (no timers); the inflight, length and time
# caps live in research_forwarder.py; this installer does one image pull on
# its first run, a few loopback probes after, and never a web search.
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (the /research row).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-research"
DATA="${RESEARCH_DATA:-/volume1/docker/research}"
SEARX_CFG="$DATA/searxng/settings.yml"
VANE_ENV="$DATA/vane.env"
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
UNIT=/etc/systemd/system/poetech-research.service
PORT=8797
SEARX=http://127.0.0.1:8798
VANE=http://127.0.0.1:3017
# GPU towers only, the LEFT tower first. 2026-10-19, measured: the NAS's own
# CPU Ollama (the old last resort) could not answer "Say OK." with qwen2.5:14b
# in 150 s, so the road timed out on every question while /health said 200.
# pipeline-nodes.json names tlcmediadpt (LEFT) "THE designated AI worker",
# expected always on; livestream-main-pc (RIGHT) is not expected always on and
# feeds the stream, so it is second (DR-0012). Each by tailnet IP, then name.
OLLAMA_CANDIDATES="${RESEARCH_OLLAMA_CANDIDATES:-http://100.69.19.13:11434 http://tlcmediadpt.tail5a2f35.ts.net:11434 http://100.72.5.90:11434 http://livestream-main-pc.tail5a2f35.ts.net:11434}"
# The tower chosen, for the forwarder to check before every question (not a
# secret, so readable by the forwarder; empty when no tower answered).
OLLAMA_URL_FILE="$DATA/ollama.url"

echo "== research install: token =="
if [ ! -s "$TOKEN_FILE" ]; then
  echo "  $TOKEN_FILE is missing -- the forwarder refuses to start an unlocked door. Nothing done."
  exit 0
fi
command -v curl >/dev/null 2>&1 || { echo "  curl missing -- cannot probe; nothing done"; exit 0; }
PY="$(command -v python3 || true)"
[ -n "$PY" ] || { echo "  python3 not found -- nothing done"; exit 0; }

echo "== research install: an Ollama with both a qwen chat model and nomic-embed-text =="
OLLAMA=""
for CAND in $OLLAMA_CANDIDATES; do
  TAGS="$(curl -fsS -m 6 "$CAND/api/tags" 2>/dev/null || true)"
  if [ -z "$TAGS" ]; then
    echo "  $CAND -- not answering"
    continue
  fi
  if printf '%s' "$TAGS" | "$PY" -c 'import json,sys; names=[m.get("name","") for m in json.load(sys.stdin).get("models",[])]; sys.exit(0 if any(n.startswith("qwen") for n in names) and any(n.startswith("nomic-embed-text") for n in names) else 1)' 2>/dev/null; then
    OLLAMA="$CAND"
    echo "  $CAND -- answering with qwen + nomic-embed-text; using it"
    break
  fi
  echo "  $CAND -- answering, but without both qwen and nomic-embed-text"
done
if sudo -n true 2>/dev/null; then SUDO_URL="sudo -n"; else SUDO_URL=""; fi
$SUDO_URL mkdir -p "$DATA"
TMPU="$(mktemp)"
printf '%s\n' "$OLLAMA" > "$TMPU"
$SUDO_URL cp "$TMPU" "$OLLAMA_URL_FILE"
rm -f "$TMPU"
$SUDO_URL chmod 644 "$OLLAMA_URL_FILE"
if [ -z "$OLLAMA" ]; then
  echo "  no GPU tower serves both models -- the forwarder now says so instead of hanging (the towers may be off; the next cycle looks again)"
  exit 0
fi

echo "== research install: locate docker (binary present is not the same as allowed to run it) =="
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

echo "== research install: config (seed once, never overwrite) =="
if sudo -n true 2>/dev/null; then SUDO="sudo -n"; else SUDO=""; fi
$SUDO mkdir -p "$DATA/searxng" "$DATA/vane-data"
if ! $SUDO test -s "$SEARX_CFG"; then
  SECRET="$("$PY" -c 'import secrets; print(secrets.token_hex(32))')"
  TMPS="$(mktemp)"
  sed -e "s|@SECRET@|$SECRET|" "$SRC/searxng.seed.yml" > "$TMPS"
  $SUDO cp "$TMPS" "$SEARX_CFG"
  rm -f "$TMPS"
  $SUDO chmod 644 "$SEARX_CFG"
  echo "  seeded $SEARX_CFG (json format on, limiter off, a fresh secret)"
else
  echo "  $SEARX_CFG exists -- left exactly as it is"
fi
WANT_ENV="OLLAMA_BASE_URL=$OLLAMA"
if [ "$($SUDO cat "$VANE_ENV" 2>/dev/null)" != "$WANT_ENV" ]; then
  TMPE="$(mktemp)"
  printf '%s\n' "$WANT_ENV" > "$TMPE"
  $SUDO cp "$TMPE" "$VANE_ENV"
  rm -f "$TMPE"
  $SUDO chmod 600 "$VANE_ENV"
  echo "  $VANE_ENV now points Vane at $OLLAMA (Vane adds it as a provider on its next start)"
  RECREATE="--force-recreate"
else
  echo "  $VANE_ENV already points at $OLLAMA"
  RECREATE=""
fi

echo "== research install: compose up (pinned images; no-op when current) =="
# A first-ever pull can outlast the services-sync ceiling; that run fails
# LOUDLY and the next cycle resumes the pull and finishes.
# shellcheck disable=SC2086
if ! COMPOSE_OUT="$($COMPOSE -f "$SRC/docker-compose.yml" -p poetech-research up -d $RECREATE 2>&1)"; then
  echo "research install: compose up FAILED -- the reason follows" >&2
  echo "$COMPOSE_OUT" >&2
  exit 1
fi
echo "$COMPOSE_OUT"

echo "== research install: SearxNG must answer on 127.0.0.1:8798 =="
TRIES=0; UP=0
while [ "$TRIES" -lt 12 ]; do
  if curl -fsS -m 5 -o /dev/null "$SEARX/healthz" 2>/dev/null; then UP=1; break; fi
  TRIES=$((TRIES + 1)); sleep 5
done
if [ "$UP" != "1" ]; then
  echo "  SearxNG silent after 60s -- NOT mounting. See: $DOCKER logs poetech-searxng"
  exit 0
fi
echo "  SearxNG answering"

echo "== research install: Vane must answer on 127.0.0.1:3017 =="
TRIES=0; UP=0
while [ "$TRIES" -lt 24 ]; do
  if curl -fsS -m 5 -o /dev/null "$VANE/api/providers" 2>/dev/null; then UP=1; break; fi
  TRIES=$((TRIES + 1)); sleep 5
done
if [ "$UP" != "1" ]; then
  echo "  Vane silent after 120s -- NOT mounting. See: $DOCKER logs poetech-vane"
  exit 0
fi
echo "  Vane answering: $(curl -fsS -m 5 "$VANE/api/providers" 2>/dev/null | head -c 200)"

echo "== research install: forwarder unit =="
TMPU="$(mktemp)"
sed -e "s|@PYTHON@|$PY|" -e "s|@SRC@|$SRC|" -e "s|@PORT@|$PORT|" "$SRC/poetech-research.service" > "$TMPU"
NEED_RESTART=0
if [ ! -f "$UNIT" ] || ! cmp -s "$TMPU" "$UNIT"; then
  $SUDO cp "$TMPU" "$UNIT"
  $SUDO systemctl daemon-reload
  NEED_RESTART=1
  echo "  unit written"
fi
rm -f "$TMPU"
# The running process must follow the code (the cameras lesson, DR-0770).
CODE_SHA="$(sha256sum < "$SRC/research_forwarder.py" | cut -c1-16)"
STAMP="$DATA/.forwarder.code.sha"
if [ "$($SUDO cat "$STAMP" 2>/dev/null)" != "$CODE_SHA" ]; then
  NEED_RESTART=1
  echo "  forwarder code changed ($CODE_SHA) -- restarting so the running process follows the code"
fi
$SUDO systemctl enable poetech-research >/dev/null 2>&1 || true
if [ "$NEED_RESTART" = "1" ]; then
  $SUDO systemctl restart poetech-research && echo "$CODE_SHA" | $SUDO tee "$STAMP" >/dev/null
else
  $SUDO systemctl is-active --quiet poetech-research || $SUDO systemctl restart poetech-research || true
fi

echo "== research install: the forwarder must answer 200 (it asks Vane for its models) =="
sleep 2
HCODE="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/health" 2>/dev/null || echo 000)"
echo "  http://127.0.0.1:$PORT/health -> $HCODE"
echo "  $(curl -s -m 10 "http://127.0.0.1:$PORT/health" 2>/dev/null | head -c 300)"
if [ "$HCODE" != "200" ]; then
  echo "  not answering 200 -- NOT mounting. See: journalctl -u poetech-research -n 50"
  exit 0
fi

echo "== research install: funnel path mount (guarded, additive, reversible) =="
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/research" \
    && echo "  /research already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /research "http://127.0.0.1:$PORT" \
         && echo "  mounted /research -> 127.0.0.1:$PORT on the PUBLIC funnel (additive; the forwarder holds the lock)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /research http://127.0.0.1:$PORT"; }
else
  echo "  tailscale binary not found -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /research http://127.0.0.1:$PORT"
fi
echo "== research install: done =="
