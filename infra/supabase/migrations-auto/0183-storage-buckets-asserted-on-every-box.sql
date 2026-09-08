-- =============================================================================
-- 0183 — the three storage buckets are asserted, not assumed (2026-09-08)
-- =============================================================================
-- MEASURED on the sovereign box (nas-health 34176275429, 01:15Z): once the
-- storage role could switch into the app roles and the app roles could USE
-- the storage schema, the first real request answered 400 "Bucket not found"
-- for moore-showcase — while storage.buckets held exactly ONE row. 0078 and
-- 0092 each INSERT their buckets inside a handler that turns
-- insufficient_privilege into a NOTICE and continues, so the replay ledger
-- read "complete" on a box where the rows never landed. The gallery's bucket,
-- the choir library's bucket and the sermon bucket are DATA the app depends
-- on; a box without them serves nothing and accepts nothing (DR-0317).
--
-- Re-asserts all three exactly as 0078 and 0092 defined them, and the
-- public flag 0163 relies on. IDEMPOTENT: ON CONFLICT DO NOTHING + an UPDATE
-- that only touches a drifted flag. GUARDED: on a box where storage-api has
-- not yet created storage.buckets (a fresh first boot) it does nothing and
-- says so, rather than aborting the replay. Applies harmlessly to the hosted
-- project, where the rows already exist.
DO $buckets$
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE NOTICE '0183: storage.buckets does not exist yet on this box (storage-api has not run its migrations) - nothing asserted; re-run after it has';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public)
  VALUES
    ('sermon-documents',      'sermon-documents',      false),
    ('church-team-documents', 'church-team-documents', false),
    ('moore-showcase',        'moore-showcase',        true)
  ON CONFLICT (id) DO NOTHING;
  -- 0163's belt-and-braces: public reads of the gallery ride this flag.
  UPDATE storage.buckets SET public = true  WHERE id = 'moore-showcase' AND public IS DISTINCT FROM true;
  UPDATE storage.buckets SET public = false WHERE id IN ('sermon-documents', 'church-team-documents') AND public IS DISTINCT FROM false;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0183: insufficient privilege on storage.buckets - the replay role cannot assert the buckets on this box; create sermon-documents, church-team-documents (private) and moore-showcase (public) by hand';
END
$buckets$;

-- Verify after apply:
--   SELECT id, public FROM storage.buckets ORDER BY id;
--   -> church-team-documents f | moore-showcase t | sermon-documents f
