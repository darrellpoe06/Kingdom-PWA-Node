-- =============================================================================
-- 0167 FAMILY TRUST RECORDS ISOLATION SMOKE — the Legacy Provisions ledger is
-- the house's shared record and nobody else's.
-- Run on the LIVE Supabase (as postgres) AFTER 0167. Rolls back.
-- PASS prints 'FAMILY TRUST RECORDS ISOLATION SMOKE: PASS'; any wrong behaviour RAISES.
-- If 0167 is NOT applied on the database under test, the first INSERT raises
-- 'relation "family_trust_records" does not exist' — which is the answer
-- DR-0322 has been waiting for, reported by the run rather than assumed.
--
-- 2026-09-24 (the Books → Plan end-to-end review): 0167 shipped its policies
-- with no live proof in this matrix. This one proves the contract:
--
-- Household F: owner O, member M, child C. Household X: owner Z.
--   O, M read F's rows; C (a child) reads none; Z reads only X's        ✔
--   M inserts a row of his own; M cannot insert as someone else          ✔ / ✘
--   Z cannot insert into F, update F's rows, or delete them              ✘
--   M deletes his own row; M cannot delete O's row; O deletes M's        ✔ / ✘ / ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000167'
\set m 'b0000000-0000-4000-a000-000000000167'
\set c 'c0000000-0000-4000-a000-000000000167'
\set z 'f0000000-0000-4000-a000-000000000167'
\set instF '10000000-0000-4000-b000-000000000167'
\set instX '20000000-0000-4000-b000-000000000167'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0167@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0167@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0167@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0167@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0167', 'The 0167 household', 'family'),
  (:'instX', 'fam-0167-x', 'Another household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instF', :'c', 'child',  'Child C'),
  (:'instX', :'z', 'owner',  'Owner Z');

INSERT INTO family_trust_records (instance_id, created_by, slug, kind, beneficiary, label) VALUES
  (:'instF', :'o', 'ft-0167-o', 'production', 'child-one', 'O recorded this'),
  (:'instX', :'z', 'ft-0167-z', 'production', 'someone',   'Z recorded this');

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

CREATE OR REPLACE FUNCTION pg_temp.labels_as(_who uuid, _email text)
RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE out text[];
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  SELECT coalesce(array_agg(label ORDER BY label), '{}') INTO out FROM public.family_trust_records;
  PERFORM set_config('role', 'postgres', true);
  RETURN out;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000167';
  m uuid := 'b0000000-0000-4000-a000-000000000167';
  c uuid := 'c0000000-0000-4000-a000-000000000167';
  z uuid := 'f0000000-0000-4000-a000-000000000167';
  instF uuid := '10000000-0000-4000-b000-000000000167';
  t text[]; n int;
BEGIN
  -- ---------------- who reads ----------------
  t := pg_temp.labels_as(o, 'o0167@test.local');
  IF t <> ARRAY['O recorded this'] THEN RAISE EXCEPTION 'FAIL: the owner reads %', t; END IF;
  t := pg_temp.labels_as(m, 'm0167@test.local');
  IF t <> ARRAY['O recorded this'] THEN RAISE EXCEPTION 'FAIL: the member reads %', t; END IF;
  t := pg_temp.labels_as(c, 'c0167@test.local');
  IF t <> '{}' THEN RAISE EXCEPTION 'FAIL: a child reads the trust ledger: %', t; END IF;
  t := pg_temp.labels_as(z, 'z0167@test.local');
  IF t <> ARRAY['Z recorded this'] THEN RAISE EXCEPTION 'FAIL: another household reads %', t; END IF;

  -- ---------------- who writes ----------------
  IF NOT pg_temp.as_user(m, 'm0167@test.local',
      format('INSERT INTO public.family_trust_records (instance_id, created_by, slug, kind, beneficiary, label) VALUES (%L, %L, %L, %L, %L, %L)', instF, m, 'ft-0167-m', 'production', 'child-two', 'M recorded this')) THEN
    RAISE EXCEPTION 'FAIL: a member could not record his own entry';
  END IF;
  IF pg_temp.as_user(m, 'm0167@test.local',
      format('INSERT INTO public.family_trust_records (instance_id, created_by, slug, kind, beneficiary, label) VALUES (%L, %L, %L, %L, %L, %L)', instF, o, 'ft-0167-m-as-o', 'production', 'child-two', 'M as O')) THEN
    RAISE EXCEPTION 'FAIL: a member inserted a row in the owner''s name';
  END IF;
  IF pg_temp.as_user(z, 'z0167@test.local',
      format('INSERT INTO public.family_trust_records (instance_id, created_by, slug, kind, beneficiary, label) VALUES (%L, %L, %L, %L, %L, %L)', instF, z, 'ft-0167-z-in-f', 'production', 'someone', 'Z in F')) THEN
    RAISE EXCEPTION 'FAIL: another household inserted into our ledger';
  END IF;

  PERFORM pg_temp.as_user(z, 'z0167@test.local',
    format('UPDATE public.family_trust_records SET label = %L WHERE instance_id = %L', 'Z was here', instF));
  SELECT count(*)::int INTO n FROM public.family_trust_records WHERE instance_id = instF AND label = 'Z was here';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: another household updated our ledger'; END IF;

  PERFORM pg_temp.as_user(z, 'z0167@test.local',
    format('DELETE FROM public.family_trust_records WHERE instance_id = %L', instF));
  SELECT count(*)::int INTO n FROM public.family_trust_records WHERE instance_id = instF;
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: another household deleted from our ledger (% rows left)', n; END IF;

  -- ---------------- who deletes at home ----------------
  PERFORM pg_temp.as_user(m, 'm0167@test.local',
    format('DELETE FROM public.family_trust_records WHERE slug = %L', 'ft-0167-o'));
  SELECT count(*)::int INTO n FROM public.family_trust_records WHERE slug = 'ft-0167-o';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: a member deleted the owner''s entry'; END IF;

  PERFORM pg_temp.as_user(m, 'm0167@test.local',
    format('DELETE FROM public.family_trust_records WHERE slug = %L', 'ft-0167-m'));
  SELECT count(*)::int INTO n FROM public.family_trust_records WHERE slug = 'ft-0167-m';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a member could not delete his own entry'; END IF;

  INSERT INTO public.family_trust_records (instance_id, created_by, slug, kind, beneficiary, label)
    VALUES (instF, m, 'ft-0167-m2', 'production', 'child-two', 'M again');
  PERFORM pg_temp.as_user(o, 'o0167@test.local',
    format('DELETE FROM public.family_trust_records WHERE slug = %L', 'ft-0167-m2'));
  SELECT count(*)::int INTO n FROM public.family_trust_records WHERE slug = 'ft-0167-m2';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: the owner could not correct a member''s entry'; END IF;

  RAISE NOTICE 'FAMILY TRUST RECORDS ISOLATION SMOKE: PASS';
END $$;

ROLLBACK;
