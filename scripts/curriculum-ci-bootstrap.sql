-- =============================================================================
-- curriculum-ci-bootstrap.sql — the minimum Supabase shape a bare PostgreSQL
-- needs before 0242 applies, for the CI curriculum job (DR-0677)
-- =============================================================================
-- CI runs 0242, the sync, the preview smoke and the parity read-back against a
-- throwaway postgres:16 service container. That container has no Supabase, so
-- this supplies only what 0242 and its smoke touch: the three API roles, the
-- auth schema's users table and auth.uid() (read from request.jwt.claims, as
-- Supabase does), and 0237's two Governor functions — copied VERBATIM in
-- behaviour from infra/supabase/migrations-auto/0237-*.sql (the email list the
-- smoke swaps inside its own transaction). Never applied to a real database.
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid, id uuid PRIMARY KEY, aud text, role text, email text,
  encrypted_password text, created_at timestamptz, updated_at timestamptz
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['darrellpoe06@gmail.com', '15636502416@phone.poetech.us']::text[] $$;
CREATE OR REPLACE FUNCTION public.is_lesson_governor()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users u
                  WHERE u.id = auth.uid()
                    AND lower(coalesce(u.email, '')) = ANY (public.lesson_governor_emails()));
$$;
REVOKE ALL ON FUNCTION public.is_lesson_governor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_lesson_governor() TO authenticated;
