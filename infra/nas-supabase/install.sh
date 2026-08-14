#!/bin/sh
# =============================================================================
# nas-supabase/install.sh -- stand up the sovereign Supabase stack, idempotently
# =============================================================================
# Darrell 2026-08-14: "I'm not paying them... other options!!!!!!!?" then
# "start the NAS supabase stack."
#
# Runs on the services-sync clock (infra/nas-loops/services.json), the same lane
# that already installs mcp / scribe / property-photos / ytzero. Merge to main
# -> the mirror pulls -> this runs. That is the DR-0108 answer to "who does
# this": the channel does, not Darrell.
#
# IDEMPOTENT BY CONSTRUCTION -- this runs every cycle, forever:
#   * secrets are minted ONCE and never re-minted (mint_keys.py refuses to
#     overwrite; re-minting JWT_SECRET signs out every user at once)
#   * `docker compose up -d` is a no-op when the stack already matches
#   * every mkdir is -p
#
# NOTHING POINTS AT THIS YET, ON PURPOSE. Standing it up proves it works and
# costs nothing; the cutover (VITE_SUPABASE_URL + anon key) is a separate,
# deliberate step. A half-proven stack must never be able to take the family's
# app down -- which is exactly the failure we are digging out of.
#
# MEASURED CONSTRAINTS (nas-health run 31817289739, 2026-08-14):
#   * dpoe is DENIED the docker socket unprivileged; `sudo -n docker` works.
#   * python3 is 3.8.15 and root cannot import dpoe's site-packages -- so the
#     key minter is stdlib-only. An installer needing pip fails on this box.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-supabase"
DATA="${SUPABASE_DATA:-/volume1/docker/supabase}"
ENV_FILE="$DATA/.env"

DOCKER="docker"
if ! docker ps >/dev/null 2>&1; then
  if sudo -n docker ps >/dev/null 2>&1; then
    DOCKER="sudo -n docker"
  else
    echo "nas-supabase: docker unreachable (neither direct nor sudo -n) - cannot install" >&2
    exit 1
  fi
fi

echo "nas-supabase: data dir $DATA"
mkdir -p "$DATA/db" "$DATA/storage"

# --- secrets: minted once, kept forever ------------------------------------
# The refusal-to-overwrite lives in mint_keys.py so this stays a plain call.
python3 "$SRC/mint_keys.py" --out "$ENV_FILE"
chmod 600 "$ENV_FILE" 2>/dev/null || true

# --- non-secret settings: safe to re-assert every cycle ---------------------
# Kept OUT of the minted file so a URL change never risks touching a key.
# SUPABASE_PUBLIC_URL is loopback until the Caddy route is proven; the cutover
# step is what points the app at a real origin.
set_kv() {
  key="$1"; val="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    return 0   # never clobber an operator's edit
  fi
  printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
}
set_kv SUPABASE_PUBLIC_URL "http://127.0.0.1:8800"
set_kv SITE_URL            "https://poetech.us"
set_kv ADDITIONAL_REDIRECT_URLS "https://poetech.us,https://poetech.us/poetech-app/"
set_kv DASHBOARD_USERNAME  "poetech"
# SMTP unset => email sign-in disabled, stack still healthy. This is the ONE
# dependency self-hosting does not remove (magic links must leave the building),
# and it must never block the standup.
set_kv SMTP_HOST ""
set_kv SMTP_PORT "587"
set_kv SMTP_USER ""
set_kv SMTP_PASS ""
set_kv SMTP_ADMIN_EMAIL "darrellpoe06@gmail.com"
set_kv MAILER_AUTOCONFIRM "true"

# --- bring it up ------------------------------------------------------------
cd "$SRC"
COMPOSE="$DOCKER compose"
if ! $DOCKER compose version >/dev/null 2>&1; then
  COMPOSE="$DOCKER-compose"
fi

echo "nas-supabase: docker compose up -d (no-op when already current)"
# --env-file keeps the secrets OUT of the repo tree; the compose file itself is
# committed and carries no values.
$COMPOSE --env-file "$ENV_FILE" up -d --remove-orphans

# --- prove it, do not claim it (DR-0076) ------------------------------------
# A green installer that never checked the stack answers is the theater this
# repo keeps catching. Poll the front door; report loudly either way.
echo "nas-supabase: waiting for the gateway to answer..."
i=0
ok=0
while [ $i -lt 30 ]; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:8800/auth/v1/health 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then ok=1; break; fi
  i=$((i + 1))
  sleep 5
done

$COMPOSE --env-file "$ENV_FILE" ps

if [ "$ok" = "1" ]; then
  echo "nas-supabase: OK - auth answers 200 on 127.0.0.1:8800 (loopback only; nothing points at it yet)"
  exit 0
fi
echo "nas-supabase: FAILED - the gateway did not answer 200 within 150s. Stack state above." >&2
exit 1
