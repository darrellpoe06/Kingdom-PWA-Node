#!/bin/sh
# =============================================================================
# replay_migrations.sh -- the HOSTED TRUTH is the baseline; migrations-auto
# replays only what lands after it (DR-0084 lane, new target; DR-0308)
# =============================================================================
# Darrell 2026-08-15: "drive it now until done." The original premise -- that
# replaying the repo's SQL files in order reproduces the hosted schema -- was
# MEASURED WRONG by this script's own frontier receipts (2026-08-16/17):
# v2.1 renamed live v1 tables in place, v2.2.1 depended on v2.8, v2.2.2
# needed a rentals.links column no file ever adds, and the dashboard era left
# hand-applied state no file records. Files are not the history; the hosted
# DATABASE is. So the baseline is now a pg_dump of hosted's public schema
# (schema AND data -- closing the empty-public-tables repoint gap), taken
# over the pinned CA with verification ON, applied once through the same
# ledger. Every migrations-auto file already lives inside that dump (hosted
# ran them all), so they pre-ledger at baseline time; only files that land
# AFTER the baseline replay normally, in filename order, stop-at-first-
# failure so the frontier names itself (the proven one-wall-per-cycle loop).
#
# Runs from install.sh only after the gateway answers 200. Idempotent forever.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
MIG_DIR="$REPO/infra/supabase/migrations-auto"
DATA="${SUPABASE_DATA:-/volume1/docker/supabase}"
ENV_FILE="$DATA/.env"
MAX_PER_RUN="${REPLAY_MAX_PER_RUN:-50}"

# RESOLVE DOCKER BEFORE CALLING IT. DSM does not put docker on the PATH of a
# non-login ssh shell, so the old two-liner here ("DOCKER=docker; docker ps ||
# DOCKER='sudo -n docker'") could only ever pick a binary that does not exist:
# the probe failed command-not-found, the fallback failed the same way, and
# set -e killed this script at the first PSQL call with "sudo: docker: command
# not found". That is exactly what happened on db-migrate run 33695466498
# (2026-09-02) — the first migration to ride the sovereign replay lane never
# ran and the ledger stayed at 151. This script's own caller,
# scripts/sovereign-replay-over-tailnet.sh, already resolved the binary this
# way; the standard lived in code and nowhere else, so this sibling missed it
# (DR-0314). It is now a documented Way and a gate:
# scripts/nas-docker-path-guard.mjs.
# DOCKER_BIN from the environment wins, so a caller that already resolved it
# (the tailnet wrapper does) does not resolve it twice.
if [ -z "${DOCKER_BIN:-}" ]; then
  DOCKER_BIN=$(command -v docker 2>/dev/null || true)
fi
if [ -z "$DOCKER_BIN" ]; then
  for c in /usr/local/bin/docker /usr/bin/docker; do
    if [ -x "$c" ]; then DOCKER_BIN="$c"; break; fi
  done
fi
[ -n "$DOCKER_BIN" ] || { echo "replay: docker binary not found (PATH, /usr/local/bin, /usr/bin) - cannot run"; exit 1; }
# Plain first, sudo only if the plain call cannot talk to the daemon.
DOCKER="$DOCKER_BIN"
"$DOCKER_BIN" ps >/dev/null 2>&1 || DOCKER="sudo -n $DOCKER_BIN"

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

# --- the hosted baseline: pg_dump of the real public schema + data ----------
# Applied ONCE, guarded by its ledger marker. The sovereign public schema is
# scratch until this succeeds (no users, no live traffic), so each attempt
# resets it clean -- destructive ONLY to the sovereign build surface, purely
# read-only against hosted. TLS: the pinned Supabase prod CA rides into the
# container and pg_dump runs sslmode=verify-full -- verification is never
# disabled (the box agent's proven pattern). Storage blobs remain the named
# DR-0307 gap; auth.users still copies via cutover_sync AS-IS. Public DATA
# rides the dump, closing the empty-tables repoint gap. session_replication_
# role=replica during restore: rows referencing auth.users load before the
# account copy lands; hosted's own FK validity guarantees integrity once
# cutover_sync brings every user across.
# BASELINE-REFRESH (DR-0309): the committed nonce file joins the marker name,
# so bumping the nonce in the repo makes the ledger "forget" the baseline and
# the whole dump flow re-runs next cycle — RESET, fresh hosted dump (schema +
# data as of now), accounts-first copy, re-ledger. This is how hosted data
# born AFTER the last dump (e.g. the family_plans plan row, 2026-08-19) rides
# to the sovereign box BEFORE the repoint, through the lane, no hands on the NAS.
REFRESH_NONCE=$(cat "$REPO/infra/nas-supabase/BASELINE-REFRESH" 2>/dev/null | tr -d '[:space:]')
MARKER="hosted-baseline.sql${REFRESH_NONCE:+@$REFRESH_NONCE}"
AGENT_ENV="/volume1/docker/poetech/agent.env"
CA_SRC="$REPO/infra/nas-agent/supabase-prod-ca-2021.crt"
IN_LEDGER=$(PSQL -t -A -c "SELECT 1 FROM public._sovereign_replay WHERE fname='$MARKER';" 2>/dev/null | tr -d ' ')
if [ "$IN_LEDGER" != "1" ]; then
  HOSTED_URL=$(grep '^AGENT_DB_URL=' "$AGENT_ENV" 2>/dev/null | head -1 | cut -d= -f2-)
  if [ -z "$HOSTED_URL" ]; then
    echo "replay: applied 0 this run, ledger 0/?, frontier: $MARKER FAILED: no AGENT_DB_URL in $AGENT_ENV"
    exit 1
  fi
  # Hosted runs PostgreSQL 17.6 (measured 2026-08-17: the in-container
  # pg_dump 15.8 aborted on "server version mismatch" -- pg_dump never dumps
  # a server newer than itself), so the dump runs a matching 17 CLIENT in a
  # throwaway container: host network for egress, the pinned CA bind-mounted
  # read-only, verification stays ON. The restore target remains PG 15.8;
  # PG17's dump preamble carries settings 15 does not know
  # (transaction_timeout), stripped below -- anything deeper, the frontier
  # names it next cycle.
  case "$HOSTED_URL" in *\?*) SEP='&';; *) SEP='?';; esac
  DUMP_URL="${HOSTED_URL}${SEP}sslmode=verify-full&sslrootcert=/hosted-ca.crt"
  if ! $DOCKER run --rm --network host -v "$CA_SRC":/hosted-ca.crt:ro \
       postgres:17-alpine pg_dump "$DUMP_URL" --schema=public --no-owner \
       > "$DATA/hosted-baseline.sql" 2>"$DATA/.dump.err"; then
    echo "replay: applied 0 this run, frontier: $MARKER FAILED at pg_dump: $(tail -3 "$DATA/.dump.err" 2>/dev/null | tr '\n' ' ')"
    exit 1
  fi
  # PG17 pg_dump emits three things the 15.8 restore cannot take, none of
  # them schema content: the transaction_timeout setting (unknown GUC), the
  # \restrict / \unrestrict meta-command pair (2025 dump-injection hardening;
  # "invalid command \restrict" -- measured 02:14Z), and an explicit
  # CREATE SCHEMA public which collides with the schema the RESET block
  # pre-creates ("schema public already exists" -- measured 20:46Z; RESET
  # pre-creates it ON PURPOSE so a failed restore never strands the next
  # cycle's prerequisites without a public schema).
  # ...and PG17's MAINTAIN privilege (new in 17) rides the dumped GRANTs --
  # PG15: 'unrecognized privilege type "maintain"' (measured 22:45Z, AFTER
  # the 23 accounts landed). A privilege that does not exist on the target
  # grants nothing by being dropped.
  # MAINTAIN survives line-level filtering when it rides a combined privilege
  # list or an ALTER DEFAULT PRIVILEGES ... GRANT (measured 23:00Z: the
  # ^GRANT MAINTAIN filter ran on a fresh dump and the error persisted). The
  # strip is token-level, ADDRESSED to GRANT / ALTER DEFAULT PRIVILEGES lines
  # only so COPY data rows are never touched.
  grep -vE '^SET transaction_timeout|^\\restrict|^\\unrestrict|^CREATE SCHEMA public;|^COMMENT ON SCHEMA public|^GRANT MAINTAIN' \
    "$DATA/hosted-baseline.sql" \
    | sed -E '/^(GRANT|ALTER DEFAULT PRIVILEGES)/{ s/MAINTAIN, ?//g; s/, ?MAINTAIN//g; }' \
    > "$DATA/hosted-baseline.filtered.sql" \
    && mv "$DATA/hosted-baseline.filtered.sql" "$DATA/hosted-baseline.sql"
  BYTES=$(wc -c < "$DATA/hosted-baseline.sql" | tr -d ' ')
  # ACCOUNTS BEFORE DATA (measured 2026-08-18 22:16Z): pg_dump re-creates the
  # public FKs AFTER its data rows via ALTER TABLE ... ADD CONSTRAINT, which
  # VALIDATES immediately -- session_replication_role=replica skips row
  # triggers, not constraint validation -- and those FKs reference auth.users
  # ("accounts_created_by_fkey ... not present in table users" on an empty
  # auth.users). So the AS-IS account copy (DR-0307 decision 2) lands FIRST,
  # via cutover_sync's accounts-only mode over the proven vendored-pg8000 +
  # pinned-CA rail.
  if ! SYNC_OUT=$(python3 "$REPO/infra/nas-supabase/cutover_sync.py" --accounts-only 2>&1); then
    echo "replay: applied 0 this run, frontier: $MARKER FAILED at accounts-first copy: $(printf '%s' "$SYNC_OUT" | tail -2 | tr '\n' ' ')"
    exit 1
  fi
  echo "replay: accounts-first $(printf '%s' "$SYNC_OUT" | grep 'cutover-sync:' | tail -3 | tr '\n' ' ')"
  echo "replay: hosted baseline dumped ($BYTES bytes) - resetting sovereign public and restoring"
  PSQL >/dev/null <<'RESET'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE, CREATE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
RESET
  if ! OUT=$( { echo "SET session_replication_role = replica;"; cat "$DATA/hosted-baseline.sql"; } | PSQL 2>&1 ); then
    echo "replay: applied 0 this run, frontier: $MARKER FAILED at restore: $(printf '%s' "$OUT" | tail -3 | tr '\n' ' ')"
    exit 1
  fi
  PSQL >/dev/null <<LEDGER
CREATE TABLE IF NOT EXISTS public._sovereign_replay (
  fname text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public._sovereign_replay (fname) VALUES ('$MARKER') ON CONFLICT DO NOTHING;
LEDGER
  # Every migrations-auto file is already INSIDE the hosted state we just
  # restored -- hosted ran them all. Pre-ledger them so only future files run.
  PRELEDGERED=0
  for F in $(ls "$MIG_DIR"/*.sql | sort); do
    PSQL -c "INSERT INTO public._sovereign_replay (fname) VALUES ('$(basename "$F")') ON CONFLICT DO NOTHING;" >/dev/null
    PRELEDGERED=$((PRELEDGERED + 1))
  done
  echo "replay: hosted baseline RESTORED (schema+data, $BYTES bytes); $PRELEDGERED already-in-baseline migrations pre-ledgered"
fi

TOTAL=$(( $(ls "$MIG_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ') + 1 ))
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
