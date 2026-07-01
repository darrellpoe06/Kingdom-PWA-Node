#!/bin/bash
#
# choir-keyboardist-to-knowledge.sh -- SOVEREIGN, LOCAL choir SME pipeline.
#
#   Christian's choir video  ->  faster-whisper transcript  ->  local LLM  ->
#       knowledge.md   (human-readable choir knowledge, for review)
#       knowledge.json (per-song: key_label / arrangement / note -> choir_song_ideas)
#       source.json    (consent + provenance: who, scope, attestation)
#
# This is the CHOIR-SCOPED variant of sme-video-to-spec.sh. Same isolated whisper
# container, same local Ollama (qwen2.5:14b) -- a choir-knowledge prompt instead of
# the build-spec prompt, and a structured JSON pass that maps onto the Song Workshop.
#
# SME: Christian, COLG choir keyboardist (consented -- see intake/.../CONSENT.md).
# Scope: owner/choir only. Faithful extraction (no invented musical detail).
#
# BEHIND THE BRAKES: MANUAL-RUN ONLY. No cron, no watcher, no autonomous trigger.
# A human runs it on demand and reviews the output before it touches the app.
#
# Usage:
#   ./choir-keyboardist-to-knowledge.sh <video-or-audio> [output-name]
#   ./choir-keyboardist-to-knowledge.sh ./intake/choir-keyboardist/way-maker.mp4
#
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PIPE_DIR="${SME_PIPE_DIR:-$HERE}"
MODELS_DIR="$PIPE_DIR/models"
OUTPUT_ROOT="$PIPE_DIR/output/choir-keyboardist"
MD_PROMPT="$PIPE_DIR/choir-knowledge-prompt.md"
JSON_PROMPT="$PIPE_DIR/choir-knowledge-json-prompt.md"

IMAGE="${SME_WHISPER_IMAGE:-poetech/sme-whisper:cpu}"
DOCKER="${DOCKER_BIN:-/usr/local/bin/docker}"

OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:14b-instruct-q4_K_M}"
OLLAMA_NUM_CTX="${OLLAMA_NUM_CTX:-8192}"

WHISPER_MODEL="${WHISPER_MODEL:-large-v3-turbo}"
WHISPER_COMPUTE="${WHISPER_COMPUTE:-int8}"

SME_NAME="${SME_NAME:-Christian}"
SME_ROLE="${SME_ROLE:-COLG choir keyboardist}"

die() { echo "ERROR: $*" >&2; exit 1; }

[ $# -ge 1 ] || die "usage: $0 <video-or-audio> [output-name]"
INPUT="$1"
[ -f "$INPUT" ] || die "input not found: $INPUT"
for f in "$MD_PROMPT" "$JSON_PROMPT"; do [ -f "$f" ] || die "prompt missing: $f"; done
command -v jq >/dev/null   || die "jq not found on host"
command -v curl >/dev/null || die "curl not found on host"

INPUT_ABS="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"
INPUT_DIR="$(dirname "$INPUT_ABS")"
INPUT_BASE="$(basename "$INPUT_ABS")"

NAME="${2:-${INPUT_BASE%.*}}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$OUTPUT_ROOT/${NAME}-${STAMP}"
mkdir -p "$OUT_DIR" "$MODELS_DIR"

echo "=== Choir keyboardist video -> choir knowledge (sovereign, local) ==="
echo "SME   : $SME_NAME ($SME_ROLE) -- consented, choir-scoped"
echo "input : $INPUT_ABS"
echo "output: $OUT_DIR"
echo "llm   : $OLLAMA_MODEL @ $OLLAMA_URL"
echo

# --- Step 1: transcribe (isolated container, CPU / INT8) -------------------
echo "[1/3] Transcribing with faster-whisper ($WHISPER_MODEL / $WHISPER_COMPUTE, CPU-only)..."
echo "      CPU is slow: budget ~1-3x the media length. Batch long jobs overnight."
T1="$(date +%s)"
sudo "$DOCKER" run --rm \
  -v "$INPUT_DIR":/work/in:ro \
  -v "$OUT_DIR":/work/out \
  -v "$MODELS_DIR":/models \
  "$IMAGE" \
  "/work/in/$INPUT_BASE" /work/out "$WHISPER_MODEL" "$WHISPER_COMPUTE"
T2="$(date +%s)"
TRANSCRIPT="$OUT_DIR/transcript.txt"
[ -s "$TRANSCRIPT" ] || echo "WARN: transcript empty (no speech detected?). Continuing."
echo "      transcribe wall: $((T2 - T1))s"
echo

TRANSCRIPT_TEXT="$(cat "$TRANSCRIPT" 2>/dev/null || true)"

# Helper: call Ollama. $1=prompt-header file, $2=output file, $3=format ("" or "json")
ollama_call() {
  local hdr_file="$1" out_file="$2" fmt="$3"
  local hdr full req
  hdr="$(cat "$hdr_file")"
  full="$hdr

=== TRANSCRIPT START ===
$TRANSCRIPT_TEXT
=== TRANSCRIPT END ==="
  if [ "$fmt" = "json" ]; then
    req="$(jq -n --arg m "$OLLAMA_MODEL" --arg p "$full" --argjson ctx "$OLLAMA_NUM_CTX" \
      '{model:$m, prompt:$p, stream:false, format:"json", options:{temperature:0.1, num_ctx:$ctx}}')"
    curl -sS --fail "$OLLAMA_URL/api/generate" -d "$req" | jq -r '.response' > "$out_file"
  else
    req="$(jq -n --arg m "$OLLAMA_MODEL" --arg p "$full" --argjson ctx "$OLLAMA_NUM_CTX" \
      '{model:$m, prompt:$p, stream:false, options:{temperature:0.2, num_ctx:$ctx}}')"
    curl -sS --fail "$OLLAMA_URL/api/generate" -d "$req" | jq -r '.response' > "$out_file"
  fi
}

# --- Step 2: human-readable choir knowledge -------------------------------
echo "[2/3] Extracting choir knowledge (knowledge.md) with $OLLAMA_MODEL..."
T3="$(date +%s)"
ollama_call "$MD_PROMPT" "$OUT_DIR/knowledge.md" "" || die "Ollama knowledge.md call failed"
T4="$(date +%s)"
[ -s "$OUT_DIR/knowledge.md" ] || die "knowledge.md came back empty"
echo "      knowledge.md wall: $((T4 - T3))s"
echo

# --- Step 3: structured JSON for the Song Workshop ------------------------
echo "[3/3] Extracting structured knowledge.json (per-song key/arrangement/note)..."
T5="$(date +%s)"
ollama_call "$JSON_PROMPT" "$OUT_DIR/knowledge.json" "json" || die "Ollama knowledge.json call failed"
T6="$(date +%s)"
# Validate it parsed as JSON; if not, keep the raw text but flag it.
if jq empty "$OUT_DIR/knowledge.json" 2>/dev/null; then
  echo "      knowledge.json: valid JSON ($((T6 - T5))s)"
else
  echo "      WARN: knowledge.json did not validate as JSON -- review it by hand ($((T6 - T5))s)"
fi
echo

# --- consent + provenance record ------------------------------------------
jq -n \
  --arg name "$SME_NAME" --arg role "$SME_ROLE" \
  --arg src "$INPUT_BASE" --arg stamp "$STAMP" --arg model "$OLLAMA_MODEL" \
  '{
     sme: { name:$name, role:$role },
     consent: { recorded:true, basis:"voluntary SME explainer videos for the COLG choir; Darrell-attested", scope:"owner/choir only" },
     extraction: { faithful:true, model:$model, whisper:"large-v3-turbo/int8" },
     source_file: $src,
     run_stamp: $stamp
   }' > "$OUT_DIR/source.json"

echo "=== DONE ==="
echo "transcript : $TRANSCRIPT"
echo "knowledge  : $OUT_DIR/knowledge.md   (review this first)"
echo "structured : $OUT_DIR/knowledge.json (per-song -> Choir Song Workshop)"
echo "provenance : $OUT_DIR/source.json"
echo
echo "Review knowledge.md, then enrich the matching songs in Choir > Song Workshop"
echo "(key / arrangement / note), or post as a sourced comment from Christian."
