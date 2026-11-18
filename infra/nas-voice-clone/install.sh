#!/bin/sh
# install.sh -- idempotent, self-running installer for "My voice" on the NAS's
# own CPU (DR-1538). services-sync runs it every 15 minutes; merging to main IS
# the deploy (services.json, DR-0236). No hand, no tower, no tailnet key.
#
# WHAT IT PUTS ON THE BOX, one large download per cycle so it never eats the
# services-sync ceiling (the voice-lite pattern):
#   1. a Python venv at /volume1/PoeTech/venvs/voice-clone (this box runs 3.8);
#   2. PyTorch, CPU build (torch 2.4.1 is the last line with Python 3.8 wheels),
#      from PyTorch's CPU index, falling back to PyPI;
#   3. librosa + the OpenVoice modules at the exact commit read on 2026-11-18
#      (MIT; --no-deps: only models, modules, attentions, commons, transforms,
#      mel_processing and utils are imported, and they need only torch, numpy
#      and librosa -- never its text front end, Gradio or Whisper);
#   4. the OpenVoice V2 converter weights (config.json + checkpoint.pth) from
#      the myshell-ai/OpenVoiceV2 repository on Hugging Face.
# Piper, the house voice and ffmpeg come from the voice-lite install; this one
# waits for them rather than fetching a second copy.
#
# PROVE, NEVER ASSUME (DR-0076): the service is restarted onto the repo's code
# on EVERY path (the one function below), /health is asked from this box, and
# once per code version it speaks one sentence and writes the MEASURED speed
# (seconds of work per second of speech) to status.json, which /health shows.
#
# Brakes: one large download per cycle; a failed download or pip step is
# retried at most once a day (a stamp per step), never every cycle; every pip
# and curl call has a timeout; the server itself does one synthesis at a time.
# Stop-path: "enabled": false on voice-clone in services.json.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-voice-clone"
HOME_DIR=/volume1/PoeTech/voice-clone
LITE=/volume1/PoeTech/voice-lite
VENV=/volume1/PoeTech/venvs/voice-clone
UNIT=/etc/systemd/system/poetech-voice-clone.service
PORT=8773
OV_COMMIT=74a1d147b17a8c3092dd5430504bd83ef6c7eb23
HF=https://huggingface.co/myshell-ai/OpenVoiceV2/resolve/main/converter
LOG="$HOME_DIR/install.log"

mkdir -p "$HOME_DIR/models/converter" "$HOME_DIR/se" "$HOME_DIR/cache" "$HOME_DIR/tmp" /volume1/PoeTech/venvs
SUDO=""
[ "$(id -u)" = "0" ] || SUDO="sudo -n"

PY=python3
[ -x "$VENV/bin/python" ] && PY="$VENV/bin/python"

# THE RUNNING PROCESS FOLLOWS THE CODE, ON EVERY PATH (the Way, step 4).
clone_follows_code() {
  PY=python3
  [ -x "$VENV/bin/python" ] && PY="$VENV/bin/python"
  NEED_RESTART=0
  TMPU="$HOME_DIR/.unit.tmp"
  sed -e "s|@PYTHON@|$PY|g" -e "s|@SRC@|$SRC|g" -e "s|@HOME@|$HOME_DIR|g" -e "s|@LITE@|$LITE|g" -e "s|@PORT@|$PORT|g" \
    "$SRC/poetech-voice-clone.service" > "$TMPU"
  if ! cmp -s "$TMPU" "$UNIT" 2>/dev/null; then
    $SUDO cp "$TMPU" "$UNIT" && $SUDO systemctl daemon-reload
    NEED_RESTART=1
    echo "  unit written (python: $PY)"
  fi
  rm -f "$TMPU"
  CODE_SHA="$(sha256sum < "$SRC/nas_clone_server.py" | cut -c1-16)"
  STAMP="$HOME_DIR/.code.sha"
  if [ "$(cat "$STAMP" 2>/dev/null)" != "$CODE_SHA" ]; then
    NEED_RESTART=1
    echo "  server code changed ($CODE_SHA) -- restarting so the running process follows the code"
  fi
  $SUDO systemctl enable poetech-voice-clone >/dev/null 2>&1 || true
  if [ "$NEED_RESTART" = "1" ]; then
    $SUDO systemctl restart poetech-voice-clone && echo "$CODE_SHA" > "$STAMP"
  else
    $SUDO systemctl is-active --quiet poetech-voice-clone || $SUDO systemctl restart poetech-voice-clone || true
  fi
  return 0
}

# A step that failed is tried again at most once a day: <stamp file> <recipe>.
due() {
  now=$(date +%s)
  last=$(cut -d' ' -f1 "$1" 2>/dev/null || echo 0)
  rec=$(cut -d' ' -f2- "$1" 2>/dev/null || echo "")
  case "$last" in ''|*[!0-9]*) last=0 ;; esac
  [ "$rec" != "$2" ] || [ $((now - last)) -ge 86400 ]
}

echo "== voice-clone install: the unit, before anything that can stop this install =="
clone_follows_code

echo "== voice-clone install: what voice-lite already put on this box =="
if [ ! -x "$LITE/piper/piper" ] || [ ! -s "$LITE/voices/en_US-ryan-medium.onnx" ]; then
  echo "  piper or the house voice is not on this box yet; the voice-lite install brings them. Waiting."
  exit 0
fi
echo "  piper and en_US-ryan-medium present"

echo "== voice-clone install: the venv and PyTorch (CPU) =="
if ! "$PY" -c "import torch" 2>/dev/null; then
  if due "$HOME_DIR/.torch-attempt" "v1 torch-2.4.1-cpu"; then
    echo "$(date +%s) v1 torch-2.4.1-cpu" > "$HOME_DIR/.torch-attempt"
    {
      echo "=== $(date -u +%FT%TZ) torch ==="
      python3 --version; uname -m
      [ -x "$VENV/bin/python" ] || python3 -m venv "$VENV" || python3 -m venv --without-pip "$VENV"
      if ! "$VENV/bin/python" -m pip --version; then
        curl -fsSL --max-time 60 https://bootstrap.pypa.io/pip/3.8/get-pip.py -o "$HOME_DIR/get-pip.py" \
          && "$VENV/bin/python" "$HOME_DIR/get-pip.py" --quiet
      fi
      timeout 90 "$VENV/bin/python" -m pip install --upgrade --quiet pip setuptools wheel
      timeout 420 "$VENV/bin/python" -m pip install --prefer-binary "torch==2.4.1" --index-url https://download.pytorch.org/whl/cpu \
        || timeout 420 "$VENV/bin/python" -m pip install --prefer-binary "torch==2.4.1"
      echo "exit=$?"
    } >> "$LOG" 2>&1 || true
  fi
  if "$VENV/bin/python" -c "import torch" 2>/dev/null; then
    echo "  torch installed: $("$VENV/bin/python" -c 'import torch; print(torch.__version__)')"
    clone_follows_code
  else
    echo "  torch not installed this cycle (retried daily): $(tail -3 "$LOG" 2>/dev/null | tr '\n' ' ' | cut -c1-300)"
  fi
  exit 0
fi
echo "  torch present: $("$PY" -c 'import torch; print(torch.__version__)')"

echo "== voice-clone install: librosa and the OpenVoice modules =="
if ! "$PY" -c "import librosa, openvoice.models, openvoice.mel_processing, openvoice.utils" 2>/dev/null; then
  if due "$HOME_DIR/.ov-attempt" "v1 $OV_COMMIT"; then
    echo "$(date +%s) v1 $OV_COMMIT" > "$HOME_DIR/.ov-attempt"
    {
      echo "=== $(date -u +%FT%TZ) librosa + openvoice $OV_COMMIT ==="
      timeout 420 "$PY" -m pip install --prefer-binary "numpy<1.25" "librosa<0.11" "numba<0.59" soundfile
      timeout 120 "$PY" -m pip install --no-deps "https://github.com/myshell-ai/OpenVoice/archive/$OV_COMMIT.tar.gz"
      echo "exit=$?"
    } >> "$LOG" 2>&1 || true
  fi
  if "$PY" -c "import librosa, openvoice.models" 2>/dev/null; then
    echo "  librosa and the OpenVoice modules installed"
    clone_follows_code
  else
    echo "  not installed this cycle (retried daily): $(tail -3 "$LOG" 2>/dev/null | tr '\n' ' ' | cut -c1-300)"
  fi
  exit 0
fi
echo "  librosa and the OpenVoice modules present"

echo "== voice-clone install: the converter weights =="
for F in config.json checkpoint.pth; do
  T="$HOME_DIR/models/converter/$F"
  [ -s "$T" ] && continue
  if due "$HOME_DIR/.weights-attempt-$F" "v1"; then
    echo "$(date +%s) v1" > "$HOME_DIR/.weights-attempt-$F"
    if curl -fsSL -m 400 -o "$T.part" "$HF/$F"; then
      mv "$T.part" "$T"
      echo "  downloaded $F ($(wc -c < "$T") bytes, sha256 $(sha256sum < "$T" | cut -c1-16))"
      clone_follows_code
    else
      rm -f "$T.part"
      echo "  download of $F FAILED (retried daily)"
    fi
  else
    echo "  $F waits for its daily retry"
  fi
  # The small file and the large one may share a cycle; nothing after this
  # step runs until both are on disk.
  [ "$F" = "checkpoint.pth" ] && exit 0
done
[ -s "$HOME_DIR/models/converter/config.json" ] || exit 0
echo "  config.json and checkpoint.pth present"

echo "== voice-clone install: the server, onto this code =="
clone_follows_code
sleep 3
HBODY="$(curl -s -m 20 "http://127.0.0.1:$PORT/health" 2>/dev/null || echo '')"
echo "  http://127.0.0.1:$PORT/health -> $(printf '%s' "$HBODY" | head -c 300)"
if ! printf '%s' "$HBODY" | grep -q '"ok": true'; then
  echo "  not ready; see: journalctl -u poetech-voice-clone -n 50"
  exit 0
fi

echo "== voice-clone install: measure it once per code version =="
CODE_SHA="$(sha256sum < "$SRC/nas_clone_server.py" | cut -c1-16)"
if [ "$(cat "$HOME_DIR/.measured.sha" 2>/dev/null)" != "$CODE_SHA" ] && [ -s "$LITE/voices/en_US-amy-medium.onnx" ]; then
  # A stand-in recording: the house's woman's voice, so the measure moves a
  # real color onto a real reading. No person's voice is used to measure.
  REF="$HOME_DIR/tmp/measure-ref.wav"
  echo "Grace be unto you, and peace, from God our Father." | "$LITE/piper/piper" --model "$LITE/voices/en_US-amy-medium.onnx" --output_file "$REF" >/dev/null 2>&1 || true
  if [ -s "$REF" ]; then
    "$PY" - "$REF" "$PORT" "$HOME_DIR/status.json" <<'PYEOF' || true
import base64, io, json, sys, time, urllib.request, wave
ref, port, out = sys.argv[1], sys.argv[2], sys.argv[3]
uri = "data:audio/wav;base64," + base64.b64encode(open(ref, "rb").read()).decode()
text = "In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God."
req = urllib.request.Request("http://127.0.0.1:%s/speak" % port, method="POST",
                             data=json.dumps({"text": text, "reference_audio": uri, "speed": 1.0}).encode(),
                             headers={"Content-Type": "application/json"})
t0 = time.time()
audio = urllib.request.urlopen(req, timeout=300).read()
spent = time.time() - t0
with wave.open(io.BytesIO(audio), "rb") as w:
    secs = w.getnframes() / float(w.getframerate())
rtf = round(spent / secs, 2) if secs else None
json.dump({"rtf": rtf, "seconds_of_speech": round(secs, 2), "seconds_spent": round(spent, 2),
           "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}, open(out, "w"))
print("  measured: %.1f s of speech in %.1f s (rtf %s; under 1.0 keeps ahead of the reader)" % (secs, spent, rtf))
PYEOF
    echo "$CODE_SHA" > "$HOME_DIR/.measured.sha"
  fi
fi
echo "== voice-clone install: done (the /voice forwarder hands My voice here when the tower is dark) =="
