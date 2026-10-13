-- =============================================================================
-- 0232 SAVED PROMPTS SMOKE — a person's prompt history is theirs alone (DR-0615)
-- =============================================================================
-- Run as postgres AFTER applying 0232, in a transaction that ROLLS BACK.
-- PROVES: a member remembers a prompt and reads it; the same words again raise
-- the count (one row, use_count 2); ANOTHER member of the SAME instance reads
-- none of it and cannot update or delete it; a non-member cannot write into
-- the instance. PASS prints 'SAVED PROMPTS SMOKE: PASS'; any wrong grant RAISES.
-- =============================================================================
BEGIN;

\set o   'a0000000-0000-4000-a000-000000000232'
\set m   'b0000000-0000-4000-a000-000000000232'
\set v   'c0000000-0000-4000-a000-000000000232'
\set g   'e0000000-0000-4000-a000-000000000232'
\set instF 'f0000000-0000-4000-b000-000000000232'
\set instG 'f0000000-0000-4000-b000-000000010232'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0232@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0232@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0232@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'g', 'authenticated','authenticated','g0232@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0232', 'Prompts smoke family',   'family'),
  (:'instG', 'fam2-0232','Prompts smoke other',    'family');
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
  o uuid := 'a0000000-0000-4000-a000-000000000232';
  m uuid := 'b0000000-0000-4000-a000-000000000232';
  g uuid := 'e0000000-0000-4000-a000-000000000232';
  instF uuid := 'f0000000-0000-4000-b000-000000000232';
  n int;
BEGIN
  -- The member remembers a prompt, twice: one row, counted twice.
  IF NOT pg_temp.as_user(m, format('SELECT public.remember_prompt(%L, ''Lesson. the keys of hell and death'', ''lesson'', false)', instF)) THEN
    RAISE EXCEPTION 'FAIL: a member could not remember a prompt';
  END IF;
  IF NOT pg_temp.as_user(m, format('SELECT public.remember_prompt(%L, ''Lesson. the keys of hell and death'', ''lesson'', true)', instF)) THEN
    RAISE EXCEPTION 'FAIL: a member could not remember the same prompt again';
  END IF;
  n := pg_temp.count_as(m, format('SELECT count(*) FROM saved_prompts WHERE instance_id = %L', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: the same words made % rows (should be one, counted)', n;
  END IF;
  n := pg_temp.count_as(m, format('SELECT use_count FROM saved_prompts WHERE instance_id = %L', instF));
  IF n <> 2 THEN
    RAISE EXCEPTION 'FAIL: use_count is % after two sends (should be 2)', n;
  END IF;
  n := pg_temp.count_as(m, format('SELECT count(*) FROM saved_prompts WHERE instance_id = %L AND kept', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: keeping a prompt on the second send did not keep it';
  END IF;

  -- The OWNER of the same instance sees none of the member's prompts.
  n := pg_temp.count_as(o, format('SELECT count(*) FROM saved_prompts WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'LEAK: another member of the same instance read % of someone''s prompts', n;
  END IF;
  PERFORM pg_temp.as_user(o, format('UPDATE saved_prompts SET body = ''changed'' WHERE instance_id = %L', instF));
  PERFORM pg_temp.as_user(o, format('DELETE FROM saved_prompts WHERE instance_id = %L', instF));
  n := pg_temp.count_as(m, format('SELECT count(*) FROM saved_prompts WHERE instance_id = %L AND body = ''Lesson. the keys of hell and death''', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'LEAK: another member changed or deleted someone''s prompt';
  END IF;

  -- A non-member cannot write into the instance.
  IF pg_temp.as_user(g, format('SELECT public.remember_prompt(%L, ''intruder'', NULL, false)', instF)) THEN
    RAISE EXCEPTION 'LEAK: a non-member remembered a prompt inside another instance';
  END IF;

  RAISE NOTICE 'SAVED PROMPTS SMOKE: PASS';
END $$;

ROLLBACK;
