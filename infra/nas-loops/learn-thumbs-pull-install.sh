#!/bin/sh
# learn-thumbs-pull -- the NAS keeps the paid Learn pictures (DR-1360).
# Rides the ALREADY-ARMED services-sync clock (the content-sync pattern): this
# script is run once per 15-minute cycle by the installer loop and is
# stamp-gated to one pull an hour (a registry.json loop would have no clock;
# DR-0277). learn-presentation-prepare.yml uploads each batch's pictures as an
# artifact that expires, and its cache evicts in 7 days, so the NAS pulls every
# new one: masters to /volume1/PoeTech/learn-thumbs/masters, the run's ledger to
# runs/<run_id>. The NAS starts the road; no runner pushes into the house.
#
# BRAKES (DR-0248, deterministic class: budget + lock).
#   budget  one pass an hour (stamp, written BEFORE the pass so a failing pass
#           waits its hour too); 6 artifacts and 2 GB a pass; a 400 s wall
#           clock inside the pass, and `timeout 420` around it, under the
#           480 s services-sync rider ceiling;
#   lock    a lockdir in the pass's home, plus the runner's lock above.
#   stop    services.json "enabled": false (a PR).
# No GitHub token is a named quiet no-op (exit 0). Exit 3 = GitHub could not be
# asked this cycle (DEGRADED); exit 1 = an artifact was refused (bad digest or
# an unsafe path in the zip), retried hourly and set aside after 3 refusals.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
HOME_DIR="${LEARN_THUMBS_DEST:-/volume1/PoeTech/learn-thumbs}"
STAMP="$HOME_DIR/.last-pass"
EVERY_SECONDS="${LEARN_THUMBS_EVERY_SECONDS:-3300}"
TOKEN_FILE="${LEARN_THUMBS_TOKEN_FILE:-/volume1/PoeTech/secrets/github-token.txt}"

if [ ! -s "$TOKEN_FILE" ]; then
  echo "learn-thumbs-pull: no GitHub token at $TOKEN_FILE - quiet no-op"
  exit 0
fi
mkdir -p "$HOME_DIR" || { echo "learn-thumbs-pull: cannot make $HOME_DIR" >&2; exit 1; }

now=$(date +%s)
last=0
[ -f "$STAMP" ] && last=$(cat "$STAMP" 2>/dev/null || echo 0)
case "$last" in ''|*[!0-9]*) last=0 ;; esac
if [ $((now - last)) -lt "$EVERY_SECONDS" ]; then
  echo "learn-thumbs-pull: pulled $(( (now - last) / 60 )) min ago; next in $(( (EVERY_SECONDS - (now - last)) / 60 )) min"
  exit 0
fi
echo "$now" > "$STAMP"

PATH=/usr/local/bin:/opt/bin:/usr/bin:/bin:$PATH; export PATH
if command -v timeout >/dev/null 2>&1; then
  timeout 420 python3 "$REPO/infra/nas-loops/learn-thumbs-pull.py"
else
  python3 "$REPO/infra/nas-loops/learn-thumbs-pull.py"
fi
