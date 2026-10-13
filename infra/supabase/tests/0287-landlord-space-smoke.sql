-- =============================================================================
-- 0287 LANDLORD SPACE SMOKE — a landlord gets their own space by their own
-- hand, and nobody else's (DR-1007). Runs after the chain, in a transaction,
-- and ROLLS BACK. PASS prints 'LANDLORD SPACE SMOKE: PASS'; any breach RAISES.
--
-- Assertions
--   a stranger (anon) cannot call it                            -> REFUSED  ✘
--   a bad path is refused                                       -> REFUSED  ✘
--   A claims 'properties': a landlord-type space, owned by A, audited       ✔
--   ... A holds exactly ONE membership (no family home was made)           ✔
--   ... my_properties_instance_role() answers A with that seat, as owner   ✔
--   A claims again: 'already', the same space, still one space            ✔
--   B claims 'poetech': the landlord space AND a family home, both owned   ✔
--   ... join_default_instance() hands B the FAMILY home, not the space
--       (where 0119's ordering is present; said plainly where it is not)  ✔
--   B cannot read A's space (instances RLS) and never resolves A's seat    ✘
--   C, a MEMBER of someone's landlord space, gets that seat: 'already'     ✔
--   A, properties-only, claims 'poetech' later: home minted, seat kept     ✔
-- =============================================================================
BEGIN;

\set ua 'a0000000-0000-4000-a000-000000000287'
\set ub 'b0000000-0000-4000-a000-000000000287'
\set uc 'c0000000-0000-4000-a000-000000000287'
\set ud 'd0000000-0000-4000-a000-000000000287'
\set instD '10000000-0000-4000-b000-000000000287'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'ua', 'authenticated','authenticated','landa0287@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'ub', 'authenticated','authenticated','landb0287@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'uc', 'authenticated','authenticated','landc0287@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'ud', 'authenticated','authenticated','landd0287@test.local','', now(), now());

-- D already runs a landlord space; C sits in it as a member.
INSERT INTO instances (id, slug, display_name, instance_type) VALUES (:'instD', 'props-d-0287', 'D Properties', 'landlord');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instD', :'ud', 'owner',  'D'),
  (:'instD', :'uc', 'member', 'C');

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',_who,'role','authenticated','email',_email)::text, true);
  EXECUTE _sql INTO j; PERFORM set_config('role','postgres',true); RETURN j;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.fails_as(_role text, _who uuid, _email text, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role',_role,true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',_who,'role',_role,'email',_email)::text, true);
  BEGIN EXECUTE _sql; EXCEPTION WHEN others THEN PERFORM set_config('role','postgres',true); RETURN true; END;
  PERFORM set_config('role','postgres',true); RETURN false;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE c int;
BEGIN
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',_who,'role','authenticated','email',_email)::text, true);
  EXECUTE _sql INTO c; PERFORM set_config('role','postgres',true); RETURN c;
END $$;

-- ── a stranger and a bad path are refused ───────────────────────────────────
DO $$ BEGIN
  IF NOT pg_temp.fails_as('anon', NULL, NULL, $q$ SELECT public.claim_landlord_space('X', 'properties') $q$) THEN
    RAISE EXCEPTION 'SMOKE FAIL: anon could claim a landlord space';
  END IF;
  IF NOT pg_temp.fails_as('authenticated', 'a0000000-0000-4000-a000-000000000287', 'landa0287@test.local', $q$ SELECT public.claim_landlord_space('A', 'everything') $q$) THEN
    RAISE EXCEPTION 'SMOKE FAIL: a bad path was accepted';
  END IF;
END $$;

-- ── A: Poe Properties only ──────────────────────────────────────────────────
DO $$ DECLARE r jsonb; n int; seat jsonb; BEGIN
  r := pg_temp.json_as('a0000000-0000-4000-a000-000000000287', 'landa0287@test.local', $q$ SELECT public.claim_landlord_space('Alice', 'properties') $q$);
  IF r->>'status' <> 'created' OR r->>'path' <> 'properties' OR r->>'role' <> 'owner' THEN RAISE EXCEPTION 'SMOKE FAIL: A''s claim did not report created/properties/owner (%)', r; END IF;
  -- the slug is derived from the uid: proven by shape, never by retyping it
  SELECT count(*) INTO n FROM instances i JOIN instance_members m ON m.instance_id = i.id
   WHERE i.id = (r->>'instance_id')::uuid AND i.instance_type = 'landlord' AND i.slug LIKE 'll-a0000000%' AND m.user_id = 'a0000000-0000-4000-a000-000000000287' AND m.role = 'owner';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: A does not own a landlord-type space with the derived slug (% rows)', n; END IF;
  SELECT count(*) INTO n FROM audit_log WHERE instance_id = (r->>'instance_id')::uuid AND action = 'create' AND entity_type = 'instance' AND note = 'claim_landlord_space' AND to_value->>'path' = 'properties';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the claim was not audited with its path (% rows)', n; END IF;
  SELECT count(*) INTO n FROM instance_members WHERE user_id = 'a0000000-0000-4000-a000-000000000287';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: properties-only should make exactly one membership, found %', n; END IF;
  seat := pg_temp.json_as('a0000000-0000-4000-a000-000000000287', 'landa0287@test.local', $q$ SELECT public.my_properties_instance_role() $q$);
  IF seat IS NULL OR seat->>'instance_id' <> r->>'instance_id' OR seat->>'role' <> 'owner' THEN RAISE EXCEPTION 'SMOKE FAIL: the properties resolver does not answer A with the new seat (%)', seat; END IF;
  -- again: already, the same space, still one
  r := pg_temp.json_as('a0000000-0000-4000-a000-000000000287', 'landa0287@test.local', $q$ SELECT public.claim_landlord_space('Alice again', 'properties') $q$);
  IF r->>'status' <> 'already' OR r->>'instance_id' <> seat->>'instance_id' THEN RAISE EXCEPTION 'SMOKE FAIL: a second claim did not return the same seat as already (%)', r; END IF;
  SELECT count(*) INTO n FROM instances WHERE slug LIKE 'll-a0000000%';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: a second claim made a second space (% rows)', n; END IF;
END $$;

-- ── B: the full PoeTech app ─────────────────────────────────────────────────
DO $$ DECLARE r jsonb; n int; home uuid; BEGIN
  r := pg_temp.json_as('b0000000-0000-4000-a000-000000000287', 'landb0287@test.local', $q$ SELECT public.claim_landlord_space('Bob', 'poetech') $q$);
  IF r->>'status' <> 'created' OR r->>'path' <> 'poetech' THEN RAISE EXCEPTION 'SMOKE FAIL: B''s claim did not report created/poetech (%)', r; END IF;
  SELECT count(*) INTO n FROM instance_members m JOIN instances i ON i.id = m.instance_id WHERE m.user_id = 'b0000000-0000-4000-a000-000000000287' AND m.role = 'owner';
  IF n <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the full app should make two owned spaces (landlord + home), found %', n; END IF;
  SELECT count(*) INTO n FROM instance_members m JOIN instances i ON i.id = m.instance_id WHERE m.user_id = 'b0000000-0000-4000-a000-000000000287' AND i.instance_type = 'family' AND i.slug LIKE 'u-b0000000%';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: B''s family home was not minted in the 0119 shape (% rows)', n; END IF;
  -- The shell's resolver orders a family-type home FIRST since 0119. A
  -- database that predates 0119 (the journeys' own) cannot prove that
  -- ordering; it says so instead of pretending (DR-0076 §8). The hosted
  -- legs carry 0119 and run the assertion.
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'join_default_instance' AND prosrc LIKE '%instance_type = ''family'' THEN 0%') THEN
    home := (pg_temp.json_as('b0000000-0000-4000-a000-000000000287', 'landb0287@test.local', $q$ SELECT to_jsonb(public.join_default_instance(NULL)) $q$))#>>'{}';
    IF home IS NULL OR home <> (SELECT i.id FROM instances i JOIN instance_members m ON m.instance_id = i.id WHERE m.user_id = 'b0000000-0000-4000-a000-000000000287' AND i.instance_type = 'family') THEN
      RAISE EXCEPTION 'SMOKE FAIL: the shell''s default home for B is not the family home (%)', home;
    END IF;
  ELSE
    RAISE NOTICE 'LANDLORD SPACE SMOKE: join_default_instance predates 0119 here; the family-home-first ordering is proven on the hosted legs, not on this database';
  END IF;
END $$;

-- ── B cannot see A's space; A's seat never answers for B ────────────────────
DO $$ DECLARE n int; seat jsonb; BEGIN
  n := pg_temp.count_as('b0000000-0000-4000-a000-000000000287', 'landb0287@test.local', $q$ SELECT count(*)::int FROM instances WHERE slug LIKE 'll-a0000000%' $q$);
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: B can read A''s landlord space (% rows)', n; END IF;
  seat := pg_temp.json_as('b0000000-0000-4000-a000-000000000287', 'landb0287@test.local', $q$ SELECT public.my_properties_instance_role() $q$);
  IF seat IS NULL OR (seat->>'slug') NOT LIKE 'll-b0000000%' THEN RAISE EXCEPTION 'SMOKE FAIL: B''s resolver should answer B''s own space (%)', seat; END IF;
END $$;

-- ── C, a member of D's landlord space, gets THAT seat and no new space ──────
DO $$ DECLARE r jsonb; n int; BEGIN
  r := pg_temp.json_as('c0000000-0000-4000-a000-000000000287', 'landc0287@test.local', $q$ SELECT public.claim_landlord_space('Cal', 'properties') $q$);
  IF r->>'status' <> 'already' OR r->>'instance_id' <> '10000000-0000-4000-b000-000000000287' OR r->>'role' <> 'member' THEN RAISE EXCEPTION 'SMOKE FAIL: C should get D''s seat back as already/member (%)', r; END IF;
  SELECT count(*) INTO n FROM instances WHERE slug LIKE 'll-c0000000%';
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: a seated member was given a second space (% rows)', n; END IF;
END $$;

-- ── A upgrades to the full app later: the home is minted, the seat kept ─────
DO $$ DECLARE r jsonb; n int; BEGIN
  r := pg_temp.json_as('a0000000-0000-4000-a000-000000000287', 'landa0287@test.local', $q$ SELECT public.claim_landlord_space(NULL, 'poetech') $q$);
  IF r->>'status' <> 'already' OR r->>'path' <> 'poetech' THEN RAISE EXCEPTION 'SMOKE FAIL: A''s upgrade did not report already/poetech (%)', r; END IF;
  SELECT count(*) INTO n FROM instance_members m JOIN instances i ON i.id = m.instance_id WHERE m.user_id = 'a0000000-0000-4000-a000-000000000287';
  IF n <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: after the upgrade A should hold landlord + home, found %', n; END IF;
  SELECT count(*) INTO n FROM instances WHERE slug LIKE 'll-a0000000%';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the upgrade made a second landlord space (% rows)', n; END IF;
END $$;

SELECT 'LANDLORD SPACE SMOKE: PASS' AS result;
ROLLBACK;
