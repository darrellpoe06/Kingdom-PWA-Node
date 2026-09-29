-- =============================================================================
-- 0240 MY LESSON ROWS SMOKE — the Governor sees both his doors, a member only
-- their own (DR-0672)
-- =============================================================================
-- Run as postgres AFTER applying 0127, 0237 and 0240, in a transaction that
-- ROLLS BACK. The Governor's email list is swapped for two test addresses
-- INSIDE the transaction only, so no real account is touched.
-- PROVES:
--   a member reads only their own lesson rows through my_lesson_rows(), even
--   inside the same household as another member;
--   a member never reads the Governor's rows;
--   the Governor, signed in at either door, reads the lessons from BOTH doors
--   and never a member's;
--   a row that is not a lesson is never returned.
-- PASS prints 'MY LESSON ROWS SMOKE: PASS'; any leak RAISES.
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000240', 'authenticated','authenticated','gov0240@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-a000-000000000240', 'authenticated','authenticated','govphone0240@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000240', 'authenticated','authenticated','ma0240@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-a000-000000000240', 'authenticated','authenticated','mb0240@test.local','',  now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('f0000000-0000-4000-b000-000000000240', 'fam-0240',  'My lessons smoke household', 'family'),
  ('f0000000-0000-4000-b000-000000010240', 'fam2-0240', 'My lessons smoke governor',  'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('f0000000-0000-4000-b000-000000000240', 'b0000000-0000-4000-a000-000000000240', 'owner',  'Member A'),
  ('f0000000-0000-4000-b000-000000000240', 'c0000000-0000-4000-a000-000000000240', 'member', 'Member B'),
  ('f0000000-0000-4000-b000-000000000240', 'a1000000-0000-4000-a000-000000000240', 'member', 'Governor phone'),
  ('f0000000-0000-4000-b000-000000010240', 'a0000000-0000-4000-a000-000000000240', 'owner',  'Governor');

CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['gov0240@test.local', 'govphone0240@test.local']::text[] $$;

-- Rows are written as postgres (the smoke tests the read, not the insert).
INSERT INTO agent_inbox (id, instance_id, body, tags, created_by) VALUES
  ('d0000000-0000-4000-a000-0000000a0240', 'f0000000-0000-4000-b000-000000000240', 'member A lesson', '["lesson"]', 'b0000000-0000-4000-a000-000000000240'),
  ('d0000000-0000-4000-a000-0000000b0240', 'f0000000-0000-4000-b000-000000000240', 'member B lesson', '["lesson"]', 'c0000000-0000-4000-a000-000000000240'),
  ('d0000000-0000-4000-a000-0000000c0240', 'f0000000-0000-4000-b000-000000010240', 'governor desk lesson', '["lesson"]', 'a0000000-0000-4000-a000-000000000240'),
  ('d0000000-0000-4000-a000-0000000d0240', 'f0000000-0000-4000-b000-000000000240', 'governor phone lesson', '["lesson","voice"]', 'a1000000-0000-4000-a000-000000000240'),
  ('d0000000-0000-4000-a000-0000000e0240', 'f0000000-0000-4000-b000-000000000240', 'member A thought', '["thought"]', 'b0000000-0000-4000-a000-000000000240');

CREATE OR REPLACE FUNCTION pg_temp.ids_as(_who uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE s text;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  SELECT coalesce(string_agg(right(r.id::text, 5), ',' ORDER BY r.id), '') INTO s FROM public.my_lesson_rows(300) r
   WHERE r.id::text LIKE 'd0000000-0000-4000-a000-%0240';
  PERFORM set_config('role', 'postgres', true);
  RETURN s;
END $$;

DO $$
DECLARE got text;
BEGIN
  got := pg_temp.ids_as('b0000000-0000-4000-a000-000000000240');
  IF got <> 'a0240' THEN RAISE EXCEPTION 'LEAK: member A read % (expected only a0240)', got; END IF;
  got := pg_temp.ids_as('c0000000-0000-4000-a000-000000000240');
  IF got <> 'b0240' THEN RAISE EXCEPTION 'LEAK: member B read % (expected only b0240)', got; END IF;
  got := pg_temp.ids_as('a0000000-0000-4000-a000-000000000240');
  IF got <> 'c0240,d0240' THEN RAISE EXCEPTION 'FAIL: the Governor at his desk read % (expected his two doors c0240,d0240)', got; END IF;
  got := pg_temp.ids_as('a1000000-0000-4000-a000-000000000240');
  IF got <> 'c0240,d0240' THEN RAISE EXCEPTION 'FAIL: the Governor on his phone read % (expected his two doors c0240,d0240)', got; END IF;
  RAISE NOTICE 'MY LESSON ROWS SMOKE: PASS';
END $$;

ROLLBACK;
