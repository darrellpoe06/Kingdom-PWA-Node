-- =============================================================================
-- 0125 VIEWER-READONLY SMOKE TEST — the enablement gate for true-read-only Viewer
-- =============================================================================
-- Run on the LIVE Supabase (as postgres) AFTER applying 0125. PROVES (DR-0076,
-- the live two-identity no-leak probe) that the restrictive viewer overlay and
-- the explicit invite target actually hold. Runs in a transaction and ROLLS
-- BACK. PASS prints 'VIEWER READONLY SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: family-type instance F (owner O, member M, viewer V) plus
-- business-type instance B (O owner) and church instance C (O owner).
--
-- Assertions:
--   V SELECTs the F ledger row O created                   -> 1 row      ✔
--   V INSERT into the ledger (entities)                    -> DENIED     ✘
--   V UPDATE O's ledger row                                -> 0 rows     ✘
--   V DELETE O's ledger row                                -> 0 rows     ✘
--   V sends a DM to O (participation exception)            -> allowed    ✔
--   M INSERT into the ledger (member still collaborates)   -> allowed    ✔
--   invite with explicit instance B                        -> row on B   ✔
--   invite with explicit instance F by non-leader M        -> RAISES     ✘
--   invite with explicit church instance C                 -> RAISES     ✘
--   invite with no instance (legacy)                       -> row on F (family-first) ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000125'
\set m 'b0000000-0000-4000-a000-000000000125'
\set v 'c0000000-0000-4000-a000-000000000125'

\set instF 'f0000000-0000-4000-b000-000000000125'
\set instB 'f0000000-0000-4000-b000-000000010125'
\set instC 'f0000000-0000-4000-b000-000000020125'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0125@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0125@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0125@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0125',    'Viewer smoke family',   'family'),
  (:'instB', 'biz-0125',    'Viewer smoke business', 'business'),
  (:'instC', 'church-0125', 'Viewer smoke church',   'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instF', :'v', 'viewer', 'Viewer V'),
  (:'instB', :'o', 'owner',  'Owner O'),
  (:'instC', :'o', 'owner',  'Owner O');

-- A ledger row the owner created (entities is core-books per 0100, no FK chain),
-- for the viewer to try to touch.
INSERT INTO entities (id, instance_id, created_by, slug, display_name, entity_type)
VALUES ('d0000000-0000-4000-c000-000000000125', :'instF', :'o', 'smoke-seed-0125', 'Smoke Seed', 'business');

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
  o uuid := 'a0000000-0000-4000-a000-000000000125';
  m uuid := 'b0000000-0000-4000-a000-000000000125';
  v uuid := 'c0000000-0000-4000-a000-000000000125';
  instF uuid := 'f0000000-0000-4000-b000-000000000125';
  instB uuid := 'f0000000-0000-4000-b000-000000010125';
  instC uuid := 'f0000000-0000-4000-b000-000000020125';
  seed uuid := 'd0000000-0000-4000-c000-000000000125';
  invited jsonb;
  target uuid;
  n int;
BEGIN
  -- Viewer READS the family ledger (membership semantics unchanged).
  n := pg_temp.count_as(v, format('SELECT count(*) FROM entities WHERE instance_id = %L', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: viewer should read the family ledger (got % rows)', n;
  END IF;

  -- Viewer cannot INSERT.
  IF pg_temp.as_user(v, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''viewer-write-0125'', ''Viewer Write'', ''business'')',
      instF, v)) THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: a viewer INSERTED into the ledger';
  END IF;

  -- Viewer cannot UPDATE (restrictive USING filters the row: 0 rows touched).
  PERFORM pg_temp.as_user(v, format('UPDATE entities SET display_name = ''overwritten'' WHERE id = %L', seed));
  SELECT count(*) INTO n FROM entities WHERE id = seed AND display_name = 'overwritten';
  IF n <> 0 THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: a viewer UPDATED an owner''s ledger row';
  END IF;

  -- Viewer cannot DELETE.
  PERFORM pg_temp.as_user(v, format('DELETE FROM entities WHERE id = %L', seed));
  SELECT count(*) INTO n FROM entities WHERE id = seed;
  IF n <> 1 THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: a viewer DELETED an owner''s ledger row';
  END IF;

  -- Participation exception: the viewer CAN still DM a leader.
  IF NOT pg_temp.as_user(v, format(
      'INSERT INTO direct_messages (instance_id, sender_user_id, recipient_user_id, sender_name, body) VALUES (%L, %L, %L, ''Viewer V'', ''hello'')',
      instF, v, o)) THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: the viewer could not DM the leader (participation exception broken)';
  END IF;

  -- A member still collaborates (nothing narrowed for member).
  IF NOT pg_temp.as_user(m, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''member-write-0125'', ''Member Write'', ''business'')',
      instF, m)) THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: a member could no longer INSERT (over-narrowed)';
  END IF;

  -- Explicit invite target is honored: O invites into B, the row lands on B.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  invited := public.invite_to_instance('guest0125@test.local', 'viewer', instB);
  PERFORM set_config('role', 'postgres', true);
  SELECT instance_id INTO target FROM instance_invites WHERE id = (invited->>'id')::uuid;
  IF target IS DISTINCT FROM instB THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: explicit invite target ignored (landed on %, wanted %)', target, instB;
  END IF;

  -- A non-leader cannot invite into a space by naming it.
  IF pg_temp.as_user(m, format('SELECT public.invite_to_instance(''guest2-0125@test.local'', ''viewer'', %L)', instF)) THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: a plain member invited by naming the instance';
  END IF;

  -- A church instance is never a valid explicit target for this RPC.
  IF pg_temp.as_user(o, format('SELECT public.invite_to_instance(''guest3-0125@test.local'', ''viewer'', %L)', instC)) THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: invite_to_instance accepted a church target';
  END IF;

  -- Legacy call (no instance) keeps the family-first resolution.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  invited := public.invite_to_instance('guest4-0125@test.local', 'member');
  PERFORM set_config('role', 'postgres', true);
  SELECT instance_id INTO target FROM instance_invites WHERE id = (invited->>'id')::uuid;
  IF target IS DISTINCT FROM instF THEN
    RAISE EXCEPTION 'VIEWER READONLY SMOKE FAIL: legacy resolution changed (landed on %, wanted family %)', target, instF;
  END IF;

  RAISE NOTICE 'VIEWER READONLY SMOKE: PASS';
END $$;

SELECT 'VIEWER READONLY SMOKE: PASS' AS result;

ROLLBACK;
