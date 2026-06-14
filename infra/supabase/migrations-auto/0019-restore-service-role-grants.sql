-- =============================================================================
-- 0019 — restore service_role table grants (2026-06-14)
-- =============================================================================
-- The new sb_secret_ API key authenticates as the service_role Postgres role,
-- but service_role was missing its default table privileges in this project
-- (server-side calls hit "permission denied for table instances", with Postgres
-- hinting "GRANT ... TO service_role"). This restores the Supabase default:
-- service_role has full access to the public schema (it bypasses RLS and is the
-- backend/admin role — anon/authenticated are unaffected, so the app's RLS
-- security is unchanged). Needed for the local sermon importer (service key) to
-- read/write instances + the choir tables. Idempotent.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

NOTIFY pgrst, 'reload schema';
