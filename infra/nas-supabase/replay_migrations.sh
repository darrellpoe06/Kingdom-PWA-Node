#!/bin/sh
# =============================================================================
# replay_migrations.sh -- replay the repo's migration history into the
# sovereign stack, resumably, with a ledger (DR-0084 lane, new target)
# =============================================================================
# Darrell 2026-08-15: "drive it now until done." The hosted project's schema
# was built by infra/supabase/migrations-auto/*.sql applied in filename order;
# replaying the same files into the sovereign db reproduces the 183 tables and
# ~1,719 policies (mostly DO-loop generated -- migrate_verify.py's measured
# note), which is what makes cutover a swap and not a rewrite.
#
# RESUMABLE BY LEDGER: public._sovereign_replay records every applied file.
# Each run applies only what is missing, in order, and STOPS at the first
# failure so the frontier names itself in one line (the day's proven loop:
# every wall so far announced itself here and was cured one cycle later).
# BUDGETED: at most MAX_PER_RUN files per cycle so the services-sync 600s
# timeout can never be blown by a 150-file first run.
#
# Runs from install.sh only after the gateway answers 200. Idempotent forever.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
MIG_DIR="$REPO/infra/supabase/migrations-auto"
DATA="${SUPABASE_DATA:-/volume1/docker/supabase}"
ENV_FILE="$DATA/.env"
MAX_PER_RUN="${REPLAY_MAX_PER_RUN:-50}"

DOCKER="docker"
docker ps >/dev/null 2>&1 || DOCKER="sudo -n docker"

PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2-)
[ -n "$PW" ] || { echo "replay: no POSTGRES_PASSWORD - cannot run"; exit 1; }

PSQL() {
  $DOCKER exec -i -e PGPASSWORD="$PW" supabase-db \
    psql -h 127.0.0.1 -U supabase_admin -d postgres -q -v ON_ERROR_STOP=1 "$@"
}

# --- prerequisites the hosted platform provides outside migration files ------
# The supabase/postgres image's own init was shadowed by our custom init dir
# (the root cause of the whole role saga), so the platform-side pieces the
# migrations assume are asserted here, idempotently, every run:
#   * extensions schema + uuid/crypto extensions on the search path
#   * the auth.* helper functions every RLS policy calls (uid/role/jwt/email)
#   * baseline grants for the API roles on public
PSQL >/dev/null <<'SQL'
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.role', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )::text
  $$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.email', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
    )::text
  $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claims', true), ''),
      '{}'
    )::jsonb
  $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
CREATE TABLE IF NOT EXISTS public._sovereign_replay (
  fname text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

TOTAL=$(ls "$MIG_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ')
DONE_BEFORE=$(PSQL -t -A -c "SELECT count(*) FROM public._sovereign_replay;" 2>/dev/null | tr -d ' ')
APPLIED=0
FRONTIER="none"

for F in $(ls "$MIG_DIR"/*.sql | sort); do
  B=$(basename "$F")
  IN=$(PSQL -t -A -c "SELECT 1 FROM public._sovereign_replay WHERE fname='$B';" | tr -d ' ')
  [ "$IN" = "1" ] && continue
  if [ "$APPLIED" -ge "$MAX_PER_RUN" ]; then
    FRONTIER="budget reached ($MAX_PER_RUN this cycle) - next cycle continues at $B"
    break
  fi
  if OUT=$(PSQL < "$F" 2>&1); then
    PSQL -c "INSERT INTO public._sovereign_replay (fname) VALUES ('$B') ON CONFLICT DO NOTHING;" >/dev/null
    APPLIED=$((APPLIED + 1))
  else
    FRONTIER="$B FAILED: $(printf '%s' "$OUT" | tail -3 | tr '\n' ' ')"
    break
  fi
done

DONE_NOW=$(PSQL -t -A -c "SELECT count(*) FROM public._sovereign_replay;" | tr -d ' ')
echo "replay: applied $APPLIED this run, ledger $DONE_NOW/$TOTAL, frontier: $FRONTIER"
[ "$DONE_NOW" = "$TOTAL" ] && exit 0
exit 1
