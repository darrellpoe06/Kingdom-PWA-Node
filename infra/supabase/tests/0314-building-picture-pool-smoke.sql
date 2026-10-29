-- =============================================================================
-- 0314 SMOKE — the building shares one picture pool (DR-1290)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'BUILDING PICTURE POOL SMOKE: PASS'.
--
-- 9822 Pool Smoke Way holds Apt 4 (listed, empty), Apt 2 (listed, empty) and
-- Apt 3 (let, an active tenancy). Apt 3 holds the entry picture, a listing,
-- and a move-in record of its own bedroom. 9840 Pool Smoke Way is another
-- building of the same family; a second family has a door at 9822 too.
--
--   nothing placed: Apt 2 shows nothing of Apt 3's (the apartment rule,
--     unchanged -- the building is opt-in)                                  ✔
--   the family places Apt 3's entry on Apt 2                                ✔
--   Apt 2's open shelf now shows the entry, though Apt 3 is let             ✔
--   a placed move-in RECORD never reaches a stranger                        ✔
--   placing a picture from ANOTHER building                                 ✘
--   placing another FAMILY's picture at the same street                     ✘
--   a stranger placing a picture                                            ✘
--   once Apt 2 is let, the stranger sees nothing of it                      ✔
--   taking the entry off Apt 2 takes it off the shelf                       ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0314', 'authenticated','authenticated','owner314@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0314', 'authenticated','authenticated','other314@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0314', 'authenticated','authenticated','stranger314@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010314', 'pool-314',       'Pool Smoke',       'business'),
  ('00000000-0000-4000-b000-000000020314', 'pool-other-314', 'Pool Other Family', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010314', '00000000-0000-4000-a000-0000000a0314', 'owner', 'Owner'),
  ('00000000-0000-4000-b000-000000020314', '00000000-0000-4000-a000-0000000b0314', 'owner', 'Other owner')
ON CONFLICT DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status, city, state, listed_at, rentable_level) VALUES
  ('00000000-0000-4000-c000-0000000a0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-a000-0000000a0314', 'PL-APT-4', 'Apt 4', '9822 Pool Smoke Way Apt 4', 'Apt 4', 'multi-family', 'vacant',   'Champaign', 'Illinois', now(), 'unit'),
  ('00000000-0000-4000-c000-0000000b0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-a000-0000000a0314', 'PL-APT-2', 'Apt 2', '9822 Pool Smoke Way',       'Apt 2', 'multi-family', 'vacant',   'Champaign', 'Illinois', now(), 'unit'),
  ('00000000-0000-4000-c000-0000000c0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-a000-0000000a0314', 'PL-APT-3', 'Apt 3', '9822 Pool Smoke Way',       'Apt 3', 'multi-family', 'occupied', 'Champaign', 'Illinois', NULL,  'unit'),
  ('00000000-0000-4000-c000-0000000d0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-a000-0000000a0314', 'PL-FAR-1', 'Far 1', '9840 Pool Smoke Way',       'Apt 1', 'multi-family', 'vacant',   'Champaign', 'Illinois', now(), 'unit'),
  ('00000000-0000-4000-c000-0000000e0314', '00000000-0000-4000-b000-000000020314', '00000000-0000-4000-a000-0000000b0314', 'PL-OTH-9', 'Other 9','9822 Pool Smoke Way',      'Apt 9', 'multi-family', 'vacant',   'Champaign', 'Illinois', now(), 'unit');
INSERT INTO rental_tenancies (instance_id, created_by, rental_ref, property_label, status) VALUES
  ('00000000-0000-4000-b000-000000010314', '00000000-0000-4000-a000-0000000a0314', 'PL-APT-3', '9822 Pool Smoke Way Apt 3', 'active');
INSERT INTO property_photos (id, instance_id, rental_ref, kind, caption, storage_path, sort_order, taken_at) VALUES
  ('00000000-0000-4000-d000-0000000a0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-c000-0000000b0314', 'listing',            'apt2-kitchen', 'data:image/jpeg;base64,a', 10, now() - interval '3 days'),
  ('00000000-0000-4000-d000-0000000b0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-c000-0000000c0314', 'listing',            'entry',        'data:image/jpeg;base64,b', 10, now() - interval '2 days'),
  ('00000000-0000-4000-d000-0000000c0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-c000-0000000c0314', 'move-in-condition',  'apt3-bedroom', 'data:image/jpeg;base64,c', 20, now() - interval '2 days'),
  ('00000000-0000-4000-d000-0000000d0314', '00000000-0000-4000-b000-000000010314', '00000000-0000-4000-c000-0000000d0314', 'listing',            'far-porch',    'data:image/jpeg;base64,d', 10, now() - interval '1 day'),
  ('00000000-0000-4000-d000-0000000e0314', '00000000-0000-4000-b000-000000020314', '00000000-0000-4000-c000-0000000e0314', 'listing',            'other-family', 'data:image/jpeg;base64,e', 10, now() - interval '1 day');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); PERFORM set_config('request.jwt.claims', '', true); END $$;
-- What a stranger's open shelf shows for a door: "caption:from_sibling,...".
CREATE OR REPLACE FUNCTION pg_temp.seen(_door uuid) RETURNS text LANGUAGE plpgsql AS $$
DECLARE s text;
BEGIN
  PERFORM set_config('role', 'anon', true);
  SELECT coalesce(string_agg(caption || ':' || from_sibling::text, ',' ORDER BY n), '') INTO s
    FROM public.public_vacancy_photos(_door) WITH ORDINALITY AS p(id, caption, storage_path, taken_at, from_sibling, n);
  PERFORM pg_temp.as_postgres();
  RETURN s;
END $$;
-- Does _sql run for _who? Refusals by privilege, CHECK or RLS count as "no".
CREATE OR REPLACE FUNCTION pg_temp.runs(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true; n int;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN
    EXECUTE _sql;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN ok := false; END IF;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR raise_exception THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok IS DISTINCT FROM _should THEN
    RAISE EXCEPTION 'BUILDING PICTURE POOL SMOKE FAIL: % (expected %, got %)', _label,
      CASE WHEN _should THEN 'allowed' ELSE 'refused' END, CASE WHEN ok THEN 'allowed' ELSE 'refused' END;
  END IF;
END $$;

DO $$
DECLARE
  o     uuid := '00000000-0000-4000-a000-0000000a0314';
  s     uuid := '00000000-0000-4000-a000-0000000e0314';
  inst  text := '00000000-0000-4000-b000-000000010314';
  apt2  text := '00000000-0000-4000-c000-0000000b0314';
  entry text := '00000000-0000-4000-d000-0000000b0314';
  bedrm text := '00000000-0000-4000-d000-0000000c0314';
  far   text := '00000000-0000-4000-d000-0000000d0314';
  othr  text := '00000000-0000-4000-d000-0000000e0314';
  got   text;
BEGIN
  -- 1. Nothing placed: the apartment rule is unchanged; Apt 3 is another apartment.
  got := pg_temp.seen(apt2::uuid);
  IF got <> 'apt2-kitchen:false' THEN
    RAISE EXCEPTION 'BUILDING PICTURE POOL SMOKE FAIL: with nothing placed Apt 2 shows [%] (expected only its own kitchen)', got;
  END IF;

  -- 2. The family places Apt 3's entry, and its own bedroom record, on Apt 2.
  PERFORM pg_temp.runs(o, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 10)', apt2, entry, inst), 'the family places the entry from Apt 3 on Apt 2', true);
  PERFORM pg_temp.runs(o, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 20)', apt2, bedrm, inst), 'the family places a record from Apt 3 on Apt 2 (its gallery)', true);

  -- 3. The shelf shows the entry (Apt 3 is let; the choice was the family's)
  --    and never the move-in record.
  got := pg_temp.seen(apt2::uuid);
  IF got <> 'apt2-kitchen:false,entry:true' THEN
    RAISE EXCEPTION 'BUILDING PICTURE POOL SMOKE FAIL: Apt 2 shows [%] (expected its kitchen, then the placed entry; never the bedroom record)', got;
  END IF;

  -- 4. Refusals.
  PERFORM pg_temp.runs(o, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 30)', apt2, far, inst), 'placing a picture from another building', false);
  PERFORM pg_temp.runs(o, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 30)', apt2, othr, inst), 'placing another family''s picture at the same street', false);
  PERFORM pg_temp.runs(s, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 30)', apt2, entry, inst), 'a stranger placing a picture', false);
  PERFORM pg_temp.runs(s, format('DELETE FROM door_photo_order WHERE rental_id = %L', apt2), 'a stranger taking Apt 2''s entry away', false);

  -- 5. Once Apt 2 is let, the stranger sees nothing of it.
  INSERT INTO rental_tenancies (instance_id, created_by, rental_ref, property_label, status)
    VALUES (inst::uuid, o, 'PL-APT-2', '9822 Pool Smoke Way Apt 2', 'active');
  got := pg_temp.seen(apt2::uuid);
  IF got <> '' THEN
    RAISE EXCEPTION 'BUILDING PICTURE POOL SMOKE FAIL: a let Apt 2 still shows [%] to a stranger', got;
  END IF;
  DELETE FROM rental_tenancies WHERE rental_ref = 'PL-APT-2';

  -- 6. Taking the entry off Apt 2 takes it off the shelf.
  PERFORM pg_temp.runs(o, format('DELETE FROM door_photo_order WHERE rental_id = %L AND photo_id = %L', apt2, entry), 'the family takes the entry off Apt 2', true);
  got := pg_temp.seen(apt2::uuid);
  IF got <> 'apt2-kitchen:false' THEN
    RAISE EXCEPTION 'BUILDING PICTURE POOL SMOKE FAIL: after taking the entry off, Apt 2 shows [%]', got;
  END IF;

  RAISE NOTICE 'BUILDING PICTURE POOL SMOKE: PASS';
END $$;

ROLLBACK;
