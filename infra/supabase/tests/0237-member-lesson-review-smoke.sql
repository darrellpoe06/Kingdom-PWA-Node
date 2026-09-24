-- =============================================================================
-- 0237 MEMBER LESSON REVIEW SMOKE — the Governor's queue, and nobody else's eyes
-- (DR-0635)
-- =============================================================================
-- Run as postgres AFTER applying 0237, in a transaction that ROLLS BACK.
-- The Governor's email list is swapped for a test address INSIDE the
-- transaction only (lesson_governor_emails), so no real account is touched.
-- PROVES:
--   a member reads only their own inbox rows, even inside the same instance;
--   a member cannot open the queue or decide, and cannot re-tag their own row;
--   the Governor sees undecided member rows (not a raw recording), approves
--   (tag lesson-approved), declines only with a reason (tag lesson-declined +
--   review_reason), never decides twice; decided rows leave the queue; the
--   member reads the outcome on their own row.
-- PASS prints 'MEMBER LESSON REVIEW SMOKE: PASS'; any wrong grant RAISES.
-- =============================================================================
BEGIN;

\set gov 'a0000000-0000-4000-a000-000000000237'
\set ma  'b0000000-0000-4000-a000-000000000237'
\set mb  'c0000000-0000-4000-a000-000000000237'
\set instF 'f0000000-0000-4000-b000-000000000237'
\set instG 'f0000000-0000-4000-b000-000000010237'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'gov', 'authenticated','authenticated','gov0237@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'ma',  'authenticated','authenticated','ma0237@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mb',  'authenticated','authenticated','mb0237@test.local','',  now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0237',  'Review smoke household', 'family'),
  (:'instG', 'fam2-0237', 'Review smoke governor',  'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'ma',  'owner',  'Member A'),
  (:'instF', :'mb',  'member', 'Member B'),
  (:'instG', :'gov', 'owner',  'Governor');

-- The test Governor, for this transaction only.
CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0237@test.local']::text[] $$;

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

DO $$
DECLARE
  gov uuid := 'a0000000-0000-4000-a000-000000000237';
  ma  uuid := 'b0000000-0000-4000-a000-000000000237';
  mb  uuid := 'c0000000-0000-4000-a000-000000000237';
  instF uuid := 'f0000000-0000-4000-b000-000000000237';
  ra uuid := 'd0000000-0000-4000-a000-00000000a236';
  rb uuid := 'd0000000-0000-4000-a000-00000000b236';
  rv uuid := 'd0000000-0000-4000-a000-00000000c236';
  n int;
  t jsonb;
  why text;
BEGIN
  -- Two members of one household each send a lesson; A also sends a raw recording.
  IF NOT pg_temp.as_user(ma, format(
      'INSERT INTO agent_inbox (id, instance_id, body, tags, created_by) VALUES (%L, %L, ''my boss lied to me'', ''["lesson"]'', %L)', ra, instF, ma)) THEN
    RAISE EXCEPTION 'FAIL: a member could not send a lesson';
  END IF;
  IF NOT pg_temp.as_user(mb, format(
      'INSERT INTO agent_inbox (id, instance_id, body, tags, created_by) VALUES (%L, %L, ''grief'', ''["lesson"]'', %L)', rb, instF, mb)) THEN
    RAISE EXCEPTION 'FAIL: a second member could not send a lesson';
  END IF;
  IF NOT pg_temp.as_user(ma, format(
      'INSERT INTO agent_inbox (id, instance_id, body, tags, created_by) VALUES (%L, %L, ''(audio)'', ''["lesson","voice"]'', %L)', rv, instF, ma)) THEN
    RAISE EXCEPTION 'FAIL: a member could not file a recording';
  END IF;

  -- Each reads only their own, inside the same instance.
  n := pg_temp.count_as(mb, format('SELECT count(*) FROM agent_inbox WHERE id IN (%L, %L)', ra, rv));
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: a household member read another member''s lesson rows (got %)', n; END IF;
  n := pg_temp.count_as(ma, format('SELECT count(*) FROM agent_inbox WHERE id = %L', ra));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: a member could not read their own lesson row (got %)', n; END IF;

  -- A member cannot open the queue, decide, or re-tag their own row.
  IF pg_temp.as_user(ma, 'SELECT count(*) FROM public.member_lesson_queue()') THEN
    RAISE EXCEPTION 'LEAK: a member opened the Governor''s queue';
  END IF;
  IF pg_temp.as_user(ma, format('SELECT public.review_member_lesson(%L, ''approve'')', rb)) THEN
    RAISE EXCEPTION 'LEAK: a member decided a lesson';
  END IF;
  PERFORM pg_temp.as_user(ma, format('UPDATE agent_inbox SET tags = tags || ''["lesson-approved"]'' WHERE id = %L', ra));
  SELECT tags INTO t FROM agent_inbox WHERE id = ra;
  IF t @> '["lesson-approved"]'::jsonb THEN RAISE EXCEPTION 'LEAK: a member approved their own row by UPDATE'; END IF;

  -- The Governor sees both typed rows, not the raw recording.
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_queue() q WHERE q.id IN (%L, %L)', ra, rb));
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: the Governor''s queue should hold both member rows (got %)', n; END IF;
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_queue() q WHERE q.id = %L', rv));
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a raw recording reached the queue'; END IF;
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_queue() q WHERE q.id = %L AND q.sender_name = ''Member A''', ra));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the queue did not carry the sender''s name'; END IF;

  -- Approve; never twice.
  IF NOT pg_temp.as_user(gov, format('SELECT public.review_member_lesson(%L, ''approve'')', ra)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not approve';
  END IF;
  SELECT tags INTO t FROM agent_inbox WHERE id = ra;
  IF NOT t @> '["lesson-approved"]'::jsonb THEN RAISE EXCEPTION 'FAIL: approve did not write lesson-approved'; END IF;
  IF pg_temp.as_user(gov, format('SELECT public.review_member_lesson(%L, ''decline'', ''changed my mind'')', ra)) THEN
    RAISE EXCEPTION 'FAIL: a decided row was decided again';
  END IF;

  -- Decline needs a reason.
  IF pg_temp.as_user(gov, format('SELECT public.review_member_lesson(%L, ''decline'', ''  '')', rb)) THEN
    RAISE EXCEPTION 'FAIL: a decline without a reason was accepted';
  END IF;
  IF NOT pg_temp.as_user(gov, format('SELECT public.review_member_lesson(%L, ''decline'', ''L162 already teaches this'')', rb)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not decline with a reason';
  END IF;
  SELECT tags, review_reason INTO t, why FROM agent_inbox WHERE id = rb;
  IF NOT t @> '["lesson-declined"]'::jsonb OR why <> 'L162 already teaches this' THEN
    RAISE EXCEPTION 'FAIL: decline did not write lesson-declined and the reason';
  END IF;

  -- Decided rows leave the queue; the member reads the outcome on their own row.
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_queue() q WHERE q.id IN (%L, %L)', ra, rb));
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: decided rows stayed in the queue (got %)', n; END IF;
  n := pg_temp.count_as(mb, format('SELECT count(*) FROM agent_inbox WHERE id = %L AND tags @> ''["lesson-declined"]'' AND review_reason IS NOT NULL', rb));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the member could not read the outcome of their own lesson'; END IF;

  RAISE NOTICE 'MEMBER LESSON REVIEW SMOKE: PASS';
END $$;

ROLLBACK;
