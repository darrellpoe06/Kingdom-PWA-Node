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

# WHO SPOKE (DR-0706), ARMED BY RECORD (DR-0247): on unless lesson-voice.env
# sets LESSON_VOICE_SPEAKERS=0 (the stop-path). Once (and again only when the
# recipe changes): sherpa-onnx into the same venv (a cp38 manylinux2014 wheel exists,
# measured 2026-09-30: sherpa_onnx-1.13.8) and two small ONNX models from the
# k2-fsa/sherpa-onnx GitHub releases into $DATA/models/speakers. No torch, no
# account, no gated model, nothing leaves the NAS at run time.
SPK_RECIPE="v1 sherpa-onnx pyannote-seg-3.0 titanet-small"
SPK_DIR="$DATA/models/speakers"
SPK_STAMP="$DATA/.speakers-recipe"
if [ "${LESSON_VOICE_SPEAKERS:-1}" != "0" ] && [ "$(cat "$SPK_STAMP" 2>/dev/null)" != "$SPK_RECIPE" ]; then
  mkdir -p "$SPK_DIR"
  {
    echo "=== $(date -u +%FT%TZ) speakers recipe: $SPK_RECIPE ==="
    timeout 180 "$VENV/bin/python" -m pip install --prefer-binary "sherpa-onnx==1.13.8"
    if [ ! -s "$SPK_DIR/segmentation.onnx" ]; then
      curl -fsSL --max-time 120 -o "$SPK_DIR/seg.tar.bz2" \
        https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-segmentation-models/sherpa-onnx-pyannote-segmentation-3-0.tar.bz2 \
        && tar -xjf "$SPK_DIR/seg.tar.bz2" -C "$SPK_DIR" \
        && cp "$SPK_DIR/sherpa-onnx-pyannote-segmentation-3-0/model.onnx" "$SPK_DIR/segmentation.onnx" \
        && rm -rf "$SPK_DIR/seg.tar.bz2" "$SPK_DIR/sherpa-onnx-pyannote-segmentation-3-0"
    fi
    if [ ! -s "$SPK_DIR/embedding.onnx" ]; then
      curl -fsSL --max-time 120 -o "$SPK_DIR/embedding.onnx" \
        https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recongition-models/nemo_en_titanet_small.onnx
    fi
  } > "$DATA/speakers-install.log" 2>&1
  if "$VENV/bin/python" -c "import sherpa_onnx" 2>>"$DATA/speakers-install.log" && [ -s "$SPK_DIR/segmentation.onnx" ] && [ -s "$SPK_DIR/embedding.onnx" ]; then
    echo "$SPK_RECIPE" > "$SPK_STAMP"
    echo "lesson-voice: speaker marking installed"
  else
    echo "lesson-voice: speaker marking not installed this cycle: $(tail -3 "$DATA/speakers-install.log" | tr '\n' ' ' | cut -c1-300)"
  fi
fi

# ENROLL BY WORDS (DR-0706): BG and DP are named from words a person who was
# there attributed (enroll.json, committed), so no one has to sit at the NAS
# to say "voice 0 is Bishop Gwin". Runs only when speaker marking is installed
# and a label in enroll.json has no voiceprint yet. It is long (a whole class
# diarized and transcribed on the CPU), so it runs detached from this cycle,
# with its own brakes: budget = timeout 3600 s at the lowest priority; lock =
# one attempt per 24 h (the stamp is written before it starts, and the budget
# is far inside the day, so two never overlap); stop-path =
# LESSON_VOICE_SPEAKERS=0 or deleting enroll.json. The result is
# $DATA/enroll-result.json and the log $DATA/enroll.log (voice-intake-health.yml).
ENROLL_SPEC="$SRC/enroll.json"
ENROLL_STAMP="$DATA/.enroll-attempt"
if [ "${LESSON_VOICE_SPEAKERS:-1}" != "0" ] && [ -f "$ENROLL_SPEC" ] && [ "$(cat "$SPK_STAMP" 2>/dev/null)" = "$SPK_RECIPE" ] \
   && { [ ! -s "$DATA/voiceprints/BG.json" ] || [ ! -s "$DATA/voiceprints/DP.json" ]; }; then
  now=$(date +%s)
  last=$(cat "$ENROLL_STAMP" 2>/dev/null || echo 0)
  case "$last" in ''|*[!0-9]*) last=0 ;; esac
  if [ $((now - last)) -ge 86400 ]; then
    echo "$now" > "$ENROLL_STAMP"
    ( cd "$SRC" && LESSON_VOICE_DATA="$DATA" HF_HOME="$DATA/hf" nohup nice -n 19 timeout 3600 \
        "$VENV/bin/python" name_voice.py --enroll "$ENROLL_SPEC" > "$DATA/enroll.log" 2>&1 & )
    echo "lesson-voice: enrolling BG and DP by their attributed words (detached, 3600 s budget; log: $DATA/enroll.log)"
  fi
fi

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
