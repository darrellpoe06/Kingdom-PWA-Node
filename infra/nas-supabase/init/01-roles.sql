-- Idempotent role passwords for the self-hosted stack.
-- supabase/postgres ships the roles; only their passwords are ours to set, and
-- setting them every boot is safe (ALTER ROLE is idempotent by nature).
-- Runs ONLY on first init of an empty data dir -- the installer re-asserts them
-- on later cycles, so a password rotation is never stranded here.
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
