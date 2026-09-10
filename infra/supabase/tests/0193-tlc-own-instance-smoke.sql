-- =============================================================================
-- 0193 TLC OWN-INSTANCE SMOKE — the office is a therapy-practice instance and
-- the office resolvers answer ONLY from one (0193, DR-0351). Run on the LIVE
-- Supabase (as postgres) AFTER 0187..0193. Runs in a transaction and ROLLS
-- BACK. PASS prints 'TLC OWN INSTANCE SMOKE: PASS'; any wrong answer RAISES.
--
-- Scenario: family instance FAM (owner U, joined long ago; owner W) and
-- practice instance PRAC (admin U, joined now; member C). S is a stranger.
--
-- Assertions:
--   U  my_office_instance_role  -> PRAC / admin (not the older family)   ✔
--   U  tlc_onboarding_my_office -> PRAC                                   ✔
--   U  my_default_instance_role -> FAM (the shell's resolver untouched)   ✔
--   W  (family owner only)  my_office -> null; tlc_onboarding_my_office -> no row ✔
--   W  invites a colleague through the office                            -> REFUSED ✘
--   U  invites a colleague through the office                            -> allowed ✔
--   C  (practice member only) my_office -> PRAC / member                  ✔
--   S  my_office -> null                                                  ✔
--   LIVE: instance tlc-therapy-solutions exists, type therapy-practice,
--         with an owner and an admin; no tlc_* row remains on poe-family   ✔
-- =============================================================================
BEGIN;

\set u 'a0000000-0000-4000-a000-000000000193'
\set w 'b0000000-0000-4000-a000-000000000193'
\set c 'c0000000-0000-4000-a000-000000000193'
\set s 'd0000000-0000-4000-a000-000000000193'
\set instFam  'f0000000-0000-4000-b000-000000000193'
\set instPrac 'f1000000-0000-4000-b000-000000000193'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'u', 'authenticated','authenticated','u0193@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'w', 'authenticated','authenticated','w0193@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0193@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0193@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instFam',  'fam-0193',  'Family 0193',   'family'),
  (:'instPrac', 'prac-0193', 'Practice 0193', 'therapy-practice');
INSERT INTO instance_members (instance_id, user_id, role, display_name, joined_at) VALUES
  (:'instFam',  :'u', 'owner',  'U (family)',   now() - interval '400 days'),
  (:'instFam',  :'w', 'owner',  'W (family)',   now() - interval '400 days'),
  (:'instPrac', :'u', 'admin',  'U (practice)', now()),
  (:'instPrac', :'c', 'member', 'C (practice)', now());

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

DO $$
DECLARE
  u uuid := 'a0000000-0000-4000-a000-000000000193';
  w uuid := 'b0000000-0000-4000-a000-000000000193';
  c uuid := 'c0000000-0000-4000-a000-000000000193';
  s uuid := 'd0000000-0000-4000-a000-000000000193';
  fam  uuid := 'f0000000-0000-4000-b000-000000000193';
  prac uuid := 'f1000000-0000-4000-b000-000000000193';
  j jsonb;
  n integer;
  live_id uuid;
  live_type text;
BEGIN
  -- U: two memberships; the office is the practice, the shell is the family.
  j := pg_temp.json_as(u, 'u0193@test.local', 'SELECT public.my_office_instance_role()');
  IF (j->>'instance_id')::uuid IS DISTINCT FROM prac OR j->>'role' <> 'admin' OR j->>'instance_type' <> 'therapy-practice' THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: U''s office role is % (expected the practice, admin)', j;
  END IF;
  j := pg_temp.json_as(u, 'u0193@test.local', 'SELECT to_jsonb(t) FROM public.tlc_onboarding_my_office() t');
  IF (j->>'instance_id')::uuid IS DISTINCT FROM prac THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: U''s tlc_onboarding_my_office is % (expected the practice)', j;
  END IF;
  j := pg_temp.json_as(u, 'u0193@test.local', 'SELECT public.my_default_instance_role()');
  IF (j->>'instance_id')::uuid IS DISTINCT FROM fam THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: the shell''s resolver moved for U: % (expected the family)', j;
  END IF;

  -- W: a family owner is nobody at the office.
  j := pg_temp.json_as(w, 'w0193@test.local', 'SELECT public.my_office_instance_role()');
  IF j->>'instance_id' IS NOT NULL OR j->>'role' IS NOT NULL THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: a family-only owner got an office role: %', j;
  END IF;
  j := pg_temp.json_as(w, 'w0193@test.local', 'SELECT coalesce((SELECT to_jsonb(t) FROM public.tlc_onboarding_my_office() t), ''{}''::jsonb)');
  IF j <> '{}'::jsonb THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: tlc_onboarding_my_office answered a family-only owner: %', j;
  END IF;
  IF pg_temp.as_user(w, 'w0193@test.local', 'SELECT public.tlc_onboarding_invite(''new0193@test.local'', ''smoke'')') THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: a family-only owner minted an office invite';
  END IF;
  IF NOT pg_temp.as_user(u, 'u0193@test.local', 'SELECT public.tlc_onboarding_invite(''new0193@test.local'', ''smoke'')') THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: the practice admin could not mint an invite';
  END IF;
  SELECT count(*)::int INTO n FROM tlc_onboarding_invites WHERE instance_id = prac AND email = 'new0193@test.local';
  IF n <> 1 THEN RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: the invite landed on % rows of the practice, expected 1', n; END IF;
  SELECT count(*)::int INTO n FROM tlc_onboarding_invites WHERE instance_id = fam;
  IF n <> 0 THEN RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: an invite landed on the family instance'; END IF;

  -- C: practice member only.
  j := pg_temp.json_as(c, 'c0193@test.local', 'SELECT public.my_office_instance_role()');
  IF (j->>'instance_id')::uuid IS DISTINCT FROM prac OR j->>'role' <> 'member' THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: C''s office role is % (expected the practice, member)', j;
  END IF;
  -- S: nobody.
  j := pg_temp.json_as(s, 's0193@test.local', 'SELECT public.my_office_instance_role()');
  IF j->>'instance_id' IS NOT NULL THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: a stranger got an office: %', j;
  END IF;

  -- LIVE: the real office exists with its people, and nothing of the office
  -- remains on the family instance (the 0193 move).
  SELECT id, instance_type INTO live_id, live_type FROM instances WHERE slug = 'tlc-therapy-solutions';
  IF live_id IS NULL OR live_type <> 'therapy-practice' THEN
    RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: the live office instance is missing or typed % ', live_type;
  END IF;
  SELECT count(*)::int INTO n FROM instance_members WHERE instance_id = live_id AND role = 'owner';
  IF n < 1 THEN RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: the live office has no owner'; END IF;
  SELECT count(*)::int INTO n FROM instance_members WHERE instance_id = live_id AND role = 'admin';
  IF n < 1 THEN RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: the live office has no admin'; END IF;
  SELECT (SELECT count(*) FROM tlc_office_tasks       WHERE instance_id = f.id)
       + (SELECT count(*) FROM tlc_lesson_assignments WHERE instance_id = f.id)
       + (SELECT count(*) FROM tlc_onboarding_invites WHERE instance_id = f.id)
       + (SELECT count(*) FROM tlc_onboarding_packets WHERE instance_id = f.id)
       + (SELECT count(*) FROM tlc_onboarding_banking WHERE instance_id = f.id)
       + (SELECT count(*) FROM tlc_roster             WHERE instance_id = f.id)
       + (SELECT count(*) FROM tlc_jobs               WHERE instance_id = f.id)
       + (SELECT count(*) FROM tlc_job_applications   WHERE instance_id = f.id)
    INTO n FROM instances f WHERE f.slug = 'poe-family';
  IF coalesce(n, 0) <> 0 THEN RAISE EXCEPTION 'TLC OWN INSTANCE SMOKE FAIL: % office rows still sit on the family instance', n; END IF;

  RAISE NOTICE 'TLC OWN INSTANCE SMOKE: PASS';
END $$;

SELECT 'TLC OWN INSTANCE SMOKE: PASS' AS result;

ROLLBACK;
