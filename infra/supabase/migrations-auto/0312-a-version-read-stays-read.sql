-- =============================================================================
-- 0312 — a version read stays read: the learner's record carries WHICH
--        versions of a lesson were read, and the union never shrinks (DR-1255)
-- =============================================================================
-- Darrell 2026-10-27, on the lesson list: "Why can't I tell which ones I've
-- already read?! Even which version so I can try the one I didn't read!!!!!!"
--
-- public.learner_lesson_records (0250) is one row per learner per lesson:
-- completed, the exam, the band. It never said WHICH of a lesson's versions
-- (child, youth, teen, adult, senior) was read, so a lesson read to the
-- children and the same lesson read as an adult were one fact. This adds the
-- list, bounded to the five ids the app can show, and makes it RATCHET at the
-- wall: a row updated with a subset (one device that has not yet seen what
-- another device filed) keeps the union, in the picker's order, each once.
-- Every wall of 0250 stands unchanged. Idempotent; applies twice in CI.
-- =============================================================================
ALTER TABLE public.learner_lesson_records
  ADD COLUMN IF NOT EXISTS versions_read text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.learner_lesson_records
  DROP CONSTRAINT IF EXISTS learner_lesson_records_versions_known;
ALTER TABLE public.learner_lesson_records
  ADD CONSTRAINT learner_lesson_records_versions_known
  CHECK (versions_read <@ ARRAY['child','youth','teen','adult','senior']::text[]
         AND cardinality(versions_read) <= 5);

-- The union, in the picker's order, each id once. On INSERT it normalises the
-- list; on UPDATE it keeps every version the row already held. A word that is
-- not one of the five is KEPT, not laundered, so the constraint above refuses
-- the row (a BEFORE trigger runs before the check; the smoke proves the
-- refusal).
CREATE OR REPLACE FUNCTION public.learner_lesson_records_versions_ratchet()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  known text[] := ARRAY['child','youth','teen','adult','senior'];
  held  text[] := '{}';
  given text[] := COALESCE(NEW.versions_read, '{}');
BEGIN
  IF TG_OP = 'UPDATE' THEN
    held := COALESCE(OLD.versions_read, '{}');
  END IF;
  NEW.versions_read := ARRAY(
    SELECT t.v
      FROM unnest(known) WITH ORDINALITY AS t(v, o)
     WHERE t.v = ANY (held || given)
     ORDER BY t.o
  ) || ARRAY(SELECT x FROM unnest(given) AS x WHERE x <> ALL (known));
  RETURN NEW;
END
$fn$;
REVOKE ALL ON FUNCTION public.learner_lesson_records_versions_ratchet() FROM PUBLIC;

DROP TRIGGER IF EXISTS learner_lesson_records_versions_ratchet ON public.learner_lesson_records;
CREATE TRIGGER learner_lesson_records_versions_ratchet
  BEFORE INSERT OR UPDATE ON public.learner_lesson_records
  FOR EACH ROW EXECUTE FUNCTION public.learner_lesson_records_versions_ratchet();

-- Receipt: the column and the trigger exist, or this migration failed.
DO $chk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'learner_lesson_records' AND column_name = 'versions_read'
  ) THEN RAISE EXCEPTION '0312: versions_read is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'learner_lesson_records_versions_ratchet' AND NOT tgisinternal
  ) THEN RAISE EXCEPTION '0312: the ratchet trigger is missing'; END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
