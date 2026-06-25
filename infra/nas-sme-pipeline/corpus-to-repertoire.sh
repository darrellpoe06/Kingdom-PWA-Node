#!/bin/bash
#
# corpus-to-repertoire.sh -- HISTORICAL choir-repertoire sweep over the services
# we ALREADY have. One source, two harvests (Darrell 2026-06-25): the same service
# recordings that gave us the sermons carry the choir songs. So we do NOT pull a
# new video list -- we drive off the EXISTING corpus (choir_sermons) and harvest
# the songs sung in each, reusing that service's video id + date. Each harvested
# song is attributed in-app to the real service it came from (a rendition).
#
#   services-manifest (from choir_sermons)  ──▶  for each service:
#       service-to-repertoire.sh <audio> <video_id> <date> <type>  ──▶ repertoire.json
#   merge all  ──▶  repertoire-historical.json  (import once in-app)
#                   scope.json  (swept / skipped-no-audio / total -- HONEST partial)
#
# REUSE, DON'T RE-FETCH: the manifest is the service list we already ingested; the
# audio is the NAS recording for each (matched by video id). We re-transcribe only
# the audio (song identity lives in it); we never re-discover the video list.
#
# BEHIND THE BRAKES: manual-run only, no cron. Review repertoire-historical.json
# before importing; import is a reviewed in-app director action.
#
# Manifest format (TSV, one service per line; export it from choir_sermons):
#   <video_id>\t<service_date YYYY-MM-DD>\t<service_type>\t<audio_path>
# Lines starting with # are ignored. A missing/empty audio_path = skipped (logged).
#
# Usage:
#   ./corpus-to-repertoire.sh ./services.tsv
#
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SINGLE="$HERE/service-to-repertoire.sh"
OUT_ROOT="${SME_PIPE_DIR:-$HERE}/output/repertoire-historical"

die() { echo "ERROR: $*" >&2; exit 1; }
[ $# -ge 1 ] || die "usage: $0 <services-manifest.tsv>"
MANIFEST="$1"
[ -f "$MANIFEST" ] || die "manifest not found: $MANIFEST"
[ -x "$SINGLE" ] || die "service-to-repertoire.sh not found/executable next to this script"
command -v jq >/dev/null || die "jq not found on host"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$OUT_ROOT/$STAMP"
mkdir -p "$OUT_DIR"
COMBINED="$OUT_DIR/repertoire-historical.json"
SCOPE="$OUT_DIR/scope.json"

echo "[]" > "$OUT_DIR/.songs.json"   # accumulator
TOTAL=0; SWEPT=0; SKIPPED=0
SKIPPED_LIST=""

while IFS=$'\t' read -r VIDEO_ID SERVICE_DATE SERVICE_TYPE AUDIO_PATH; do
  case "$VIDEO_ID" in ''|\#*) continue;; esac
  TOTAL=$((TOTAL + 1))
  SERVICE_TYPE="${SERVICE_TYPE:-sunday}"
  if [ -z "${AUDIO_PATH:-}" ] || [ ! -f "$AUDIO_PATH" ]; then
    echo "  SKIP $VIDEO_ID ($SERVICE_DATE): no audio at '${AUDIO_PATH:-<none>}'"
    SKIPPED=$((SKIPPED + 1)); SKIPPED_LIST="$SKIPPED_LIST $VIDEO_ID"
    continue
  fi
  echo "=== sweep $VIDEO_ID ($SERVICE_DATE / $SERVICE_TYPE) ==="
  if "$SINGLE" "$AUDIO_PATH" "$VIDEO_ID" "$SERVICE_DATE" "$SERVICE_TYPE"; then
    # Newest run dir for this name -> its repertoire.json; stamp every song with
    # the REAL service video id + url (so the in-app import links it to the
    # existing service -- reuse, don't re-fetch).
    REP="$(ls -dt "${SME_PIPE_DIR:-$HERE}/output/repertoire/${VIDEO_ID}-"* 2>/dev/null | head -1)/repertoire.json"
    if [ -f "$REP" ] && jq empty "$REP" 2>/dev/null; then
      jq --arg vid "$VIDEO_ID" --arg url "https://www.youtube.com/watch?v=$VIDEO_ID" \
        '[ (.songs // [])[] | .video_id = $vid | .youtube_url = (.youtube_url // $url) ]' "$REP" \
        > "$OUT_DIR/.one.json"
      jq -s '.[0] + .[1]' "$OUT_DIR/.songs.json" "$OUT_DIR/.one.json" > "$OUT_DIR/.merged.json"
      mv "$OUT_DIR/.merged.json" "$OUT_DIR/.songs.json"
      SWEPT=$((SWEPT + 1))
    else
      echo "  WARN $VIDEO_ID: no valid repertoire.json produced -- counting as skipped"
      SKIPPED=$((SKIPPED + 1)); SKIPPED_LIST="$SKIPPED_LIST $VIDEO_ID"
    fi
  else
    echo "  WARN $VIDEO_ID: extraction failed -- continuing"
    SKIPPED=$((SKIPPED + 1)); SKIPPED_LIST="$SKIPPED_LIST $VIDEO_ID"
  fi
done < "$MANIFEST"

# Combined import file (the app dedups by video_id + title on import; re-runnable).
jq -n --slurpfile songs "$OUT_DIR/.songs.json" \
  '{ source: { channel: "@thelovecorner", kind: "historical-sweep" }, songs: $songs[0], unclear: [] }' \
  > "$COMBINED"

jq -n --argjson total "$TOTAL" --argjson swept "$SWEPT" --argjson skipped "$SKIPPED" \
  --arg skippedList "$(echo "$SKIPPED_LIST" | tr ' ' '\n' | sed '/^$/d' | jq -R . | jq -s .)" \
  '{ total_services: $total, swept: $swept, skipped_no_audio_or_error: $skipped,
     partial: ($swept < $total), skipped_video_ids: ($skippedList | fromjson),
     note: "Honest scope: counts only services in the manifest. Skipped = no audio on hand or extraction failed; sweep those later and re-import (idempotent)." }' \
  > "$SCOPE"
rm -f "$OUT_DIR/.songs.json" "$OUT_DIR/.one.json"

echo
echo "=== DONE (HISTORICAL SWEEP) ==="
echo "repertoire : $COMBINED   (REVIEW, then import in-app: Songbook -> Source the repertoire)"
echo "scope      : $SCOPE      (swept $SWEPT of $TOTAL; $SKIPPED skipped)"
[ "$SWEPT" -lt "$TOTAL" ] && echo "NOTE: partial sweep -- the in-app readout will show it as partial. Re-run for the rest; import is idempotent."
echo "song count : $(jq '.songs | length' "$COMBINED")"
