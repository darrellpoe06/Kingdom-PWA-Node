#!/usr/bin/env bash
# key-shape.sh -- the tower probe's own diagnosis of a refused tailnet key.
# Scoped to learn-imagegen-tower.yml on purpose: the shared join action that
# 64 workflows use is NOT changed (owner, 2026-11-24).
#
# NO CHARACTER OF THE SECRET IS EVER PRINTED. It prints only facts derived from
# the value: a kind label chosen by this script (from Tailscale's public prefix
# format), the length, whether whitespace/newlines/quotes are present, and the
# dash-separated part count. Never a substring, never a key id, never a hash.
#
#   key-shape.sh shape     env K = the secret; GH_TOKEN / LANE = tokens to ask
#                          GitHub when the secret was last saved (metadata only;
#                          GitHub's API never returns a secret's value)
#   key-shape.sh tailnet   after a successful join: which tailnet the key opened
set -uo pipefail
EXPECT_SUFFIX='tail5a2f35.ts.net'

shape() {
  local K="${K:-}"
  if [ -z "$K" ]; then echo "TS_AUTHKEY: EMPTY (the secret is not set for this run)"; return; fi
  local T ws=no qt=no kind parts
  T=$(printf '%s' "$K" | tr -d '[:space:]')
  [ "$T" != "$K" ] && ws=yes
  case "$T" in *\"* | *\'*) qt=yes ;; esac
  case "$T" in
    tskey-auth-*) kind='auth key (the right kind)' ;;
    tskey-api-*) kind='API ACCESS TOKEN (wrong kind: joining needs an auth key)' ;;
    tskey-client-*) kind='OAuth client secret (wrong kind for an auth key)' ;;
    tskey-*) kind='another Tailscale key kind (not an auth key)' ;;
    *) kind='no Tailscale key prefix (not a key, or clipped at the start)' ;;
  esac
  parts=$(printf '%s' "$T" | awk -F- '{print NF}')
  echo "TS_AUTHKEY shape: kind=${kind}; length=${#K}; whitespace/newline=${ws}; quotes=${qt}; dash-parts=${parts} (an auth key has 4)"

  echo "This job started at $(date -u +%Y-%m-%dT%H:%M:%SZ); GitHub hands a job the secret's value as of its start."
  local url="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/secrets/TS_AUTHKEY" name tok code
  for name in GH_TOKEN LANE; do
    tok="${!name:-}"
    [ -z "$tok" ] && { echo "secret saved-at via ${name}: no token"; continue; }
    code=$(curl -sS -o /tmp/secret-meta.json -w '%{http_code}' --max-time 20 \
      -H "Authorization: Bearer ${tok}" -H 'Accept: application/vnd.github+json' "$url" || echo 000)
    if [ "$code" = 200 ]; then
      echo "secret saved-at via ${name}: updated_at=$(jq -r .updated_at /tmp/secret-meta.json) created_at=$(jq -r .created_at /tmp/secret-meta.json)"
      rm -f /tmp/secret-meta.json
      return
    fi
    echo "secret saved-at via ${name}: HTTP ${code} (this token may not read secret metadata)"
  done
  rm -f /tmp/secret-meta.json
  echo "secret saved-at: not readable from a runner; Settings > Secrets and variables > Actions shows it beside TS_AUTHKEY"
}

tailnet() {
  local suffix
  suffix=$(tailscale status --json 2>/dev/null | jq -r '.MagicDNSSuffix // empty')
  if [ "$suffix" = "$EXPECT_SUFFIX" ]; then
    echo "Tailnet: the key opened the church tailnet (${suffix})."
  else
    echo "::error::Tailnet: the key opened '${suffix:-unknown}', not ${EXPECT_SUFFIX}: it was minted in a different Tailscale account."
    exit 1
  fi
}

case "${1:-shape}" in
  shape) shape ;;
  tailnet) tailnet ;;
  *) echo "usage: key-shape.sh shape|tailnet" >&2; exit 2 ;;
esac
