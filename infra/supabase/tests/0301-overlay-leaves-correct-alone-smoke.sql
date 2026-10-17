-- =============================================================================
-- 0301 smoke — an overlay leaves a correct policy alone, and still puts a
-- wrong one right (DR-1090). Runs against the live database; rolls back.
-- =============================================================================
-- Proves, on two scratch instance-scoped tables (one with no capability area,
-- so the viewer predicate is the pure deny):
--   1. the first run stamps all seven policies, exactly as before;
--   2. a second run re-creates NOTHING (every policy keeps its oid), which is
--      the lock the poe-properties leg ran out of;
--   3. a hand-loosened policy (USING true), a policy moved to PUBLIC, and a
--      dropped policy are each put back exactly;
--   4. a participation table keeps no viewer policy (the 0227 sweep).
-- =============================================================================
BEGIN;

CREATE TABLE public.zz_overlay_smoke_a (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), instance_id uuid);
ALTER TABLE public.zz_overlay_smoke_a ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.zz_overlay_smoke_b (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), instance_id uuid);
ALTER TABLE public.zz_overlay_smoke_b ENABLE ROW LEVEL SECURITY;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

CREATE TEMP TABLE zz_before ON COMMIT DROP AS
  SELECT c.relname, pol.polname, pol.oid AS pol_oid
    FROM pg_policy pol JOIN pg_class c ON c.oid = pol.polrelid
   WHERE c.relname IN ('zz_overlay_smoke_a', 'zz_overlay_smoke_b')
     AND (pol.polname LIKE 'assistant_scope_%' OR pol.polname LIKE 'viewer_readonly_%');

DO $$
DECLARE k integer;
BEGIN
  SELECT count(*) INTO k FROM zz_before;
  IF k <> 14 THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: expected 7 policies on each scratch table (14), found %', k;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policy pol JOIN pg_class c ON c.oid = pol.polrelid
     WHERE c.relname = 'zz_overlay_smoke_a' AND pol.polname LIKE 'assistant_scope_%'
       AND (pol.polpermissive OR pol.polroles <> ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')]::oid[])) THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: an assistant policy is not RESTRICTIVE to authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'zz_overlay_smoke_a' AND policyname = 'assistant_scope_select'
       AND qual LIKE '%user_role_in_instance(instance_id) IS DISTINCT FROM ''assistant''%') THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: assistant_scope_select does not deny the assistant';
  END IF;
END
$$;

-- 2. A second run re-creates nothing.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
DO $$
DECLARE k integer;
BEGIN
  SELECT count(*) INTO k
    FROM zz_before b
    JOIN pg_class c ON c.relname = b.relname
    JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = b.polname
   WHERE pol.oid = b.pol_oid;
  IF k <> 14 THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: a second run re-created % of 14 correct policies (each re-creation is a table lock)', 14 - k;
  END IF;
END
$$;

-- 3. Wrong policies are put right.
ALTER POLICY assistant_scope_select ON public.zz_overlay_smoke_a USING (true);
ALTER POLICY viewer_readonly_update ON public.zz_overlay_smoke_b TO PUBLIC;
DROP POLICY viewer_readonly_delete ON public.zz_overlay_smoke_a;
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
DO $$
DECLARE k integer;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zz_overlay_smoke_a'
              AND policyname = 'assistant_scope_select' AND qual = 'true') THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: a loosened assistant policy was left loose';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zz_overlay_smoke_b'
              AND policyname = 'viewer_readonly_update' AND roles = '{authenticated}') THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: a viewer policy moved to PUBLIC was not put back';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zz_overlay_smoke_a'
              AND policyname = 'viewer_readonly_delete') THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: a dropped viewer policy was not restored';
  END IF;
  -- Only the three that were wrong moved; the other eleven kept their oids.
  SELECT count(*) INTO k
    FROM zz_before b
    JOIN pg_class c ON c.relname = b.relname
    JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = b.polname
   WHERE pol.oid = b.pol_oid;
  IF k <> 11 THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: expected exactly the 3 wrong policies re-created (11 kept), kept %', k;
  END IF;
END
$$;

-- 4. The participation sweep still holds.
DO $$
BEGIN
  IF to_regclass('public.feedback') IS NOT NULL AND EXISTS (
       SELECT 1 FROM pg_policy WHERE polrelid = 'public.feedback'::regclass
          AND polname LIKE 'viewer_readonly_%') THEN
    RAISE EXCEPTION 'OVERLAY SMOKE: a participation table carries a viewer policy';
  END IF;
END
$$;

SELECT 'OVERLAY LEAVES CORRECT ALONE SMOKE: PASS' AS result;
ROLLBACK;
