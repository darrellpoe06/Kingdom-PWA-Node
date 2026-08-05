#!/bin/sh
# transcript-backfill -- trickle the YouTube auto-caption loader through the
# braked runner (DR-0247 armed-by-record; the 2026-08-05 harvest review found
# the corpus at 81/858 transcribed with the loader parked on a manual app
# button since 2026-07-06 while the deterministic fleet ran without it).
# Deterministic decisioning: load-transcripts.py fetches YouTube's own
# auto-captions from the NAS's residential IP (the CI path is IP-blocked --
# observed run #5, 2026-07-11) and upserts video_transcripts; the served app
# derives the transcript harvests LIVE off those rows. No LLM, no GPU.
# Brakes stack: the runner's timeout/cap/lock PLUS the loader's own --max
# budget, single-instance lock, and auto-pause after 3 all-blocked runs
# (cleared from the app via the resume-transcripts ops job). Trickle pace:
# small bursts with randomized sleeps, sized to stay under the ~50-in-a-burst
# block YouTube applied 2026-07-03.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
exec python3 "$REPO/infra/nas-sme-pipeline/load-transcripts.py" \
  --slug "${TRANSCRIPTS_SLUG:-colg}" \
  --max "${TRANSCRIPTS_MAX:-8}" \
  --sleep-min "${TRANSCRIPTS_SLEEP_MIN:-20}" \
  --sleep-max "${TRANSCRIPTS_SLEEP_MAX:-60}"
