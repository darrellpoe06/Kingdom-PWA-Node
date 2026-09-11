-- =============================================================================
-- 0207 POE PROPERTIES INSTANCE SMOKE — the landlord instance, and the move that
-- changes nothing it should not (0207, DR-0365). Run on the LIVE Supabase (as
-- postgres) AFTER 0207. Runs in a transaction and ROLLS BACK.
-- PASS prints 'POE PROPERTIES INSTANCE SMOKE: PASS'; any wrong grant RAISES.
--
-- The fixture builds a SEPARATE family + landlord pair so the assertions never
-- depend on the real poe-family rows.
--
-- Assertions
--   the landlord resolver answers from a landlord membership                ✔
--   it does NOT answer from a family-only membership             -> NULL    ✘
--   a stranger gets nothing                                      -> NULL    ✘
--   the shell's my_default_instance_role() is UNCHANGED by all this         ✔
--   a door moved to the landlord instance keeps its ENTITY ATTACHMENT       ✔
--   ... and keeps its entity_slug verbatim, mismatch and all                ✔
--   no door ends up pointing at an entity in another instance    -> 0       ✔
--   a landlord-instance owner reads his doors                               ✔
--   a family-only owner can no longer read the moved doors       -> REFUSED ✘
--   the 10-door landlord cap is REAL: 11 active doors on a landlord-tier
--     instance is refused by rentals_tier_enforce                -> REFUSED ✘
-- =============================================================================
BEGIN;

\set land 'a0000000-0000-4000-a000-000000000207'
\set fam  'b0000000-0000-4000-a000-000000000207'
\set out  'c0000000-0000-4000-a000-000000000207'
\set instL '10000000-0000-4000-b000-000000000207'
\set instF '20000000-0000-4000-b000-000000000207'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'land', 'authenticated','authenticated','land0207@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'fam',  'authenticated','authenticated','fam0207@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'out',  'authenticated','authenticated','out0207@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instL', 'props-0207', 'Test Properties', 'landlord'),
  (:'instF', 'fam-0207',   'Test Family',     'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instL', :'land', 'owner',  'Landlord L'),
  (:'instF', :'fam',  'owner',  'Family F');

-- Two entities per instance, same slugs, so a move can preserve attachment.
INSERT INTO entities (id, instance_id, created_by, slug, display_name, entity_type) VALUES
  ('30000000-0000-4000-c000-000000000207', :'instF', :'fam',  'e-props-0207',    'Props LLC', 'business'),
  ('31000000-0000-4000-c000-000000000207', :'instF', :'fam',  'e-personal-0207', 'Personal',  'personal'),
  ('32000000-0000-4000-c000-000000000207', :'instL', :'land', 'e-props-0207',    'Props LLC', 'business'),
  ('33000000-0000-4000-c000-000000000207', :'instL', :'land', 'e-personal-0207', 'Personal',  'personal');

-- A door on the FAMILY with the same slug/id disagreement the real data has:
-- the slug says personal, the id points at the LLC.
INSERT INTO rentals (id, instance_id, created_by, slug, address, status, entity_slug, entity_id)
VALUES ('40000000-0000-4000-d000-000000000207', :'instF', :'fam', 'door-0207', '1 Move Street', 'occupied',
        'e-personal-0207', '30000000-0000-4000-c000-000000000207');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _email text, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',_who,'role','authenticated','email',_email)::text, true);
  BEGIN EXECUTE _sql; EXCEPTION WHEN others THEN PERFORM set_config('role','postgres',true); RETURN false; END;
  PERFORM set_config('role','postgres',true); RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',_who,'role','authenticated','email',_email)::text, true);
  EXECUTE _sql INTO j; PERFORM set_config('role','postgres',true); RETURN j;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE c int;
BEGIN
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',_who,'role','authenticated','email',_email)::text, true);
  EXECUTE _sql INTO c; PERFORM set_config('role','postgres',true); RETURN c;
END $$;

DO $$
DECLARE
  land uuid := 'a0000000-0000-4000-a000-000000000207';
  fam  uuid := 'b0000000-0000-4000-a000-000000000207';
  outsider uuid := 'c0000000-0000-4000-a000-000000000207';
  instL uuid := '10000000-0000-4000-b000-000000000207';
  instF uuid := '20000000-0000-4000-b000-000000000207';
  door uuid := '40000000-0000-4000-d000-000000000207';
  j jsonb; n int; v_slug text; v_points text;
BEGIN
  -- ------------------------------------------------------------------
  -- The resolver answers from a LANDLORD membership and nothing else.
  -- ------------------------------------------------------------------
  j := pg_temp.json_as(land, 'land0207@test.local', 'SELECT public.my_properties_instance_role()');
  IF j IS NULL OR (j->>'instance_slug') <> 'props-0207' OR (j->>'role') <> 'owner' THEN
    RAISE EXCEPTION 'FAIL: the landlord resolver did not answer for the landlord: %', j;
  END IF;

  j := pg_temp.json_as(fam, 'fam0207@test.local', 'SELECT public.my_properties_instance_role()');
  IF j IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: a family-only member got a properties instance: %', j;
  END IF;

  j := pg_temp.json_as(outsider, 'out0207@test.local', 'SELECT public.my_properties_instance_role()');
  IF j IS NOT NULL THEN RAISE EXCEPTION 'FAIL: a stranger got a properties instance: %', j; END IF;

  -- The shell's own resolver is untouched: the family owner still gets family.
  j := pg_temp.json_as(fam, 'fam0207@test.local', 'SELECT public.my_default_instance_role()');
  IF j IS NULL OR (j->>'instance_slug') <> 'fam-0207' THEN
    RAISE EXCEPTION 'FAIL: the shell resolver changed for a family owner: %', j;
  END IF;

  -- ------------------------------------------------------------------
  -- THE MOVE PRESERVES THE ATTACHMENT. The door's slug says personal and
  -- its id points at the LLC; after the move both must still say that.
  -- ------------------------------------------------------------------
  UPDATE public.rentals r
     SET instance_id = instL,
         entity_id = (SELECT n2.id FROM public.entities o
                        JOIN public.entities n2 ON n2.slug = o.slug AND n2.instance_id = instL
                       WHERE o.id = r.entity_id)
   WHERE r.id = door;

  SELECT r.entity_slug, e.slug INTO v_slug, v_points
    FROM public.rentals r JOIN public.entities e ON e.id = r.entity_id WHERE r.id = door;

  IF v_slug <> 'e-personal-0207' THEN
    RAISE EXCEPTION 'FAIL: the move rewrote entity_slug to %', v_slug;
  END IF;
  IF v_points <> 'e-props-0207' THEN
    RAISE EXCEPTION 'FAIL: the move re-attached the door to % — it must stay on the LLC', v_points;
  END IF;

  SELECT count(*) INTO n FROM public.rentals r JOIN public.entities e ON e.id = r.entity_id
   WHERE e.instance_id <> r.instance_id AND r.id = door;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: the door points across a tenancy boundary'; END IF;

  -- ------------------------------------------------------------------
  -- Who can read the moved door.
  -- ------------------------------------------------------------------
  n := pg_temp.count_as(land, 'land0207@test.local',
         format('SELECT count(*)::int FROM public.rentals WHERE id = %L', door));
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: the landlord cannot read his own door'; END IF;

  n := pg_temp.count_as(fam, 'fam0207@test.local',
         format('SELECT count(*)::int FROM public.rentals WHERE id = %L', door));
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a family-only owner still reads the moved door'; END IF;

  -- ------------------------------------------------------------------
  -- THE CAP IS REAL. This is the landmine DR-0365 records: give the
  -- landlord instance an active landlord subscription and an 11th active
  -- door is refused.
  -- ------------------------------------------------------------------
  -- created_by is NOT NULL with no default on this table (measured, not assumed).
  INSERT INTO instance_subscriptions (instance_id, created_by, tier, status, current_period_start)
  VALUES (instL, land, 'landlord', 'active', now());

  -- The moved door is already 1 active door, so 9 more makes exactly 10 —
  -- the cap. The next one is the 11th and must be refused.
  FOR n IN 1..9 LOOP
    INSERT INTO rentals (instance_id, created_by, slug, address, status)
    VALUES (instL, land, 'cap-0207-' || n, n || ' Cap Street', 'occupied');
  END LOOP;

  BEGIN
    INSERT INTO rentals (instance_id, created_by, slug, address, status)
    VALUES (instL, land, 'cap-0207-over', 'Over Cap Street', 'occupied');
    RAISE EXCEPTION 'FAIL: an 11th active door was accepted on the landlord tier';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    NULL;  -- refused, exactly as DR-0365 warns
  END;

  RAISE NOTICE 'POE PROPERTIES INSTANCE SMOKE: PASS';
END $$;

ROLLBACK;
