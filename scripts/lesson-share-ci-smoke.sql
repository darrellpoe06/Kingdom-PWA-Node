-- =============================================================================
-- lesson-share-ci-smoke.sql — 0244 proven on a real PostgreSQL (DR-0698)
-- =============================================================================
-- Run by the CI `lesson-shares` job against a throwaway postgres:16 after
-- scripts/curriculum-ci-bootstrap.sql (roles, auth.users, auth.uid(), the
-- Governor functions) and 0244 applied twice. Every check RAISEs on a wrong
-- answer, so a break is a red job, never a quiet pass. Everything runs in one
-- transaction and is rolled back: nothing is left behind.
--
-- It proves the walls the record promises:
--   * a signed-out browser can record a share and an open, and read NOTHING;
--   * a sharer reads their own shares and not another member's;
--   * opens row by row are the Governor's alone; a sharer sees counts;
--   * the Governor's ledger holds every share with its counts;
--   * shape and flood limits refuse what they must.
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'member-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'member-b@example.test'),
  ('00000000-0000-0000-0000-0000000000cc', 'darrellpoe06@gmail.com');

-- --- a signed-out reader shares, and cannot read -------------------------------
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{}', true);
SELECT public.lesson_share_record('anonShare01', jsonb_build_object(
  'courseKey', 'living-lessons', 'lessonId', 'l1', 'lessonTitle', 'One',
  'method', 'copy', 'url', 'https://poetech.us/lovecorner/app/?view=church&sub=learn&course=living-lessons&lesson=l1&s=anonShare01'));
DO $$ BEGIN
  PERFORM 1 FROM public.lesson_shares;
  RAISE EXCEPTION 'SMOKE FAIL: anon read lesson_shares';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN
  PERFORM 1 FROM public.lesson_share_opens;
  RAISE EXCEPTION 'SMOKE FAIL: anon read lesson_share_opens';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN
  INSERT INTO public.lesson_shares (token, course_key, lesson_id, method, url) VALUES ('directWrite1', 'c', 'l', 'copy', 'https://x/?s=directWrite1');
  RAISE EXCEPTION 'SMOKE FAIL: anon wrote lesson_shares directly';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
DO $$ BEGIN
  PERFORM public.lesson_share_ledger(false);
  RAISE EXCEPTION 'SMOKE FAIL: anon called the ledger';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

-- An open of a real token is recorded; an unknown token is a quiet false.
DO $$ BEGIN
  IF NOT public.lesson_share_open('anonShare01', 'ok', NULL) THEN RAISE EXCEPTION 'SMOKE FAIL: anon open not recorded'; END IF;
  IF NOT public.lesson_share_open('anonShare01', 'failed', 'Lesson not found: L1 <script>') THEN RAISE EXCEPTION 'SMOKE FAIL: failed open not recorded'; END IF;
  IF public.lesson_share_open('neverShared1', 'ok', NULL) THEN RAISE EXCEPTION 'SMOKE FAIL: unknown token counted'; END IF;
END $$;
DO $$ BEGIN
  PERFORM public.lesson_share_open('anonShare01', 'maybe', NULL);
  RAISE EXCEPTION 'SMOKE FAIL: a bad outcome was accepted';
EXCEPTION WHEN invalid_parameter_value THEN NULL; END $$;
-- Shape: a link that does not carry its token is refused.
DO $$ BEGIN
  PERFORM public.lesson_share_record('anonShare02', jsonb_build_object(
    'courseKey', 'c', 'lessonId', 'l', 'method', 'copy', 'url', 'https://poetech.us/?lesson=l'));
  RAISE EXCEPTION 'SMOKE FAIL: a link without its token was recorded';
EXCEPTION WHEN invalid_parameter_value THEN NULL; END $$;
RESET ROLE;

-- --- member A shares; member B cannot see it ------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true);
SELECT public.lesson_share_record('memberAshare1', jsonb_build_object(
  'door', 'church', 'kind', 'lesson', 'courseKey', 'living-lessons', 'lessonId', 'l2', 'lessonTitle', 'Two',
  'method', 'native', 'url', 'https://poetech.us/?course=living-lessons&lesson=l2&s=memberAshare1',
  'sharedBy', '00000000-0000-0000-0000-00000000000b'));
DO $$ DECLARE n int; who uuid; BEGIN
  SELECT count(*) INTO n FROM public.lesson_shares;
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: member A sees % shares, expected 1 (own only)', n; END IF;
  SELECT shared_by INTO who FROM public.lesson_shares WHERE token = 'memberAshare1';
  IF who IS DISTINCT FROM '00000000-0000-0000-0000-00000000000a'::uuid THEN
    RAISE EXCEPTION 'SMOKE FAIL: shared_by was taken from the payload (%), not auth.uid()', who;
  END IF;
  SELECT count(*) INTO n FROM public.lesson_share_opens;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: a member read % open rows (Governor only)', n; END IF;
  SELECT count(*) INTO n FROM public.lesson_share_ledger(true);
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: p_all widened a member ledger to % rows', n; END IF;
END $$;
-- A token already recorded cannot be re-owned.
SELECT public.lesson_share_record('anonShare01', jsonb_build_object(
  'courseKey', 'hijack', 'lessonId', 'x', 'method', 'copy', 'url', 'https://evil.test/?s=anonShare01'));
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.lesson_shares WHERE token = 'anonShare01';
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: re-recording a token re-owned it'; END IF;
END $$;
DO $$ BEGIN
  IF NOT public.lesson_share_open('memberAshare1', 'ok', NULL) THEN RAISE EXCEPTION 'SMOKE FAIL: member open not recorded'; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  SELECT * INTO r FROM public.lesson_share_ledger(false) WHERE token = 'memberAshare1';
  IF r.opens <> 1 OR r.ok_opens <> 1 OR r.failed_opens <> 0 OR r.sharer <> 'you' THEN
    RAISE EXCEPTION 'SMOKE FAIL: member ledger counts wrong: % % % %', r.opens, r.ok_opens, r.failed_opens, r.sharer;
  END IF;
END $$;

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b"}', true);
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.lesson_shares;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: member B sees % of member A''s shares', n; END IF;
  SELECT count(*) INTO n FROM public.lesson_share_ledger(true);
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: member B ledger shows % rows', n; END IF;
END $$;

-- --- the Governor reads every share, every open, and the counts ------------------
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000cc"}', true);
DO $$ DECLARE n int; r record; BEGIN
  SELECT count(*) INTO n FROM public.lesson_shares;
  IF n <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: Governor sees % shares, expected 2', n; END IF;
  SELECT count(*) INTO n FROM public.lesson_share_opens;
  IF n <> 3 THEN RAISE EXCEPTION 'SMOKE FAIL: Governor sees % opens, expected 3', n; END IF;
  SELECT * INTO r FROM public.lesson_share_ledger(true) WHERE token = 'anonShare01';
  IF r.opens <> 2 OR r.ok_opens <> 1 OR r.failed_opens <> 1 OR r.sharer <> 'a signed-out reader' THEN
    RAISE EXCEPTION 'SMOKE FAIL: Governor ledger row wrong: % % % %', r.opens, r.ok_opens, r.failed_opens, r.sharer;
  END IF;
  -- The reason keeps only plain characters: no markup survives.
  IF r.last_failure <> 'lesson not found: l1 script' THEN
    RAISE EXCEPTION 'SMOKE FAIL: reason not normalized: %', r.last_failure;
  END IF;
  SELECT * INTO r FROM public.lesson_share_ledger(true) WHERE token = 'memberAshare1';
  IF r.sharer <> 'member-a@example.test' THEN RAISE EXCEPTION 'SMOKE FAIL: Governor does not see who shared (%)', r.sharer; END IF;
END $$;

-- --- the flood brake on opens of one link ---------------------------------------
DO $$ DECLARE i int; recorded int := 0; BEGIN
  FOR i IN 1..40 LOOP
    IF public.lesson_share_open('memberAshare1', 'ok', NULL) THEN recorded := recorded + 1; END IF;
  END LOOP;
  -- 1 open already this minute, so 29 more are allowed.
  IF recorded <> 29 THEN RAISE EXCEPTION 'SMOKE FAIL: per-link flood brake let % through, expected 29', recorded; END IF;
END $$;
RESET ROLE;

-- Columns that could carry who opened a link do not exist.
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'lesson_share_opens'
     AND column_name NOT IN ('id', 'token', 'outcome', 'reason', 'opened_at');
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: lesson_share_opens carries % extra column(s)', n; END IF;
END $$;

ROLLBACK;
\echo 'lesson-share smoke: every wall held'
