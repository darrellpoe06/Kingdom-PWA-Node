-- =============================================================================
-- 0250 LEARNER RECORD SMOKE — a learner keeps his own record, the Governor sees
-- every learner's, and no learner sees another's (DR-0754)
-- =============================================================================
-- Run as postgres AFTER scripts/curriculum-ci-bootstrap.sql, 0250, 0312, 0313 and 0316, in a
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
  vr  text[];
  rd  text;
  rd2 text;
  done boolean;
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

  -- 8. WHICH VERSIONS WERE READ, and a version read stays read (0312, DR-1255).
  --    The son files the adult version from one device; his tablet, which has
  --    not seen that yet, files the child version alone — the row keeps both,
  --    in the picker's order, each once; an empty update keeps them too.
  PERFORM pg_temp.as_user(son);
  INSERT INTO public.learner_lesson_records (lesson_id, course_key, completed_at, versions_read)
  VALUES ('L104', 'living-lessons', now(), ARRAY['adult','adult']);
  SELECT versions_read INTO vr FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L104';
  IF vr <> ARRAY['adult'] THEN RAISE EXCEPTION 'FAIL: an insert did not normalise the versions (%)', vr; END IF;
  UPDATE public.learner_lesson_records SET versions_read = ARRAY['child'], updated_at = now()
   WHERE user_id = son AND lesson_id = 'L104';
  SELECT versions_read INTO vr FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L104';
  IF vr <> ARRAY['child','adult'] THEN RAISE EXCEPTION 'FAIL: a later device''s subset shrank the versions read (%)', vr; END IF;
  UPDATE public.learner_lesson_records SET versions_read = '{}', updated_at = now()
   WHERE user_id = son AND lesson_id = 'L104';
  SELECT versions_read INTO vr FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L104';
  IF vr <> ARRAY['child','adult'] THEN RAISE EXCEPTION 'FAIL: an empty update erased the versions read (%)', vr; END IF;
  -- An exam filed by column leaves the read and its versions alone.
  INSERT INTO public.learner_lesson_records (lesson_id, quiz_pct, quiz_passed, quiz_attempts, quiz_at)
  VALUES ('L104', 90, true, 1, now())
  ON CONFLICT (user_id, lesson_id) DO UPDATE
    SET quiz_pct = excluded.quiz_pct, quiz_passed = excluded.quiz_passed,
        quiz_attempts = excluded.quiz_attempts, quiz_at = excluded.quiz_at, updated_at = now();
  SELECT versions_read, (completed_at IS NOT NULL) INTO vr, done
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L104';
  IF vr <> ARRAY['child','adult'] OR NOT done THEN RAISE EXCEPTION 'FAIL: an exam erased the read (versions=%, completed=%)', vr, done; END IF;

  -- 9. A version the app cannot show is refused by the wall.
  BEGIN
    INSERT INTO public.learner_lesson_records (lesson_id, versions_read) VALUES ('L105', ARRAY['grown-up']);
    RAISE EXCEPTION 'LEAK: an unknown version was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  DELETE FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L104';

  -- 10. EVERY EXAM ATTEMPT IS KEPT, AND THE BEST SCORE STANDS (0313, DR-1264).
  --     A fail, then a pass, then a lower retake: three entries in the ledger,
  --     the row's score is the best, the pass stays, attempts never shrink, and
  --     a history the client sends is ignored.
  INSERT INTO public.learner_lesson_records (lesson_id, course_key, age_band, quiz_pct, quiz_passed, quiz_attempts, quiz_at)
  VALUES ('L106', 'living-lessons', 'adult', 60, false, 1, '2026-10-28 01:00:00+00');
  SELECT jsonb_array_length(quiz_history), quiz_pct INTO n, pct
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L106';
  IF n <> 1 OR pct <> 60 THEN RAISE EXCEPTION 'FAIL: the first attempt was not entered in the ledger (entries=%, pct=%)', n, pct; END IF;
  INSERT INTO public.learner_lesson_records (lesson_id, quiz_pct, quiz_passed, quiz_attempts, quiz_at)
  VALUES ('L106', 100, true, 2, '2026-10-28 01:10:00+00')
  ON CONFLICT (user_id, lesson_id) DO UPDATE
    SET quiz_pct = excluded.quiz_pct, quiz_passed = excluded.quiz_passed,
        quiz_attempts = excluded.quiz_attempts, quiz_at = excluded.quiz_at, updated_at = now();
  INSERT INTO public.learner_lesson_records (lesson_id, quiz_pct, quiz_passed, quiz_attempts, quiz_at, quiz_history)
  VALUES ('L106', 40, false, 1, '2026-10-28 01:20:00+00', '[]'::jsonb)
  ON CONFLICT (user_id, lesson_id) DO UPDATE
    SET quiz_pct = excluded.quiz_pct, quiz_passed = excluded.quiz_passed,
        quiz_attempts = excluded.quiz_attempts, quiz_at = excluded.quiz_at,
        quiz_history = excluded.quiz_history, updated_at = now();
  SELECT jsonb_array_length(quiz_history), quiz_pct, quiz_attempts, quiz_passed INTO n, pct, att, done
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L106';
  IF n <> 3 THEN RAISE EXCEPTION 'FAIL: the ledger holds % entries after three attempts (expected 3; a client-sent history must be ignored)', n; END IF;
  IF pct <> 100 OR NOT done THEN RAISE EXCEPTION 'FAIL: a lower retake lowered the record (pct=%, passed=%)', pct, done; END IF;
  IF att <> 3 THEN RAISE EXCEPTION 'FAIL: attempts read % (expected 3, never below the ledger)', att; END IF;
  SELECT (quiz_history -> 2 ->> 'pct')::int, (quiz_history -> 0 ->> 'pct')::int INTO pct, n
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L106';
  IF pct <> 40 OR n <> 60 THEN RAISE EXCEPTION 'FAIL: the ledger is not in order (first=%, last=%)', n, pct; END IF;
  -- A mark-read that names no exam leaves the ledger, the best and the moment alone.
  UPDATE public.learner_lesson_records SET completed_at = now(), updated_at = now()
   WHERE user_id = son AND lesson_id = 'L106';
  SELECT jsonb_array_length(quiz_history), quiz_pct INTO n, pct
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L106';
  IF n <> 3 OR pct <> 100 THEN RAISE EXCEPTION 'FAIL: a read touched the exam ledger (entries=%, pct=%)', n, pct; END IF;
  DELETE FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L106';

  -- 11. HOW EACH ATTEMPT WAS TAKEN, AND THE READING ON EVIDENCE (0316, DR-1396).
  --     The attempt's `taken` lands in its ledger entry, cleaned to the known
  --     keys; anything else is dropped; the row keeps the latest; a mark-read
  --     leaves it; the evidenced reading ratchets and refuses a future moment.
  INSERT INTO public.learner_lesson_records (lesson_id, course_key, age_band, quiz_pct, quiz_passed, quiz_attempts, quiz_at, quiz_taken)
  VALUES ('L107', 'living-lessons', 'adult', 100, true, 1, '2026-11-10 09:00:00+00',
          '{"reading":"before","readPct":0,"secsPerQuestion":0.4,"rushed":true,"firstTry":true,"eyesWpm":null,"evil":"x","readPct2":5}'::jsonb);
  SELECT quiz_history -> 0 -> 'taken' ->> 'reading', quiz_taken ->> 'reading' INTO rd, rd2
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L107';
  SELECT (quiz_history -> 0 -> 'taken' ->> 'rushed')::boolean INTO done
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L107';
  IF rd IS DISTINCT FROM 'before' OR NOT done THEN RAISE EXCEPTION 'FAIL: how the attempt was taken did not reach its ledger entry (reading=%, rushed=%)', rd, done; END IF;
  SELECT (quiz_history -> 0 -> 'taken') ? 'evil' OR (quiz_history -> 0 -> 'taken') ? 'readPct2' INTO done
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L107';
  IF done THEN RAISE EXCEPTION 'FAIL: an unknown key reached the ledger'; END IF;
  IF rd2 IS DISTINCT FROM 'before' THEN RAISE EXCEPTION 'FAIL: the row does not keep the latest attempt (quiz_taken.reading=%)', rd2; END IF;
  -- A second attempt after reading: its own entry says after; the row now says after.
  UPDATE public.learner_lesson_records
     SET quiz_pct = 90, quiz_passed = true, quiz_attempts = 2, quiz_at = '2026-11-10 09:30:00+00',
         quiz_taken = '{"reading":"after","readPct":100,"secsPerQuestion":12,"rushed":false,"firstTry":false,"eyesWpm":240}'::jsonb,
         read_evidence_at = '2026-11-10 09:20:00+00', updated_at = now()
   WHERE user_id = son AND lesson_id = 'L107';
  SELECT jsonb_array_length(quiz_history), quiz_history -> 1 -> 'taken' ->> 'reading', (quiz_history -> 1 -> 'taken' ->> 'eyesWpm')::int
    INTO n, rd, pct
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L107';
  IF n <> 2 OR rd IS DISTINCT FROM 'after' OR pct <> 240 THEN RAISE EXCEPTION 'FAIL: the second attempt was not kept with how it was taken (entries=%, reading=%, eyes=%)', n, rd, pct; END IF;
  -- A mark-read that names no attempt leaves quiz_taken; a later or cleared read moment never moves the evidence.
  UPDATE public.learner_lesson_records SET completed_at = now(), read_evidence_at = NULL, quiz_taken = '{"reading":"partly"}'::jsonb, updated_at = now()
   WHERE user_id = son AND lesson_id = 'L107';
  SELECT quiz_taken ->> 'reading', (read_evidence_at = '2026-11-10 09:20:00+00'::timestamptz) INTO rd, done
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L107';
  IF rd IS DISTINCT FROM 'after' THEN RAISE EXCEPTION 'FAIL: a write without an attempt replaced quiz_taken (%)', rd; END IF;
  IF NOT done THEN RAISE EXCEPTION 'FAIL: the evidenced reading was cleared or moved'; END IF;
  UPDATE public.learner_lesson_records SET read_evidence_at = '2026-11-10 10:00:00+00', updated_at = now()
   WHERE user_id = son AND lesson_id = 'L107';
  SELECT (read_evidence_at = '2026-11-10 09:20:00+00'::timestamptz) INTO done
    FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L107';
  IF NOT done THEN RAISE EXCEPTION 'FAIL: a later moment replaced the first evidenced reading'; END IF;
  INSERT INTO public.learner_lesson_records (lesson_id, read_evidence_at) VALUES ('L108', now() + interval '30 days');
  SELECT read_evidence_at IS NULL INTO done FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L108';
  IF NOT done THEN RAISE EXCEPTION 'FAIL: a reading evidenced in the future was accepted'; END IF;
  -- A quiz_taken that names no attempt, or is not an object, is never stored.
  INSERT INTO public.learner_lesson_records (lesson_id, quiz_taken) VALUES ('L109', '["not","an","object"]'::jsonb);
  SELECT quiz_taken IS NULL INTO done FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L109';
  IF NOT done THEN RAISE EXCEPTION 'LEAK: a quiz_taken with no attempt was stored'; END IF;
  INSERT INTO public.learner_lesson_records (lesson_id, quiz_at, quiz_pct, quiz_taken) VALUES ('L110', '2026-11-10 11:00:00+00', 50, '["not","an","object"]'::jsonb);
  SELECT quiz_taken IS NULL AND NOT ((quiz_history -> 0) ? 'taken') INTO done FROM public.learner_lesson_records WHERE user_id = son AND lesson_id = 'L110';
  IF NOT done THEN RAISE EXCEPTION 'LEAK: a quiz_taken that is not an object reached the record'; END IF;
  -- The attempts view gives one plain row per attempt, under the same read wall.
  SELECT count(*), max(eyes_wpm), bool_or(rushed) INTO n, pct, done
    FROM public.learner_exam_attempts WHERE lesson_id = 'L107';
  IF n <> 2 OR pct <> 240 OR NOT done THEN RAISE EXCEPTION 'FAIL: the attempts view does not show both attempts as taken (rows=%, eyes=%, rushed=%)', n, pct, done; END IF;
  PERFORM pg_temp.as_user(other);
  SELECT count(*) INTO n FROM public.learner_exam_attempts WHERE lesson_id = 'L107';
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: another learner sees % of this learner''s attempts through the view', n; END IF;
  PERFORM pg_temp.as_user(son);
  DELETE FROM public.learner_lesson_records WHERE user_id = son AND lesson_id IN ('L107', 'L108', 'L109', 'L110');

  PERFORM pg_temp.as_postgres();
  RAISE NOTICE 'LEARNER RECORD SMOKE: PASS';
END $$;

ROLLBACK;
