-- =============================================================================
-- 0082 SUCCESSOR + CHILD BOOKS SMOKE — the enablement gate for the role wall
-- =============================================================================
-- Run on the LIVE Supabase (as postgres) AFTER applying 0082 THEN 0100 (the
-- matrix leg applies both in order — 0100 re-gates the same five books tables,
-- so the live DB is only ever in its final combined state). PROVES (DR-0076,
-- the live two-identity no-leak probe) the ROLE wall 0082 declared actually
-- holds at the data layer: a child is walled out of the core books, a successor
-- reads but cannot write, and no writing role's access was narrowed. Runs in a
-- transaction and ROLLS BACK. PASS prints 'SUCCESSOR BOOKS SMOKE: PASS'; any
-- wrong grant RAISES -> psql exits non-zero -> the leg is RED.
--
-- The child wall is the load-bearing assertion: 0082's own header records that
-- before it, a child was a member and so user_in_instance() returned true —
-- a child could READ and even INSERT/UPDATE the books at the DB layer while
-- FamilyRoster promised the opposite. This smoke is the adversarial live proof
-- (the DR-0111 re-review item 0082 named its own fix for).
--
-- Assertions (against the final policy — child+successor walls both present):
--   CH (child)      SELECT the books row O created      -> 0 rows   (walled)  ✘
--   CH INSERT into the books                            -> DENIED             ✘
--   CH UPDATE O's books row                             -> 0 rows            ✘
--   SU (successor)  SELECT the books row                -> 1 row    (reads)   ✔
--   SU INSERT into the books                            -> DENIED   (r/o)     ✘
--   SU UPDATE O's books row                             -> 0 rows   (r/o)     ✘
--   M  (member)     INSERT into the books               -> allowed           ✔
--   M  DELETE O's books row                             -> 0 rows   (o/a only)✘
--   O  (owner)      DELETE own books row                -> removed           ✔
-- =============================================================================
BEGIN;

\set o  'a0000000-0000-4000-a000-000000000082'
\set m  'b0000000-0000-4000-a000-000000000082'
\set ch 'c0000000-0000-4000-a000-000000000082'
\set su 'd0000000-0000-4000-a000-000000000082'

\set instF 'f0000000-0000-4000-b000-000000000082'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o',  'authenticated','authenticated','o0082@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m',  'authenticated','authenticated','m0082@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'ch', 'authenticated','authenticated','ch0082@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'su', 'authenticated','authenticated','su0082@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0082', 'Successor smoke family', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o',  'owner',     'Owner O'),
  (:'instF', :'m',  'member',    'Member M'),
  (:'instF', :'ch', 'child',     'Child CH'),
  (:'instF', :'su', 'successor', 'Successor SU');

-- A books row the owner created (entities is a core-books table, no FK chain),
-- for the walled/read-only roles to try to reach.
INSERT INTO entities (id, instance_id, created_by, slug, display_name, entity_type)
VALUES ('e0000000-0000-4000-c000-000000000082', :'instF', :'o', 'smoke-seed-0082', 'Smoke Seed', 'business');

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
  o  uuid := 'a0000000-0000-4000-a000-000000000082';
  m  uuid := 'b0000000-0000-4000-a000-000000000082';
  ch uuid := 'c0000000-0000-4000-a000-000000000082';
  su uuid := 'd0000000-0000-4000-a000-000000000082';
  instF uuid := 'f0000000-0000-4000-b000-000000000082';
  seed  uuid := 'e0000000-0000-4000-c000-000000000082';
  n int;
BEGIN
  -- CHILD is walled out of READ (the load-bearing child-safety assertion).
  n := pg_temp.count_as(ch, format('SELECT count(*) FROM entities WHERE instance_id = %L', instF));
  IF n <> 0 THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a child READ the books (got % rows, wanted 0)', n;
  END IF;

  -- CHILD cannot INSERT.
  IF pg_temp.as_user(ch, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''child-write-0082'', ''Child Write'', ''business'')',
      instF, ch)) THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a child INSERTED into the books';
  END IF;

  -- CHILD cannot UPDATE (restrictive USING filters the row: 0 rows touched).
  PERFORM pg_temp.as_user(ch, format('UPDATE entities SET display_name = ''child-overwrote'' WHERE id = %L', seed));
  SELECT count(*) INTO n FROM entities WHERE id = seed AND display_name = 'child-overwrote';
  IF n <> 0 THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a child UPDATED the owner''s books row';
  END IF;

  -- SUCCESSOR READS the books (steward-in-training sees the real books).
  n := pg_temp.count_as(su, format('SELECT count(*) FROM entities WHERE instance_id = %L', instF));
  IF n <> 1 THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a successor should read the books (got % rows, wanted 1)', n;
  END IF;

  -- SUCCESSOR cannot INSERT (read-only).
  IF pg_temp.as_user(su, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''succ-write-0082'', ''Succ Write'', ''business'')',
      instF, su)) THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a successor INSERTED into the books (should be read-only)';
  END IF;

  -- SUCCESSOR cannot UPDATE (read-only).
  PERFORM pg_temp.as_user(su, format('UPDATE entities SET display_name = ''succ-overwrote'' WHERE id = %L', seed));
  SELECT count(*) INTO n FROM entities WHERE id = seed AND display_name = 'succ-overwrote';
  IF n <> 0 THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a successor UPDATED the owner''s books row (should be read-only)';
  END IF;

  -- MEMBER still writes (nothing narrowed for the ordinary writing roles).
  IF NOT pg_temp.as_user(m, format(
      'INSERT INTO entities (instance_id, created_by, slug, display_name, entity_type) VALUES (%L, %L, ''member-write-0082'', ''Member Write'', ''business'')',
      instF, m)) THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a member could no longer INSERT (over-narrowed)';
  END IF;

  -- MEMBER cannot DELETE (delete stays owner/admin only).
  PERFORM pg_temp.as_user(m, format('DELETE FROM entities WHERE id = %L', seed));
  SELECT count(*) INTO n FROM entities WHERE id = seed;
  IF n <> 1 THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: a member DELETED the owner''s books row (delete is owner/admin only)';
  END IF;

  -- OWNER can DELETE own books row.
  PERFORM pg_temp.as_user(o, format('DELETE FROM entities WHERE id = %L', seed));
  SELECT count(*) INTO n FROM entities WHERE id = seed;
  IF n <> 0 THEN
    RAISE EXCEPTION 'SUCCESSOR BOOKS SMOKE FAIL: the owner could not DELETE own books row';
  END IF;

  RAISE NOTICE 'SUCCESSOR BOOKS SMOKE: PASS';
END $$;

SELECT 'SUCCESSOR BOOKS SMOKE: PASS' AS result;

ROLLBACK;
