#!/bin/sh
# db-backup-receipt -- the house says whether its backup is good, with no key
# (DR-1360 / DR-1113). Rides the ALREADY-ARMED services-sync clock: run once
# per cycle by the installer loop and exits. No daemon, no schedule of its own.
# No credential or no status file = quiet no-op.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SECRETS="${SUPABASE_SECRETS:-/volume1/PoeTech/secrets/supabase.json}"
if [ ! -s "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ] && [ ! -s /volume1/docker/supabase/.env ]; then
  echo "db-backup-receipt: no credential (no secrets file, no env key, no sovereign stack) - quiet no-op"
  exit 0
fi
SUPABASE_SECRETS="$SECRETS" python3 "$REPO/infra/nas-loops/db-backup-receipt.py"
