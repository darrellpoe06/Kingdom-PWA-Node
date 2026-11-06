#!/bin/sh
# nas-heartbeat -- the house's own witness, one row per services-sync cycle (DR-1360).
# Rides the ALREADY-ARMED services-sync clock (the lesson-voice pattern): this
# script is run once per cycle by the installer loop and exits. No daemon, no
# schedule of its own, one read and one write. No credential = quiet no-op.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SECRETS="${SUPABASE_SECRETS:-/volume1/PoeTech/secrets/supabase.json}"
if [ ! -s "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ] && [ ! -s /volume1/docker/supabase/.env ]; then
  echo "nas-heartbeat: no credential (no secrets file, no env key, no sovereign stack) - quiet no-op"
  exit 0
fi
SUPABASE_SECRETS="$SECRETS" python3 "$REPO/infra/nas-loops/heartbeat.py"
