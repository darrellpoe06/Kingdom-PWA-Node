-- =============================================================================
-- 0234 INTAKE OUTCOME SMOKE — the outcome and the fix queue (DR-0622)
-- =============================================================================
-- Run as postgres AFTER applying 0234, in a transaction that ROLLS BACK.
-- PROVES:
--   * a member sends a note carrying its category and basis, and it lands;
--   * a member CANNOT write an outcome onto their own note (outcome columns
--     cleared, status forced to 'new' by the insert guard);
--   * the member reads their own note's outcome once a steward writes it;
--   * the fix queue is the stewards' room: the owner reads and may skip a row;
--     a member, a viewer, an assistant and a non-member read none of it and
--     move nothing; nobody signed in can INSERT into it.
-- PASS prints 'INTAKE OUTCOME SMOKE: PASS'; any wrong grant RAISES.
-- =============================================================================
BEGIN;

\set o   'a0000000-0000-4000-a000-000000000234'
\set m   'b0000000-0000-4000-a000-000000000234'
\set v   'c0000000-0000-4000-a000-000000000234'
\set s   'd0000000-0000-4000-a000-000000000234'
\set g   'e0000000-0000-4000-a000-000000000234'
\set instF 'f0000000-0000-4000-b000-000000000234'
\set instG 'f0000000-0000-4000-b000-000000010234'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0234@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0234@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0234@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0234@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'g', 'authenticated','authenticated','g0234@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0234', 'Intake smoke family', 'family'),
  (:'instG', 'fam2-0234','Intake smoke other',  'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',     'Owner O'),
  (:'instF', :'m', 'member',    'Member M'),
  (:'instF', :'v', 'viewer',    'Viewer V'),
  (:'instF', :'s', 'assistant', 'Assistant S'),
  (:'instG', :'g', 'owner',     'Owner G');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
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

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  RETURN n;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000234';
  m uuid := 'b0000000-0000-4000-a000-000000000234';
  v uuid := 'c0000000-0000-4000-a000-000000000234';
  s uuid := 'd0000000-0000-4000-a000-000000000234';
  g uuid := 'e0000000-0000-4000-a000-000000000234';
  instF uuid := 'f0000000-0000-4000-b000-000000000234';
  fb uuid := '10000000-0000-4000-a000-000000000234';
  n int;
  t text;
BEGIN
  -- The member sends a note with its category, and tries to mark it fixed.
  IF NOT pg_temp.as_user(m, format(
       'INSERT INTO feedback (id, instance_id, user_id, display_name, feedback_text, intake_category, intake_basis, outcome_note, outcome_ref, outcome_at, triage_status)
        VALUES (%L, %L, %L, ''M'', ''Not working: typo on the bus page title'', ''fix'', ''{"kind":"fix-rule","rule":"wording"}''::jsonb, ''I fixed it myself'', ''#1'', now(), ''fixed'')',
       fb, instF, m)) THEN
    RAISE EXCEPTION 'FAIL: a member could not send a categorized note';
  END IF;
  SELECT coalesce(outcome_note, '') || '|' || coalesce(outcome_ref, '') || '|' || coalesce(outcome_at::text, '') || '|' || triage_status || '|' || intake_category
    INTO t FROM feedback WHERE id = fb;
  IF t <> '|||new|fix' THEN
    RAISE EXCEPTION 'LEAK: a sender wrote an outcome onto their own note (%)', t;
  END IF;

  -- A member cannot write the outcome afterwards either (admin-only UPDATE).
  PERFORM pg_temp.as_user(m, format('UPDATE feedback SET outcome_note = ''mine'', triage_status = ''fixed'' WHERE id = %L', fb));
  IF (SELECT outcome_note FROM feedback WHERE id = fb) IS NOT NULL THEN
    RAISE EXCEPTION 'LEAK: a member updated the outcome of a note';
  END IF;

  -- The owner writes the outcome; the member reads it on their own note.
  IF NOT pg_temp.as_user(o, format('UPDATE feedback SET triage_status = ''fixed'', outcome_note = ''The bus page title is spelled right.'', outcome_ref = ''#1800'', outcome_at = now() WHERE id = %L', fb)) THEN
    RAISE EXCEPTION 'FAIL: the owner could not write the outcome';
  END IF;
  n := pg_temp.count_as(m, format('SELECT count(*) FROM feedback WHERE id = %L AND outcome_note = ''The bus page title is spelled right.'' AND triage_status = ''fixed''', fb));
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: the sender cannot read the outcome of their own note';
  END IF;

  -- The fix queue: the runner (postgres here, the service role live) enqueues.
  INSERT INTO intake_fix_queue (instance_id, feedback_id, rule, scope) VALUES (instF, fb, 'wording', 'copy');

  n := pg_temp.count_as(o, format('SELECT count(*) FROM intake_fix_queue WHERE instance_id = %L', instF));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the owner reads % fix-queue rows (should be 1)', n; END IF;
  FOREACH t IN ARRAY ARRAY['member','viewer','assistant','outsider'] LOOP
    n := pg_temp.count_as(CASE t WHEN 'member' THEN m WHEN 'viewer' THEN v WHEN 'assistant' THEN s ELSE g END,
                          format('SELECT count(*) FROM intake_fix_queue WHERE instance_id = %L', instF));
    IF n <> 0 THEN RAISE EXCEPTION 'LEAK: a % read % fix-queue rows', t, n; END IF;
  END LOOP;

  -- Nobody signed in inserts into the queue (the runner owns its rows).
  IF pg_temp.as_user(o, format('INSERT INTO intake_fix_queue (instance_id, feedback_id, rule, scope) VALUES (%L, %L, ''wording'', ''copy'')', instF, fb)) THEN
    RAISE EXCEPTION 'LEAK: a signed-in owner inserted into the fix queue';
  END IF;

  -- A member, viewer or assistant cannot move a queue row; the owner can skip it.
  PERFORM pg_temp.as_user(m, format('UPDATE intake_fix_queue SET status = ''merged'' WHERE feedback_id = %L', fb));
  PERFORM pg_temp.as_user(v, format('UPDATE intake_fix_queue SET status = ''merged'' WHERE feedback_id = %L', fb));
  PERFORM pg_temp.as_user(s, format('UPDATE intake_fix_queue SET status = ''merged'' WHERE feedback_id = %L', fb));
  IF (SELECT status FROM intake_fix_queue WHERE feedback_id = fb) <> 'queued' THEN
    RAISE EXCEPTION 'LEAK: a non-steward moved a fix-queue row';
  END IF;
  IF NOT pg_temp.as_user(o, format('UPDATE intake_fix_queue SET status = ''skipped'' WHERE feedback_id = %L', fb)) THEN
    RAISE EXCEPTION 'FAIL: the owner could not skip a fix-queue row';
  END IF;
  IF (SELECT status FROM intake_fix_queue WHERE feedback_id = fb) <> 'skipped' THEN
    RAISE EXCEPTION 'FAIL: the owner''s skip did not land';
  END IF;

  -- The category CHECK holds.
  IF pg_temp.as_user(m, format('INSERT INTO feedback (instance_id, user_id, display_name, feedback_text, intake_category) VALUES (%L, %L, ''M'', ''x y z'', ''whatever'')', instF, m)) THEN
    RAISE EXCEPTION 'FAIL: an unknown intake_category was accepted';
  END IF;

  RAISE NOTICE 'INTAKE OUTCOME SMOKE: PASS';
END $$;

ROLLBACK;
