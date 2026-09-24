#!/bin/sh
# install.sh -- idempotent, self-running installer for the NAS's own REAL-AUDIO
# reading voice (Piper on CPU), the /voice-lite road (DR-0627, the reader's
# background playback; the /taxes + /voice pattern).
#
# WHAT THIS CLOSES. Darrell 2026-09-24, Android phone, lesson reading: "Why
# doesn't the player remain playing in the background when I switch between
# apps?!!? Fix it." With the GPU studio dark, the reader fell back to the
# phone's Web Speech engine, which Android stops when the app leaves the
# screen. A real audio clip keeps playing like music. This puts a voice that is
# always AUDIO on the NAS itself, so the reader has one even when the GPU is off.
#
# PROVE, NEVER ASSUME (DR-0076). Nothing is mounted on the Funnel until:
#   1. the piper binary runs on THIS box (glibc / arch are real risks),
#   2. it synthesizes a real sentence into a non-empty WAV here,
#   3. the server answers /health 200 on 127.0.0.1.
# A cycle that fails any step says which, mounts nothing, and exits 0 so
# services-sync keeps running; the next cycle tries again.
#
# Brakes: request-driven server (no timers); MAX_INFLIGHT / MAX_CHARS /
# SYNTH_TIMEOUT / cache cap live in voice_lite_server.py. This installer only
# downloads when a file is missing (~26 MB piper + ~2 x 63 MB voices, once).
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md (the /voice-lite row).
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-voice-lite"
HOME_DIR=/volume1/PoeTech/voice-lite
TOKEN_FILE=/volume1/PoeTech/secrets/chat-bridge-token.txt
UNIT=/etc/systemd/system/poetech-voice-lite.service
PORT=8772
PIPER_TAG=2023.11.14-2
VOICE_BASE=https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US

echo "== voice-lite install: token =="
if [ ! -s "$TOKEN_FILE" ]; then
  echo "  $TOKEN_FILE is missing -- the server refuses to start an unlocked door. Nothing done."
  exit 0
fi
command -v curl >/dev/null 2>&1 || { echo "  curl missing -- cannot download or verify; nothing done"; exit 0; }

mkdir -p "$HOME_DIR/voices" "$HOME_DIR/cache"

echo "== voice-lite install: piper binary =="
if [ ! -x "$HOME_DIR/piper/piper" ]; then
  case "$(uname -m)" in
    x86_64|amd64) ARCH=x86_64 ;;
    aarch64|arm64) ARCH=aarch64 ;;
    armv7l) ARCH=armv7l ;;
    *) echo "  unsupported CPU $(uname -m) -- nothing mounted"; exit 0 ;;
  esac
  TGZ="$HOME_DIR/piper_$ARCH.tar.gz"
  curl -fsSL -m 200 -o "$TGZ" "https://github.com/rhasspy/piper/releases/download/$PIPER_TAG/piper_linux_$ARCH.tar.gz" \
    || { echo "  download FAILED -- nothing mounted"; rm -f "$TGZ"; exit 0; }
  tar xzf "$TGZ" -C "$HOME_DIR" && rm -f "$TGZ"
  echo "  installed piper $PIPER_TAG ($ARCH)"
  # ONE large download per cycle, so this installer (registered LAST) can
  # never eat the services-sync cycle ceiling. The voices come next cycle.
  echo "  voices download on the next cycle -- nothing mounted yet"
  exit 0
else
  echo "  piper already installed"
fi

echo "== voice-lite install: voices (at most one large file per cycle) =="
BIG_DONE=0
for V in ryan amy; do
  NAME="en_US-$V-medium"
  for EXT in onnx.json onnx; do
    F="$HOME_DIR/voices/$NAME.$EXT"
    [ -s "$F" ] && continue
    if [ "$EXT" = "onnx" ] && [ "$BIG_DONE" = "1" ]; then
      echo "  $NAME.onnx waits for the next cycle"
      continue
    fi
    curl -fsSL -m 200 -o "$F.part" "$VOICE_BASE/$V/medium/$NAME.$EXT" \
      && mv "$F.part" "$F" && echo "  downloaded $NAME.$EXT" \
      || { rm -f "$F.part"; echo "  download of $NAME.$EXT FAILED (retried next cycle)"; }
    [ "$EXT" = "onnx" ] && BIG_DONE=1
  done
done
if [ ! -s "$HOME_DIR/voices/en_US-ryan-medium.onnx" ]; then
  echo "  the first voice is not on disk yet -- nothing mounted"
  exit 0
fi

echo "== voice-lite install: prove piper speaks on THIS box =="
PROBE_WAV="$HOME_DIR/cache/.install-probe.wav"
rm -f "$PROBE_WAV"
START=$(date +%s)
if echo "In the beginning was the Word." | "$HOME_DIR/piper/piper" --model "$HOME_DIR/voices/en_US-ryan-medium.onnx" --output_file "$PROBE_WAV" >/dev/null 2>&1 \
   && [ -s "$PROBE_WAV" ]; then
  echo "  piper synthesized $(wc -c < "$PROBE_WAV") bytes in $(( $(date +%s) - START ))s"
else
  echo "  piper did NOT produce audio on this box -- nothing mounted (check glibc / arch)"
  exit 0
fi

echo "== voice-lite install: systemd unit =="
PY="$(command -v python3 || true)"
[ -n "$PY" ] || { echo "  python3 not found -- nothing mounted"; exit 0; }
TMPU="$(mktemp)"
sed -e "s|@PYTHON@|$PY|" -e "s|@SRC@|$SRC|" -e "s|@HOME@|$HOME_DIR|" -e "s|@PORT@|$PORT|" \
    "$SRC/poetech-voice-lite.service" > "$TMPU"
NEED_RESTART=0
if [ ! -f "$UNIT" ] || ! cmp -s "$TMPU" "$UNIT"; then
  cp "$TMPU" "$UNIT"
  systemctl daemon-reload
  NEED_RESTART=1
  echo "  unit written"
fi
rm -f "$TMPU"
systemctl enable poetech-voice-lite >/dev/null 2>&1 || true
if [ "$NEED_RESTART" = "1" ]; then
  systemctl restart poetech-voice-lite
else
  systemctl is-active --quiet poetech-voice-lite || systemctl restart poetech-voice-lite || true
fi

echo "== voice-lite install: the server must answer before the Funnel points at it =="
sleep 2
HCODE="$(curl -s -m 8 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/health" 2>/dev/null || echo 000)"
echo "  http://127.0.0.1:$PORT/health -> $HCODE"
if [ "$HCODE" != "200" ]; then
  echo "  not answering 200 -- NOT mounting. See: journalctl -u poetech-voice-lite -n 50"
  exit 0
fi

echo "== voice-lite install: funnel path mount (guarded, additive, reversible) =="
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  printf '%s' "$FSTAT" | grep -q "/voice-lite" \
    && echo "  /voice-lite already mounted on the funnel" \
    || { $TSC funnel --bg --set-path /voice-lite "http://127.0.0.1:$PORT" \
         && echo "  mounted /voice-lite -> 127.0.0.1:$PORT on the PUBLIC funnel (additive)" \
         || echo "  mount FAILED -- by hand: sudo $TS funnel --bg --set-path /voice-lite http://127.0.0.1:$PORT"; }
else
  echo "  tailscale binary not found -- mount by hand:"
  echo "    sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /voice-lite http://127.0.0.1:$PORT"
fi
echo "== voice-lite install: done =="
