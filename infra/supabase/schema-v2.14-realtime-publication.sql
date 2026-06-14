-- =============================================================================
-- v2.14 — realtime publication for the family-data sync tables (2026-06-12)
-- =============================================================================
-- Review finding: the client subscribes to postgres_changes on these tables,
-- but on hosted Supabase a table emits realtime events ONLY if it is in the
-- supabase_realtime publication — and no prior migration added them. Without
-- this, subscribe() is a silent no-op and cross-device updates appear only at
-- the next sign-in (initialSync). Run once in the cloud Studio SQL Editor.
--
-- Idempotent: each ADD is guarded so a re-run is a no-op instead of an error.
-- RLS still gates what each subscriber may see; the publication only makes
-- events exist.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rentals', 'incidents', 'contractors_1099',
    'accounts', 'debts', 'transactions', 'projects', 'inquiries', 'entities', 'feedback'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
       AND NOT EXISTS (
         SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
       )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE 'added % to supabase_realtime', t;
    END IF;
  END LOOP;
END $$;

-- Verify:
--   SELECT tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' ORDER BY tablename;
