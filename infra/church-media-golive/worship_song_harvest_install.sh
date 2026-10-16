#!/bin/sh
# worship-song-harvest -- the sweep runs itself (DR-1065), riding the
# ALREADY-ARMED services-sync clock (DR-0247: agreed work starts itself).
#
# Darrell, 2026-10-16, over the Songbook's own readout of 920 services with 915
# still to sweep: "What?!!!!! Fix it!!!! Make sure humans have to do nothing if
# possible... just get all of them... we already have it dont we?!!!"
#
# WE DID ALREADY HAVE IT, AND THAT IS THE WHOLE FINDING. The producer was
# written months ago -- infra/nas-sme-pipeline/worship-song-harvest.py, pure
# Python, no LLM, grounded drafts only -- and it was never given a clock. It
# appeared NOWHERE outside its own folder: not in nas-loops/registry.json, not
# in services.json, not in any workflow. The only way it ever ran was a person
# opening an SSH session and typing it, and then pasting its output into a
# textarea in the Songbook. 915 services sat unswept because nothing swept them.
#
# BRAKES (DR-0248, the deterministic class): the BUDGET lives in the script's
# own --chunk / --time-budget; the LOCK and the outer timeout live in the
# nas-loops runner above this. No kill-switch by record -- this class carries
# budget and lock, and the selftest gating merge is the protection.
#
# WHY THE NAS AND NOT CI: this reads video_transcripts and writes choir_songs
# through the sovereign Supabase on the tailnet, with the secret that lives at
# /volume1/PoeTech/secrets/supabase.json and never leaves the NAS. Same reason
# choir-dates and stream-length ride here.
#
# NOTHING IS TRUSTED BY RUNNING THIS. Every row it writes is source=
# 'harvest-transcript', confidence low or medium, needs_review TRUE, and
# carries the verbatim phrase it was heard in. The steward still confirms every
# song in the Songbook; this only means they correct a grounded draft instead
# of facing 915 blank services. Re-runs are idempotent -- the script dedupes
# against the drafts it already wrote, per video and per title.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
DIR="$REPO/infra/nas-sme-pipeline"

if [ ! -f /volume1/PoeTech/secrets/supabase.json ]; then
  echo "worship-song-harvest: no supabase secret on this box; nothing swept this cycle" >&2
  exit 1
fi

# 25 services and 240 s per 15-min cycle. Newest first, so each new Sunday is
# harvested on the first cycle after its row exists and the backlog drains
# behind it. At this pace the 915 standing services clear in about 37 cycles,
# roughly ten hours, and every cycle after that is one read and nothing else.
python3 "$DIR/worship-song-harvest.py" --write --chunk 25 --time-budget 240
