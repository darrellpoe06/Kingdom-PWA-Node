#!/bin/sh
# bg-message-lessons -- each message Bishop Gwin preaches becomes a lesson (DR-1433).
# Rides the ALREADY-ARMED services-sync clock (the lesson-queue-census pattern):
# run once per cycle by the installer loop, then exits. No daemon, no schedule
# of its own. It files at most per_cycle rows; the lesson builder on this same
# machine writes each lesson. No credential = quiet no-op.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SECRETS="${SUPABASE_SECRETS:-/volume1/PoeTech/secrets/supabase.json}"
if [ ! -s "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ] && [ ! -s /volume1/docker/supabase/.env ]; then
  echo "bg-message-lessons: no credential (no secrets file, no env key, no sovereign stack) - quiet no-op"
  exit 0
fi
SUPABASE_SECRETS="$SECRETS" timeout 300 python3 "$REPO/infra/nas-loops/bg-message-lessons.py"
