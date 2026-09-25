-- =============================================================================
-- 0238 MEMBER LESSON NAME SMOKE — the member's name choice, and the Governor's
-- "approve, but keep it anonymous" (DR-0639)
-- =============================================================================
-- Run as postgres AFTER applying 0237 and 0238, in a transaction that ROLLS
-- BACK. The Governor's email list is swapped for a test address inside the
-- transaction only. PROVES: a member's named row (lesson-name-ok +
-- lesson-name:<name>) is read by the member and by no one else in the
-- household; the Governor's queue carries the choice; approve keeps it named;
-- approve-anonymous writes lesson-approved AND lesson-anonymous; a member
-- cannot approve-anonymous. PASS prints 'MEMBER LESSON NAME SMOKE: PASS'.
-- =============================================================================
BEGIN;

\set gov 'a0000000-0000-4000-a000-000000000238'
\set ma  'b0000000-0000-4000-a000-000000000238'
\set mb  'c0000000-0000-4000-a000-000000000238'
\set instF 'f0000000-0000-4000-b000-000000000238'
\set instG 'f0000000-0000-4000-b000-000000010238'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'gov', 'authenticated','authenticated','gov0238@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'ma',  'authenticated','authenticated','ma0238@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mb',  'authenticated','authenticated','mb0238@test.local','',  now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0238',  'Name smoke household', 'family'),
  (:'instG', 'fam2-0238', 'Name smoke governor',  'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'ma',  'owner',  'Member A'),
  (:'instF', :'mb',  'member', 'Member B'),
  (:'instG', :'gov', 'owner',  'Governor');

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0238@test.local']::text[] $$;

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
  gov uuid := 'a0000000-0000-4000-a000-000000000238';
  ma  uuid := 'b0000000-0000-4000-a000-000000000238';
  mb  uuid := 'c0000000-0000-4000-a000-000000000238';
  instF uuid := 'f0000000-0000-4000-b000-000000000238';
  r1 uuid := 'd0000000-0000-4000-a000-00000000a238';
  r2 uuid := 'd0000000-0000-4000-a000-00000000b238';
  n int;
  t jsonb;
BEGIN
  -- Member A sends two named lessons.
  IF NOT pg_temp.as_user(ma, format(
      'INSERT INTO agent_inbox (id, instance_id, body, tags, created_by) VALUES (%L, %L, ''a job ran over'', ''["lesson","lesson-name-ok","lesson-name:Sister Mae"]'', %L)', r1, instF, ma)) THEN
    RAISE EXCEPTION 'FAIL: a member could not send a named lesson';
  END IF;
  IF NOT pg_temp.as_user(ma, format(
      'INSERT INTO agent_inbox (id, instance_id, body, tags, created_by) VALUES (%L, %L, ''a promise broken'', ''["lesson","lesson-name-ok","lesson-name:Mae"]'', %L)', r2, instF, ma)) THEN
    RAISE EXCEPTION 'FAIL: a member could not send a second named lesson';
  END IF;

  -- The name is theirs: the sender reads it, the household does not.
  n := pg_temp.count_as(ma, format('SELECT count(*) FROM agent_inbox WHERE id = %L AND tags @> ''["lesson-name:Sister Mae"]''', r1));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the sender could not read their own name choice'; END IF;
  n := pg_temp.count_as(mb, format('SELECT count(*) FROM agent_inbox WHERE id IN (%L, %L)', r1, r2));
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: a household member read another member''s named lesson (got %)', n; END IF;

  -- The Governor's queue carries the choice.
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_queue() q WHERE q.id = %L AND q.tags @> ''["lesson-name-ok","lesson-name:Sister Mae"]''', r1));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the queue did not carry the member''s name choice'; END IF;

  -- A member cannot approve-anonymous.
  IF pg_temp.as_user(ma, format('SELECT public.review_member_lesson(%L, ''approve-anonymous'')', r1)) THEN
    RAISE EXCEPTION 'LEAK: a member decided their own lesson';
  END IF;

  -- Approve keeps it named; approve-anonymous adds lesson-anonymous.
  IF NOT pg_temp.as_user(gov, format('SELECT public.review_member_lesson(%L, ''approve'')', r1)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not approve a named lesson';
  END IF;
  SELECT tags INTO t FROM agent_inbox WHERE id = r1;
  IF NOT t @> '["lesson-approved","lesson-name-ok"]'::jsonb OR t @> '["lesson-anonymous"]'::jsonb THEN
    RAISE EXCEPTION 'FAIL: approve should keep the lesson named';
  END IF;
  IF NOT pg_temp.as_user(gov, format('SELECT public.review_member_lesson(%L, ''approve-anonymous'')', r2)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not approve and keep it anonymous';
  END IF;
  SELECT tags INTO t FROM agent_inbox WHERE id = r2;
  IF NOT t @> '["lesson-approved","lesson-anonymous"]'::jsonb THEN
    RAISE EXCEPTION 'FAIL: approve-anonymous did not write lesson-approved and lesson-anonymous';
  END IF;
  IF pg_temp.as_user(gov, format('SELECT public.review_member_lesson(%L, ''approve'')', r2)) THEN
    RAISE EXCEPTION 'FAIL: a decided row was decided again';
  END IF;

  -- The Messages edge: both decided rows owe a Message; only the Governor sees
  -- the outbox or marks one sent; a marked row leaves it; a published row owes
  -- its own Message.
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_outbox() o WHERE o.id IN (%L, %L)', r1, r2));
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: the outbox should owe both decided rows a Message (got %)', n; END IF;
  IF pg_temp.as_user(ma, 'SELECT count(*) FROM public.member_lesson_outbox()') THEN
    RAISE EXCEPTION 'LEAK: a member opened the Governor''s outbox';
  END IF;
  IF pg_temp.as_user(ma, format('SELECT public.mark_member_lesson_messaged(%L, ''decision'')', r1)) THEN
    RAISE EXCEPTION 'LEAK: a member marked a Message sent';
  END IF;
  IF NOT pg_temp.as_user(gov, format('SELECT public.mark_member_lesson_messaged(%L, ''decision'')', r1)) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not mark a Message sent';
  END IF;
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_outbox() o WHERE o.id = %L', r1));
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a messaged row stayed in the outbox'; END IF;
  UPDATE agent_inbox SET tags = tags || '["lesson-published","lesson-id:ll193-test"]'::jsonb WHERE id = r1;
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.member_lesson_outbox() o WHERE o.id = %L', r1));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: a published row did not owe its Message'; END IF;

  RAISE NOTICE 'MEMBER LESSON NAME SMOKE: PASS';
END $$;

ROLLBACK;
