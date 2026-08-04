#!/usr/bin/env bash
# =============================================================================
# health-check.sh — the first DETERMINISTIC loop (no LLM, no vendor).
# =============================================================================
# The proof loop the research-review recommends migrating first (wf20 class):
# bounded, deterministic, and the "is the system up" probe. It checks each target
# in HEALTH_TARGETS, prints a one-line summary on stdout (the runner captures it to
# the event reel), and exits 0 only when EVERY target is healthy. Any failure ->
# non-zero exit -> the runner records loop_fail + ntfy alert.
#
# This loop NEVER calls an LLM and makes NO new decisions — it only observes. That
# is exactly why it keeps running headless regardless of whether Claude/Dispatch is
# online: routine deterministic work does not wait on the vendor AI.
#
# Brakes are enforced by the runner (run.mjs), NOT here: the wall-clock timeout,
# the per-day call cap, the single-flight lock, the kill-switch, and LOOPS_ARMED
# all gate this script's invocation. This file only does the probing.
#
# Config (env, with safe defaults; override in infra/nas-loops/.env):
#   HEALTH_TARGETS  space- or comma-separated "name=url" pairs to GET.
#                   Default probes the kept n8n webhook surface + Ollama locally.
#   HEALTH_TIMEOUT  per-target curl timeout in seconds (default 8).
# =============================================================================
set -uo pipefail

# Default targets grew 2026-08-03 (DR-0268 follow-through): the sovereign photo
# server locally AND the Funnel hop as the NAS sees it — the 22:11/22:56 double-
# 525 outage was invisible to every NAS-side instrument because nothing here
# probed the funnel. photo-local vs funnel distinguishes "service down" from
# "funnel down" in one reel line. (An .env HEALTH_TARGETS override still wins.)
TARGETS_RAW="${HEALTH_TARGETS:-n8n=http://127.0.0.1:5678/healthz ollama=http://127.0.0.1:11434/api/version photo-local=http://127.0.0.1:8099/healthz funnel=https://poetech.tail5a2f35.ts.net/nas-photos/healthz}"
CURL_TIMEOUT="${HEALTH_TIMEOUT:-8}"

# Normalize commas to spaces so either separator works.
TARGETS_RAW="${TARGETS_RAW//,/ }"

if ! command -v curl >/dev/null 2>&1; then
  echo "health-check: REFUSED -- curl not found on PATH"
  exit 2
fi

total=0
healthy=0
report=""

for pair in $TARGETS_RAW; do
  name="${pair%%=*}"
  url="${pair#*=}"
  [ -z "$name" ] && continue
  [ "$name" = "$url" ] && { name="target$total"; }   # no '=' present; treat whole token as url
  total=$((total + 1))

  # -s silent, -S show error, -o /dev/null discard body, -m timeout, -w write the HTTP code.
  code="$(curl -s -S -o /dev/null -m "$CURL_TIMEOUT" -w '%{http_code}' "$url" 2>/dev/null || echo 000)"
  if [ "$code" -ge 200 ] 2>/dev/null && [ "$code" -lt 400 ] 2>/dev/null; then
    healthy=$((healthy + 1))
    report="$report ${name}:${code}"
  else
    report="$report ${name}:DOWN(${code})"
  fi
done

if [ "$total" -eq 0 ]; then
  echo "health-check: no targets configured"
  exit 2
fi

summary="health-check ${healthy}/${total} healthy:${report}"
echo "$summary"

if [ "$healthy" -eq "$total" ]; then
  exit 0
fi
exit 1
