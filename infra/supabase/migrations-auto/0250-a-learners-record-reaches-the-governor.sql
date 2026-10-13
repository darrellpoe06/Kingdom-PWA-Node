-- =============================================================================
-- 0250 — A learner's record reaches the Governor (DR-0754)
-- =============================================================================
-- Darrell, 2026-10-05: "my son is reading the lessons testing the app and
-- seeing how it flows for him... we want to keep analytics on what he's
-- completion rates are and competency scores based on the exams in the
-- lessons.. make sense?"
--
-- WHAT WAS MEASURED. A learner's progress through a course lived in ONE place:
-- the shell's own `data.classProgress` (a module id → the moment it was marked
-- read) and `data.classQuiz` (a module id → {passed, pct, at}), held in the
-- browser on that device. Neither is in any synced table, so neither ever left
-- the phone it was read on. The Governor could see an aggregate engagement
-- BAND by age (app/src/components/ChurchLearn.jsx, the pace section) and
-- nothing else: not who read what, not how a learner scored, not whether a
-- course was finished. A son reading on his own phone produced no record his
-- father could look at.
--
-- THE FIX HERE. One row per learner per lesson, written as he reads and as he
-- answers, carrying the completion moment and the quiz result. The device copy
-- stays exactly as it is and remains the fast path; this table is the witness
-- that crosses devices and reaches the Governor.
--
-- WALLS (DR-0060 — RLS is the wall, not the screen). A learner reads, writes
-- and corrects ONLY his own rows. The Governor (public.is_lesson_governor(),
-- his own declared email list — not a role, not an instance, not a tag) reads
-- EVERY learner's rows and writes none. anon reads nothing. Proven on a real
-- PostgreSQL in CI: infra/supabase/tests/0250-learner-records-smoke.sql.
--
-- IDEMPOTENT. Word-first: "Give an account of thy stewardship" (Luke 16:2) —
-- a record kept is a stewardship shown, and "the Resources" Yahweh supplies
-- are measured by what they actually build (Proverbs 24:3-4).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.learner_lesson_records (
  user_id       uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id     text        NOT NULL,
  course_key    text,
  learner_label text,
  age_band      text,
  completed_at  timestamptz,
  quiz_pct      int,
  quiz_passed   boolean,
  quiz_attempts int         NOT NULL DEFAULT 0,
  quiz_at       timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT learner_lesson_records_lesson_id_len  CHECK (length(lesson_id) BETWEEN 1 AND 120),
  CONSTRAINT learner_lesson_records_course_key_len CHECK (course_key IS NULL OR length(course_key) <= 120),
  CONSTRAINT learner_lesson_records_label_len      CHECK (learner_label IS NULL OR length(learner_label) <= 80),
  CONSTRAINT learner_lesson_records_age_band_len   CHECK (age_band IS NULL OR length(age_band) <= 24),
  CONSTRAINT learner_lesson_records_pct_range      CHECK (quiz_pct IS NULL OR (quiz_pct BETWEEN 0 AND 100)),
  CONSTRAINT learner_lesson_records_attempts_range CHECK (quiz_attempts BETWEEN 0 AND 10000)
);

CREATE INDEX IF NOT EXISTS learner_lesson_records_user_course_idx
  ON public.learner_lesson_records (user_id, course_key);

ALTER TABLE public.learner_lesson_records ENABLE ROW LEVEL SECURITY;

-- Read: my own record always; every learner's record for the Governor.
DROP POLICY IF EXISTS learner_lesson_records_read ON public.learner_lesson_records;
CREATE POLICY learner_lesson_records_read ON public.learner_lesson_records FOR SELECT
  USING (user_id = auth.uid() OR public.is_lesson_governor());

-- Write / correct / forget: strictly my own rows. The Governor WATCHES; he
-- never writes another learner's record, so no governor clause here.
DROP POLICY IF EXISTS learner_lesson_records_insert ON public.learner_lesson_records;
CREATE POLICY learner_lesson_records_insert ON public.learner_lesson_records FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS learner_lesson_records_update ON public.learner_lesson_records;
CREATE POLICY learner_lesson_records_update ON public.learner_lesson_records FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS learner_lesson_records_delete ON public.learner_lesson_records;
CREATE POLICY learner_lesson_records_delete ON public.learner_lesson_records FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_lesson_records TO authenticated;

-- Realtime, so a record written on his phone reaches an open screen without a
-- reload (the 0245 pattern; RLS still decides who hears about a row).
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'learner_lesson_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.learner_lesson_records;
    RAISE NOTICE '0250: added learner_lesson_records to supabase_realtime';
  END IF;

  -- Receipt: the table must now be published, or this migration failed.
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'learner_lesson_records'
  ) THEN
    RAISE EXCEPTION '0250: learner_lesson_records is still not in supabase_realtime';
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
