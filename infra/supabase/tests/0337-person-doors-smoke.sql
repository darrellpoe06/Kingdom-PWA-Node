-- =============================================================================
-- 0337 SMOKE — each visit says which app it was (DR-1591)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'PERSON DOORS SMOKE: PASS'.
-- Needs: the door-work bootstrap, schema-v1 / v1.1 / v2.1, 0073, then 0337.
--
--   a signed-in person writes their own row with a door                      ✔
--   a door that is not a short lowercase key is refused                       ✘
--   the governor reads, per person, each door with first and last time       ✔
--   a person with no space at all is in the governor's read                   ✔
--   rows from before door tracking are counted apart, never given a door      ✔
--   door_tracking_since is the earliest row that carries a door               ✔
--   a signed-in person outside poe-family is refused                          ✘
--   anon cannot execute the read at all                                       ✘
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0337', 'authenticated','authenticated','gov337@test.local',      '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0337', 'authenticated','authenticated','nospace337@test.local',  '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0337', 'authenticated','authenticated','oldonly337@test.local',  '', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010337', 'poe-family', 'Poe Family', 'family')
ON CONFLICT DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name)
SELECT i.id, '00000000-0000-4000-a000-0000000a0337', 'member', 'Gov'
  FROM instances i WHERE i.slug = 'poe-family'
ON CONFLICT DO NOTHING;

-- History written as the superuser: one old row with no door for each person,
-- then two Poe Properties rows for the person with no space.
INSERT INTO usage_events (owner, kind, name, at, door) VALUES
  ('00000000-0000-4000-a000-0000000b0337', 'view', 'overview', now() - interval '20 days', NULL),
  ('00000000-0000-4000-a000-0000000c0337', 'view', 'overview', now() - interval '15 days', NULL),
  ('00000000-0000-4000-a000-0000000b0337', 'door', 'properties', now() - interval '3 days', 'properties'),
  ('00000000-0000-4000-a000-0000000b0337', 'view', 'rentals',    now() - interval '1 day',  'properties');

-- A bad door is refused by the shape check.
DO $$
BEGIN
  INSERT INTO usage_events (owner, kind, name, door) VALUES ('00000000-0000-4000-a000-0000000b0337', 'view', 'x', 'Poe Properties!');
  RAISE EXCEPTION 'a door that is not a short lowercase key must be refused';
EXCEPTION WHEN check_violation THEN
  NULL;
END $$;

-- The person with no space writes their own row with a door, through RLS.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000b0337","role":"authenticated"}';
INSERT INTO usage_events (kind, name, door) VALUES ('door', 'lovecorner', 'lovecorner');

-- ...and is refused the governor's read.
DO $$
BEGIN
  PERFORM public.admin_person_doors();
  RAISE EXCEPTION 'a person outside poe-family must not read every person''s doors';
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

-- The governor reads.
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000a0337","role":"authenticated"}';
DO $$
DECLARE r jsonb; p jsonb; d jsonb; old jsonb;
BEGIN
  r := public.admin_person_doors();
  IF (r->>'door_tracking_since')::timestamptz > now() - interval '2 days' THEN
    RAISE EXCEPTION 'door_tracking_since must be the earliest row with a door (3 days ago), got %', r->>'door_tracking_since';
  END IF;

  SELECT e INTO p FROM jsonb_array_elements(r->'people') e WHERE e->>'user_id' = '00000000-0000-4000-a000-0000000b0337';
  IF p IS NULL THEN RAISE EXCEPTION 'a person with no space must be in the read: %', r; END IF;
  SELECT e INTO d FROM jsonb_array_elements(p->'doors') e WHERE e->>'door' = 'properties';
  IF d IS NULL OR (d->>'n')::int <> 2 THEN RAISE EXCEPTION 'expected two Poe Properties rows, got %', p; END IF;
  IF (d->>'first_at')::timestamptz >= (d->>'last_at')::timestamptz THEN
    RAISE EXCEPTION 'first_at must be before last_at: %', d;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p->'doors') e WHERE e->>'door' = 'lovecorner') THEN
    RAISE EXCEPTION 'the Love Corner open written through RLS must be read: %', p;
  END IF;
  IF (p->'before_tracking'->>'n')::int <> 1 THEN
    RAISE EXCEPTION 'the row with no door must be counted apart, got %', p->'before_tracking';
  END IF;

  SELECT e INTO old FROM jsonb_array_elements(r->'people') e WHERE e->>'user_id' = '00000000-0000-4000-a000-0000000c0337';
  IF old IS NULL OR jsonb_array_length(old->'doors') <> 0 OR (old->'before_tracking'->>'n')::int <> 1 THEN
    RAISE EXCEPTION 'a person with only old rows must appear with no doors and one old row, got %', old;
  END IF;
END $$;

-- Anon cannot execute it.
RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.admin_person_doors();
  RAISE EXCEPTION 'anon must not be able to read every person''s doors';
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'PERSON DOORS SMOKE: PASS'; END $$;
ROLLBACK;
