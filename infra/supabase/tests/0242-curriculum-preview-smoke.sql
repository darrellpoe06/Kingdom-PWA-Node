-- =============================================================================
-- 0242 CURRICULUM PREVIEW SMOKE — a gated lesson Darrell previews, nobody else
-- reads until it is merged code (DR-0677)
-- =============================================================================
-- Run as postgres AFTER applying 0237 and 0242, in a transaction that ROLLS BACK.
-- The Governor's email list is swapped for a test address INSIDE the
-- transaction only (lesson_governor_emails, as the 0237 smoke does), so no real
-- account is touched. Darrell's own sign-in is proven by uid (the claim only;
-- no auth.users row is written for it).
-- PROVES:
--   anyone (anon, a member) reads a PUBLIC lesson and its parts;
--   anon and a member read NO preview lesson and NO part of one;
--   Darrell's uid and the Governor read the preview and its parts;
--   the Governor may stage a PREVIEW row, never a PUBLIC one, and cannot touch
--   a public row; a member can stage nothing;
--   no row without a passed gate over exactly its content; no content change
--   without a fresh gate run;
--   PROVEN-TO-CATCH: with the read policy opened (USING true), the same member
--   check DOES see the preview — so the check above is not measuring nothing.
-- PASS prints 'CURRICULUM PREVIEW SMOKE: PASS'; any wrong grant RAISES.
-- =============================================================================
BEGIN;

\set gov 'a0000000-0000-4000-a000-000000000242'
\set mem 'b0000000-0000-4000-a000-000000000242'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'gov', 'authenticated','authenticated','gov0242@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mem', 'authenticated','authenticated','mem0242@test.local','', now(), now());

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0242@test.local']::text[] $$;

CREATE OR REPLACE FUNCTION pg_temp.v(_sha text, _run text DEFAULT 'run-1')
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object('passed', true, 'run_id', _run, 'content_sha256', _sha, 'gate', 'smoke')
$$;

CREATE OR REPLACE FUNCTION pg_temp.as_role(_role text, _who uuid, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', _role, true);
  PERFORM set_config('request.jwt.claims',
    CASE WHEN _who IS NULL THEN json_build_object('role', _role)::text
         ELSE json_build_object('sub', _who, 'role', _role)::text END, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    PERFORM set_config('request.jwt.claims', '', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_role text, _who uuid, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', _role, true);
  PERFORM set_config('request.jwt.claims',
    CASE WHEN _who IS NULL THEN json_build_object('role', _role)::text
         ELSE json_build_object('sub', _who, 'role', _role)::text END, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  RETURN n;
END $$;

INSERT INTO curriculum_courses (course_key, title) VALUES ('smoke-0242', 'Smoke course')
ON CONFLICT (course_key) DO NOTHING;
INSERT INTO curriculum_lessons (course_key, lesson_id, title, content_sha256, status, gate_verdict)
VALUES ('smoke-0242', 'smoke0242-public',  'Public',  repeat('a', 64), 'public',  pg_temp.v(repeat('a', 64))),
       ('smoke-0242', 'smoke0242-preview', 'Preview', repeat('b', 64), 'preview', pg_temp.v(repeat('b', 64)));
INSERT INTO curriculum_lesson_bands (course_key, lesson_id, band, position, text)
VALUES ('smoke-0242', 'smoke0242-public',  'child', 0, 'public band'),
       ('smoke-0242', 'smoke0242-preview', 'child', 0, 'preview band');

DO $$
DECLARE
  gov uuid := 'a0000000-0000-4000-a000-000000000242';
  mem uuid := 'b0000000-0000-4000-a000-000000000242';
  darrell uuid := 'f13843f2-742b-4f8a-82af-7ecfbdc536ec';
  n int;
  q_lessons text := 'SELECT count(*) FROM curriculum_lessons WHERE lesson_id = ''smoke0242-preview''';
  q_bands   text := 'SELECT count(*) FROM curriculum_lesson_bands WHERE lesson_id = ''smoke0242-preview''';
  q_public  text := 'SELECT count(*) FROM curriculum_lessons l JOIN curriculum_lesson_bands b USING (course_key, lesson_id) WHERE l.lesson_id = ''smoke0242-public''';
BEGIN
  -- Everyone reads the public lesson and its band.
  IF pg_temp.count_as('anon', NULL, q_public) <> 1 THEN RAISE EXCEPTION 'FAIL: anon cannot read a public lesson'; END IF;
  IF pg_temp.count_as('authenticated', mem, q_public) <> 1 THEN RAISE EXCEPTION 'FAIL: a member cannot read a public lesson'; END IF;

  -- Nobody but a previewer reads the preview, or any part of it.
  n := pg_temp.count_as('anon', NULL, q_lessons);
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: anon read a preview lesson (got %)', n; END IF;
  n := pg_temp.count_as('anon', NULL, q_bands);
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: anon read a preview band (got %)', n; END IF;
  n := pg_temp.count_as('authenticated', mem, q_lessons);
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: a member read a preview lesson (got %)', n; END IF;
  n := pg_temp.count_as('authenticated', mem, q_bands);
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: a member read a preview band (got %)', n; END IF;

  -- Darrell's sign-in and the Governor read it.
  IF pg_temp.count_as('authenticated', darrell, q_lessons) <> 1 THEN RAISE EXCEPTION 'FAIL: Darrell cannot read the preview'; END IF;
  IF pg_temp.count_as('authenticated', darrell, q_bands) <> 1 THEN RAISE EXCEPTION 'FAIL: Darrell cannot read the preview band'; END IF;
  IF pg_temp.count_as('authenticated', gov, q_lessons) <> 1 THEN RAISE EXCEPTION 'FAIL: the Governor cannot read the preview'; END IF;

  -- Writes: the Governor stages a preview, never a public row; a member nothing.
  IF NOT pg_temp.as_role('authenticated', gov, format(
      'INSERT INTO curriculum_lessons (course_key, lesson_id, title, content_sha256, status, gate_verdict, updated_by) VALUES (''smoke-0242'', ''smoke0242-staged'', ''Staged'', %L, ''preview'', %L, %L)',
      repeat('c', 64), pg_temp.v(repeat('c', 64)), gov)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not stage a preview';
  END IF;
  IF pg_temp.as_role('authenticated', gov, format(
      'INSERT INTO curriculum_lessons (course_key, lesson_id, title, content_sha256, status, gate_verdict, updated_by) VALUES (''smoke-0242'', ''smoke0242-forged'', ''Forged'', %L, ''public'', %L, %L)',
      repeat('d', 64), pg_temp.v(repeat('d', 64)), gov)) THEN
    RAISE EXCEPTION 'LEAK: the Governor wrote a PUBLIC row (only merged code, through the sync, may)';
  END IF;
  PERFORM pg_temp.as_role('authenticated', gov, 'UPDATE curriculum_lessons SET title = ''edited'' WHERE lesson_id = ''smoke0242-public''');
  IF (SELECT title FROM curriculum_lessons WHERE lesson_id = 'smoke0242-public') <> 'Public' THEN
    RAISE EXCEPTION 'LEAK: the Governor edited a public row';
  END IF;
  IF pg_temp.as_role('authenticated', mem, format(
      'INSERT INTO curriculum_lessons (course_key, lesson_id, title, content_sha256, status, gate_verdict, updated_by) VALUES (''smoke-0242'', ''smoke0242-member'', ''M'', %L, ''preview'', %L, %L)',
      repeat('e', 64), pg_temp.v(repeat('e', 64)), mem)) THEN
    RAISE EXCEPTION 'LEAK: a member staged a lesson';
  END IF;
  IF pg_temp.as_role('anon', NULL, 'DELETE FROM curriculum_lessons WHERE lesson_id = ''smoke0242-public''') THEN
    IF NOT EXISTS (SELECT 1 FROM curriculum_lessons WHERE lesson_id = 'smoke0242-public') THEN
      RAISE EXCEPTION 'LEAK: anon deleted a lesson';
    END IF;
  END IF;

  -- The gate stamp.
  BEGIN
    INSERT INTO curriculum_lessons (course_key, lesson_id, title, content_sha256, status, gate_verdict)
    VALUES ('smoke-0242', 'smoke0242-ungated', 'U', repeat('f', 64), 'public',
            jsonb_build_object('passed', false, 'run_id', 'x', 'content_sha256', repeat('f', 64)));
    RAISE EXCEPTION 'FAIL: a row with a FAILED gate verdict was written';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO curriculum_lessons (course_key, lesson_id, title, content_sha256, status, gate_verdict)
    VALUES ('smoke-0242', 'smoke0242-otherhash', 'O', repeat('1', 64), 'public', pg_temp.v(repeat('2', 64)));
    RAISE EXCEPTION 'FAIL: a verdict over DIFFERENT content was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE curriculum_lessons SET content_sha256 = repeat('9', 64),
           gate_verdict = gate_verdict || jsonb_build_object('content_sha256', repeat('9', 64))
     WHERE lesson_id = 'smoke0242-public';
    RAISE EXCEPTION 'FAIL: content changed without a fresh gate run';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  UPDATE curriculum_lessons SET content_sha256 = repeat('9', 64), gate_verdict = pg_temp.v(repeat('9', 64), 'run-2')
   WHERE lesson_id = 'smoke0242-public';

  -- PROVEN-TO-CATCH: open the wall; the member check above must now SEE it.
  DROP POLICY curriculum_lessons_read ON curriculum_lessons;
  CREATE POLICY curriculum_lessons_read ON curriculum_lessons FOR SELECT USING (true);
  n := pg_temp.count_as('authenticated', mem, q_lessons);
  IF n <> 1 THEN RAISE EXCEPTION 'THEATER: with the wall opened the member check still saw nothing (got %)', n; END IF;

  RAISE NOTICE 'CURRICULUM PREVIEW SMOKE: PASS';
END $$;

ROLLBACK;
