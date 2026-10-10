-- =============================================================================
-- door-work-ci-bootstrap.sql — the minimum Supabase shape a bare PostgreSQL
-- needs before the Poe Properties work-order chain applies, for the CI
-- door-work job (DR-0859). Never applied to a real database.
-- =============================================================================
-- CI applies the REAL schema files and migrations that own the work-order
-- tables (schema-v1 .. v2.2.2, 0055, 0062, 0075, 0150, 0151, 0153, 0160, 0185),
-- then 0260 twice, then the 0260 smoke. A throwaway postgres:16 has no Supabase,
-- so this supplies only what that chain calls and does not itself create:
--   * the three API roles, auth.users and auth.uid() (read from
--     request.jwt.claims, as Supabase does);
--   * engagement_touch_updated_at(), the shared updated_at trigger function;
--   * the two policy overlays as NO-OPS. The real overlays (0125/0130 lineage)
--     add RESTRICTIVE policies for the viewer and assistant seats; they can only
--     narrow what this leg proves, never widen it, and the production
--     rls-isolation leg runs the same smoke against the real overlays.
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid, id uuid PRIMARY KEY, aud text, role text, email text, phone text,
  encrypted_password text, email_confirmed_at timestamptz, created_at timestamptz, updated_at timestamptz
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid $$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('request.jwt.claims', true)::json->>'email', '') $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE
AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.apply_viewer_readonly_overlay() RETURNS void LANGUAGE sql AS $$ SELECT $$;
CREATE OR REPLACE FUNCTION public.apply_assistant_scope_overlay() RETURNS void LANGUAGE sql AS $$ SELECT $$;
