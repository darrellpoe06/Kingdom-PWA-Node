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
# THE WHISPER LADDER is WHISPER_URLS (default the 4070 tower by its tailnet name
# tlcmediadpt.tail5a2f35.ts.net:8771, then 100.69.19.13:8771; the bare name does
# not resolve on the NAS, measured 2026-09-24),
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

T0=$(date +%s)
mkdir -p "$DATA/audio" /volume1/PoeTech/venvs

if [ -f "$ENVFILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENVFILE"
  set +a
fi

# The job follows the database the app reads (DR-0614): the NAS's own Supabase
# when REPOINT-ARMED is merged, else the hosted project in the secrets file.
if [ ! -s "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ] && [ ! -s /volume1/docker/supabase/.env ]; then
  echo "lesson-voice: no credential (no secrets file, no env key, no sovereign stack) - nothing to poll with"
  exit 0
fi

# The CPU rung: install faster-whisper once; retry at most once a day on
# failure, OR at once when the install recipe below changes (so a fix merged to
# main is tried on the next cycle instead of a day later).
#
# MEASURED 2026-09-24 (voice-intake-health run 36048978519): the venv existed,
# `import faster_whisper` failed, the tower answered HTTP 000, and a spoken
# lesson was reported voice-failed with no rung left. The old line hid pip's
# reason behind --quiet and a 24h wait. The NAS runs Python 3.8, whose venv
# ships a pip too old to see the manylinux_2_17 wheels ctranslate2 publishes,
# so pip fell back to building from source and failed. Now: pip is upgraded
# inside the venv first (bootstrapped with get-pip for 3.8 if the venv has
# none), the whole attempt is logged to $DATA/pip.log for the witness
# (voice-intake-health.yml) to read, and the stamp names the recipe.
PIP_RECIPE="v2 pip-upgrade faster-whisper<1.1"
PY=python3
if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import faster_whisper" 2>/dev/null; then
  PY="$VENV/bin/python"
else
  now=$(date +%s)
  stamp=$(cat "$PIPSTAMP" 2>/dev/null || echo "")
  last=$(printf '%s' "$stamp" | cut -d' ' -f1)
  recipe=$(printf '%s' "$stamp" | cut -d' ' -f2-)
  case "$last" in ''|*[!0-9]*) last=0 ;; esac
  if [ "$recipe" != "$PIP_RECIPE" ] || [ $((now - last)) -ge 86400 ]; then
    echo "$now $PIP_RECIPE" > "$PIPSTAMP"
    LOG="$DATA/pip.log"
    {
      echo "=== $(date -u +%FT%TZ) recipe: $PIP_RECIPE ==="
      python3 --version; uname -m
      [ -x "$VENV/bin/python" ] || python3 -m venv "$VENV" || python3 -m venv --without-pip "$VENV"
      if ! "$VENV/bin/python" -m pip --version; then
        echo "no pip in the venv: bootstrapping it with get-pip for Python 3.8"
        curl -fsSL --max-time 60 https://bootstrap.pypa.io/pip/3.8/get-pip.py -o "$DATA/get-pip.py" \
          && "$VENV/bin/python" "$DATA/get-pip.py" --quiet
      fi
      timeout 60 "$VENV/bin/python" -m pip install --upgrade --quiet pip setuptools wheel
      "$VENV/bin/python" -m pip --version
      # faster-whisper 1.1 needs Python 3.9; the 1.0 line runs on 3.8 and
      # already carries clip_timestamps, which the CPU rung resumes with.
      timeout 300 "$VENV/bin/python" -m pip install --prefer-binary "faster-whisper<1.1"
      echo "exit=$?"
    } > "$LOG" 2>&1
    if "$VENV/bin/python" -c "import faster_whisper" 2>>"$LOG"; then
      PY="$VENV/bin/python"
      echo "lesson-voice: CPU rung installed"
    else
      echo "lesson-voice: CPU rung not installed this cycle: $(tail -3 "$LOG" | tr '\n' ' ' | cut -c1-300) (log: $LOG)"
    fi
  fi
fi
# The model downloads once and is kept beside the data, not in root's home.
export HF_HOME="$DATA/hf"

cd "$SRC" || exit 1
# The pip install above can spend most of a cycle; the transcription pass gets
# what is left of services-sync's 480 s ceiling (440 s, a margin kept), never more.
LEFT=$((440 - ($(date +%s) - T0)))
BUDGET="${LESSON_VOICE_MAX_SECONDS:-400}"
[ "$LEFT" -lt "$BUDGET" ] && BUDGET=$LEFT
if [ "$BUDGET" -lt 60 ]; then
  echo "lesson-voice: the install used this cycle; the transcription pass runs next cycle"
  exit 0
fi
LESSON_VOICE_DATA="$DATA" LESSON_VOICE_MAX_SECONDS="$BUDGET" \
  "$PY" lesson_voice_transcribe.py > "$DATA/last-run.json.tmp"
rc=$?
cat "$DATA/last-run.json.tmp"
mv -f "$DATA/last-run.json.tmp" "$DATA/last-run.json"
exit $rc
