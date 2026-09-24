#!/bin/sh
# lesson-voice -- spoken lessons become words, riding the ALREADY-ARMED
# services-sync clock (the transcript-trickle pattern: zero new DSM entries,
# no human hands). DR-0611.
#
# WHY A RIDER AND NOT A registry.json LOOP: install-clock.sh clocks exactly two
# loops (services-sync every 15 min, health-check hourly). A registry entry with
# no clock reads enabled while nothing fires it (the 2026-08-06 ways review;
# scribe-transcribe is in that state today, DR-0611). Riding services-sync is
# the path that actually runs.
#
# EACH CYCLE (every 15 minutes, idempotent):
#   1. data dir + a venv for the CPU rung (faster-whisper), installed ONCE and
#      retried at most daily when pip fails, never every cycle;
#   2. one pass of lesson_voice_transcribe.py: budget 3 rows and 400 s (inside
#      services-sync's 480 s per-installer ceiling), single-flight lock.
#
# THE WHISPER LADDER is WHISPER_URLS (default the 4070 tower, tlcmediadpt:8771),
# then this NAS's CPU. Add a place by setting WHISPER_URLS in
# /volume1/PoeTech/secrets/lesson-voice.env, e.g.
#   WHISPER_URLS=http://tlcmediadpt:8771,http://tower2:8771
#
# EXIT DISCIPLINE: no credential is a named, quiet no-op (exit 0 with the why);
# a run that fails rows reports them in its JSON and inside the app (the row
# says voice-failed after 3 tries), so the cycle stays green unless the script
# itself crashes, which propagates and reds the cycle (DR-0076).
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-lesson-voice"
DATA="${LESSON_VOICE_DATA:-/volume1/PoeTech/lesson-voice}"
VENV=/volume1/PoeTech/venvs/lesson-voice
SECRETS=/volume1/PoeTech/secrets/supabase.json
ENVFILE=/volume1/PoeTech/secrets/lesson-voice.env
PIPSTAMP="$DATA/.pip-attempt"

mkdir -p "$DATA/audio" /volume1/PoeTech/venvs

if [ -f "$ENVFILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENVFILE"
  set +a
fi

if [ ! -s "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "lesson-voice: no credential ($SECRETS absent and SUPABASE_SERVICE_KEY unset) - nothing to poll with"
  exit 0
fi

# The CPU rung: install faster-whisper once; retry at most once a day on failure.
PY=python3
if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import faster_whisper" 2>/dev/null; then
  PY="$VENV/bin/python"
else
  now=$(date +%s)
  last=0
  [ -f "$PIPSTAMP" ] && last=$(cat "$PIPSTAMP" 2>/dev/null || echo 0)
  case "$last" in ''|*[!0-9]*) last=0 ;; esac
  if [ $((now - last)) -ge 86400 ]; then
    echo "$now" > "$PIPSTAMP"
    echo "lesson-voice: installing the CPU Whisper rung (faster-whisper) into $VENV"
    [ -x "$VENV/bin/python" ] || python3 -m venv "$VENV" || true
    if [ -x "$VENV/bin/pip" ] && timeout 300 "$VENV/bin/pip" install --quiet faster-whisper; then
      PY="$VENV/bin/python"
      echo "lesson-voice: CPU rung installed"
    else
      echo "lesson-voice: CPU rung not installed this cycle (the network rungs still run); retry in 24h"
    fi
  fi
fi

cd "$SRC" || exit 1
LESSON_VOICE_DATA="$DATA" LESSON_VOICE_MAX_SECONDS="${LESSON_VOICE_MAX_SECONDS:-400}" \
  exec "$PY" lesson_voice_transcribe.py
