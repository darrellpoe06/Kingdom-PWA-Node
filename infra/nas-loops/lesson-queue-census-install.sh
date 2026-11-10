#!/bin/sh
# lesson-queue-census -- the NAS counts its own lesson queue (DR-1360 / DR-0725).
# Rides the ALREADY-ARMED services-sync clock (the nas-heartbeat pattern): this
# script is run once per cycle by the installer loop and exits. No daemon, no
# schedule of its own, one read and one write. No credential = quiet no-op.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SECRETS="${SUPABASE_SECRETS:-/volume1/PoeTech/secrets/supabase.json}"
if [ ! -s "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ] && [ ! -s /volume1/docker/supabase/.env ]; then
  echo "lesson-queue-census: no credential (no secrets file, no env key, no sovereign stack) - quiet no-op"
  exit 0
fi
SUPABASE_SECRETS="$SECRETS" python3 "$REPO/infra/nas-loops/lesson-queue-census.py"
