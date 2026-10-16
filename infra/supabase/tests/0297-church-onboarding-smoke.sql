-- =============================================================================
-- 0297 SMOKE — a church is added by a form, not a migration (DR-1066)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'CHURCH ONBOARDING SMOKE: PASS'.
-- Runs on a fresh PostgreSQL (ci.yml church-onboarding) AND on the live
-- database (rls-isolation choir-claim leg), so every account here is a test
-- account and the family instance is only ever touched inside this rollback.
--
--   W is a steward (owner seat on poe-family); S is a stranger; L will lead
--   the new church; M will be its member; N is a second steward-named leader.
--     provision as S                      -> insufficient_privilege, no row    ✘
--     provision bad slug / bad email as W -> check_violation                   ✘
--     provision 'church-0297' as W        -> created, church, leader row L,
--                                            W's admin seat, a profile row     ✔
--     provision the same slug again, N    -> created:false, N added, 1 seat    ✔
--     provision a slug that is a business -> check_violation                   ✘
--     join as L (no invite, no hardcode)  -> church-0297, role owner           ✔
--     join as N                           -> church-0297, role admin           ✔
--     join as S                           -> NULL, no seat                     ✘
--     join_at('church-0297') as S         -> NULL                              ✘
--     join_at('church-0297') as L         -> church-0297                       ✔
--     set_church_profile as M (member)    -> insufficient_privilege            ✘
--     set_church_profile as L, http url   -> check_violation                   ✘
--     set_church_profile as L, javascript -> check_violation                   ✘
--     set_church_profile as L, 2 channels -> saved; M reads 1 row; S reads 0   ✔
--     L marks it public                   -> S reads 1 row, channels intact    ✔
--     L reads church_leaders              -> 2 rows; S reads 0; M reads 0      ✔
--     if colg exists: its four leaders are rows, and L cannot read them       ✔
-- =============================================================================
BEGIN;

\set w '00000000-0000-4000-a000-0000000a0297'
\set s '00000000-0000-4000-a000-0000000b0297'
\set l '00000000-0000-4000-a000-0000000c0297'
\set m '00000000-0000-4000-a000-0000000d0297'
\set n '00000000-0000-4000-a000-0000000e0297'
\set biz '00000000-0000-4000-b000-000000020297'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'w', 'authenticated','authenticated','w0297@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0297@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'l', 'authenticated','authenticated','l0297@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0297@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'n', 'authenticated','authenticated','n0297@test.local','', now(), now());

-- The family instance exists on the live database; a fresh container gets one
-- for the length of this transaction. W's steward seat is a test row only.
INSERT INTO instances (slug, display_name, instance_type)
  VALUES ('poe-family', 'Poe Family (smoke)', 'family')
  ON CONFLICT (slug) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name)
  SELECT id, :'w', 'owner', 'Steward W' FROM instances WHERE slug = 'poe-family';

-- A business space, to prove a church cannot be provisioned over it.
INSERT INTO instances (id, slug, display_name, instance_type)
  VALUES (:'biz', 'biz-0297', 'A Business 0297', 'business');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  PERFORM set_config('role', 'anon', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.as_user(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION pg_temp.as_anon() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION pg_temp.as_postgres() TO authenticated, anon;

DO $$
DECLARE
  w uuid := '00000000-0000-4000-a000-0000000a0297';
  s uuid := '00000000-0000-4000-a000-0000000b0297';
  l uuid := '00000000-0000-4000-a000-0000000c0297';
  m uuid := '00000000-0000-4000-a000-0000000d0297';
  n uuid := '00000000-0000-4000-a000-0000000e0297';
  t uuid;
  colg uuid;
  got uuid;
  j jsonb;
  r text;
  k int;
BEGIN
  -- A stranger cannot add a church.
  PERFORM pg_temp.as_user(s);
  BEGIN
    j := public.provision_church_instance('church-0297', 'Smoke Church 0297', 'l0297@test.local');
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger provisioned a church';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM pg_temp.as_postgres();
  SELECT count(*) INTO k FROM instances WHERE slug = 'church-0297';
  IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a refused call left an instance behind'; END IF;

  -- The steward's input is checked before anything is written.
  PERFORM pg_temp.as_user(w);
  BEGIN
    j := public.provision_church_instance('Bad Slug!', 'Smoke Church', 'l0297@test.local');
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a bad slug was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    j := public.provision_church_instance('church-0297', 'Smoke Church', 'not-an-email');
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a bad leader email was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    j := public.provision_church_instance('poe-family', 'Family', 'l0297@test.local');
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a reserved slug was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    j := public.provision_church_instance('biz-0297', 'Not A Church', 'l0297@test.local');
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a business space was re-typed as a church';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- The steward adds the church in one call.
  j := public.provision_church_instance('church-0297', 'Smoke Church 0297', 'L0297@Test.Local ', 'owner',
         '{"site":"https://smoke0297.example.org","address":"1 Smoke Way"}'::jsonb);
  PERFORM pg_temp.as_postgres();
  IF (j->>'created')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: first call did not create: %', j; END IF;
  t := (j->>'instance_id')::uuid;
  SELECT instance_type INTO r FROM instances WHERE id = t AND slug = 'church-0297';
  IF r IS DISTINCT FROM 'church' THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the instance is % (want church)', r; END IF;
  SELECT role INTO r FROM church_leaders WHERE instance_id = t AND email = 'l0297@test.local';
  IF r IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the leader row reads % (want owner, lowercased, trimmed)', r; END IF;
  SELECT role INTO r FROM instance_members WHERE instance_id = t AND user_id = w;
  IF r IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the steward''s oversight seat reads % (want admin)', r; END IF;
  SELECT profile->>'name' INTO r FROM church_profiles WHERE instance_id = t;
  IF r IS DISTINCT FROM 'Smoke Church 0297' THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the profile row was not made (name %)', r; END IF;
  SELECT profile->>'site' INTO r FROM church_profiles WHERE instance_id = t;
  IF r IS DISTINCT FROM 'https://smoke0297.example.org' THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the profile did not keep the steward''s site'; END IF;

  -- A second call for the same slug adds a leader and creates nothing else.
  PERFORM pg_temp.as_user(w);
  j := public.provision_church_instance('church-0297', 'Renamed Should Not Apply', 'n0297@test.local', 'admin');
  PERFORM pg_temp.as_postgres();
  IF (j->>'created')::boolean IS NOT FALSE OR (j->>'instance_id')::uuid <> t THEN
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: second call was not idempotent: %', j;
  END IF;
  SELECT count(*) INTO k FROM instances WHERE slug = 'church-0297';
  IF k <> 1 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: % instances for one slug', k; END IF;
  SELECT display_name INTO r FROM instances WHERE id = t;
  IF r <> 'Smoke Church 0297' THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a second call renamed the church'; END IF;
  SELECT count(*) INTO k FROM church_leaders WHERE instance_id = t;
  IF k <> 2 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: % leader rows (want 2)', k; END IF;
  SELECT count(*) INTO k FROM instance_members WHERE instance_id = t AND user_id = w;
  IF k <> 1 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the steward holds % seats (want 1)', k; END IF;

  -- The named leaders join by the ordinary join — no invite, no hardcoded address.
  PERFORM pg_temp.as_user(l);
  got := public.join_church_instance('Leader L');
  PERFORM pg_temp.as_postgres();
  IF got IS DISTINCT FROM t THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: leader L joined % (want the new church)', got; END IF;
  SELECT role INTO r FROM instance_members WHERE instance_id = t AND user_id = l;
  IF r IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: L is seated as % (want owner)', r; END IF;

  PERFORM pg_temp.as_user(n);
  got := public.join_church_instance(NULL);
  PERFORM pg_temp.as_postgres();
  SELECT role INTO r FROM instance_members WHERE instance_id = t AND user_id = n;
  IF got IS DISTINCT FROM t OR r IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: leader N joined % as % (want the new church, admin)', got, r;
  END IF;

  -- A stranger still gets nothing, by either join.
  PERFORM pg_temp.as_user(s);
  got := public.join_church_instance(NULL);
  IF got IS NOT NULL THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger joined %', got; END IF;
  got := public.join_church_instance_at('church-0297', NULL);
  IF got IS NOT NULL THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger joined % by name', got; END IF;
  PERFORM pg_temp.as_postgres();
  SELECT count(*) INTO k FROM instance_members WHERE user_id = s;
  IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the stranger holds % seats', k; END IF;

  -- The church, asked for by name, answers its leader.
  PERFORM pg_temp.as_user(l);
  got := public.join_church_instance_at('church-0297', NULL);
  PERFORM pg_temp.as_postgres();
  IF got IS DISTINCT FROM t THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: join by name answered % for the leader', got; END IF;

  -- M becomes a member (the office invites; M signs in).
  INSERT INTO instance_invites (instance_id, email, role, invited_by, expires_at)
    VALUES (t, 'm0297@test.local', 'member', l, now() + interval '1 day');
  PERFORM pg_temp.as_user(m);
  got := public.join_church_instance(NULL);
  PERFORM pg_temp.as_postgres();
  IF got IS DISTINCT FROM t THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the invited member joined %', got; END IF;

  -- The profile is the office's to write, and only with sound links. A
  -- STRANGER first: user_role_in_instance is NULL for a non-member, and a
  -- NULL-blind `NOT IN` guard lets that NULL through (the 0131 class) — this
  -- case failed against the first draft and is why the guard is coalesced.
  PERFORM pg_temp.as_user(s);
  BEGIN
    j := public.set_church_profile(t, '{"name":"Stranger"}'::jsonb, '[]'::jsonb, NULL);
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger wrote the profile';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM pg_temp.as_user(m);
  BEGIN
    j := public.set_church_profile(t, '{"name":"Hijacked"}'::jsonb, '[]'::jsonb, NULL);
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a member wrote the profile';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM pg_temp.as_user(l);
  BEGIN
    j := public.set_church_profile(t, '{}'::jsonb, '[{"id":"zelle","label":"Zelle","url":"http://enroll.zellepay.com/x"}]'::jsonb, NULL);
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: an http channel was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    j := public.set_church_profile(t, '{}'::jsonb, '[{"id":"x","label":"X","url":"javascript:alert(1)"}]'::jsonb, NULL);
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a javascript: channel was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    j := public.set_church_profile(t, '{"site":"ftp://smoke0297.example.org"}'::jsonb, '[]'::jsonb, NULL);
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a non-https site was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    j := public.set_church_profile(t, '{}'::jsonb,
      '[{"id":"a","label":"A","url":"https://a.example.org"},{"id":"a","label":"B","url":"https://b.example.org"}]'::jsonb, NULL);
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: duplicate channel ids were accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  j := public.set_church_profile(t,
         '{"name":"Smoke Church 0297","site":"https://smoke0297.example.org","links":{"give":"https://smoke0297.example.org/give"}}'::jsonb,
         '[{"id":"cashapp","label":"Cash App","url":"https://cash.app/$Smoke0297","display":"$Smoke0297","how":"Opens Cash App."},
           {"id":"givelify","label":"Givelify","url":"https://www.givelify.com/donate/smoke0297/donation/amount"}]'::jsonb,
         NULL);
  IF jsonb_array_length(j->'giving_channels') <> 2 OR (j->>'is_public')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the office write did not land: %', j;
  END IF;

  -- A member reads the profile; a stranger does not, until it is public.
  PERFORM pg_temp.as_user(m);
  SELECT count(*) INTO k FROM church_profiles WHERE instance_id = t;
  IF k <> 1 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a member reads % profile rows (want 1)', k; END IF;
  PERFORM pg_temp.as_user(s);
  SELECT count(*) INTO k FROM church_profiles WHERE instance_id = t;
  IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger reads a private profile'; END IF;
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO k FROM church_profiles WHERE instance_id = t;
  IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: anon reads a private profile'; END IF;

  PERFORM pg_temp.as_user(l);
  j := public.set_church_profile(t, NULL, NULL, true);
  IF (j->>'is_public')::boolean IS NOT TRUE OR jsonb_array_length(j->'giving_channels') <> 2 THEN
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: marking public lost the channels or did not apply: %', j;
  END IF;
  PERFORM pg_temp.as_user(s);
  SELECT count(*) INTO k FROM church_profiles WHERE instance_id = t;
  IF k <> 1 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a public profile is not readable by a signed-in stranger'; END IF;
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO k FROM church_profiles WHERE instance_id = t;
  IF k <> 1 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a public profile is not readable by anon'; END IF;
  -- A stranger may read a public profile; a stranger may never write one.
  PERFORM pg_temp.as_user(s);
  BEGIN
    UPDATE church_profiles SET is_public = false WHERE instance_id = t;
    GET DIAGNOSTICS k = ROW_COUNT;
    IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger updated a profile'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- The leader rows are the office's to see, and no one else's.
  PERFORM pg_temp.as_user(l);
  SELECT count(*) INTO k FROM church_leaders WHERE instance_id = t;
  IF k <> 2 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the owner reads % leader rows (want 2)', k; END IF;
  PERFORM pg_temp.as_user(m);
  SELECT count(*) INTO k FROM church_leaders WHERE instance_id = t;
  IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a member reads the leader rows'; END IF;
  PERFORM pg_temp.as_user(s);
  SELECT count(*) INTO k FROM church_leaders;
  IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger reads % leader rows', k; END IF;
  BEGIN
    INSERT INTO church_leaders (instance_id, email, role) VALUES (t, 's0297@test.local', 'owner');
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: a stranger wrote a leader row';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM pg_temp.as_user(l);
  BEGIN
    INSERT INTO church_leaders (instance_id, email, role) VALUES (t, 'l2-0297@test.local', 'owner');
    RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: the owner wrote a leader row directly (RPC only)';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM pg_temp.as_postgres();

  -- Where COLG exists (the live database), its four leaders are rows, the
  -- join still answers exactly as 0294 did, and the new church's owner
  -- cannot see them.
  SELECT id INTO colg FROM instances WHERE slug = 'colg';
  IF colg IS NOT NULL THEN
    SELECT count(*) INTO k FROM church_leaders WHERE instance_id = colg;
    IF k < 4 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: colg carries % leader rows (want the four of 0294)', k; END IF;
    PERFORM pg_temp.as_user(l);
    SELECT count(*) INTO k FROM church_leaders WHERE instance_id = colg;
    PERFORM pg_temp.as_postgres();
    IF k <> 0 THEN RAISE EXCEPTION 'CHURCH ONBOARDING SMOKE FAIL: another church''s owner reads colg''s leaders'; END IF;
  END IF;

  RAISE NOTICE 'CHURCH ONBOARDING SMOKE: PASS';
END $$;

ROLLBACK;
