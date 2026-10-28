-- =============================================================================
-- 0313 — every exam attempt is kept, and the best score stands (DR-1264)
-- =============================================================================
-- Darrell 2026-10-28, with his Class Record open ("5 exams taken, 6 attempts"):
--   "How did I take 6 test and no know what happened and when? I also should
--    be able to keep 100% by using that test again or read it again make
--    sense?"  ...  "Taking the test again"
--
-- MEASURED BEFORE BUILDING. learner_lesson_records (0250) holds ONE row per
-- learner per lesson with quiz_pct, quiz_passed, quiz_attempts and quiz_at.
-- quiz_attempts is a COUNT the device sends; quiz_pct/quiz_at are whatever the
-- LAST attempt wrote. So "6 attempts" was the whole of what the record could
-- say about those six: not which lesson each was on, not when, not the score.
-- And a retake that scored lower OVERWROTE the pass.
--
-- THE WALL NOW KEEPS THE LEDGER ITSELF:
--   quiz_history  jsonb  — one entry per attempt, appended by the trigger from
--                          the columns the row is written with (at, pct,
--                          passed, band). The client never writes it: a value
--                          sent for quiz_history is IGNORED, so a device cannot
--                          rewrite or shorten what happened.
--   quiz_pct / quiz_passed — the BEST the learner has done on that exam; a
--                          later, lower attempt is kept in the history and does
--                          not lower the record ("keep 100% by using that test
--                          again"). The latest attempt is the last history
--                          entry; quiz_at stays the latest attempt's moment.
--   quiz_attempts         — never below the history's length, and never
--                          decreasing (a device that forgot still cannot
--                          shrink the count).
-- A new attempt is one that carries a quiz_at the row did not hold before.
-- Idempotent: re-running this file changes nothing.
-- =============================================================================

ALTER TABLE public.learner_lesson_records
  ADD COLUMN IF NOT EXISTS quiz_history jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.learner_lesson_records
  DROP CONSTRAINT IF EXISTS learner_lesson_records_history_shape;
ALTER TABLE public.learner_lesson_records
  ADD CONSTRAINT learner_lesson_records_history_shape
  CHECK (jsonb_typeof(quiz_history) = 'array' AND jsonb_array_length(quiz_history) <= 2000);

CREATE OR REPLACE FUNCTION public.learner_lesson_records_exam_ledger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  held     jsonb := '[]'::jsonb;
  best_pct int;
  best_ok  boolean;
  new_turn boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    held := COALESCE(OLD.quiz_history, '[]'::jsonb);
    new_turn := NEW.quiz_at IS NOT NULL AND NEW.quiz_at IS DISTINCT FROM OLD.quiz_at;
    -- The best stands: a lower retake never lowers the record.
    best_pct := GREATEST(COALESCE(OLD.quiz_pct, -1), COALESCE(NEW.quiz_pct, -1));
    IF best_pct < 0 THEN best_pct := NULL; END IF;
    IF OLD.quiz_passed IS NULL AND NEW.quiz_passed IS NULL THEN best_ok := NULL;
    ELSE best_ok := COALESCE(OLD.quiz_passed, false) OR COALESCE(NEW.quiz_passed, false);
    END IF;
  ELSE
    new_turn := NEW.quiz_at IS NOT NULL;
    best_pct := NEW.quiz_pct;
    best_ok := NEW.quiz_passed;
  END IF;

  IF new_turn THEN
    held := held || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'at', NEW.quiz_at,
      'pct', NEW.quiz_pct,
      'passed', NEW.quiz_passed,
      'band', NEW.age_band
    )));
  END IF;

  -- The ledger is the wall's, never the client's.
  NEW.quiz_history := held;
  NEW.quiz_pct := best_pct;
  NEW.quiz_passed := best_ok;
  NEW.quiz_attempts := GREATEST(
    COALESCE(NEW.quiz_attempts, 0),
    CASE WHEN TG_OP = 'UPDATE' THEN COALESCE(OLD.quiz_attempts, 0) ELSE 0 END,
    jsonb_array_length(held)
  );
  -- A retake keeps the latest moment on the row; an update that names no
  -- new attempt keeps the moment it already had.
  IF TG_OP = 'UPDATE' AND NOT new_turn THEN
    NEW.quiz_at := OLD.quiz_at;
  END IF;
  RETURN NEW;
END
$fn$;
REVOKE ALL ON FUNCTION public.learner_lesson_records_exam_ledger() FROM PUBLIC;

DROP TRIGGER IF EXISTS learner_lesson_records_exam_ledger ON public.learner_lesson_records;
-- Runs AFTER the versions ratchet (0312) by name order; both are BEFORE
-- triggers on independent columns, so the order does not change the result.
CREATE TRIGGER learner_lesson_records_exam_ledger
  BEFORE INSERT OR UPDATE ON public.learner_lesson_records
  FOR EACH ROW EXECUTE FUNCTION public.learner_lesson_records_exam_ledger();

-- Receipt: the column and the trigger exist, or this migration failed.
DO $chk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'learner_lesson_records' AND column_name = 'quiz_history'
  ) THEN RAISE EXCEPTION '0313: quiz_history is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'learner_lesson_records_exam_ledger' AND NOT tgisinternal
  ) THEN RAISE EXCEPTION '0313: the exam ledger trigger is missing'; END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
