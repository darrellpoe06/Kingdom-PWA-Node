-- =============================================================================
-- 0250 LEARNER RECORD SMOKE — a learner keeps his own record, the Governor sees
-- every learner's, and no learner sees another's (DR-0754)
-- =============================================================================
-- Run as postgres AFTER scripts/curriculum-ci-bootstrap.sql and 0250, in a
-- transaction that ROLLS BACK. The Governor's email list is swapped for a test
-- address INSIDE the transaction only, so no real account is touched.
-- PROVES:
--   * a learner writes his own record and reads it back;
--   * the record lands under his own account even when the payload lies;
--   * a second reading of the same lesson corrects the row, never duplicates;
--   * one learner cannot read, write, correct or delete another learner's row;
--   * the Governor reads EVERY learner's rows and can write none of them;
--   * anon reads nothing;
--   * the constraints refuse an out-of-range score.
-- PASS prints 'LEARNER RECORD SMOKE: PASS'; any leak RAISES.
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000250', 'authenticated','authenticated','gov0250@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000250', 'authenticated','authenticated','son0250@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-a000-000000000250', 'authenticated','authenticated','oth0250@test.local','', now(), now());

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0250@test.local']::text[] $$;

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  PERFORM set_config('role', 'anon', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.as_user(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION pg_temp.as_anon() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION pg_temp.as_postgres() TO authenticated, anon;

DO $$
DECLARE
  son   uuid := 'b0000000-0000-4000-a000-000000000250';
  other uuid := 'c0000000-0000-4000-a000-000000000250';
  gov   uuid := 'a0000000-0000-4000-a000-000000000250';
  n   int;
  pct int;
  att int;
BEGIN
  -- 1. The learner keeps his own record and reads it back.
  PERFORM pg_temp.as_user(son);
  INSERT INTO public.learner_lesson_records
    (lesson_id, course_key, learner_label, age_band, completed_at, quiz_pct, quiz_passed, quiz_attempts, quiz_at)
  VALUES ('L101', 'living-lessons', 'Son', 'teen', now(), 80, true, 1, now());
  SELECT count(*) INTO n FROM public.learner_lesson_records WHERE user_id = son;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the learner''s own record did not come back (% rows)', n; END IF;

  -- 2. The row lands under his own account even when the payload lies.
  BEGIN
    INSERT INTO public.learner_lesson_records (user_id, lesson_id) VALUES (other, 'L102');
    RAISE EXCEPTION 'LEAK: a learner filed a record under another account';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- 3. A second reading corrects the row; it never duplicates.
  INSERT INTO public.learner_lesson_records (lesson_id, course_key, quiz_pct, quiz_passed, quiz_attempts, quiz_at)
  VALUES ('L101', 'living-lessons', 100, true, 2, now())
  ON CONFLICT (user_id, lesson_id) DO UPDATE
    SET quiz_pct = excluded.quiz_pct,
        quiz_passed = excluded.quiz_passed,
        quiz_attempts = excluded.quiz_attempts,
        quiz_at = excluded.quiz_at,
        updated_at = now();
  SELECT count(*), max(quiz_pct), max(quiz_attempts) INTO n, pct, att
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L101';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the same lesson made % rows (expected 1)', n; END IF;
  IF pct <> 100 OR att <> 2 THEN RAISE EXCEPTION 'FAIL: the record did not take the second attempt (pct=%, attempts=%)', pct, att; END IF;

  -- 4. An out-of-range score is refused by the wall, not by the screen.
  BEGIN
    INSERT INTO public.learner_lesson_records (lesson_id, quiz_pct) VALUES ('L103', 140);
    RAISE EXCEPTION 'LEAK: a score of 140 was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- 5. Another learner sees nothing of his, and cannot touch it.
  PERFORM pg_temp.as_user(other);
  INSERT INTO public.learner_lesson_records (lesson_id, course_key, quiz_pct, quiz_passed, quiz_attempts, quiz_at)
  VALUES ('L101', 'living-lessons', 40, false, 1, now());
  SELECT count(*) INTO n FROM public.learner_lesson_records;
  IF n <> 1 THEN RAISE EXCEPTION 'LEAK: another learner read % rows (expected only their own)', n; END IF;
  SELECT count(*) INTO n FROM public.learner_lesson_records WHERE user_id = son;
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: another learner read the son''s record'; END IF;
  UPDATE public.learner_lesson_records SET quiz_pct = 0 WHERE user_id = son;
  IF FOUND THEN RAISE EXCEPTION 'LEAK: another learner corrected the son''s record'; END IF;
  DELETE FROM public.learner_lesson_records WHERE user_id = son;
  IF FOUND THEN RAISE EXCEPTION 'LEAK: another learner deleted the son''s record'; END IF;

  -- 6. The Governor reads every learner's record and writes none.
  PERFORM pg_temp.as_user(gov);
  SELECT count(*) INTO n FROM public.learner_lesson_records;
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: the Governor saw % records (expected 2)', n; END IF;
  SELECT count(DISTINCT user_id) INTO n FROM public.learner_lesson_records;
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: the Governor saw % learners (expected 2)', n; END IF;
  UPDATE public.learner_lesson_records SET quiz_pct = 1 WHERE user_id = son;
  IF FOUND THEN RAISE EXCEPTION 'LEAK: the Governor rewrote a learner''s record'; END IF;
  DELETE FROM public.learner_lesson_records WHERE user_id = son;
  IF FOUND THEN RAISE EXCEPTION 'LEAK: the Governor deleted a learner''s record'; END IF;
  BEGIN
    INSERT INTO public.learner_lesson_records (user_id, lesson_id) VALUES (son, 'L999');
    RAISE EXCEPTION 'LEAK: the Governor filed a record for a learner';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- 7. anon reads nothing.
  PERFORM pg_temp.as_anon();
  BEGIN
    SELECT count(*) INTO n FROM public.learner_lesson_records;
    IF n <> 0 THEN RAISE EXCEPTION 'LEAK: anon read % learner records', n; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM pg_temp.as_postgres();
  RAISE NOTICE 'LEARNER RECORD SMOKE: PASS';
END $$;

ROLLBACK;
