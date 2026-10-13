-- =============================================================================
-- 0127 SOVEREIGN NOISE + THOUGHT SMOKE — the no-leak proof for the n8n replacements
-- =============================================================================
-- Run on the LIVE Supabase (as postgres) AFTER applying 0127. PROVES (DR-0076,
-- the two-identity no-leak probe) that transaction_noise and agent_inbox are
-- tenant-isolated: a member of instance F writes/reads F's rows; a member of a
-- DIFFERENT instance G can neither read nor write F's rows; a viewer of F can
-- read but not write. Runs in a transaction and ROLLS BACK. PASS prints
-- 'SOVEREIGN NOISE+THOUGHT SMOKE: PASS'; any wrong grant RAISES.
--
-- Assertions:
--   M (member of F) INSERT noise into F                    -> allowed    ✔
--   M (member of F) INSERT thought into F                  -> allowed    ✔
--   V (viewer of F) INSERT noise into F                    -> DENIED     ✘
--   V (viewer of F) SELECT F's noise                       -> sees it    ✔
--   G-owner (NOT a member of F) SELECT F's noise           -> 0 rows     ✘ (no leak)
--   G-owner INSERT noise into F                            -> DENIED     ✘
--   G-owner SELECT F's agent_inbox                         -> 0 rows     ✘ (no leak)
-- =============================================================================
BEGIN;

\set o   'a0000000-0000-4000-a000-000000000127'
\set m   'b0000000-0000-4000-a000-000000000127'
\set v   'c0000000-0000-4000-a000-000000000127'
\set g   'e0000000-0000-4000-a000-000000000127'
\set instF 'f0000000-0000-4000-b000-000000000127'
\set instG 'f0000000-0000-4000-b000-000000010127'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0127@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0127@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0127@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'g', 'authenticated','authenticated','g0127@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0127', 'Noise smoke family',   'family'),
  (:'instG', 'fam2-0127','Noise smoke other',    'family');
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
  o uuid := 'a0000000-0000-4000-a000-000000000127';
  m uuid := 'b0000000-0000-4000-a000-000000000127';
  v uuid := 'c0000000-0000-4000-a000-000000000127';
  g uuid := 'e0000000-0000-4000-a000-000000000127';
  instF uuid := 'f0000000-0000-4000-b000-000000000127';
  n int;
BEGIN
  -- Member of F writes F's noise + thought.
  IF NOT pg_temp.as_user(m, format(
      'INSERT INTO transaction_noise (instance_id, institution, fitid, created_by) VALUES (%L, ''chase'', ''FIT-1'', %L)', instF, m)) THEN
    RAISE EXCEPTION 'FAIL: a member could not insert a noise flag into their own instance';
  END IF;
  IF NOT pg_temp.as_user(m, format(
      'INSERT INTO agent_inbox (instance_id, body, created_by) VALUES (%L, ''a thought'', %L)', instF, m)) THEN
    RAISE EXCEPTION 'FAIL: a member could not insert a thought into their own instance';
  END IF;

  -- Viewer of F cannot write noise, but can read it.
  IF pg_temp.as_user(v, format(
      'INSERT INTO transaction_noise (instance_id, institution, fitid, created_by) VALUES (%L, ''chase'', ''FIT-V'', %L)', instF, v)) THEN
    RAISE EXCEPTION 'FAIL: a viewer INSERTED a noise flag (writes are collaborators-only)';
  END IF;
  n := pg_temp.count_as(v, format('SELECT count(*) FROM transaction_noise WHERE instance_id = %L', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: a viewer should read the instance noise (got % rows)', n;
  END IF;

  -- G-owner is NOT a member of F: no read (no leak), no write.
  n := pg_temp.count_as(g, format('SELECT count(*) FROM transaction_noise WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'LEAK: a non-member read another instance''s noise flags (got % rows)', n;
  END IF;
  n := pg_temp.count_as(g, format('SELECT count(*) FROM agent_inbox WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'LEAK: a non-member read another instance''s agent_inbox (got % rows)', n;
  END IF;
  IF pg_temp.as_user(g, format(
      'INSERT INTO transaction_noise (instance_id, institution, fitid, created_by) VALUES (%L, ''chase'', ''FIT-G'', %L)', instF, g)) THEN
    RAISE EXCEPTION 'LEAK: a non-member INSERTED a noise flag into another instance';
  END IF;

  RAISE NOTICE 'SOVEREIGN NOISE+THOUGHT SMOKE: PASS';
END $$;

ROLLBACK;
