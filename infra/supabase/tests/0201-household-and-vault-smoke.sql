-- =============================================================================
-- 0201 HOUSEHOLD + VAULT SMOKE — the household's own record and its own shelf
-- (0201, DR-0357). Run on the LIVE Supabase (as postgres) AFTER 0200..0201.
-- Runs in a transaction and ROLLS BACK. PASS prints 'HOUSEHOLD SMOKE: PASS'.
--
-- Scenario: household F (owner O, member M, viewer V) and household X (owner Z).
--
-- Assertions — THE RECORD
--   O reads: the record starts itself, empty, once                          ✔
--   O fills cells; a second patch merges beside the first                   ✔
--   M (member) fills                                              -> REFUSED ✘
--   V (viewer) fills                                              -> REFUSED ✘
--   Z fills F's record                                            -> REFUSED ✘
--   M reads F's record                                                      ✔
--   Z reads F's record                                            -> REFUSED ✘
--   a bank/card/SSN/password/diagnosis cell                       -> REFUSED ✘
--   acknowledgments through a patch                               -> REFUSED ✘
--   O signs the covenant in place; the office's clock stamps it              ✔
--   the same signing keeps the stamp; a new version is stamped anew          ✔
--   V signs                                                       -> REFUSED ✘
--
-- Assertions — THE SHELF
--   O files a document (a file) and a pointer; both stand                    ✔
--   a row with neither bytes nor a place                          -> REFUSED ✘
--   M cannot see O's private document                             -> REFUSED ✘
--   O shares one with the household; M sees THAT one only                    ✔
--   M cannot edit or delete what O shared                         -> REFUSED ✘
--   Z sees nothing of F's shelf                                   -> REFUSED ✘
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000201'
\set m 'b0000000-0000-4000-a000-000000000201'
\set v 'c0000000-0000-4000-a000-000000000201'
\set z 'd0000000-0000-4000-a000-000000000201'
\set instF 'f0000000-0000-4000-b000-000000000201'
\set instX 'e0000000-0000-4000-b000-000000000201'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0201@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0201@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0201@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0201@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0201', 'The 0201 household', 'family'),
  (:'instX', 'fam-0201-x', 'Another household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instF', :'v', 'viewer', 'Viewer V'),
  (:'instX', :'z', 'owner',  'Owner Z');

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

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO j;
  PERFORM set_config('role', 'postgres', true);
  RETURN j;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE c int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO c;
  PERFORM set_config('role', 'postgres', true);
  RETURN c;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000201';
  m uuid := 'b0000000-0000-4000-a000-000000000201';
  v uuid := 'c0000000-0000-4000-a000-000000000201';
  z uuid := 'd0000000-0000-4000-a000-000000000201';
  instF uuid := 'f0000000-0000-4000-b000-000000000201';
  j jsonb;
  n int;
  v_stamp1 text;
  v_stamp2 text;
  v_att text := 'I have read the Household Covenant.';
BEGIN
  -- ═══ THE RECORD ═════════════════════════════════════════════════════════
  j := pg_temp.json_as(o, 'o0201@test.local', format('SELECT public.household_record_read(%L)', instF));
  IF j->>'record_id' IS NULL OR j->>'record' <> '{}' THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: the record did not start empty: %', j;
  END IF;
  SELECT count(*)::int INTO n FROM household_records WHERE instance_id = instF;
  IF n <> 1 THEN RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: reading twice made % records', n; END IF;
  PERFORM pg_temp.json_as(o, 'o0201@test.local', format('SELECT public.household_record_read(%L)', instF));
  SELECT count(*)::int INTO n FROM household_records WHERE instance_id = instF;
  IF n <> 1 THEN RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a second read made a second record'; END IF;

  j := pg_temp.json_as(o, 'o0201@test.local', format(
    'SELECT public.household_record_patch(''{"householdName":"The Poe household","sabbathDay":"Sunday"}''::jsonb, ''first pass'', %L)', instF));
  IF j->'record'->>'householdName' <> 'The Poe household' THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: the patch did not land: %', j;
  END IF;
  j := pg_temp.json_as(o, 'o0201@test.local', format(
    'SELECT public.household_record_patch(''{"bankName":"Busey"}''::jsonb, ''added the bank name'', %L)', instF));
  IF j->'record'->>'bankName' <> 'Busey' OR j->'record'->>'sabbathDay' <> 'Sunday' THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a second patch replaced instead of merging: %', j;
  END IF;

  -- Who may fill
  IF pg_temp.as_user(m, 'm0201@test.local', format('SELECT public.household_record_patch(''{"homeCity":"no"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a member filled the household record';
  END IF;
  IF pg_temp.as_user(v, 'v0201@test.local', format('SELECT public.household_record_patch(''{"homeCity":"no"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a viewer filled the household record';
  END IF;
  IF pg_temp.as_user(z, 'z0201@test.local', format('SELECT public.household_record_patch(''{"homeCity":"no"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: another household filled this one''s record';
  END IF;

  -- Who may read
  j := pg_temp.json_as(m, 'm0201@test.local', format('SELECT public.household_record_read(%L)', instF));
  IF j->'record'->>'householdName' <> 'The Poe household' THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a member cannot read their own household record';
  END IF;
  IF pg_temp.as_user(z, 'z0201@test.local', format('SELECT public.household_record_read(%L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: another household read this one''s record';
  END IF;

  -- The walls
  IF pg_temp.as_user(o, 'o0201@test.local', format('SELECT public.household_record_patch(''{"accountNumber":"13198025"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: an account number was written into a household record';
  END IF;
  IF pg_temp.as_user(o, 'o0201@test.local', format('SELECT public.household_record_patch(''{"routingNumber":"071102568"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a routing number was written into a household record';
  END IF;
  IF pg_temp.as_user(o, 'o0201@test.local', format('SELECT public.household_record_patch(''{"ssn":"000-00-0000"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a Social Security number was written into a household record';
  END IF;
  IF pg_temp.as_user(o, 'o0201@test.local', format('SELECT public.household_record_patch(''{"password":"x"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a password was written into a household record';
  END IF;
  IF pg_temp.as_user(o, 'o0201@test.local', format('SELECT public.household_record_patch(''{"diagnosis":"x"}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a diagnosis was written into a household record';
  END IF;
  IF pg_temp.as_user(o, 'o0201@test.local', format('SELECT public.household_record_patch(''{"acknowledgments":{"householdCovenant":{"agreed":true}}}''::jsonb, NULL, %L)', instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a signature was written through a patch';
  END IF;

  -- The covenant, signed in place
  j := pg_temp.json_as(o, 'o0201@test.local', format(
    'SELECT public.household_record_acknowledge(''householdCovenant'', ''Darrell Poe'', ''v1a2b3c4'', %L, ''2026-09-11T12:00:00.000Z'', %L)', v_att, instF));
  IF (j->'record'->'acknowledgments'->'householdCovenant'->>'agreed') <> 'true'
     OR (j->'record'->'acknowledgments'->'householdCovenant'->>'signature') <> 'Darrell Poe'
     OR coalesce(j->'record'->'acknowledgments'->'householdCovenant'->>'signedAtServer', '') = ''
     OR (j->'record'->>'householdName') <> 'The Poe household' THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: the covenant signature is not whole: %', j->'record'->'acknowledgments';
  END IF;
  v_stamp1 := j->'record'->'acknowledgments'->'householdCovenant'->>'signedAtServer';

  PERFORM pg_sleep(0.01);
  j := pg_temp.json_as(o, 'o0201@test.local', format(
    'SELECT public.household_record_acknowledge(''householdCovenant'', ''Darrell Poe'', ''v1a2b3c4'', %L, NULL, %L)', v_att, instF));
  IF (j->'record'->'acknowledgments'->'householdCovenant'->>'signedAtServer') <> v_stamp1 THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: the same signing was re-stamped';
  END IF;

  PERFORM pg_sleep(0.01);
  j := pg_temp.json_as(o, 'o0201@test.local', format(
    'SELECT public.household_record_acknowledge(''householdCovenant'', ''Darrell Poe'', ''v9f9f9f9'', %L, NULL, %L)', v_att, instF));
  v_stamp2 := j->'record'->'acknowledgments'->'householdCovenant'->>'signedAtServer';
  IF v_stamp2 = v_stamp1 THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a re-signing on a new version kept the old stamp';
  END IF;

  IF pg_temp.as_user(v, 'v0201@test.local', format(
    'SELECT public.household_record_acknowledge(''householdCovenant'', ''Viewer V'', ''v1'', %L, NULL, %L)', v_att, instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a viewer signed the household covenant';
  END IF;
  IF pg_temp.as_user(o, 'o0201@test.local', format(
    'SELECT public.household_record_acknowledge(''somethingElse'', ''Darrell Poe'', ''v1'', %L, NULL, %L)', v_att, instF)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: an unknown document was acknowledged';
  END IF;

  -- ═══ THE SHELF ══════════════════════════════════════════════════════════
  PERFORM set_config('role', 'postgres', true);
  IF NOT pg_temp.as_user(o, 'o0201@test.local', format(
    'INSERT INTO family_documents (instance_id, created_by, slug, category, label, storage_path, file_name) VALUES (%L, %L, ''deed-0201'', ''home'', ''The deed'', %L, ''deed.pdf'')',
    instF, o, o::text || '/deed-0201.pdf')) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: the owner could not file a document';
  END IF;
  IF NOT pg_temp.as_user(o, 'o0201@test.local', format(
    'INSERT INTO family_documents (instance_id, created_by, slug, category, label, where_filed) VALUES (%L, %L, ''will-0201'', ''legacy'', ''The will'', ''the fire safe, top shelf'')',
    instF, o)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a pointer record was refused';
  END IF;
  IF pg_temp.as_user(o, 'o0201@test.local', format(
    'INSERT INTO family_documents (instance_id, created_by, slug, category, label) VALUES (%L, %L, ''nowhere-0201'', ''other'', ''Nowhere'')', instF, o)) THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a document with neither bytes nor a place was accepted';
  END IF;

  -- Private until shared
  n := pg_temp.count_as(m, 'm0201@test.local', format('SELECT count(*)::int FROM family_documents WHERE instance_id = %L', instF));
  IF n <> 0 THEN RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a member saw % of another''s private documents', n; END IF;

  PERFORM pg_temp.as_user(o, 'o0201@test.local', 'UPDATE family_documents SET shared_with_household = true WHERE slug = ''deed-0201''');
  n := pg_temp.count_as(m, 'm0201@test.local', format('SELECT count(*)::int FROM family_documents WHERE instance_id = %L', instF));
  IF n <> 1 THEN RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a member saw % shared documents, expected exactly 1', n; END IF;

  -- Sharing does not hand over the pen
  PERFORM pg_temp.as_user(m, 'm0201@test.local', 'UPDATE family_documents SET label = ''mine now'' WHERE slug = ''deed-0201''');
  IF (SELECT label FROM family_documents WHERE slug = 'deed-0201') <> 'The deed' THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a member edited a document another person shared';
  END IF;
  PERFORM pg_temp.as_user(m, 'm0201@test.local', 'DELETE FROM family_documents WHERE slug = ''deed-0201''');
  IF NOT EXISTS (SELECT 1 FROM family_documents WHERE slug = 'deed-0201') THEN
    RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: a member deleted a document another person shared';
  END IF;

  -- Another household sees nothing at all
  n := pg_temp.count_as(z, 'z0201@test.local', format('SELECT count(*)::int FROM family_documents WHERE instance_id = %L', instF));
  IF n <> 0 THEN RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: another household saw % of this shelf', n; END IF;

  -- The record of it all
  SELECT count(*)::int INTO n FROM audit_log
   WHERE instance_id = instF AND entity_type = 'household_record' AND action = 'update';
  IF n < 5 THEN RAISE EXCEPTION 'HOUSEHOLD SMOKE FAIL: expected at least 5 audited household writes, found %', n; END IF;

  RAISE NOTICE 'HOUSEHOLD SMOKE: PASS';
END $$;

SELECT 'HOUSEHOLD SMOKE: PASS' AS result;

ROLLBACK;
