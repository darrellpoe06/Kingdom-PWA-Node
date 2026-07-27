#!/bin/sh
# scribe-transcribe -- drain the Scribe whisper queue through the braked consumer.
# DR-0236 (built same-day) / DR-0068 / DR-0225. Deterministic decisioning: the
# consumer transcribes via the local whisper-gpu HTTP endpoint (local ML, no
# vendor LLM); the optional minutes stage only runs when LLM_URL is set (a
# parameter decision, DR-0096). Brakes stack: the runner's timeout/cap/lock/
# kill-switch PLUS the consumer's own budget + lock + auto-pause. The runner
# arm (LOOPS_ARMED + the DSM entry) is the governance step that activates this;
# the consumer's own active flag is set here because this script only ever runs
# armed.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
export SCRIBE_CONSUMER_ACTIVE=1
export SCRIBE_DATA="${SCRIBE_DATA:-/data/poetech-scribe}"
export WHISPER_URL="${WHISPER_URL:-http://127.0.0.1:8771}"
exec python3 "$REPO/infra/nas-scribe/scribe_queue_consumer.py"
