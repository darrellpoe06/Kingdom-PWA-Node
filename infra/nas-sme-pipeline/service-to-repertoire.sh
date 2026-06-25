#!/bin/bash
#
# service-to-repertoire.sh -- SOVEREIGN, LOCAL choir-repertoire pipeline.
#
#   A service recording  ->  faster-whisper transcript  ->  local LLM  ->
#       repertoire.json  (the songs the choir ACTUALLY sang, with timestamps,
#                          confidence, and a source quote -- the EXACT contract
#                          the app's Songbook importer consumes)
#       source.json      (consent + provenance: channel, scope, attestation)
#
# WHY THIS EXISTS (the missing producer): the PoeTech app already CONSUMES a
# repertoire.json -- the Choir > Songbook "Source the repertoire" panel calls
# importRepertoireJson() (app/src/lib/choir-songbook-sync.js), and
# lib/choir-archive.js parseRepertoireJson() maps it field-for-field into the
# cross-referenced Songbook (choir_songs, migration 0042). But NOTHING produced
# that file. The choir's song identity is NOT in the YouTube titles or
# descriptions -- the @thelovecorner channel publishes full sermons / Bible
# studies with empty descriptions (verified 2026-06-25 against the channel RSS
# feed). The songs are sung DURING the services; their names live only in the
# AUDIO. So the only faithful source of the repertoire is transcription. This
# script is that transcription producer -- the sibling of sound-engineer-to-
# lessons.sh, pointed at the service recordings.
#
# FAITHFUL (Verification Doctrine): the LLM extracts only songs it can ANCHOR in
# the transcript (a sung line, an announced title). Anything it is unsure of goes
# in "unclear" and is NOT seeded; anything not HIGH confidence imports as
# needs_review=true and a steward confirms it in-app before it is trusted. We
# never guess a song into the repertoire.
#
# BEHIND THE BRAKES: MANUAL-RUN ONLY. No cron, no watcher, no autonomous trigger.
# A human runs it on demand and reviews repertoire.json before importing it.
# Importing is itself a reviewed, in-app director action (not autonomous).
#
# Usage:
#   ./service-to-repertoire.sh <video-or-audio> [output-name] [service-date] [service-type]
#   ./service-to-repertoire.sh ./intake/services/2026-05-10-sunday.mp4 5-10-svc 2026-05-10 sunday
#
# The service date / type are passed through to every extracted song so the
# Songbook records when each was sung (the LLM also tries to read a spoken date).
#
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PIPE_DIR="${SME_PIPE_DIR:-$HERE}"
MODELS_DIR="$PIPE_DIR/models"
OUTPUT_ROOT="$PIPE_DIR/output/repertoire"
JSON_PROMPT="$PIPE_DIR/repertoire-json-prompt.md"

IMAGE="${SME_WHISPER_IMAGE:-poetech/sme-whisper:cpu}"
DOCKER="${DOCKER_BIN:-/usr/local/bin/docker}"

OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:14b-instruct-q4_K_M}"
OLLAMA_NUM_CTX="${OLLAMA_NUM_CTX:-8192}"

WHISPER_MODEL="${WHISPER_MODEL:-large-v3-turbo}"
WHISPER_COMPUTE="${WHISPER_COMPUTE:-int8}"

CHANNEL="${CHOIR_CHANNEL:-@thelovecorner}"

die() { echo "ERROR: $*" >&2; exit 1; }

[ $# -ge 1 ] || die "usage: $0 <video-or-audio> [output-name] [service-date] [service-type]"
INPUT="$1"
[ -f "$INPUT" ] || die "input not found: $INPUT"
[ -f "$JSON_PROMPT" ] || die "prompt missing: $JSON_PROMPT"
command -v jq >/dev/null   || die "jq not found on host"
command -v curl >/dev/null || die "curl not found on host"

INPUT_ABS="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"
INPUT_DIR="$(dirname "$INPUT_ABS")"
INPUT_BASE="$(basename "$INPUT_ABS")"

NAME="${2:-${INPUT_BASE%.*}}"
SERVICE_DATE="${3:-}"
SERVICE_TYPE="${4:-sunday}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$OUTPUT_ROOT/${NAME}-${STAMP}"
mkdir -p "$OUT_DIR" "$MODELS_DIR"

echo "=== Service recording -> choir repertoire.json (sovereign, local) ==="
echo "source : the church archive ($CHANNEL) -- faithful audio extraction"
echo "input  : $INPUT_ABS"
echo "date   : ${SERVICE_DATE:-(none given; LLM will try to read a spoken date)} / $SERVICE_TYPE"
echo "output : $OUT_DIR"
echo "llm    : $OLLAMA_MODEL @ $OLLAMA_URL"
echo

# --- Step 1: transcribe (isolated container, CPU / INT8) -------------------
echo "[1/2] Transcribing with faster-whisper ($WHISPER_MODEL / $WHISPER_COMPUTE, CPU-only)..."
echo "      CPU is slow: budget ~1-3x the media length. Batch long services overnight."
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

# --- Step 2: structured repertoire.json (the app import contract) ----------
echo "[2/2] Extracting repertoire.json (the songs actually sung) with $OLLAMA_MODEL..."
HDR="$(cat "$JSON_PROMPT")"
FULL="$HDR

KNOWN CONTEXT (use these unless the transcript clearly says otherwise):
- channel: $CHANNEL
- service_date: ${SERVICE_DATE:-unknown}
- service_type: $SERVICE_TYPE

=== TRANSCRIPT START ===
$TRANSCRIPT_TEXT
=== TRANSCRIPT END ==="
REQ="$(jq -n --arg m "$OLLAMA_MODEL" --arg p "$FULL" --argjson ctx "$OLLAMA_NUM_CTX" \
  '{model:$m, prompt:$p, stream:false, format:"json", options:{temperature:0.1, num_ctx:$ctx}}')"
T3="$(date +%s)"
curl -sS --fail "$OLLAMA_URL/api/generate" -d "$REQ" | jq -r '.response' > "$OUT_DIR/repertoire.json" \
  || die "Ollama repertoire.json call failed"
T4="$(date +%s)"

# Validate it parsed as JSON; if not, keep the raw text but flag it loudly.
if jq empty "$OUT_DIR/repertoire.json" 2>/dev/null; then
  COUNT="$(jq '.songs | length' "$OUT_DIR/repertoire.json" 2>/dev/null || echo '?')"
  echo "      repertoire.json: valid JSON, $COUNT song(s) ($((T4 - T3))s)"
else
  echo "      WARN: repertoire.json did not validate as JSON -- review it by hand ($((T4 - T3))s)"
fi
echo

# --- consent + provenance record ------------------------------------------
jq -n \
  --arg ch "$CHANNEL" --arg src "$INPUT_BASE" --arg stamp "$STAMP" \
  --arg model "$OLLAMA_MODEL" --arg date "$SERVICE_DATE" --arg type "$SERVICE_TYPE" \
  '{
     source: { channel:$ch, kind:"service-recording", service_date:$date, service_type:$type },
     consent: { recorded:true, basis:"the church publishes these services publicly; COLG-first, family-attested", scope:"owner/choir only" },
     extraction: { faithful:true, model:$model, whisper:"large-v3-turbo/int8", rule:"only songs anchored in the transcript; uncertain -> unclear, never seeded" },
     source_file: $src,
     run_stamp: $stamp
   }' > "$OUT_DIR/source.json"

echo "=== DONE ==="
echo "transcript : $TRANSCRIPT"
echo "repertoire : $OUT_DIR/repertoire.json   (REVIEW THIS, then import it in-app)"
echo "provenance : $OUT_DIR/source.json"
echo
echo "Next: open the PWA -> Church -> Choir -> Songbook -> 'Source the repertoire +"
echo "keyboardist knowledge' -> paste repertoire.json into 'Import repertoire.json'."
echo "Every seeded song lands flagged 'needs review' until a steward confirms it."
