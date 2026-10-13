-- Idempotent role passwords for the self-hosted stack.
-- MEASURED 2026-08-15 (nas-health 31870361908): auth, rest, and storage
-- restart-looped for hours -- 292/292/285 restarts -- all with ONE disease,
-- "password authentication failed" for supabase_auth_admin / authenticator /
-- supabase_storage_admin. The original version of this file set the `pw`
-- variable and then NEVER USED IT: authenticator was created LOGIN with no
-- password at all, and the supabase_* service roles never received the .env
-- password (the image sets only supabase_admin's from POSTGRES_PASSWORD --
-- which is why meta stayed healthy while its siblings drowned).
-- Runs ONLY on first init of an empty data dir; install.sh re-asserts the
-- same passwords every cycle, so a rotation is never stranded here.
\set pw `echo "$POSTGRES_PASSWORD"`
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  -- MEASURED 2026-08-15 16:00Z ('role "supabase_auth_admin" does not exist'):
  -- this image does NOT ship the auth/storage service roles -- the official
  -- self-host init volume creates them, and this file replaced that volume.
  -- GoTrue and storage-api log in as these roles and own their schemas.
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN;
  END IF;
  -- 17:36Z: GoTrue's own migrations GRANT to a role named postgres (this
  -- image's superuser is supabase_admin; the official init creates postgres
  -- separately). The hosted project's 148 migrations reference it too.
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres NOSUPERUSER CREATEDB CREATEROLE LOGIN REPLICATION BYPASSRLS;
  END IF;
END $$;
GRANT anon, authenticated, service_role TO authenticator;
-- storage-api runs every request as its own role and then SETS the caller's
-- role (anon / authenticated / service_role) so RLS applies to the object
-- rows. Without membership that SET is refused: "permission denied to set
-- role" (guc.c call_string_check_hook, 42501) -- which storage-api reports as
-- "new row violates row-level security policy" and answers 400 to EVERY
-- request, public reads included. MEASURED 2026-09-07 (nas-health
-- 34165385695): supabase-storage restarts=843, all twelve moore-showcase
-- reads 400, and Shay's uploads with them. This is the grant that was missing.
GRANT anon, authenticated, service_role TO supabase_storage_admin;

-- THE API-ROLE BASELINE THE HOSTED PLATFORM CARRIES AND THIS BOX NEVER DID.
-- Measured on the hosted project 2026-09-08 00:05Z (has_schema_privilege /
-- has_table_privilege): anon, authenticated and service_role all hold USAGE
-- on auth and storage, EXECUTE on auth.uid(), and ALL on storage.buckets /
-- storage.objects. Measured on this box the same hour: none of it. Two live
-- faults trace to that gap --
--   * storage-api SETs the caller's role (anon) and then resolves "buckets"
--     through search_path; a schema the role cannot USE is silently skipped,
--     so the answer was 42P01 'relation "buckets" does not exist' while the
--     table sat there with one row (nas-health 34171764006).
--   * any RLS policy that calls auth.uid() directly is evaluated AS the app
--     role; without USAGE on auth that is "permission denied for schema
--     auth" (nas-health 34165810216) -- a table read that fails, not a
--     policy that denies.
-- Guarded so first boot (before GoTrue and storage-api have created their
-- objects) does not trip ON_ERROR_STOP; every later cycle re-asserts.
DO $api_roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    IF to_regprocedure('auth.uid()')   IS NOT NULL THEN GRANT EXECUTE ON FUNCTION auth.uid()   TO anon, authenticated, service_role; END IF;
    IF to_regprocedure('auth.role()')  IS NOT NULL THEN GRANT EXECUTE ON FUNCTION auth.role()  TO anon, authenticated, service_role; END IF;
    IF to_regprocedure('auth.email()') IS NOT NULL THEN GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated, service_role; END IF;
    IF to_regprocedure('auth.jwt()')   IS NOT NULL THEN GRANT EXECUTE ON FUNCTION auth.jwt()   TO anon, authenticated, service_role; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
    IF to_regclass('storage.buckets') IS NOT NULL THEN GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role; END IF;
    IF to_regclass('storage.objects') IS NOT NULL THEN GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role; END IF;
  END IF;
END
$api_roles$;

GRANT CREATE, CONNECT ON DATABASE postgres TO supabase_auth_admin, supabase_storage_admin;
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;
-- 16:30Z cycle: with the roles cured, GoTrue's migrator progressed to its
-- NEXT wall -- 'permission denied for schema public' -- because it creates
-- its bookkeeping in the FIRST schema on its path. The official init pins
-- each service admin's search_path to the schema it owns; so do we.
ALTER ROLE supabase_auth_admin SET search_path = auth;
ALTER ROLE supabase_storage_admin SET search_path = storage;
-- Set the password on every service role that exists at this point in init.
-- \gexec keeps it conditional: a role the image has not created yet (initdb.d
-- ordering) is simply skipped here, and install.sh's every-cycle re-assert
-- catches it once the stack is up.
SELECT 'ALTER ROLE ' || quote_ident(rolname) || ' WITH LOGIN PASSWORD ' || quote_literal(:'pw')
FROM pg_roles
WHERE rolname IN ('authenticator', 'supabase_auth_admin', 'supabase_storage_admin', 'postgres')
\gexec
