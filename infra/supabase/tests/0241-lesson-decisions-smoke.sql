-- =============================================================================
-- 0241 LESSON DECISIONS SMOKE — only the Governor decides, only as himself,
-- and the record cannot be rewritten from the app (DR-0672)
-- =============================================================================
-- Run as postgres AFTER applying 0127, 0237 and 0241, in a transaction that
-- ROLLS BACK. The Governor's email list is swapped for a test address INSIDE
-- the transaction only.
-- PROVES:
--   a member cannot read or write a decision;
--   the Governor can send a pending decision, as himself only;
--   he cannot send one already marked shipped or carrying a gate result;
--   nobody can UPDATE or DELETE a decision from the app;
--   a `choose` without a version, or a merge without a base, is refused.
-- PASS prints 'LESSON DECISIONS SMOKE: PASS'; any wrong grant RAISES.
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000241', 'authenticated','authenticated','gov0241@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000241', 'authenticated','authenticated','ma0241@test.local','',  now(), now());
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('f0000000-0000-4000-b000-000000000241', 'fam-0241', 'Decisions smoke household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('f0000000-0000-4000-b000-000000000241', 'a0000000-0000-4000-a000-000000000241', 'owner',  'Governor'),
  ('f0000000-0000-4000-b000-000000000241', 'b0000000-0000-4000-a000-000000000241', 'member', 'Member A');
INSERT INTO agent_inbox (id, instance_id, body, tags, created_by) VALUES
  ('d0000000-0000-4000-a000-0000000a0241', 'f0000000-0000-4000-b000-000000000241', 'a lesson', '["lesson"]', 'a0000000-0000-4000-a000-000000000241');

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0241@test.local']::text[] $$;

CREATE OR REPLACE FUNCTION pg_temp.try_as(_who uuid, _sql text)
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
  gov uuid := 'a0000000-0000-4000-a000-000000000241';
  ma  uuid := 'b0000000-0000-4000-a000-000000000241';
  trow uuid := 'd0000000-0000-4000-a000-0000000a0241';
  v1  uuid := 'e0000000-0000-4000-a000-000000000241';
  n int;
BEGIN
  -- The Governor sends a pending `choose`.
  IF NOT pg_temp.try_as(gov, format('INSERT INTO public.lesson_decisions (teaching_row_id, mode, chosen_version_id, version_ids) VALUES (%L, ''choose'', %L, %L)', trow, v1, jsonb_build_array(v1))) THEN
    RAISE EXCEPTION 'FAIL: the Governor could not send a decision';
  END IF;
  n := pg_temp.count_as(gov, format('SELECT count(*) FROM public.lesson_decisions WHERE teaching_row_id = %L AND decided_by = %L AND status = ''pending''', trow, gov));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the decision is not recorded as his and pending (got %)', n; END IF;

  -- A member cannot read or write.
  n := pg_temp.count_as(ma, format('SELECT count(*) FROM public.lesson_decisions WHERE teaching_row_id = %L', trow));
  IF n <> 0 THEN RAISE EXCEPTION 'LEAK: a member read the Governor''s decisions (got %)', n; END IF;
  IF pg_temp.try_as(ma, format('INSERT INTO public.lesson_decisions (teaching_row_id, mode, chosen_version_id, decided_by) VALUES (%L, ''choose'', %L, %L)', trow, v1, ma)) THEN
    RAISE EXCEPTION 'LEAK: a member sent a decision';
  END IF;

  -- He decides only as himself, only pending, never with a gate result.
  IF pg_temp.try_as(gov, format('INSERT INTO public.lesson_decisions (teaching_row_id, mode, chosen_version_id, decided_by) VALUES (%L, ''choose'', %L, %L)', trow, v1, ma)) THEN
    RAISE EXCEPTION 'FAIL: a decision was recorded in another person''s name';
  END IF;
  IF pg_temp.try_as(gov, format('INSERT INTO public.lesson_decisions (teaching_row_id, mode, chosen_version_id, status) VALUES (%L, ''choose'', %L, ''shipped'')', trow, v1)) THEN
    RAISE EXCEPTION 'FAIL: the app marked a decision shipped';
  END IF;
  IF pg_temp.try_as(gov, format('INSERT INTO public.lesson_decisions (teaching_row_id, mode, chosen_version_id, gate_result) VALUES (%L, ''choose'', %L, ''{"passed":true}'')', trow, v1)) THEN
    RAISE EXCEPTION 'FAIL: the app wrote a gate result';
  END IF;

  -- The shape holds.
  IF pg_temp.try_as(gov, format('INSERT INTO public.lesson_decisions (teaching_row_id, mode) VALUES (%L, ''choose'')', trow)) THEN
    RAISE EXCEPTION 'FAIL: a choose without a version was accepted';
  END IF;
  IF pg_temp.try_as(gov, format('INSERT INTO public.lesson_decisions (teaching_row_id, mode, merge_map) VALUES (%L, ''merge'', ''{"title":"x"}'')', trow)) THEN
    RAISE EXCEPTION 'FAIL: a merge without a base was accepted';
  END IF;

  -- Nobody rewrites the record from the app.
  PERFORM pg_temp.try_as(gov, format('UPDATE public.lesson_decisions SET status = ''shipped'' WHERE teaching_row_id = %L', trow));
  PERFORM pg_temp.try_as(gov, format('DELETE FROM public.lesson_decisions WHERE teaching_row_id = %L', trow));
  SELECT count(*) INTO n FROM public.lesson_decisions WHERE teaching_row_id = trow AND status = 'pending';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the decision record was rewritten or removed from the app (pending rows now %)', n; END IF;

  RAISE NOTICE 'LESSON DECISIONS SMOKE: PASS';
END $$;

ROLLBACK;
