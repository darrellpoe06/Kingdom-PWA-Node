#!/usr/bin/env bash
# =============================================================================
# test-db-throwaway — a database the isolation proofs may break freely
# =============================================================================
# The rls-isolation matrix re-applies migration chains (with DROP FUNCTION
# pre-steps) and runs smokes that create and roll back whole casts of users.
# Until 2026-09-25 it did that to a real database (SUPABASE_DB_URL); db-migrate
# run 36090407494 caught the result. Now every leg gets its own container on
# the runner, started from the NAS's own image versions, and nothing else.
#
#   fetch <out.sql.gz>   newest `test-db-baseline` artifact (schema-only dump
#                        of the live shape; scripts/test-db-baseline-over-tailnet.sh)
#   up <baseline.sql.gz> start supabase/postgres + migrate auth with GoTrue,
#                        then restore the baseline. Prints DBURL=... on success.
#
# The images are the ones infra/nas-supabase/docker-compose.yml pins; the test
# reads them from that file so the two cannot drift apart.
# This script never reads a secret and never names a live host: it is checked
# by scripts/live-db-reach-guard.mjs like the workflow that calls it.
# =============================================================================
set -euo pipefail
CMD="${1:?usage: test-db-throwaway.sh fetch|up <file>}"
FILE="${2:?usage: test-db-throwaway.sh fetch|up <file>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/infra/nas-supabase/docker-compose.yml"
PORT="${TESTDB_PORT:-54322}"
PW=postgres

pinned() { grep -E "^\s*image:\s*$1:" "$COMPOSE" | head -1 | sed -E 's/^\s*image:\s*//' | tr -d '[:space:]'; }

if [ "$CMD" = "fetch" ]; then
  : "${GH_TOKEN:?GH_TOKEN, the job own github.token, is required to read artifacts}"
  REPO="${GITHUB_REPOSITORY:?}"
  ID=$(gh api "repos/$REPO/actions/artifacts?name=test-db-baseline&per_page=30" \
        --jq '[.artifacts[] | select(.expired == false)] | sort_by(.created_at) | last | .id // empty')
  if [ -z "$ID" ]; then
    echo "::error::no unexpired test-db-baseline artifact exists. db-migrate takes one before each dispatch; by hand: sovereign-read with what=baseline."
    exit 2
  fi
  CREATED=$(gh api "repos/$REPO/actions/artifacts/$ID" --jq '.created_at')
  RUN=$(gh api "repos/$REPO/actions/artifacts/$ID" --jq '.workflow_run.id')
  TMP="$(mktemp -d)"
  gh api "repos/$REPO/actions/artifacts/$ID/zip" > "$TMP/a.zip"
  unzip -q -o "$TMP/a.zip" -d "$TMP"
  mv "$TMP/test-db-baseline.sql.gz" "$FILE"
  echo "baseline: artifact $ID from run $RUN, taken $CREATED ($(wc -c < "$FILE" | tr -d ' ') bytes)"
  exit 0
fi

[ "$CMD" = "up" ] || { echo "unknown command $CMD"; exit 2; }
PGIMG=$(pinned supabase/postgres); AUTHIMG=$(pinned supabase/gotrue)
[ -n "$PGIMG" ] && [ -n "$AUTHIMG" ] || { echo "::error::could not read the pinned images from $COMPOSE"; exit 3; }
JWT="throwaway-$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"
echo "throwaway: $PGIMG + $AUTHIMG (pinned by infra/nas-supabase/docker-compose.yml)"

docker network create testdb >/dev/null
docker run -d --name testdb --network testdb -p "127.0.0.1:$PORT:5432" \
  -e POSTGRES_PASSWORD="$PW" -e POSTGRES_DB=postgres -e JWT_SECRET="$JWT" -e JWT_EXP=3600 \
  "$PGIMG" >/dev/null

# Wait for the server AND for the image's own init to finish (it restarts once).
ok=0
for _ in $(seq 1 90); do
  if docker exec testdb pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1 \
     && docker exec -e PGPASSWORD="$PW" testdb psql -U supabase_admin -h 127.0.0.1 -d postgres -tAc 'select 1' >/dev/null 2>&1; then
    ok=$((ok + 1)); [ "$ok" -ge 3 ] && break
  else ok=0; fi
  sleep 2
done
[ "$ok" -ge 3 ] || { docker logs testdb | tail -40; echo "::error::the throwaway database did not come up"; exit 4; }
SQL() { docker exec -i -e PGPASSWORD="$PW" testdb psql -U supabase_admin -h 127.0.0.1 -d postgres -q -v ON_ERROR_STOP=1 "$@"; }

# GoTrue owns the auth schema; run the NAS's version once so auth.* matches.
SQL -c "ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD '$PW';" >/dev/null
docker run -d --name testauth --network testdb \
  -e GOTRUE_API_HOST=0.0.0.0 -e GOTRUE_API_PORT=9999 -e API_EXTERNAL_URL=http://127.0.0.1:9999 \
  -e GOTRUE_DB_DRIVER=postgres -e GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:$PW@testdb:5432/postgres" \
  -e GOTRUE_SITE_URL=http://127.0.0.1 -e GOTRUE_JWT_SECRET="$JWT" -e GOTRUE_JWT_EXP=3600 \
  -e GOTRUE_JWT_AUD=authenticated -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated \
  "$AUTHIMG" >/dev/null
up=0
for _ in $(seq 1 60); do
  if docker logs testauth 2>&1 | grep -qiE 'API started|GoTrue API started|listening'; then up=1; break; fi
  if [ "$(docker inspect -f '{{.State.Running}}' testauth)" != "true" ]; then break; fi
  sleep 2
done
docker logs testauth 2>&1 | tail -5
[ "$up" = 1 ] || { echo "::error::GoTrue did not migrate the auth schema"; exit 5; }
docker rm -f testauth >/dev/null
NMIG=$(SQL -tAc 'select count(1) from auth.schema_migrations')
echo "throwaway: auth schema migrated, $NMIG GoTrue migrations"

# The platform pieces the migrations assume, asserted exactly as the NAS
# replay asserts them (infra/nas-supabase/replay_migrations.sh).
SQL >/dev/null <<'PRE'
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text $$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.email', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email'))::text $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE, CREATE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
PRE

# The baseline, strictly: a restore error is a finding, never a warning.
ERR="$(mktemp)"
if ! gzip -dc "$FILE" \
     | grep -vE '^CREATE SCHEMA public;|^COMMENT ON SCHEMA public|^\\restrict|^\\unrestrict|^SET transaction_timeout' \
     | SQL 2>"$ERR"; then
  echo "::error::the baseline did not restore into the throwaway database:"
  tail -20 "$ERR"
  exit 6
fi
T=$(SQL -tAc "select count(*) from pg_tables where schemaname='public'")
F=$(SQL -tAc "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'")
I=$(SQL -tAc "select count(*) from public.instances")
echo "throwaway: restored $T tables, $F functions, $I instances"
echo "DBURL=postgres://supabase_admin:$PW@127.0.0.1:$PORT/postgres"
