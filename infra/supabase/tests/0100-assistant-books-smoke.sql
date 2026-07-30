-- =============================================================================
-- 0100 ASSISTANT BOOKS SMOKE — the enablement gate for the assistant wall
-- =============================================================================
-- Run on the LIVE Supabase (as postgres) AFTER applying 0082 THEN 0100 (the
-- matrix leg applies both in order). PROVES (DR-0076, the live two-identity
-- no-leak probe) the ASSISTANT wall 0100 declared holds at the data layer:
-- Darrell 2026-07-13, "make sure assistants can't see the owner's data ...
-- Never our personal data, business data etc." An assistant (a 1099
-- executive / marketing assistant) is walled OUT of the core books — read NO,
-- write NO — exactly like a child. relationships.js is the model half and
-- scripts/assistant-wall-guard.mjs proves the wall STATICALLY in CI; this is
-- the confirming ADVERSARIAL LIVE test (the DR-0111 re-review item 0100 named).
--
-- Runs in a transaction and ROLLS BACK. PASS prints 'ASSISTANT BOOKS SMOKE:
-- PASS'; any wrong grant RAISES -> psql exits non-zero -> the leg is RED.
--
-- Assertions (against the final policy — 0100 added 'assistant' to the walls):
--   AS (assistant)  SELECT the books row O created      -> 0 rows   (walled)  ✘
--   AS INSERT into the books                            -> DENIED             ✘
--   AS UPDATE O's books row                             -> 0 rows            ✘
--   SU (successor)  SELECT the books row  (regression)  -> 1 row    (kept)    ✔
--   M  (member)     INSERT into the books (regression)  -> allowed  (kept)    ✔
-- The successor+member checks are the REGRESSION GUARD: 0100 re-gates the same
-- five tables 0082 did, so this leg proves 0100 added the assistant exclusion
-- WITHOUT narrowing the roles 0082 left writing/reading.
-- =============================================================================
BEGIN;

\set o  'a0000000-0000-4000-a000-000000000100'
\set m  'b0000000-0000-4000-a000-000000000100'
\set as 'c0000000-0000-4000-a000-000000000100'
\set su 'd0000000-0000-4000-a000-000000000100'

\set instF 'f0000000-0000-4000-b000-000000000100'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o',  'authenticated','authenticated','o0100@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m',  'authenticated','authenticated','m0100@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'as', 'authenticated','authenticated','as0100@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'su', 'authenticated','authenticated','su0100@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'biz-0100', 'Assistant smoke business', 'business');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o',  'owner',     'Owner O'),
  (:'instF', :'m',  'member',    'Member M'),
  (:'instF', :'as', 'assistant', 'Assistant AS'),
  (:'instF', :'su', 'successor', 'Successor SU');

-- A books row the owner created, for the assistant to try to reach.
INSERT INTO entities (id, instance_id, created_by, slug, display_name, entity_type)
VALUES ('e0000000-0000-4000-c000-000000000100', :'instF', :'o', 'smoke-seed-0100', 'Smoke Seed', 'business');

-- ── Helpers: run a statement AS a user; report success/denial ───────────────
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
  o  uuid := 'a0000000-0000-4000-a000-000000000100';
  m  uuid := 'b0000000-0000-4000-a000-000000000100';
  asst uuid := 'c0000000-0000-4000-a000-000000000100';
  su uuid := 'd0000000-0000-4000-a000-000000000100';
  instF uuid := 'f0000000-0000-4000-b000-000000000100';
  seed  uuid := 'e0000000-0000-4000-c000-000000000100';
  n int;
BEGIN
  -- ASSISTANT is walled out of READ (never the owner's books — the guarantee).
  n := pg_temp.count_as(asst, format('SELECT count(*) FROM entities WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'ASSISTANT BOOKS SMOKE FAIL: an assistant READ the owner books (got % rows, wanted 0)', n;
  END IF;

  -- ASSISTANT cannot INSERT.
  IF pg_temp.as_user(asst, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''asst-write-0100'', ''Asst Write'', ''business'')',
      instF, asst)) THEN
    RAISE EXCEPTION 'ASSISTANT BOOKS SMOKE FAIL: an assistant INSERTED into the books';
  END IF;

  -- ASSISTANT cannot UPDATE (restrictive USING filters the row: 0 touched).
  PERFORM pg_temp.as_user(asst, format('UPDATE entities SET display_name = ''asst-overwrote'' WHERE id = %L', seed));
  SELECT count(*) INTO n FROM entities WHERE id = seed AND display_name = 'asst-overwrote';
  IF n <> 0 THEN
    RAISE EXCEPTION 'ASSISTANT BOOKS SMOKE FAIL: an assistant UPDATED the owner''s books row';
  END IF;

  -- REGRESSION GUARD: the successor 0082 left reading STILL reads after 0100.
  n := pg_temp.count_as(su, format('SELECT count(*) FROM entities WHERE instance_id = %L', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'ASSISTANT BOOKS SMOKE FAIL: 0100 narrowed the successor read (got % rows, wanted 1)', n;
  END IF;

  -- REGRESSION GUARD: the member 0082 left writing STILL writes after 0100.
  IF NOT pg_temp.as_user(m, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''member-write-0100'', ''Member Write'', ''business'')',
      instF, m)) THEN
    RAISE EXCEPTION 'ASSISTANT BOOKS SMOKE FAIL: 0100 narrowed the member write (over-narrowed)';
  END IF;

  RAISE NOTICE 'ASSISTANT BOOKS SMOKE: PASS';
END $$;

SELECT 'ASSISTANT BOOKS SMOKE: PASS' AS result;

ROLLBACK;
