-- =============================================================================
-- 0317 — the house says what it has applied (DR-1398, under DR-1360)
-- =============================================================================
-- Darrell 2026-11-10, on being told the runner's road to the NAS needed a new
-- Tailscale credential: "Why can't we do it another way. Same outcome. Don't
-- need anything because we designed it."
--
-- DR-1360 already made it the standard: the NAS initiates every road and the
-- lane never reaches in. The APPLY half was already built that way:
-- replay-on-clock.sh (DR-1269) applies every merged migration on the NAS's own
-- services-sync clock, needing no runner, no key and no hand. What still
-- reached in was the PROOF: db-migrate could only learn whether a migration
-- landed by joining the tailnet, so a dead key turned a landed migration into a
-- red lane and an "unknown" nobody could resolve without a hand on the box.
--
-- This is the proof turned outward. The live database already keeps its own
-- receipt (public._sovereign_replay, one row per applied file, written by the
-- replay itself). This function lets anyone ask it, over the same public road
-- every family browser already uses (poetech.us/sb, the anon key the site
-- ships): "of these migration files, which have you NOT applied?"
--
-- What it gives out, and why that is safe: file names from
-- infra/supabase/migrations-auto, which are public in the repository; a count;
-- the newest applied file name and when the newest row was written. No row of
-- any member's data, no schema detail beyond file names, nothing a caller can
-- write. Input is bounded: at most 1000 names, each one shaped like a
-- migration file name, so the call cannot be used to probe anything else.
--
-- On a database with no sovereign ledger (the hosted mirror) it says so
-- (`ledger: false`) instead of guessing; the reader treats that as "the wrong
-- database answered", never as "nothing is missing" (DR-0076 §8).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sovereign_migration_receipt(p_files text[] DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_files  text[];
  v_result jsonb;
BEGIN
  IF to_regclass('public._sovereign_replay') IS NULL THEN
    RETURN jsonb_build_object('ledger', false);
  END IF;

  SELECT COALESCE(array_agg(DISTINCT u.f), '{}'::text[])
    INTO v_files
    FROM unnest(COALESCE(p_files, '{}'::text[])) WITH ORDINALITY AS u(f, n)
   WHERE u.n <= 1000
     AND u.f ~ '^[0-9]{4}-[a-z0-9-]{1,120}\.sql$';

  EXECUTE $q$
    SELECT jsonb_build_object(
      'ledger', true,
      'applied', (SELECT count(*) FROM public._sovereign_replay WHERE fname ~ '^[0-9]{4}-.*\.sql$'),
      'newest', (SELECT max(fname) FROM public._sovereign_replay WHERE fname ~ '^[0-9]{4}-.*\.sql$'),
      'last_applied_at', (SELECT max(applied_at) FROM public._sovereign_replay),
      'asked', cardinality($1),
      'missing', COALESCE((
        SELECT jsonb_agg(f ORDER BY f)
          FROM unnest($1) AS f
         WHERE NOT EXISTS (SELECT 1 FROM public._sovereign_replay s WHERE s.fname = f)
      ), '[]'::jsonb)
    )
  $q$ INTO v_result USING v_files;
  RETURN v_result;
END
$fn$;

REVOKE ALL ON FUNCTION public.sovereign_migration_receipt(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sovereign_migration_receipt(text[]) TO anon, authenticated;

-- Receipt for this migration itself: the function exists and answers.
DO $chk$
DECLARE r jsonb;
BEGIN
  r := public.sovereign_migration_receipt(ARRAY['0001-not-a-real-file.sql', 'not a file name']);
  IF r IS NULL OR NOT (r ? 'ledger') THEN
    RAISE EXCEPTION '0317: the receipt did not answer';
  END IF;
  IF (r ->> 'ledger')::boolean AND (r ->> 'asked')::int <> 1 THEN
    RAISE EXCEPTION '0317: a malformed name was not filtered (asked %)', r ->> 'asked';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
