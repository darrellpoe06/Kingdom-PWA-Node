-- =============================================================================
-- 0200 PRODUCT FORMS SMOKE — one forms engine for every product (0200, DR-0357)
-- Run on the LIVE Supabase (as postgres) AFTER 0200. Runs in a transaction and
-- ROLLS BACK. PASS prints 'PRODUCT FORMS SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: family instance F (owner O, member M, viewer V) and an unrelated
-- family instance X (owner Z). Stranger S has no seat anywhere.
--
-- Assertions:
--   O saves the household form: version 1, then version 2, history keeps both ✔
--   a save with no note                                          -> REFUSED ✘
--   an unknown product / a malformed key / a non-object body      -> REFUSED ✘
--   M (member) saves                                              -> REFUSED ✘
--   V (viewer) saves                                              -> REFUSED ✘
--   Z saves into F's instance                                     -> REFUSED ✘
--   M reads F's forms                                                        ✔
--   Z reads F's poetech forms                                     -> REFUSED ✘
--   S (anon) reads poetech                                        -> REFUSED ✘
--   S (anon) reads properties for a named instance                           ✔
--   S (anon) reads properties with no instance named              -> REFUSED ✘
--   the two instances never see each other's rows                            ✔
--   every save is audited                                                    ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000200'
\set m 'b0000000-0000-4000-a000-000000000200'
\set v 'c0000000-0000-4000-a000-000000000200'
\set z 'd0000000-0000-4000-a000-000000000200'
\set instF 'f0000000-0000-4000-b000-000000000200'
\set instX 'e0000000-0000-4000-b000-000000000200'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0200@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0200@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0200@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0200@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0200', 'The 0200 household', 'family'),
  (:'instX', 'fam-0200-x', 'Another household', 'family');
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

CREATE OR REPLACE FUNCTION pg_temp.as_anon(_sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', NULL, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.json_anon(_sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', NULL, true);
  EXECUTE _sql INTO j;
  PERFORM set_config('role', 'postgres', true);
  RETURN j;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000200';
  m uuid := 'b0000000-0000-4000-a000-000000000200';
  v uuid := 'c0000000-0000-4000-a000-000000000200';
  z uuid := 'd0000000-0000-4000-a000-000000000200';
  instF uuid := 'f0000000-0000-4000-b000-000000000200';
  instX uuid := 'e0000000-0000-4000-b000-000000000200';
  j jsonb;
  n int;
  v_body text := '{"sections":[{"id":"household","title":"The household","fields":[{"key":"householdName","type":"text","label":"What we call this household","required":true}]}]}';
BEGIN
  -- ── The owner saves, twice: version 1 then 2, both kept in history ────────
  j := pg_temp.json_as(o, 'o0200@test.local', format(
    'SELECT public.product_form_save(''poetech'', ''household-intake'', %L::jsonb, ''first draft'', %L)', v_body, instF));
  IF (j->>'version')::int <> 1 THEN RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: first save is not version 1: %', j; END IF;
  j := pg_temp.json_as(o, 'o0200@test.local', format(
    'SELECT public.product_form_save(''poetech'', ''household-intake'', %L::jsonb, ''renamed a question'', %L)', v_body, instF));
  IF (j->>'version')::int <> 2 THEN RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: second save is not version 2: %', j; END IF;
  SELECT count(*)::int INTO n FROM product_form_history WHERE instance_id = instF AND key = 'household-intake';
  IF n <> 2 THEN RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: history kept % versions, expected 2', n; END IF;

  -- ── The walls of a save ───────────────────────────────────────────────────
  IF pg_temp.as_user(o, 'o0200@test.local', format('SELECT public.product_form_save(''poetech'', ''household-intake'', %L::jsonb, '''', %L)', v_body, instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: a save with no note was accepted';
  END IF;
  IF pg_temp.as_user(o, 'o0200@test.local', format('SELECT public.product_form_save(''nope'', ''household-intake'', %L::jsonb, ''x y z'', %L)', v_body, instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: an unknown product was accepted';
  END IF;
  IF pg_temp.as_user(o, 'o0200@test.local', format('SELECT public.product_form_save(''poetech'', ''Bad Key'', %L::jsonb, ''x y z'', %L)', v_body, instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: a malformed key was accepted';
  END IF;
  IF pg_temp.as_user(o, 'o0200@test.local', format('SELECT public.product_form_save(''poetech'', ''household-intake'', ''[]''::jsonb, ''x y z'', %L)', instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: a non-object body was accepted';
  END IF;

  -- ── Who may save ──────────────────────────────────────────────────────────
  IF pg_temp.as_user(m, 'm0200@test.local', format('SELECT public.product_form_save(''poetech'', ''household-intake'', %L::jsonb, ''member try'', %L)', v_body, instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: a member changed the household form';
  END IF;
  IF pg_temp.as_user(v, 'v0200@test.local', format('SELECT public.product_form_save(''poetech'', ''household-intake'', %L::jsonb, ''viewer try'', %L)', v_body, instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: a viewer changed the household form';
  END IF;
  IF pg_temp.as_user(z, 'z0200@test.local', format('SELECT public.product_form_save(''poetech'', ''household-intake'', %L::jsonb, ''stranger try'', %L)', v_body, instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: another household''s owner changed this household''s form';
  END IF;

  -- ── Who may read ──────────────────────────────────────────────────────────
  j := pg_temp.json_as(m, 'm0200@test.local', format('SELECT public.product_forms_read(''poetech'', %L)', instF));
  IF (j->'household-intake'->>'version')::int <> 2 THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: a member cannot read their own household form: %', j;
  END IF;
  IF pg_temp.as_user(z, 'z0200@test.local', format('SELECT public.product_forms_read(''poetech'', %L)', instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: another household read this household''s forms';
  END IF;

  -- ── The anonymous applicant: properties yes, poetech never ────────────────
  PERFORM pg_temp.json_as(o, 'o0200@test.local', format(
    'SELECT public.product_form_save(''properties'', ''rental-criteria'', ''{"title":"What we look at"}''::jsonb, ''our criteria'', %L)', instF));
  j := pg_temp.json_anon(format('SELECT public.product_forms_read(''properties'', %L)', instF));
  IF (j->'rental-criteria'->>'version')::int <> 1 THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: an applicant with no account cannot read the criteria: %', j;
  END IF;
  IF pg_temp.as_anon(format('SELECT public.product_forms_read(''poetech'', %L)', instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: an anonymous reader saw a household form';
  END IF;
  IF pg_temp.as_anon('SELECT public.product_forms_read(''properties'', NULL)') THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: an anonymous read with no office named was accepted';
  END IF;

  -- ── Neither household sees the other's rows ───────────────────────────────
  PERFORM pg_temp.json_as(z, 'z0200@test.local', format(
    'SELECT public.product_form_save(''poetech'', ''household-intake'', %L::jsonb, ''their own'', %L)', v_body, instX));
  j := pg_temp.json_as(o, 'o0200@test.local', format('SELECT public.product_forms_read(''poetech'', %L)', instF));
  IF (j->'household-intake'->>'note') <> 'renamed a question' THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: one household''s save reached another: %', j;
  END IF;

  -- ── Direct writes are refused even for the owner ──────────────────────────
  IF pg_temp.as_user(o, 'o0200@test.local', format(
    'INSERT INTO product_forms (instance_id, product, key, body) VALUES (%L, ''poetech'', ''sneak'', ''{}''::jsonb)', instF)) THEN
    RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: a direct insert bypassed the save function';
  END IF;

  -- ── The record ────────────────────────────────────────────────────────────
  SELECT count(*)::int INTO n FROM audit_log
   WHERE instance_id = instF AND entity_type = 'product_form' AND action = 'update';
  IF n <> 3 THEN RAISE EXCEPTION 'PRODUCT FORMS SMOKE FAIL: expected 3 audited saves, found %', n; END IF;

  RAISE NOTICE 'PRODUCT FORMS SMOKE: PASS';
END $$;

SELECT 'PRODUCT FORMS SMOKE: PASS' AS result;

ROLLBACK;
