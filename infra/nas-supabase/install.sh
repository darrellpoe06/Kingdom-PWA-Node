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
# Realtime encrypts its tenant secrets with AES-128 and requires DB_ENC_KEY to
# be EXACTLY 16 bytes. The first standup wired the 32-char VAULT_ENC_KEY into
# it and realtime crashed seeding with "Bad key size" (285 restarts, measured
# run 31870361908) -- upstream Supabase ships realtime its own 16-char key for
# this reason. No tenant was ever seeded, so minting the key now loses nothing.
if ! grep -q '^REALTIME_DB_ENC_KEY=' "$ENV_FILE" 2>/dev/null; then
  printf 'REALTIME_DB_ENC_KEY=%s\n' "$(python3 -c 'import secrets; print(secrets.token_hex(8))')" >> "$ENV_FILE"
fi

# --- render kong.yml with the REAL keys (before compose touches the mount) ---
# Kong 2.8 does NOT substitute env vars in a mounted declarative config -- the
# official Supabase compose templates kong.yml with an eval/echo entrypoint;
# this stack mounted the raw file, so key-auth held the LITERAL text
# '$SUPABASE_ANON_KEY' and rejected every real key. Measured 2026-08-20 on
# Darrell's first signed-in session: sign-in passed (the auth route carries no
# key-auth) and the FIRST data call answered kong's own "Invalid
# authentication credentials" (rpc/set_user_pin through /sb/rest/v1). The
# rendered file lives OUTSIDE the repo tree (644 so the non-root kong
# process can read it through the mount); the compose file mounts it.
ANONK=$(grep '^ANON_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2-)
SVCK=$(grep '^SERVICE_ROLE_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2-)
if [ -n "$ANONK" ] && [ -n "$SVCK" ]; then
  sed -e "s|\$SUPABASE_ANON_KEY|$ANONK|g" -e "s|\$SUPABASE_SERVICE_KEY|$SVCK|g" \
    "$SRC/kong.yml" > "$DATA/kong.yml"
  # 644, NOT 600: the kong process in the container is NOT root; a 0600
  # root-owned file behind the bind mount is unreadable inside and kong
  # crash-loops (measured 2026-08-20 17:06Z: every probe 502, container
  # 'Restarting'). Anon key is public-by-design; the service-key local-read
  # tradeoff is accepted to keep the gateway alive.
  chmod 644 "$DATA/kong.yml" 2>/dev/null || true
  echo "nas-supabase: kong.yml rendered with real keys -> $DATA/kong.yml"
else
  # Never ship the placeholder file into the mount: a kong that rejects every
  # key looks healthy from /auth (no key-auth there) and fails every data call.
  echo "nas-supabase: FATAL - ANON_KEY/SERVICE_ROLE_KEY missing from $ENV_FILE; kong.yml NOT rendered" >&2
  exit 1
fi

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

# kong.yml is a bind mount: compose cannot see content changes, and kong 2.8
# reads declarative config only at start. Track the RENDERED file's hash; a
# change (routes OR key rotation) restarts kong once, never in a loop.
KONG_HASH=$(md5sum "$DATA/kong.yml" 2>/dev/null | cut -d' ' -f1)
if [ -n "$KONG_HASH" ] && [ "$KONG_HASH" != "$(cat "$DATA/.kong.hash" 2>/dev/null)" ]; then
  echo "nas-supabase: kong.yml changed - restarting kong to load it"
  $DOCKER restart supabase-kong >/dev/null 2>&1 && printf '%s' "$KONG_HASH" > "$DATA/.kong.hash"
fi

# --- reconcile service-role passwords (every cycle; measured 2026-08-15) -----
# Run 31870361908 named the stack's whole disease in one line: "password
# authentication failed" for supabase_auth_admin (auth, 292 restarts),
# authenticator (rest, 292), and supabase_storage_admin (storage, 285). The
# image sets only supabase_admin's password from POSTGRES_PASSWORD at first
# init (meta healthy = the proof those credentials work), and the original
# 01-roles.sql never set the other three. ALTER ROLE is idempotent -- re-assert
# them every cycle over supabase_admin's verified credentials, so neither a
# bad first init nor a future rotation is ever stranded. The password value is
# never echoed; -v pw + quote via :'pw' keeps any charset safe.
# 2026-08-15, second pass: the first reconcile used `psql -c ... :'pw'` — and
# psql applies NO variable interpolation to -c command strings, so the server
# received the literal three characters :'pw', errored, and the legs stayed
# sick while the failure printed only where the event capture cannot see.
# SQL now arrives on stdin (where interpolation is guaranteed), the password
# rides the environment (never the command line), and the cure is VERIFIED by
# actually logging in as authenticator — the role that never had a password —
# before this installer claims anything (DR-0076: prove, don't claim). Every
# outcome prints on stdout so the cycle event carries the reason.
# 2026-08-15, third pass (run 31893397378: legs still 28P01 after the stdin
# rewrite, and the outcome line was again buried mid-output where the cycle
# event's last-lines capture cannot see it). Two changes: (1) the ADMIN
# connection tries the UNIX SOCKET as the postgres OS user FIRST -- peer auth
# inside the container needs no password at all, removing every pg_hba and
# password uncertainty from the curing connection -- with the supabase_admin
# TCP path as the fallback; (2) the outcome is stashed in RECON and RESTATED
# as one of the installer's LAST lines, so the cycle event always carries the
# verdict verbatim. Single quotes keep the backtick literal for psql.
# 2026-08-15, fourth pass -- the instrument finally spoke (16:00Z cycle):
#   reconcile: ALTER FAILED: ERROR: role "supabase_auth_admin" does not exist
# The role NEVER EXISTED. Every earlier pass assumed the image ships the
# service roles and only their passwords were wrong -- but this stack replaced
# the official init volume with the minimal 01-roles.sql, so the auth and
# storage service roles (and their schemas) were never created at all;
# realtime survived because it connects as the superuser supabase_admin. And
# ON_ERROR_STOP halted at that first missing role, so authenticator's ALTER
# -- which would have worked -- never ran behind it. The cure now CREATES
# what is missing first (roles, schemas, grants), then sets every password.
RECON="not-run"
ALTER_SQL='\set pw `printenv PW`
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '"'"'supabase_auth_admin'"'"') THEN
    CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '"'"'supabase_storage_admin'"'"') THEN
    CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '"'"'postgres'"'"') THEN
    CREATE ROLE postgres NOSUPERUSER CREATEDB CREATEROLE LOGIN REPLICATION BYPASSRLS;
  END IF;
END $$;
ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD :'"'"'pw'"'"';
ALTER ROLE authenticator WITH LOGIN PASSWORD :'"'"'pw'"'"';
ALTER ROLE supabase_storage_admin WITH LOGIN PASSWORD :'"'"'pw'"'"';
ALTER ROLE postgres WITH LOGIN PASSWORD :'"'"'pw'"'"';
GRANT CREATE, CONNECT ON DATABASE postgres TO supabase_auth_admin, supabase_storage_admin;
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;
ALTER ROLE supabase_auth_admin SET search_path = auth;
ALTER ROLE supabase_storage_admin SET search_path = storage;'
PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2-)
if [ -n "$PW" ]; then
  if OUT=$(printf '%s\n' "$ALTER_SQL" | $DOCKER exec -i -e PW="$PW" -u postgres supabase-db \
        psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 2>&1); then
    RECON="altered via postgres socket"
  elif OUT=$(printf '%s\n' "$ALTER_SQL" | $DOCKER exec -i -e PGPASSWORD="$PW" -e PW="$PW" supabase-db \
        psql -h 127.0.0.1 -U supabase_admin -d postgres -q -v ON_ERROR_STOP=1 2>&1); then
    RECON="altered via supabase_admin tcp"
  else
    RECON="ALTER FAILED: $(printf '%s' "$OUT" | tail -2 | tr '\n' ' ')"
  fi
  case "$RECON" in
    altered*)
      if $DOCKER exec -e PGPASSWORD="$PW" supabase-db \
          psql -h 127.0.0.1 -U authenticator -d postgres -q -c "SELECT 1;" >/dev/null 2>&1; then
        RECON="$RECON, VERIFIED (authenticator logs in)"
      else
        RECON="$RECON, but authenticator STILL cannot log in (pg_hba or role shape, not the password)"
      fi
      ;;
  esac
else
  RECON="no POSTGRES_PASSWORD in $ENV_FILE"
fi
echo "nas-supabase: reconcile: $RECON"

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

# --- the cutover sprint rides a GREEN gateway (DR-0307) ----------------------
# Only after kong answers 200: replay the repo's migration history into the
# sovereign db (resumable ledger, budgeted per cycle), and once the ledger is
# complete, copy the auth accounts and measure parity. Each leg prints one
# summary line in the installer's tail where the cycle event carries it.
REPLAY="not-run (gateway not green)"
SYNC="not-run"
if [ "$ok" = "1" ]; then
  if R_OUT=$(sh "$SRC/replay_migrations.sh" 2>&1); then
    REPLAY=$(printf '%s' "$R_OUT" | tail -1)
    # PostgREST caches the DB schema at startup — a replayed migration is
    # invisible to the API until a reload (measured 2026-08-20: rpc
    # has_user_pin answered PGRST202 "no matches" while the ledger read
    # 153/153; the function existed, the cache predated it). NOTIFY is the
    # documented live-reload channel; harmless when nothing changed.
    $DOCKER exec -u postgres supabase-db \
      psql -U postgres -d postgres -q -c "NOTIFY pgrst, 'reload schema';" 2>/dev/null || true
    if S_OUT=$(python3 "$SRC/cutover_sync.py" 2>&1); then
      SYNC=$(printf '%s' "$S_OUT" | tail -2 | tr '\n' ' ')
    else
      SYNC="$(printf '%s' "$S_OUT" | tail -2 | tr '\n' ' ')"
    fi
  else
    REPLAY=$(printf '%s' "$R_OUT" | tail -1)
    SYNC="waiting on replay"
  fi
fi

# --- public transport: mount /sb on the funnel (additive, reversible) --------
# Same guarded pattern as the mcp installer: only the real DSM binary, only
# when not already mounted, never touching '/' (the legacy transport).
TS="$(command -v tailscale 2>/dev/null || true)"
[ -n "$TS" ] || TS="$(ls /var/packages/Tailscale/target/bin/tailscale 2>/dev/null || true)"
SB_MOUNT="not-attempted"
if [ -n "$TS" ]; then
  if sudo -n true 2>/dev/null; then TSC="sudo -n $TS"; else TSC="$TS"; fi
  FSTAT="$($TSC funnel status 2>/dev/null || true)"
  if printf '%s' "$FSTAT" | grep -q "/sb"; then
    SB_MOUNT="already mounted"
  elif $TSC funnel --bg --set-path /sb http://127.0.0.1:8800 2>/dev/null; then
    SB_MOUNT="mounted /sb -> kong 8800"
  else
    SB_MOUNT="mount FAILED - by hand: sudo $TS funnel --bg --set-path /sb http://127.0.0.1:8800"
  fi
else
  SB_MOUNT="tailscale binary not found"
fi

# The verdict lines ride the LAST lines on purpose: the cycle event captures
# an installer's tail, and three passes of the password cure went blind
# because outcomes printed mid-output. FOURTH blindness (22:52Z probe): a
# SUCCEEDING installer's stdout is logged NOWHERE -- the cron log records only
# failures -- so the moment the gateway went green, every verdict line
# vanished. The status file is the fix: written every run regardless of exit,
# read by nas-health, so success and failure leave the same receipt.
{
  echo "at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "nas-supabase: reconcile: $RECON"
  echo "nas-supabase: replay: $REPLAY"
  echo "nas-supabase: sync: $SYNC"
  echo "nas-supabase: sb-transport: $SB_MOUNT"
} > "$DATA/cutover.status" 2>/dev/null || true
echo "nas-supabase: reconcile: $RECON"
echo "nas-supabase: replay: $REPLAY"
echo "nas-supabase: sync: $SYNC"
echo "nas-supabase: sb-transport: $SB_MOUNT"
if [ "$ok" = "1" ]; then
  echo "nas-supabase: OK - auth answers 200 on 127.0.0.1:8800"
  exit 0
fi
echo "nas-supabase: FAILED - the gateway did not answer 200 within 150s. Stack state above." >&2
exit 1
