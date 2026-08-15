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
-- Realtime's home schema (upstream's init created this; ours was shadowed).
-- The compose pins realtime's search_path here so its Ecto migrations stop
-- landing in public.
CREATE SCHEMA IF NOT EXISTS _realtime AUTHORIZATION supabase_admin;
-- Evict realtime's squatter tables from public (frontier 2026-08-15 23:10Z:
-- the APP's schema-v1 found a tenants table with no slug column -- realtime's
-- tenants, migrated into public before the search_path pin existed). The
-- jwt_secret-column guard means this can ONLY ever match realtime's shape,
-- never the app's own tenants; once the baseline creates the real tenants
-- this block is a permanent no-op.
DO $cleanup$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='tenants'
               AND column_name='jwt_secret') THEN
    DROP TABLE IF EXISTS public.extensions CASCADE;
    DROP TABLE IF EXISTS public.tenants CASCADE;
    DROP TABLE IF EXISTS public.schema_migrations CASCADE;
  END IF;
END
$cleanup$;
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

# --- the baseline the hosted project carried BEFORE migrations-auto ----------
# Frontier discovery 2026-08-15 (ledger stuck at 2/150): 0003 ALTERs `feedback`
# but no migrations-auto file ever CREATES it. The hosted schema's first months
# live in the schema-v*.sql series (v1 2026-05-23 .. v2.17 2026-08-11) plus the
# 2026-06-12 cleanup -- applied by hand in the dashboard era, so no file in
# MIG_DIR reproduces them. They ride the same ledger, in EXPLICIT order because
# lexical sort misorders v2.10 before v2.2. The late-dated three (v2.16,
# v2.10-renter-portal-auth, v2.17) reference only v1/v2.1/v2.2 tables --
# verified before this list was written. Seed files are DATA, not schema; the
# data leg of cutover is its own step, never smuggled into a schema replay.
SUPA_DIR="$REPO/infra/supabase"
BASELINE="schema-v1.sql
schema-v1.1-tenant-join.sql
schema-v1.2-numeric-sync.sql
schema-v2.1-infra.sql
schema-v2.2-rentals.sql
schema-v2.2.1-rentals-amendments.sql
schema-v2.2.2-rentals-sync-amendments.sql
schema-v2.3-therapy.sql
schema-v2.4-contractor.sql
schema-v2.6-legal.sql
schema-v2.7-church.sql
schema-v2.7.1-church-amendments.sql
schema-v2.8-ops.sql
schema-v2.9-portal-rls.sql
schema-v2.9-smoke-findings.sql
schema-v2.10-ai-workflow-state.sql
schema-v2.10-renter-portal-auth.sql
schema-v2.11-engagement.sql
schema-v2.12-engagement-questions.sql
schema-v2.13-family-data-sync.sql
schema-v2.14-realtime-publication.sql
schema-v2.15-family-snapshot.sql
schema-v2.16-forecast-snapshots.sql
schema-v2.17-data-liberation.sql
cleanup-2026-06-12-entity-pollution.sql"

# One-time ordering repair: 0001/0002 are SECURITY fixes that CREATE OR REPLACE
# functions the baseline also creates -- they were ledgered before the baseline
# joined this replay, so baseline applying after them would silently REVERT the
# family-allowlist fix. If the baseline has not started but 0001 is ledgered,
# clear those two rows so they re-apply AFTER the baseline (both idempotent).
BASE_IN=$(PSQL -t -A -c "SELECT 1 FROM public._sovereign_replay WHERE fname='schema-v1.sql';" | tr -d ' ')
FIRST_IN=$(PSQL -t -A -c "SELECT 1 FROM public._sovereign_replay WHERE fname='0001-join-default-instance-family-allowlist.sql';" | tr -d ' ')
if [ "$BASE_IN" != "1" ] && [ "$FIRST_IN" = "1" ]; then
  PSQL -c "DELETE FROM public._sovereign_replay WHERE fname IN ('0001-join-default-instance-family-allowlist.sql','0002-join-default-instance-self-serve.sql');" >/dev/null
  echo "replay: cleared 0001/0002 from ledger to re-apply after baseline (security fixes stay senior)"
fi

FILE_LIST=""
for B in $BASELINE; do FILE_LIST="$FILE_LIST $SUPA_DIR/$B"; done
FILE_LIST="$FILE_LIST $(ls "$MIG_DIR"/*.sql | sort)"
TOTAL=$(set -- $FILE_LIST; echo $#)
DONE_BEFORE=$(PSQL -t -A -c "SELECT count(*) FROM public._sovereign_replay;" 2>/dev/null | tr -d ' ')
APPLIED=0
FRONTIER="none"

for F in $FILE_LIST; do
  B=$(basename "$F")
  if [ ! -f "$F" ]; then
    FRONTIER="$B MISSING on disk at $F"
    break
  fi
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
