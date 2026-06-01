#!/usr/bin/env bash
# =====================================================================
# pull-deepseek-r1.sh
# Re-pull deepseek-r1:8b-llama-distill-q4_K_M into the Ollama container on
# the DS1621xs. The first attempt during the n8n install (2026-05-26) was
# killed mid-pull by an n8n restart. This script is paste-ready and runs
# on the Synology under bash via SSH.
#
# Sovereignty-First: this is an autonomy gate — without the secondary
# reasoning model in place, every workflow that wants chain-of-thought
# (POE change_request reasoner, depth answers, situational analysis) has
# to fall back to the primary model and lose accuracy. We close the gate
# before anything builds on top.
#
# Usage:
#   ssh dpoe@192.168.1.26 'bash -s' < infra/n8n/scripts/pull-deepseek-r1.sh
# Or pasted directly:
#   ssh dpoe@192.168.1.26
#   bash <(curl -sSL https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/infra/n8n/scripts/pull-deepseek-r1.sh)
# Or via the PowerShell wrapper:
#   .\infra\n8n\scripts\pull-deepseek-r1.ps1
# =====================================================================

set -u
set -o pipefail

MODEL="deepseek-r1:8b-llama-distill-q4_K_M"
CONTAINER="${OLLAMA_CONTAINER:-ollama}"
PULL_TIMEOUT_SEC="${PULL_TIMEOUT_SEC:-1800}"   # 30 minutes; q4_K_M ~5GB
TEST_PROMPT='Reply with the single word OK and nothing else.'

ts() { date '+%Y-%m-%d %H:%M:%S'; }
say() { printf '[%s] %s\n' "$(ts)" "$*"; }
fail() { printf '[%s] FAIL: %s\n' "$(ts)" "$*" >&2; exit 1; }

say "=== DeepSeek R1 Distill 8B pull ==="
say "model:     ${MODEL}"
say "container: ${CONTAINER}"
say "timeout:   ${PULL_TIMEOUT_SEC}s"

# -------------------------------------------------------------
# Pre-flight checks
# -------------------------------------------------------------
say "[1/5] pre-flight checks"

if ! command -v docker >/dev/null 2>&1; then
  fail "docker not on PATH; cannot reach the Ollama container"
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  say "Ollama container '${CONTAINER}' not running. Listing containers:"
  docker ps --format '{{.Names}}\t{{.Status}}' >&2 || true
  fail "Ollama container '${CONTAINER}' is not up. Start the n8n stack and retry."
fi

say "OK: container '${CONTAINER}' is running"

# -------------------------------------------------------------
# Check whether the model is already present
# -------------------------------------------------------------
say "[2/5] check if model is already present"
if docker exec "${CONTAINER}" ollama list 2>/dev/null | awk '{print $1}' | grep -qx "${MODEL}"; then
  say "model already present in Ollama; skipping pull"
  ALREADY_PRESENT=1
else
  ALREADY_PRESENT=0
fi

# -------------------------------------------------------------
# Pull (timeout-protected)
# -------------------------------------------------------------
if [[ "${ALREADY_PRESENT}" -eq 0 ]]; then
  say "[3/5] pulling ${MODEL} (timeout ${PULL_TIMEOUT_SEC}s)"
  # `timeout` rather than `pull --timeout` so we kill cleanly. Stream output
  # so we can see progress in real time.
  if ! timeout "${PULL_TIMEOUT_SEC}" docker exec "${CONTAINER}" ollama pull "${MODEL}"; then
    rc=$?
    if [[ $rc -eq 124 ]]; then
      fail "pull timed out after ${PULL_TIMEOUT_SEC}s — re-run with PULL_TIMEOUT_SEC=3600 or check disk space"
    fi
    fail "pull exited with code ${rc}"
  fi
  say "pull complete"
else
  say "[3/5] pull skipped (already present)"
fi

# -------------------------------------------------------------
# Verify the model now appears in `ollama list`
# -------------------------------------------------------------
say "[4/5] verify model is registered"
if ! docker exec "${CONTAINER}" ollama list 2>/dev/null | awk '{print $1}' | grep -qx "${MODEL}"; then
  say "ollama list output:"
  docker exec "${CONTAINER}" ollama list 2>&1 || true
  fail "model '${MODEL}' did not appear in 'ollama list' after pull"
fi
say "OK: model is registered"

# -------------------------------------------------------------
# Smoke-test a generation to confirm the model loads
# -------------------------------------------------------------
say "[5/5] smoke-test generation"
PAYLOAD=$(cat <<JSON
{"model":"${MODEL}","prompt":"${TEST_PROMPT}","stream":false,"options":{"num_predict":8}}
JSON
)

# Strip the chain-of-thought block DeepSeek-R1 emits between <think>…</think>
# so the success check sees the actual reply. The stripping pattern is the
# same one the n8n workflows use (see n8n-workflows/README.md §DeepSeek-R1).
RESPONSE_RAW=$(docker exec "${CONTAINER}" curl -s -X POST http://localhost:11434/api/generate -d "${PAYLOAD}" || true)
if [[ -z "${RESPONSE_RAW}" ]]; then
  fail "generation returned an empty response — model may not have loaded"
fi

# Extract .response from the Ollama JSON envelope. We don't want to require
# jq inside the container; use awk + sed as a fallback.
if command -v jq >/dev/null 2>&1; then
  REPLY=$(echo "${RESPONSE_RAW}" | jq -r '.response // empty')
else
  REPLY=$(echo "${RESPONSE_RAW}" | sed -n 's/.*"response":"\([^"]*\)".*/\1/p')
fi

# Strip <think>...</think> blocks
REPLY_CLEAN=$(echo "${REPLY}" | sed 's/<think>.*<\/think>//g' | tr -d '\n' | tr -d '\r' | xargs)

if [[ -z "${REPLY_CLEAN}" ]]; then
  say "WARNING: reply was empty after <think> strip. Raw response was:"
  echo "${RESPONSE_RAW}" >&2
  fail "model loaded but did not produce a usable reply"
fi

say "OK: model responded with: '${REPLY_CLEAN}'"
say ""
say "=== SUCCESS ==="
say "DeepSeek R1 Distill 8B is loaded and responding."
say "n8n workflows can now call \$env.OLLAMA_SECONDARY_MODEL for chain-of-thought."
exit 0
