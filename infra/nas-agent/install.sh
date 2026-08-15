#!/bin/sh
# nas-agent installer -- idempotent, services-sync clock (DR-0247: starts itself).
# Vendors pg8000 (pure-python Postgres; DSM python3.8 is stdlib-only for root --
# the transcript-trickle pattern), and STARTS the consumer only when the secret
# exists: AGENT_DB_URL comes from the arm workflow (nas-agent-arm.yml) writing
# /volume1/docker/poetech/agent.env from the repo secret over remote-hands.
# Absent env => polite no-op that says exactly what is missing. Never loud on
# a box that was simply never armed with the credential.
set -e
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-agent"
ENVF="/volume1/docker/poetech/agent.env"
VENDOR="$SRC/.vendor"

python3 "$SRC/agent_consumer.py" --selftest >/dev/null 2>&1 || {
  echo "nas-agent: SELFTEST FAILED -- refusing to install a broken consumer" >&2; exit 1; }

if ! PYTHONPATH="$VENDOR" python3 -c 'import pg8000' >/dev/null 2>&1; then
  echo "nas-agent: vendoring pg8000 into the repo (both users can read it)"
  mkdir -p "$VENDOR"
  DPOE_PIP="/var/services/homes/dpoe/.local/bin/pip"
  # Measured 2026-08-15 (cycles 03:30/03:45/04:00): NO pip route works as root
  # on this DSM, so the wheel is COMMITTED to the repo (.vendor, pg8000 1.30.5,
  # the last release whose floor is python 3.8 -- 1.31+ declares >=3.9 and
  # imports zoneinfo). The repo carries what the box cannot fetch; this pip
  # path remains only as a fallback for other hosts, and it PRINTS its failure
  # instead of swallowing it -- three cycles failed with no recorded reason
  # because of the exact >/dev/null below, the sin this day kept correcting.
  python3 -m pip install --target "$VENDOR" --quiet "pg8000==1.30.5" \
    || { [ -x "$DPOE_PIP" ] && "$DPOE_PIP" install --target "$VENDOR" --quiet "pg8000==1.30.5"; } \
    || true
  PYTHONPATH="$VENDOR" python3 -c 'import pg8000' >/dev/null 2>&1 || {
    echo "nas-agent: could not vendor pg8000 (no pip route worked AND the committed .vendor is missing -- was it checked out?)" >&2; exit 1; }
fi

if [ ! -f "$ENVF" ]; then
  echo "nas-agent: installed (pg8000 vendored, selftest green). WAITING for $ENVF"
  echo "nas-agent: dispatch .github/workflows/nas-agent-arm.yml to place AGENT_DB_URL -- then this loop answers on its next cycle."
  exit 0
fi
. "$ENVF"
export AGENT_DB_URL OLLAMA_MODEL
python3 "$SRC/agent_consumer.py" --max "${AGENT_MAX:-5}"
