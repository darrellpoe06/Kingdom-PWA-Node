-- =============================================================================
-- 0316 — the reading on evidence, and how each exam attempt was taken, are kept
--        on the record (DR-1396, completing DR-1386)
-- =============================================================================
-- Darrell 2026-11-10: "Storage on the nas?!!!!!!! What are we waiting for?!!!!!!"
-- DR-1386 kept how an attempt was taken (after, partly or before the reading;
-- seconds a question; quick or not; first try; the paces it was read at) only
-- on the device, and parked carrying it to the record behind a re-review date.
-- The live database IS the NAS (infra/nas-supabase/REPOINT-ARMED), and this
-- lane replays every file here onto it (DR-0317), so there was nothing to wait
-- for. Two columns, both kept by the wall:
--
--   read_evidence_at  timestamptz — the first moment a reading was evidenced
--                     (seen or heard to the floor, or a finish by the reader,
--                     deck or end door). Separate from completed_at, which Done
--                     also writes, so the class record can tell a reading from a
--                     mark. A ratchet: once set it is never cleared or moved
--                     later, and a moment more than a day ahead is refused.
--   quiz_taken        jsonb — how THIS attempt was taken, sent with the attempt.
--                     The wall copies only the known keys, each checked for its
--                     type and range, into the attempt's ledger entry as
--                     `taken`. Anything else the client sends is dropped, and the
--                     ledger stays the wall's (0313): a device still cannot
--                     rewrite or shorten what happened.
--
-- The exam ledger function is replaced with 0313's body plus the `taken` field;
-- every rule 0313 set (best score stands, attempts never shrink, a client-sent
-- history is ignored) is unchanged. Idempotent: re-running changes nothing.
-- =============================================================================

ALTER TABLE public.learner_lesson_records
  ADD COLUMN IF NOT EXISTS read_evidence_at timestamptz;
ALTER TABLE public.learner_lesson_records
  ADD COLUMN IF NOT EXISTS quiz_taken jsonb;

ALTER TABLE public.learner_lesson_records
  DROP CONSTRAINT IF EXISTS learner_lesson_records_quiz_taken_shape;
ALTER TABLE public.learner_lesson_records
  ADD CONSTRAINT learner_lesson_records_quiz_taken_shape
  CHECK (quiz_taken IS NULL OR (jsonb_typeof(quiz_taken) = 'object' AND pg_column_size(quiz_taken) <= 2048));

-- How an attempt was taken, cleaned: only these keys, each of its own type and
-- range. Returns NULL when nothing usable was sent.
CREATE OR REPLACE FUNCTION public.learner_attempt_taken(t jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $fn$
  SELECT NULLIF(jsonb_strip_nulls(jsonb_build_object(
    'reading', CASE WHEN t ->> 'reading' IN ('after', 'partly', 'before') THEN t ->> 'reading' END,
    'readPct', CASE WHEN jsonb_typeof(t -> 'readPct') = 'number'
                     THEN LEAST(100, GREATEST(0, round((t ->> 'readPct')::numeric)))::int END,
    'secsPerQuestion', CASE WHEN jsonb_typeof(t -> 'secsPerQuestion') = 'number'
                     THEN LEAST(3600, GREATEST(0, round((t ->> 'secsPerQuestion')::numeric, 1))) END,
    'rushed', CASE WHEN jsonb_typeof(t -> 'rushed') = 'boolean' THEN t -> 'rushed' END,
    'firstTry', CASE WHEN jsonb_typeof(t -> 'firstTry') = 'boolean' THEN t -> 'firstTry' END,
    'eyesWpm', CASE WHEN jsonb_typeof(t -> 'eyesWpm') = 'number'
                     THEN LEAST(5000, GREATEST(0, round((t ->> 'eyesWpm')::numeric)))::int END,
    'earsWpm', CASE WHEN jsonb_typeof(t -> 'earsWpm') = 'number'
                     THEN LEAST(5000, GREATEST(0, round((t ->> 'earsWpm')::numeric)))::int END
  )), '{}'::jsonb)
  WHERE t IS NOT NULL AND jsonb_typeof(t) = 'object';
$fn$;

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
  taken    jsonb;
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
    taken := public.learner_attempt_taken(NEW.quiz_taken);
    held := held || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'at', NEW.quiz_at,
      'pct', NEW.quiz_pct,
      'passed', NEW.quiz_passed,
      'band', NEW.age_band,
      'taken', taken
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
  -- quiz_taken on the row is the latest attempt's, cleaned; an update that
  -- names no new attempt keeps what the row already had.
  IF new_turn THEN
    NEW.quiz_taken := taken;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.quiz_taken := OLD.quiz_taken;
  ELSE
    NEW.quiz_taken := NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND NOT new_turn THEN
    NEW.quiz_at := OLD.quiz_at;
  END IF;
  RETURN NEW;
END
$fn$;
REVOKE ALL ON FUNCTION public.learner_lesson_records_exam_ledger() FROM PUBLIC;

-- The reading on evidence ratchets: the first evidenced moment stands.
CREATE OR REPLACE FUNCTION public.learner_lesson_records_read_evidence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.read_evidence_at IS NOT NULL AND NEW.read_evidence_at > now() + interval '1 day' THEN
    NEW.read_evidence_at := NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.read_evidence_at IS NOT NULL THEN
    NEW.read_evidence_at := LEAST(OLD.read_evidence_at, COALESCE(NEW.read_evidence_at, OLD.read_evidence_at));
  END IF;
  RETURN NEW;
END
$fn$;
REVOKE ALL ON FUNCTION public.learner_lesson_records_read_evidence() FROM PUBLIC;

DROP TRIGGER IF EXISTS learner_lesson_records_read_evidence ON public.learner_lesson_records;
CREATE TRIGGER learner_lesson_records_read_evidence
  BEFORE INSERT OR UPDATE ON public.learner_lesson_records
  FOR EACH ROW EXECUTE FUNCTION public.learner_lesson_records_read_evidence();

-- 0313's trigger still names the replaced function; recreate it so a fresh
-- database that runs only this file after 0313 is whole.
DROP TRIGGER IF EXISTS learner_lesson_records_exam_ledger ON public.learner_lesson_records;
CREATE TRIGGER learner_lesson_records_exam_ledger
  BEFORE INSERT OR UPDATE ON public.learner_lesson_records
  FOR EACH ROW EXECUTE FUNCTION public.learner_lesson_records_exam_ledger();

-- EVERY ATTEMPT, ONE ROW (Darrell: "Python and sql... we can build anything then
-- model from there"). A flat view over the ledger, one row per attempt with how
-- it was taken and the reading on evidence beside it, so any model on the NAS
-- (a Python job, a report, pace and understanding) reads plain columns. It runs
-- as the caller (security_invoker), so the read wall of 0250 holds: a learner
-- sees their own attempts, the Governor every learner's, anon nothing.
CREATE OR REPLACE VIEW public.learner_exam_attempts
WITH (security_invoker = true) AS
SELECT
  r.user_id,
  r.lesson_id,
  r.course_key,
  e.ord::int                                   AS attempt_no,
  (e.entry ->> 'at')::timestamptz              AS taken_at,
  (e.entry ->> 'pct')::int                     AS pct,
  (e.entry ->> 'passed')::boolean              AS passed,
  e.entry ->> 'band'                           AS band,
  e.entry -> 'taken' ->> 'reading'             AS reading,
  (e.entry -> 'taken' ->> 'readPct')::int      AS read_pct,
  (e.entry -> 'taken' ->> 'secsPerQuestion')::numeric AS secs_per_question,
  (e.entry -> 'taken' ->> 'rushed')::boolean   AS rushed,
  (e.entry -> 'taken' ->> 'firstTry')::boolean AS first_try,
  (e.entry -> 'taken' ->> 'eyesWpm')::int      AS eyes_wpm,
  (e.entry -> 'taken' ->> 'earsWpm')::int      AS ears_wpm,
  r.read_evidence_at,
  r.completed_at
FROM public.learner_lesson_records r
CROSS JOIN LATERAL jsonb_array_elements(r.quiz_history) WITH ORDINALITY AS e(entry, ord);
REVOKE ALL ON public.learner_exam_attempts FROM PUBLIC, anon;
GRANT SELECT ON public.learner_exam_attempts TO authenticated;

-- Receipt: both columns, both triggers and the view exist, or this migration failed.
DO $chk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'learner_lesson_records' AND column_name = 'read_evidence_at'
  ) THEN RAISE EXCEPTION '0316: read_evidence_at is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'learner_lesson_records' AND column_name = 'quiz_taken'
  ) THEN RAISE EXCEPTION '0316: quiz_taken is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'learner_lesson_records_read_evidence' AND NOT tgisinternal
  ) THEN RAISE EXCEPTION '0316: the read evidence trigger is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'learner_lesson_records_exam_ledger' AND NOT tgisinternal
  ) THEN RAISE EXCEPTION '0316: the exam ledger trigger is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'learner_exam_attempts'
  ) THEN RAISE EXCEPTION '0316: the attempts view is missing'; END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
