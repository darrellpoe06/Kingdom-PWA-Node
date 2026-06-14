-- =============================================================================
-- 0007 — (instance_id, created_at) indexes on the cross-device sync tables
-- =============================================================================
-- A6 (rigorous-review 2026-06-13, MED scalability): table-sync.fetchAll() runs
--   SELECT * FROM <t> WHERE instance_id = $1 ORDER BY created_at ASC
-- on every initial sync and every realtime refetch, with no supporting index.
-- A composite index on (instance_id, created_at) serves both the equality
-- filter and the sort in one B-tree, so reads stay fast as the high-volume
-- tables (transactions especially) grow. Purely additive — no data change, no
-- behavior change; just makes the existing query plan use an index instead of a
-- scan + sort.
--
-- P13-safe (schema files are not applied state): each index is created only if
-- the table AND both columns actually exist in the LIVE catalog at apply time,
-- so a table that was never created (or carries a different shape) is skipped
-- rather than erroring the whole migration. CREATE INDEX IF NOT EXISTS keeps it
-- idempotent across the every-run-applies-all lane.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'accounts', 'contractors_1099', 'debts', 'entities', 'incidents',
    'inquiries', 'projects', 'rentals', 'transactions'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = t
                     AND column_name = 'instance_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = t
                     AND column_name = 'created_at')
    THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (instance_id, created_at)',
        'idx_' || t || '_instance_created', t
      );
    END IF;
  END LOOP;
END $$;
