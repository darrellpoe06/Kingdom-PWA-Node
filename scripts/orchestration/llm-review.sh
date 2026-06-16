#!/usr/bin/env bash
# =============================================================================
# llm-review.sh - sovereign, tiered, ADVISORY local-LLM code review (wrapper).
# =============================================================================
# "Have the local LLMs review the app for bugs or fixes." (Darrell, 2026-06-16.)
#
# This is the ergonomic entry point the orchestrator / a dev runs. The actual
# engine is llm-review.mjs (node ESM: clean fetch to Ollama + JSON handling,
# unit-tested pure helpers). This wrapper just locates node and runs it, passing
# every argument straight through.
#
# WHAT IT IS: a second pair of eyes on the CHANGED code only - qwen2.5 on the NAS
# reads the diff of a branch and FLAGS likely bugs / regressions / security
# concerns (file:line + concern + suggested fix). ADVISORY: it never edits,
# commits, or pushes code, and it does NOT replace the test suite. Deterministic
# CI (lint + the full vitest suite, in GitHub Actions) stays the merge gate.
#
# TIERING (sovereign-first; the Charter): Tier 1 = deterministic CI (elsewhere);
# Tier 2 = LOCAL qwen2.5 on the NAS (default); Tier 3 = VENDOR escalation, ONLY
# when the diff is too large/deep AND explicitly armed (--allow-vendor +
# ANTHROPIC_API_KEY), bounded by the Charter budget, clearly labeled.
#
# Runs on the NAS or any dev box with node + git. It is NON-INTERACTIVE and never
# shells out to a prompt-blocking CLI (gh/vercel), so it is safe in an unattended
# lane (pairs with no-interactive-cli-guard.mjs).
#
# Usage:
#   scripts/orchestration/llm-review.sh                 # review HEAD vs origin/main
#   scripts/orchestration/llm-review.sh --base origin/main --head my-branch
#   scripts/orchestration/llm-review.sh --json-only --out /data/poetech-briefing/_llm_review.json
#   scripts/orchestration/llm-review.sh --allow-vendor --deep   # escalate (paid, bounded)
#   scripts/orchestration/llm-review.sh --help
#
# On the NAS, Ollama is local: pass --ollama http://localhost:11434 (or set
# OLLAMA_BASE). The default targets the NAS host 192.168.1.26:11434.
# =============================================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ENGINE="$ROOT/scripts/orchestration/llm-review.mjs"

if [ ! -f "$ENGINE" ]; then
  echo "llm-review: engine not found at $ENGINE" >&2
  exit 1
fi

# Find a node runtime. The engine uses global fetch (node >= 18).
NODE_BIN=""
for cand in node nodejs; do
  if command -v "$cand" >/dev/null 2>&1; then NODE_BIN="$cand"; break; fi
done
if [ -z "$NODE_BIN" ]; then
  echo "llm-review: node (>=18) is required but was not found on PATH." >&2
  echo "  Install Node, or on the Synology NAS run it inside the node container." >&2
  exit 1
fi

exec "$NODE_BIN" "$ENGINE" "$@"
