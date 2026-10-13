#!/bin/sh
# family-key -- the NAS publishes the family key itself, riding the ALREADY-
# ARMED services-sync clock (DR-0613). Before this, a steward had to paste the
# key by hand in Real Estate -> Photos, and none ever had (0 rows measured).
# Each cycle: one call to box_publish_family_bridge_token (0231); it writes only
# when the key differs and only to the family's own instances. Missing pieces
# are a named quiet no-op (exit 0); the key is never printed.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
cd "$REPO/infra/nas-bridge-publish" || exit 1
exec python3 publish_family_key.py
