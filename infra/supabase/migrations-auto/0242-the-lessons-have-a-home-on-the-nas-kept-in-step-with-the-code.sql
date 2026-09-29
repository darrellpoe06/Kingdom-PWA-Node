-- =============================================================================
-- 0242 — the lessons have a home on the NAS, kept in step with the code, and
-- Darrell reads a gated lesson the moment it passes (DR-0677)
-- =============================================================================
-- Darrell 2026-09-29: "Why don't the lessons live on the nas?!!!!!!!!!!"
-- and the same morning: "The apps code is needed to keep context!!!!!!!%"
--
-- THE CODE STAYS THE MASTER. Every lesson lives in its course file in
-- app/src/lib; every session, review and git history reads it there. These
-- tables hold a SYNCHRONIZED COPY of that code on the sovereign database the
-- app already reads (REPOINT-ARMED): written by .github/workflows/lessons-sync.yml
-- after every merge that touches a course, checked lesson by lesson by the
-- parity gate (scripts/curriculum-parity.mjs), and read by the app through the
-- same-origin /sb transport with the bundled lessons as the fallback.
--
-- THE INSTANT PREVIEW (option A+, DR-0677). A lesson that has passed every gate
-- but is not yet in merged code (the NAS builder, PR #1837 / DR-0669, writes it
-- the moment its gates pass) is a row with status = 'preview' and its pr_url.
-- Only Darrell's two sign-ins and the Governor read it (is_curriculum_previewer).
-- Everyone else reads status = 'public' only — which only the sync writes, from
-- merged code. ENFORCED HERE, BY ROW LEVEL SECURITY, NOT BY THE APP.
--
-- TABLES (lossless against the course files' shapes; app/src/lib/curriculum-rows.js
-- is the one decomposition both directions use, proven by
-- app/src/__tests__/curriculum-round-trip.test.js):
--   curriculum_courses            one row per course: meta, session flow, entry
--   curriculum_lessons            one row per lesson: named columns + key_order
--                                 + rest (every other key, whole) + status/gate
--   curriculum_lesson_bands       levels.<band> text, in order
--   curriculum_lesson_quiz        quiz.questions[i], whole, with q / answer
--   curriculum_lesson_movements   movements[i] (the builder's shape), whole
--   curriculum_lesson_provenance  sources[i], and where the row came from
--   curriculum_lesson_verse_spans every "quotation" (Book C:V) a reader meets,
--                                 as the verse gate reads it (derived; checked)
--   curriculum_sync_runs          the receipt of every sync and parity pass
--
-- WHO READS: anyone, signed in or not, reads PUBLIC rows — exactly who reads the
-- bundled lessons today ("you can read everything here; nothing is locked",
-- learn-access-tiers.js). Previewers also read PREVIEW rows.
-- WHO WRITES: the service role (the sync, the NAS builder). The Governor may
-- stage or withdraw a PREVIEW row of his own; nobody but the service writes a
-- PUBLIC row. No row, of either status, is written without a passed gate stamp
-- over exactly its content (curriculum_lessons_require_gate).
--
-- No instance_id: the curriculum is the school's, not a household's, so it is
-- not tenant-scoped (DR-0060's tenancy guard governs instance_id tables); RLS is
-- on for every table all the same, and the preview wall is proven by
-- infra/supabase/tests/0242-curriculum-preview-smoke.sql.
-- IDEMPOTENT: IF NOT EXISTS, DROP+CREATE POLICY/TRIGGER, CREATE OR REPLACE.
-- =============================================================================

-- 0) Who may read a preview: Darrell's two sign-ins, or the Governor's doors.
CREATE OR REPLACE FUNCTION public.is_curriculum_previewer()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT coalesce(
    auth.uid() IN ('f13843f2-742b-4f8a-82af-7ecfbdc536ec'::uuid,
                   'c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc'::uuid)
    OR public.is_lesson_governor(),
    false);
$$;
REVOKE ALL ON FUNCTION public.is_curriculum_previewer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_curriculum_previewer() TO anon, authenticated;

-- 1) Courses.
CREATE TABLE IF NOT EXISTS curriculum_courses (
  course_key    text PRIMARY KEY,
  position      integer NOT NULL DEFAULT 0,
  title         text,
  category      text,
  wiring        text,
  unit_cap      text,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_flow  jsonb NOT NULL DEFAULT '[]'::jsonb,
  entry         jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_commit text,
  synced_at     timestamptz NOT NULL DEFAULT now()
);

-- 2) Lessons.
CREATE TABLE IF NOT EXISTS curriculum_lessons (
  course_key     text NOT NULL REFERENCES curriculum_courses(course_key) ON DELETE CASCADE,
  lesson_id      text NOT NULL,
  position       integer NOT NULL DEFAULT 0,
  key_order      text[] NOT NULL DEFAULT '{}',
  title          text,
  big_idea       text,
  in_app         text,
  lesson_text    text,
  anchor         jsonb,
  benefits       jsonb,
  facilitator    jsonb,
  child_keys     text[] NOT NULL DEFAULT '{}',
  rest           jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  status         text NOT NULL DEFAULT 'preview' CHECK (status IN ('preview', 'public')),
  pr_url         text,
  source_commit  text,
  gate_verdict   jsonb NOT NULL,
  updated_by     uuid,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_key, lesson_id)
);
-- One lesson id, one lesson, across the whole school (the structure gate's rule).
CREATE UNIQUE INDEX IF NOT EXISTS curriculum_lessons_id_once ON curriculum_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS curriculum_lessons_status_idx ON curriculum_lessons(status);

-- 3) The lesson's parts.
CREATE TABLE IF NOT EXISTS curriculum_lesson_bands (
  course_key text NOT NULL,
  lesson_id  text NOT NULL,
  band       text NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  text       text NOT NULL,
  PRIMARY KEY (course_key, lesson_id, band),
  FOREIGN KEY (course_key, lesson_id) REFERENCES curriculum_lessons(course_key, lesson_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS curriculum_lesson_quiz (
  course_key text NOT NULL,
  lesson_id  text NOT NULL,
  position   integer NOT NULL,
  q          text,
  answer     integer,
  question   jsonb NOT NULL,
  PRIMARY KEY (course_key, lesson_id, position),
  FOREIGN KEY (course_key, lesson_id) REFERENCES curriculum_lessons(course_key, lesson_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS curriculum_lesson_movements (
  course_key text NOT NULL,
  lesson_id  text NOT NULL,
  position   integer NOT NULL,
  title      text,
  text       text,
  movement   jsonb NOT NULL,
  PRIMARY KEY (course_key, lesson_id, position),
  FOREIGN KEY (course_key, lesson_id) REFERENCES curriculum_lessons(course_key, lesson_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS curriculum_lesson_provenance (
  course_key text NOT NULL,
  lesson_id  text NOT NULL,
  position   integer NOT NULL,
  kind       text NOT NULL DEFAULT 'source',
  detail     jsonb NOT NULL,
  PRIMARY KEY (course_key, lesson_id, position),
  FOREIGN KEY (course_key, lesson_id) REFERENCES curriculum_lessons(course_key, lesson_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS curriculum_lesson_verse_spans (
  course_key text NOT NULL,
  lesson_id  text NOT NULL,
  position   integer NOT NULL,
  field      text NOT NULL,
  quoted     text NOT NULL,
  book       text NOT NULL,
  chapter    integer NOT NULL,
  verses     text NOT NULL,
  PRIMARY KEY (course_key, lesson_id, position),
  FOREIGN KEY (course_key, lesson_id) REFERENCES curriculum_lessons(course_key, lesson_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS curriculum_lesson_verse_spans_ref_idx
  ON curriculum_lesson_verse_spans(book, chapter);

-- 4) The receipt of every sync and parity pass.
CREATE TABLE IF NOT EXISTS curriculum_sync_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_commit text,
  kind          text NOT NULL DEFAULT 'sync' CHECK (kind IN ('sync', 'parity')),
  courses       integer,
  lessons       integer,
  written       integer,
  removed       integer,
  drift         jsonb NOT NULL DEFAULT '[]'::jsonb,
  verdict       text NOT NULL CHECK (verdict IN ('in-step', 'drift', 'refused')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 5) No row without a passed gate over exactly its content.
-- The gates themselves are JavaScript (scripts/curriculum-gates.mjs — the same
-- functions the repo's tests run); a database cannot run them. What it CAN do
-- is refuse any row that does not carry a PASSED verdict over exactly this
-- content, and refuse an edit that changes the content without a fresh gate run
-- (a hand edit in the studio, a stale stamp). The parity gate then compares the
-- whole copy, parts included, with the code.
CREATE OR REPLACE FUNCTION public.curriculum_lessons_require_gate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.gate_verdict IS NULL
     OR coalesce(NEW.gate_verdict->>'passed', 'false') <> 'true' THEN
    RAISE EXCEPTION 'curriculum: % carries no passed gate verdict', NEW.lesson_id USING ERRCODE = '23514';
  END IF;
  IF coalesce(NEW.gate_verdict->>'content_sha256', '') <> NEW.content_sha256 THEN
    RAISE EXCEPTION 'curriculum: %''s gate verdict is over different content', NEW.lesson_id USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.content_sha256 IS DISTINCT FROM OLD.content_sha256
     AND coalesce(NEW.gate_verdict->>'run_id', '') = coalesce(OLD.gate_verdict->>'run_id', '') THEN
    RAISE EXCEPTION 'curriculum: % changed without a fresh gate run', NEW.lesson_id USING ERRCODE = '23514';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS curriculum_lessons_require_gate ON curriculum_lessons;
CREATE TRIGGER curriculum_lessons_require_gate
  BEFORE INSERT OR UPDATE ON curriculum_lessons
  FOR EACH ROW EXECUTE FUNCTION public.curriculum_lessons_require_gate();

-- 6) Row level security.
ALTER TABLE curriculum_courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_lessons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_lesson_bands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_lesson_quiz        ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_lesson_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_lesson_provenance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_lesson_verse_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_sync_runs          ENABLE ROW LEVEL SECURITY;

-- A lesson row is visible when it is public, or to a previewer.
CREATE OR REPLACE FUNCTION public.curriculum_lesson_visible(p_course text, p_lesson text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM curriculum_lessons l
     WHERE l.course_key = p_course AND l.lesson_id = p_lesson
       AND (l.status = 'public' OR public.is_curriculum_previewer())
  );
$$;
REVOKE ALL ON FUNCTION public.curriculum_lesson_visible(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.curriculum_lesson_visible(text, text) TO anon, authenticated;

DROP POLICY IF EXISTS curriculum_courses_read ON curriculum_courses;
CREATE POLICY curriculum_courses_read ON curriculum_courses FOR SELECT USING (true);

DROP POLICY IF EXISTS curriculum_lessons_read ON curriculum_lessons;
CREATE POLICY curriculum_lessons_read ON curriculum_lessons FOR SELECT
  USING (status = 'public' OR public.is_curriculum_previewer());

-- The Governor stages and withdraws PREVIEW rows; never a public one.
DROP POLICY IF EXISTS curriculum_lessons_preview_insert ON curriculum_lessons;
CREATE POLICY curriculum_lessons_preview_insert ON curriculum_lessons FOR INSERT TO authenticated
  WITH CHECK (public.is_lesson_governor() AND status = 'preview' AND updated_by = auth.uid());
DROP POLICY IF EXISTS curriculum_lessons_preview_update ON curriculum_lessons;
CREATE POLICY curriculum_lessons_preview_update ON curriculum_lessons FOR UPDATE TO authenticated
  USING (public.is_lesson_governor() AND status = 'preview')
  WITH CHECK (public.is_lesson_governor() AND status = 'preview' AND updated_by = auth.uid());
DROP POLICY IF EXISTS curriculum_lessons_preview_delete ON curriculum_lessons;
CREATE POLICY curriculum_lessons_preview_delete ON curriculum_lessons FOR DELETE TO authenticated
  USING (public.is_lesson_governor() AND status = 'preview');

-- The parts follow their lesson. The preview write is split per command and
-- TO authenticated: a FOR ALL policy is also a SELECT policy, and would ask
-- is_lesson_governor() of anon on every read (found by the smoke, 2026-09-29).
CREATE OR REPLACE FUNCTION public.curriculum_preview_part(p_course text, p_lesson text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_lesson_governor() AND EXISTS (
    SELECT 1 FROM curriculum_lessons l
     WHERE l.course_key = p_course AND l.lesson_id = p_lesson AND l.status = 'preview');
$$;
REVOKE ALL ON FUNCTION public.curriculum_preview_part(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.curriculum_preview_part(text, text) TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['curriculum_lesson_bands', 'curriculum_lesson_quiz', 'curriculum_lesson_movements',
                           'curriculum_lesson_provenance', 'curriculum_lesson_verse_spans'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_read', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (public.curriculum_lesson_visible(course_key, lesson_id))',
                   t || '_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_preview_write', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_preview_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (public.curriculum_preview_part(course_key, lesson_id))',
                   t || '_preview_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_preview_update', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (public.curriculum_preview_part(course_key, lesson_id)) WITH CHECK (public.curriculum_preview_part(course_key, lesson_id))',
                   t || '_preview_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_preview_delete', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (public.curriculum_preview_part(course_key, lesson_id))',
                   t || '_preview_delete', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS curriculum_sync_runs_read ON curriculum_sync_runs;
CREATE POLICY curriculum_sync_runs_read ON curriculum_sync_runs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Grants: read for both roles; the preview write for signed-in (RLS narrows it
-- to the Governor); everything else is the service role's.
GRANT SELECT ON curriculum_courses, curriculum_lessons, curriculum_lesson_bands, curriculum_lesson_quiz,
                curriculum_lesson_movements, curriculum_lesson_provenance, curriculum_lesson_verse_spans
  TO anon, authenticated;
GRANT SELECT ON curriculum_sync_runs TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON curriculum_courses, curriculum_sync_runs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON curriculum_lessons, curriculum_lesson_bands, curriculum_lesson_quiz,
                                 curriculum_lesson_movements, curriculum_lesson_provenance,
                                 curriculum_lesson_verse_spans FROM anon;
GRANT INSERT, UPDATE, DELETE ON curriculum_lessons, curriculum_lesson_bands, curriculum_lesson_quiz,
                                curriculum_lesson_movements, curriculum_lesson_provenance,
                                curriculum_lesson_verse_spans TO authenticated;
