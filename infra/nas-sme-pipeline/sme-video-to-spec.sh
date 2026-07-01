#!/bin/bash
#
# sme-video-to-spec.sh -- SOVEREIGN, LOCAL pipeline on the NAS.
#
#   SME video/audio  ->  faster-whisper transcript  ->  local LLM  ->  build spec
#
# Everything runs on this box. Nothing leaves the NAS. The transcription model
# runs in an isolated, on-demand container; the LLM step uses the existing local
# Ollama. No running service is reconfigured.
#
# BEHIND THE BRAKES: this is MANUAL-RUN ONLY. There is no cron, no watcher, no
# autonomous trigger. A human runs it on demand. (Honors the three-brakes rule:
# no timer-driven automation without budget + lock + kill-switch.)
#
# Usage:
#   ./sme-video-to-spec.sh <path-to-video-or-audio> [output-name]
#
# Examples:
#   ./sme-video-to-spec.sh ./input/raybans-2026-06-23.mp4
#   ./sme-video-to-spec.sh /volume1/PoeTech/sme-pipeline/input/clip.mov church-checkin-flow
#
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PIPE_DIR="${SME_PIPE_DIR:-$HERE}"
MODELS_DIR="$PIPE_DIR/models"
OUTPUT_ROOT="$PIPE_DIR/output"
PROMPT_FILE="$PIPE_DIR/buildspec-prompt.md"

IMAGE="${SME_WHISPER_IMAGE:-poetech/sme-whisper:cpu}"
DOCKER="${DOCKER_BIN:-/usr/local/bin/docker}"

OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:14b-instruct-q4_K_M}"
OLLAMA_NUM_CTX="${OLLAMA_NUM_CTX:-8192}"

WHISPER_MODEL="${WHISPER_MODEL:-large-v3-turbo}"
WHISPER_COMPUTE="${WHISPER_COMPUTE:-int8}"

die() { echo "ERROR: $*" >&2; exit 1; }

[ $# -ge 1 ] || die "usage: $0 <video-or-audio> [output-name]"
INPUT="$1"
[ -f "$INPUT" ] || die "input not found: $INPUT"

INPUT_ABS="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"
INPUT_DIR="$(dirname "$INPUT_ABS")"
INPUT_BASE="$(basename "$INPUT_ABS")"

NAME="${2:-${INPUT_BASE%.*}}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$OUTPUT_ROOT/${NAME}-${STAMP}"
mkdir -p "$OUT_DIR" "$MODELS_DIR"

[ -f "$PROMPT_FILE" ] || die "prompt file missing: $PROMPT_FILE"
command -v jq >/dev/null   || die "jq not found on host"
command -v curl >/dev/null || die "curl not found on host"

echo "=== SME video -> build spec (sovereign, local) ==="
echo "input : $INPUT_ABS"
echo "output: $OUT_DIR"
echo "models: $MODELS_DIR (cached across runs)"
echo "llm   : $OLLAMA_MODEL @ $OLLAMA_URL"
echo

# --- Step 1: transcribe (isolated container, CPU / INT8) -------------------
echo "[1/2] Transcribing with faster-whisper ($WHISPER_MODEL / $WHISPER_COMPUTE, CPU-only)..."
echo "      CPU is slow: budget roughly 1-3x the media length (a 10-min clip ~ 10-30 min)."
echo "      First run also downloads the model (~1.6GB, one time). Batch long jobs overnight."
T1="$(date +%s)"
sudo "$DOCKER" run --rm \
  -v "$INPUT_DIR":/work/in:ro \
  -v "$OUT_DIR":/work/out \
  -v "$MODELS_DIR":/models \
  "$IMAGE" \
  "/work/in/$INPUT_BASE" /work/out "$WHISPER_MODEL" "$WHISPER_COMPUTE"
T2="$(date +%s)"

TRANSCRIPT="$OUT_DIR/transcript.txt"
if [ ! -s "$TRANSCRIPT" ]; then
  echo "WARN: transcript is empty (no speech detected?). Continuing to the LLM step anyway."
fi
echo "      transcribe wall: $((T2 - T1))s"
echo

# --- Step 2: build-spec extraction (local Ollama) --------------------------
echo "[2/2] Extracting BUILD SPEC with local Ollama ($OLLAMA_MODEL)..."
PROMPT_HEADER="$(cat "$PROMPT_FILE")"
TRANSCRIPT_TEXT="$(cat "$TRANSCRIPT" 2>/dev/null || true)"

FULL_PROMPT="$PROMPT_HEADER

=== TRANSCRIPT START ===
$TRANSCRIPT_TEXT
=== TRANSCRIPT END ==="

# jq builds the request body so the transcript is JSON-escaped safely.
REQ="$(jq -n \
  --arg m "$OLLAMA_MODEL" \
  --arg p "$FULL_PROMPT" \
  --argjson ctx "$OLLAMA_NUM_CTX" \
  '{model:$m, prompt:$p, stream:false, options:{temperature:0.2, num_ctx:$ctx}}')"

SPEC="$OUT_DIR/spec.md"
T3="$(date +%s)"
curl -sS --fail "$OLLAMA_URL/api/generate" -d "$REQ" \
  | jq -r '.response' > "$SPEC" || die "Ollama request failed"
T4="$(date +%s)"
[ -s "$SPEC" ] || die "build spec came back empty"
echo "      LLM wall: $((T4 - T3))s"
echo

echo "=== DONE ==="
echo "transcript : $TRANSCRIPT"
echo "transcript : $OUT_DIR/transcript.json (timestamps + metadata)"
echo "build spec : $SPEC"
echo
echo "Pull $SPEC into the build process."
