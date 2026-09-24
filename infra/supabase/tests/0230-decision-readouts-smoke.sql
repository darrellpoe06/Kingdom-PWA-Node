-- =============================================================================
-- 0230 DECISION READOUTS SMOKE — the no-leak proof for the daily readout record
-- =============================================================================
-- Run as postgres AFTER applying 0230, inside a transaction that ROLLS BACK.
-- PROVES: a member of instance F records and refreshes F's day as themselves;
-- a member cannot write in another's name; a viewer reads but cannot write; a
-- non-member of F can neither read nor write F's readouts. PASS prints
-- 'DECISION READOUTS SMOKE: PASS'; any wrong grant RAISES. DR-0612.
-- =============================================================================
BEGIN;

\set o   'a0000000-0000-4000-a000-000000000230'
\set m   'b0000000-0000-4000-a000-000000000230'
\set v   'c0000000-0000-4000-a000-000000000230'
\set g   'e0000000-0000-4000-a000-000000000230'
\set instF 'f0000000-0000-4000-b000-000000000230'
\set instG 'f0000000-0000-4000-b000-000000010230'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0230@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0230@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0230@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'g', 'authenticated','authenticated','g0230@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0230', 'Readout smoke family',   'family'),
  (:'instG', 'fam2-0230','Readout smoke other',    'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instF', :'v', 'viewer', 'Viewer V'),
  (:'instG', :'g', 'owner',  'Owner G');

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
  o uuid := 'a0000000-0000-4000-a000-000000000230';
  m uuid := 'b0000000-0000-4000-a000-000000000230';
  v uuid := 'c0000000-0000-4000-a000-000000000230';
  g uuid := 'e0000000-0000-4000-a000-000000000230';
  instF uuid := 'f0000000-0000-4000-b000-000000000230';
  n int;
BEGIN
  -- A member of F records F's day.
  IF NOT pg_temp.as_user(m, format(
      'INSERT INTO decision_readouts (instance_id, day, counts, created_by) VALUES (%L, ''2026-09-24'', ''{"escalations":3}'', %L)', instF, m)) THEN
    RAISE EXCEPTION 'FAIL: a member could not record a readout for their own instance';
  END IF;
  -- ...and refreshes the same day (the upsert path).
  IF NOT pg_temp.as_user(m, format(
      'UPDATE decision_readouts SET counts = ''{"escalations":4}'' WHERE instance_id = %L AND day = ''2026-09-24''', instF)) THEN
    RAISE EXCEPTION 'FAIL: a member could not refresh the day''s readout';
  END IF;
  -- A member cannot write a row in someone else's name.
  IF pg_temp.as_user(m, format(
      'INSERT INTO decision_readouts (instance_id, day, created_by) VALUES (%L, ''2026-09-25'', %L)', instF, o)) THEN
    RAISE EXCEPTION 'FAIL: a member recorded a readout as another user';
  END IF;
  -- A viewer reads but never writes.
  n := pg_temp.count_as(v, format('SELECT count(*) FROM decision_readouts WHERE instance_id = %L', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: a viewer should read the instance readouts (got % rows)', n;
  END IF;
  IF pg_temp.as_user(v, format(
      'INSERT INTO decision_readouts (instance_id, day, created_by) VALUES (%L, ''2026-09-26'', %L)', instF, v)) THEN
    RAISE EXCEPTION 'FAIL: a viewer INSERTED a readout (writes are collaborators-only)';
  END IF;
  -- A non-member of F sees nothing and writes nothing.
  n := pg_temp.count_as(g, format('SELECT count(*) FROM decision_readouts WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'LEAK: a non-member read another instance''s readouts (got % rows)', n;
  END IF;
  IF pg_temp.as_user(g, format(
      'INSERT INTO decision_readouts (instance_id, day, created_by) VALUES (%L, ''2026-09-27'', %L)', instF, g)) THEN
    RAISE EXCEPTION 'LEAK: a non-member INSERTED a readout into another instance';
  END IF;

  RAISE NOTICE 'DECISION READOUTS SMOKE: PASS';
END $$;

ROLLBACK;
