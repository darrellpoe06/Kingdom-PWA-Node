#!/bin/sh
# nas-update-wf27-wf31-keepalive.sh
# 2026-06-02: Apply the sovereign prompt-cache analog (Ollama keep_alive) to the
# two existing sovereign workflows that call Ollama with a stable system prefix.
#
# CONTEXT (see docs/00-foundations/_root/CLAUDE-PROMPT-CACHING-PATTERN.md Section 8):
#   The live directive was to wire Anthropic cache_control into wf27/wf30/wf31/wf32.
#   On reading those four, NONE has an Anthropic-calling node: wf27 and wf31 call
#   sovereign Ollama (http://ollama:11434); wf30 and wf32 call no LLM at all, and
#   wf30/31/32 carry family-private content the firewall keeps on the NAS. Adding
#   an Anthropic call to a family-voice workflow would be a firewall breach, not an
#   optimization. So cache_control is NOT added to any of them.
#   The correct, firewall-safe, $0 sovereign analog IS applied here: wf27 and wf31
#   now pass keep_alive: '30m' on their Ollama /api/generate body, keeping the 14B
#   model resident so repeated calls reuse the warm context instead of cold-loading.
#
# This script re-imports wf27 and wf31 with the keep_alive change. It resolves each
# workflow's EXISTING n8n id by name (so it upserts, never duplicates) and preserves
# their active state as recorded in the repo JSON (active: false). It does NOT
# activate them - wf27 is "when fixed" and both stay inactive until separately enabled.
#
# This is an OPTIONAL, non-urgent apply: wf27/wf31 are not part of tonight's live
# surface. The keep_alive change is already in the repo; this script just lands it on
# the NAS now rather than at the workflows' next normal import.
#
# Run on the NAS host (NOT inside the container), from ConnectBot or any shell:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-update-wf27-wf31-keepalive.sh | sudo sh
#
# Idempotent: safe to re-run.

set -e

STAGE_DIR="/volume1/PoeTech/finance-events"
RAW_BASE="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/docs/00-foundations/n8n-workflows"

echo "==> Resolve docker binary..."
if [ -x /var/packages/ContainerManager/target/usr/bin/docker ]; then
  DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
elif [ -x /usr/local/bin/docker ]; then
  DOCKER="/usr/local/bin/docker"
else
  DOCKER="docker"
fi
echo "    docker = $DOCKER"

cd "$STAGE_DIR"

# apply_one <local-tmp> <raw-file> <name-substring-for-id-resolve>
apply_one() {
  TMP="$1"
  RAW_FILE="$2"
  NAME_GREP="$3"

  echo ""
  echo "==> Workflow matching: $NAME_GREP"

  # Resolve the existing n8n id by name (n8n list:workflow prints id|name per line).
  WID=$("$DOCKER" exec n8n n8n list:workflow 2>/dev/null | awk -F'|' -v n="$NAME_GREP" 'index($2, n) > 0 { gsub(/[[:space:]]/, "", $1); print $1; exit }')

  if [ -z "$WID" ]; then
    echo "    NOTE: no existing workflow found matching \"$NAME_GREP\"."
    echo "    Skipping to avoid creating a duplicate. The keep_alive change is in the"
    echo "    repo and will apply when this workflow is next imported normally."
    return 0
  fi
  echo "    Found existing id: $WID"

  wget -qO "$TMP" "$RAW_BASE/$RAW_FILE"
  # Inject the existing id so import upserts the same record (no duplicate).
  sed -i "s|^{|{\"id\": \"$WID\", |" "$TMP"
  chown 1000:1000 "$TMP"
  chmod 644 "$TMP"
  "$DOCKER" exec n8n n8n import:workflow --input="/data/finance-events/$TMP"
  echo "    Imported (upsert on id $WID). Active state preserved from repo JSON (inactive)."
}

apply_one "_c27.json" "27-foundation-agent.json" "Foundation Agent"
apply_one "_c31.json" "31-daily-standup-digest.json" "Daily standup digest"

echo ""
echo "==> Restart n8n so the Code-node bodies re-register..."
"$DOCKER" restart n8n
sleep 25

echo ""
echo "==> DONE."
echo "    wf27 + wf31 now carry keep_alive: '30m' on their Ollama calls."
echo "    They remain INACTIVE (unchanged); activate separately when ready."
echo "    No Anthropic call was added to any family-voice workflow - the firewall holds."
