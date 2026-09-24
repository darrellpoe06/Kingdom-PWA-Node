-- =============================================================================
-- 0138 FAMILY PLANS ISOLATION SMOKE — the plan is the family's alone.
-- Run on the LIVE Supabase (as postgres) AFTER 0138 (the table lives there
-- already: 0206's smoke inserts into it). Rolls back.
-- PASS prints 'FAMILY PLANS ISOLATION SMOKE: PASS'; any wrong behaviour RAISES.
--
-- 2026-09-24 (the Books → Plan end-to-end review): the Plan tab's whole wall
-- is RLS on family_plans (user_in_instance). Until now no live smoke proved a
-- cross-household SELECT is empty — 0206's smoke only proved another household
-- cannot IMPORT. This one reads.
--
-- Household F: owner O, member M. Household X: owner Z. One plan in each.
--
-- Assertions
--   O reads F's plan and only F's                                   ✔
--   M (a member) reads F's plan too                                  ✔
--   Z reads X's plan and NEVER F's (the newest-row query is scoped)  ✔
--   Z cannot update F's plan                                         ✘
--   Z cannot insert a plan into F                                    ✘
--   Z cannot delete F's plan                                         ✘
--   a stranger with no membership reads nothing                      ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000138'
\set m 'b0000000-0000-4000-a000-000000000138'
\set z 'f0000000-0000-4000-a000-000000000138'
\set s 'e0000000-0000-4000-a000-000000000138'
\set instF '10000000-0000-4000-b000-000000000138'
\set instX '20000000-0000-4000-b000-000000000138'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0138@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0138@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0138@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0138@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0138', 'The 0138 household', 'family'),
  (:'instX', 'fam-0138-x', 'Another household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instX', :'z', 'owner',  'Owner Z');

INSERT INTO family_plans (instance_id, slug, title, plan, updated_by) VALUES
  (:'instF', 'plan-0138', 'F plan', '{"narrative":{"title":"F"}}'::jsonb, :'o'),
  (:'instX', 'plan-0138', 'X plan', '{"narrative":{"title":"X"}}'::jsonb, :'z');

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

CREATE OR REPLACE FUNCTION pg_temp.titles_as(_who uuid, _email text)
RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE out text[];
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  SELECT coalesce(array_agg(title ORDER BY title), '{}') INTO out FROM public.family_plans;
  PERFORM set_config('role', 'postgres', true);
  RETURN out;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000138';
  m uuid := 'b0000000-0000-4000-a000-000000000138';
  z uuid := 'f0000000-0000-4000-a000-000000000138';
  s uuid := 'e0000000-0000-4000-a000-000000000138';
  instF uuid := '10000000-0000-4000-b000-000000000138';
  t text[]; n int;
BEGIN
  t := pg_temp.titles_as(o, 'o0138@test.local');
  IF t <> ARRAY['F plan'] THEN RAISE EXCEPTION 'FAIL: the owner reads % — expected only F plan', t; END IF;

  t := pg_temp.titles_as(m, 'm0138@test.local');
  IF t <> ARRAY['F plan'] THEN RAISE EXCEPTION 'FAIL: the member reads % — expected only F plan', t; END IF;

  t := pg_temp.titles_as(z, 'z0138@test.local');
  IF t <> ARRAY['X plan'] THEN RAISE EXCEPTION 'FAIL: another household reads % — expected only X plan', t; END IF;

  t := pg_temp.titles_as(s, 's0138@test.local');
  IF t <> '{}' THEN RAISE EXCEPTION 'FAIL: a stranger with no membership reads %', t; END IF;

  -- Cross-household writes are refused (RLS raises or affects 0 rows; either way F is untouched).
  PERFORM pg_temp.as_user(z, 'z0138@test.local',
    format('UPDATE public.family_plans SET title = %L WHERE instance_id = %L', 'Z was here', instF));
  SELECT count(*)::int INTO n FROM public.family_plans WHERE instance_id = instF AND title = 'Z was here';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: another household updated our plan'; END IF;

  PERFORM pg_temp.as_user(z, 'z0138@test.local',
    format('INSERT INTO public.family_plans (instance_id, slug, title, plan, updated_by) VALUES (%L, %L, %L, %L::jsonb, %L)', instF, 'plan-0138-z', 'Z plan in F', '{}', z));
  SELECT count(*)::int INTO n FROM public.family_plans WHERE instance_id = instF;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: another household inserted a plan into ours (% rows)', n; END IF;

  PERFORM pg_temp.as_user(z, 'z0138@test.local',
    format('DELETE FROM public.family_plans WHERE instance_id = %L', instF));
  SELECT count(*)::int INTO n FROM public.family_plans WHERE instance_id = instF;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: another household deleted our plan'; END IF;

  RAISE NOTICE 'FAMILY PLANS ISOLATION SMOKE: PASS';
END $$;

ROLLBACK;
