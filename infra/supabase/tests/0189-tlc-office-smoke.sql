-- =============================================================================
-- 0189 TLC OFFICE SMOKE — the enablement gate for the office board (0188) and
-- lesson assignments (0189), DR-0345 / DR-0347. Run on the LIVE Supabase (as
-- postgres) AFTER 0187+0188+0189. Runs in a transaction and ROLLS BACK. PASS
-- prints 'TLC OFFICE SMOKE: PASS'; any wrong grant RAISES.
--
-- Darrell 2026-09-10: "not fake test". The app's render tests mock these
-- seams; THIS is the database half, against the real policies.
--
-- Scenario: office instance F — owner O, therapist T (member), assistant A,
-- viewer V; client C and stranger S are signed-in people with NO membership,
-- known only by the email on their session.
--
-- Assertions:
--   T assigns a lesson to C                            -> allowed        ✔
--   A / V / C insert an assignment                     -> DENIED         ✘
--   C reads the rows addressed to their email          -> 1              ✔
--   S reads                                            -> 0              ✔
--   T reads their own rows                             -> 1              ✔
--   C marks it reviewed                                -> allowed, reviewed_at set ✔
--   C tries to change the lesson / the address         -> IGNORED (trigger) ✔
--   S updates C's row                                  -> 0 rows          ✔
--   T updates the launch board (0188)                  -> allowed        ✔
--   V / A write the launch board                       -> DENIED         ✘
--   T (member) deletes a board row                     -> 0 rows          ✔
--   O deletes it                                       -> gone            ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000189'
\set t 'b0000000-0000-4000-a000-000000000189'
\set a 'c0000000-0000-4000-a000-000000000189'
\set v 'd0000000-0000-4000-a000-000000000189'
\set c 'e0000000-0000-4000-a000-000000000189'
\set s 'e1000000-0000-4000-a000-000000000189'
\set instF 'f0000000-0000-4000-b000-000000000189'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0189@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'t', 'authenticated','authenticated','t0189@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0189@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0189@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0189@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0189@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'office-0189', 'TLC office smoke', 'therapy-practice'); -- 0193: the office resolver answers only from a therapy-practice membership
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',     'Owner O'),
  (:'instF', :'t', 'member',    'Therapist T'),
  (:'instF', :'a', 'assistant', 'Assistant A'),
  (:'instF', :'v', 'viewer',    'Viewer V');

-- ── Helpers: run a statement AS a user (with the email Supabase would carry) ──
CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _email text, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000189';
  t uuid := 'b0000000-0000-4000-a000-000000000189';
  a uuid := 'c0000000-0000-4000-a000-000000000189';
  v uuid := 'd0000000-0000-4000-a000-000000000189';
  c uuid := 'e0000000-0000-4000-a000-000000000189';
  s uuid := 'e1000000-0000-4000-a000-000000000189';
  instF uuid := 'f0000000-0000-4000-b000-000000000189';
  ins text := 'INSERT INTO tlc_lesson_assignments (instance_id, client_email, lesson_id, lesson_title, due_on) VALUES (%L, ''c0189@test.local'', ''cl2-grounding-skills'', ''Two grounding skills'', ''2026-09-17'')';
  row_id uuid;
  got_status text;
  got_lesson text;
  got_reviewed timestamptz;
  n integer;
BEGIN
  -- ── Assignments ──────────────────────────────────────────────────────────
  IF NOT pg_temp.as_user(t, 't0189@test.local', format(ins, instF)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the therapist could not assign a lesson';
  END IF;
  SELECT id INTO row_id FROM tlc_lesson_assignments WHERE instance_id = instF AND client_email = 'c0189@test.local';
  IF row_id IS NULL THEN RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the assignment row is missing'; END IF;

  IF pg_temp.as_user(a, 'a0189@test.local', format(ins, instF)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the assistant assigned a lesson';
  END IF;
  IF pg_temp.as_user(v, 'v0189@test.local', format(ins, instF)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: a viewer assigned a lesson';
  END IF;
  IF pg_temp.as_user(c, 'c0189@test.local', format(ins, instF)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: a client (no membership) assigned a lesson';
  END IF;

  n := pg_temp.count_as(c, 'c0189@test.local', 'SELECT count(*)::int FROM tlc_lesson_assignments');
  IF n <> 1 THEN RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the client sees % rows, expected 1', n; END IF;
  n := pg_temp.count_as(s, 's0189@test.local', 'SELECT count(*)::int FROM tlc_lesson_assignments');
  IF n <> 0 THEN RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: a stranger sees % rows, expected 0', n; END IF;
  n := pg_temp.count_as(t, 't0189@test.local', 'SELECT count(*)::int FROM tlc_lesson_assignments');
  IF n <> 1 THEN RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the therapist sees % rows, expected 1', n; END IF;

  -- The client marks it reviewed; the trigger stamps reviewed_at.
  IF NOT pg_temp.as_user(c, 'c0189@test.local', format('UPDATE tlc_lesson_assignments SET status = ''reviewed'' WHERE id = %L', row_id)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the client could not mark the lesson reviewed';
  END IF;
  SELECT status, reviewed_at INTO got_status, got_reviewed FROM tlc_lesson_assignments WHERE id = row_id;
  IF got_status <> 'reviewed' OR got_reviewed IS NULL THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: reviewed did not land (status %, reviewed_at %)', got_status, got_reviewed;
  END IF;

  -- The client tries to change the lesson and the address: the trigger keeps them.
  PERFORM pg_temp.as_user(c, 'c0189@test.local', format('UPDATE tlc_lesson_assignments SET lesson_id = ''cl1-what-is-anxiety'', client_email = ''s0189@test.local'' WHERE id = %L', row_id));
  SELECT lesson_id INTO got_lesson FROM tlc_lesson_assignments WHERE id = row_id AND client_email = 'c0189@test.local';
  IF got_lesson IS DISTINCT FROM 'cl2-grounding-skills' THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the client changed the assignment itself (lesson now %)', got_lesson;
  END IF;

  -- A stranger's update touches nothing.
  PERFORM pg_temp.as_user(s, 's0189@test.local', format('UPDATE tlc_lesson_assignments SET status = ''assigned'' WHERE id = %L', row_id));
  SELECT status INTO got_status FROM tlc_lesson_assignments WHERE id = row_id;
  IF got_status <> 'reviewed' THEN RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: a stranger changed a client''s row'; END IF;

  -- ── The launch board (0188) ──────────────────────────────────────────────
  IF NOT pg_temp.as_user(t, 't0189@test.local', format('INSERT INTO tlc_office_tasks (instance_id, task_key, status) VALUES (%L, ''website-test-booking'', ''in-progress'')', instF)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: a member could not update the launch board';
  END IF;
  IF pg_temp.as_user(v, 'v0189@test.local', format('INSERT INTO tlc_office_tasks (instance_id, task_key, status) VALUES (%L, ''marketing-social-pages'', ''done'')', instF)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: a viewer wrote the launch board';
  END IF;
  IF pg_temp.as_user(a, 'a0189@test.local', format('INSERT INTO tlc_office_tasks (instance_id, task_key, status) VALUES (%L, ''marketing-initial-posts'', ''done'')', instF)) THEN
    RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the assistant wrote the launch board';
  END IF;
  PERFORM pg_temp.as_user(t, 't0189@test.local', format('DELETE FROM tlc_office_tasks WHERE instance_id = %L AND task_key = ''website-test-booking''', instF));
  SELECT count(*)::int INTO n FROM tlc_office_tasks WHERE instance_id = instF AND task_key = 'website-test-booking';
  IF n <> 1 THEN RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: a member deleted a board row'; END IF;
  PERFORM pg_temp.as_user(o, 'o0189@test.local', format('DELETE FROM tlc_office_tasks WHERE instance_id = %L AND task_key = ''website-test-booking''', instF));
  SELECT count(*)::int INTO n FROM tlc_office_tasks WHERE instance_id = instF AND task_key = 'website-test-booking';
  IF n <> 0 THEN RAISE EXCEPTION 'TLC OFFICE SMOKE FAIL: the owner could not delete a board row'; END IF;

  RAISE NOTICE 'TLC OFFICE SMOKE: PASS';
END $$;

SELECT 'TLC OFFICE SMOKE: PASS' AS result;

ROLLBACK;
