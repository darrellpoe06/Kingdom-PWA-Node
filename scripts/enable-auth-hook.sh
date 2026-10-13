#!/usr/bin/env bash
# =============================================================================
# enable-auth-hook.sh — turn ON the renter-portal custom access token hook
# =============================================================================
# Darrell 2026-07-28: "Enable the Supabase auth hook now." The hook FUNCTION is
# applied (migration 0123) but GoTrue must be told to CALL it. That toggle lives
# in Supabase Auth config, reachable only via the dashboard OR the Management
# API. This is the API path so enabling is a workflow, not a click
# (AI-FOUNDATION-INTERNAL-OPERATIONS): "anything that is a click today should be
# an API call tomorrow, called from a workflow."
#
# NEEDS (the one value only Darrell holds): SUPABASE_ACCESS_TOKEN — a Supabase
# Management API personal access token (Account -> Access Tokens). Everything
# else (the project ref) is derived from the existing SUPABASE_URL secret.
#
# SAFE: the hook function is EXCEPTION-wrapped and can never block a login
# (schema-v2.10 / 0123). This only flips the "call it" switch; it VERIFIES the
# switch is on afterward (DR-0076 — prove it, do not assume) and exits non-zero
# if the API did not confirm. Idempotent: re-running when already on is a no-op.
# ASCII-only; no secrets are echoed.
# =============================================================================
set -euo pipefail

TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
REF="${SUPABASE_PROJECT_REF:-}"
HOOK_URI="pg-functions://postgres/public/custom_access_token_hook"
API="https://api.supabase.com/v1"

if [ -z "$TOKEN" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN is not set (a Supabase Management API token)." >&2
  echo "Mint one at https://supabase.com/dashboard/account/tokens and add it as the" >&2
  echo "repo secret SUPABASE_ACCESS_TOKEN, then dispatch this workflow again." >&2
  exit 3
fi

# Derive the project ref from https://<ref>.supabase.co when not given explicitly.
if [ -z "$REF" ]; then
  if [ -z "$URL" ]; then
    echo "ERROR: neither SUPABASE_PROJECT_REF nor SUPABASE_URL/VITE_SUPABASE_URL is set." >&2
    exit 3
  fi
  REF="$(printf '%s' "$URL" | sed -E 's#https?://([^.]+)\.supabase\.co/?.*#\1#')"
fi
if [ -z "$REF" ] || printf '%s' "$REF" | grep -q '://'; then
  echo "ERROR: could not derive a project ref from SUPABASE_URL='$URL'." >&2
  exit 3
fi

echo "Enabling custom access token hook on project: $REF"

# PATCH the auth config: enable the hook + point it at our function.
patch_status="$(curl -sS -o /tmp/auth_patch.json -w '%{http_code}' \
  -X PATCH "$API/projects/$REF/config/auth" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"hook_custom_access_token_enabled\":true,\"hook_custom_access_token_uri\":\"$HOOK_URI\"}")"

if [ "$patch_status" != "200" ]; then
  echo "ERROR: PATCH returned HTTP $patch_status" >&2
  sed -E 's/("[^"]*token[^"]*":)"[^"]*"/\1"[redacted]"/gI' /tmp/auth_patch.json >&2 || true
  exit 1
fi

# VERIFY (DR-0076): read it back and confirm the switch is actually on.
verify_status="$(curl -sS -o /tmp/auth_get.json -w '%{http_code}' \
  -X GET "$API/projects/$REF/config/auth" \
  -H "Authorization: Bearer $TOKEN")"

if [ "$verify_status" != "200" ]; then
  echo "ERROR: verify GET returned HTTP $verify_status" >&2
  exit 1
fi

enabled="$(grep -oE '"hook_custom_access_token_enabled"[[:space:]]*:[[:space:]]*(true|false)' /tmp/auth_get.json | grep -oE '(true|false)' | head -1)"
uri="$(grep -oE '"hook_custom_access_token_uri"[[:space:]]*:[[:space:]]*"[^"]*"' /tmp/auth_get.json | sed -E 's/.*:"([^"]*)"/\1/' | head -1)"

echo "Verified: hook_custom_access_token_enabled=$enabled  uri=$uri"

if [ "$enabled" != "true" ]; then
  echo "ERROR: the API did not confirm the hook is enabled." >&2
  exit 1
fi

echo "OK: renter-portal auth hook is ENABLED and verified."
