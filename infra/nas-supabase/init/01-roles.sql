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
END $$;
GRANT anon, authenticated, service_role TO authenticator;
-- Set the password on every service role that exists at this point in init.
-- \gexec keeps it conditional: a role the image has not created yet (initdb.d
-- ordering) is simply skipped here, and install.sh's every-cycle re-assert
-- catches it once the stack is up.
SELECT 'ALTER ROLE ' || quote_ident(rolname) || ' WITH LOGIN PASSWORD ' || quote_literal(:'pw')
FROM pg_roles
WHERE rolname IN ('authenticator', 'supabase_auth_admin', 'supabase_storage_admin')
\gexec
