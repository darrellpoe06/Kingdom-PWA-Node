-- =============================================================================
-- 0240-a (repair) — the parity loop gives lesson_versions back to the builder
-- (DR-0671, DR-0669)
-- =============================================================================
-- What happened: #1845 merged 0240-a-tower-writer-is-measured-against-the-
-- reference-until-it-matches.sql, which created public.lesson_versions in the
-- builder's DOCUMENTED shape "if it did not exist". The NAS lesson builder
-- (#1837) owns that table in its own 0240 and creates it with more columns
-- (build_id, family, usage, error, backfill, source_ref, instance_id) and an
-- index on build_id. Its CREATE TABLE IF NOT EXISTS would skip the early copy
-- and its CREATE INDEX ... (build_id) would then fail, so the builder could not
-- land. The parity loop never writes this table (it only reads it).
--
-- This file sorts BEFORE the builder's 0240-the-lesson-builder-... file, so it
-- runs first on every database. It removes the early copy ONLY when it is the
-- parity loop's copy (no build_id column) AND holds no rows. A table with rows,
-- or with the builder's shape, is left exactly as it is.
-- IDEMPOTENT: a second run finds nothing to do.
-- =============================================================================
DO $$
BEGIN
  IF to_regclass('public.lesson_versions') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'lesson_versions' AND column_name = 'build_id') THEN
    IF NOT EXISTS (SELECT 1 FROM public.lesson_versions) THEN
      DROP TABLE public.lesson_versions;
      RAISE NOTICE 'lesson_versions: the parity loop''s empty early copy removed; the builder creates its own';
    ELSE
      RAISE NOTICE 'lesson_versions has rows and no build_id: left untouched for a person to look at';
    END IF;
  END IF;
END $$;
