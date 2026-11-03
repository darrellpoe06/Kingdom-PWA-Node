-- =============================================================================
-- 0282 SMOKE — each door shows the apartment in its own order (DR-0984)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'DOOR PHOTO ORDER SMOKE: PASS'.
--
--   the shelf honours the family's own arranged order again (0161)         ✔
--   Bed B, borrowing, leads with the bedroom it chose; Bed A still leads
--     with the kitchen                                                      ✔
--   a door placing its OWN picture here                                     ✘
--   a door in ANOTHER building placing a picture                            ✘
--   a stranger to the family placing one                                    ✘
--   a stranger reading the orders                                           ✘ (sees none)
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0282', 'authenticated','authenticated','owner282@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0282', 'authenticated','authenticated','stranger282@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010282', 'photo-order-282', 'Photo Order Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010282', '00000000-0000-4000-a000-0000000a0282', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

-- Apt 4 holds Bed A (the pictures) and Bed B (none; the unit typed into its
-- address, as on his own door). Apt 2 is an apartment in ANOTHER building:
-- since 0314 (DR-1290) a door may place any picture from its own building, so
-- the refusal this smoke holds is the one that still stands under both rules,
-- a picture from somewhere else (0314's smoke holds the same-building case).
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status, city, state, listed_at, rentable_level) VALUES
  ('00000000-0000-4000-c000-0000000a0282', '00000000-0000-4000-b000-000000010282', '00000000-0000-4000-a000-0000000a0282', 'PO-BED-A', 'Bed A', '9820 Order Smoke Way', 'Apt 4', 'multi-family', 'vacant', 'Champaign', 'Illinois', now(), 'bed'),
  ('00000000-0000-4000-c000-0000000b0282', '00000000-0000-4000-b000-000000010282', '00000000-0000-4000-a000-0000000a0282', 'PO-BED-B', 'Bed B', '9820 Order Smoke Way Apt 4', 'Apt 4', 'multi-family', 'vacant', 'Champaign', 'Illinois', now(), 'bed'),
  ('00000000-0000-4000-c000-0000000c0282', '00000000-0000-4000-b000-000000010282', '00000000-0000-4000-a000-0000000a0282', 'PO-APT-2', 'Apt 2', '9830 Order Smoke Way', 'Apt 2', 'multi-family', 'vacant', 'Champaign', 'Illinois', now(), 'unit');
INSERT INTO property_photos (id, instance_id, rental_ref, kind, caption, storage_path, sort_order, taken_at) VALUES
  ('00000000-0000-4000-d000-0000000a0282', '00000000-0000-4000-b000-000000010282', '00000000-0000-4000-c000-0000000a0282', 'listing', 'kitchen',  'data:image/jpeg;base64,a', 10, now() - interval '3 days'),
  ('00000000-0000-4000-d000-0000000b0282', '00000000-0000-4000-b000-000000010282', '00000000-0000-4000-c000-0000000a0282', 'listing', 'living',   'data:image/jpeg;base64,b', 20, now() - interval '2 days'),
  ('00000000-0000-4000-d000-0000000c0282', '00000000-0000-4000-b000-000000010282', '00000000-0000-4000-c000-0000000a0282', 'listing', 'bedroom',  'data:image/jpeg;base64,c', 30, now() - interval '1 day');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); PERFORM set_config('request.jwt.claims', '', true); END $$;
CREATE OR REPLACE FUNCTION pg_temp.first_photo(_door uuid) RETURNS text LANGUAGE plpgsql AS $$
DECLARE c text;
BEGIN
  PERFORM set_config('role', 'anon', true);
  SELECT caption INTO c FROM public_vacancy_photos(_door) LIMIT 1;
  PERFORM pg_temp.as_postgres();
  RETURN c;
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
    RAISE EXCEPTION 'DOOR PHOTO ORDER SMOKE FAIL: % (expected %, got %)', _label,
      CASE WHEN _should THEN 'allowed' ELSE 'refused' END, CASE WHEN ok THEN 'allowed' ELSE 'refused' END;
  END IF;
END $$;

DO $$
DECLARE
  o uuid := '00000000-0000-4000-a000-0000000a0282';
  s uuid := '00000000-0000-4000-a000-0000000e0282';
  inst text := '00000000-0000-4000-b000-000000010282';
  bedA text := '00000000-0000-4000-c000-0000000a0282';
  bedB text := '00000000-0000-4000-c000-0000000b0282';
  apt2 text := '00000000-0000-4000-c000-0000000c0282';
  kitchen text := '00000000-0000-4000-d000-0000000a0282';
  bedroom text := '00000000-0000-4000-d000-0000000c0282';
  n int;
BEGIN
  -- 1. The family's own order, honoured on the shelf again (newest is the
  --    bedroom, so a sort by date alone would lead with it).
  IF pg_temp.first_photo(bedA::uuid) IS DISTINCT FROM 'kitchen' THEN
    RAISE EXCEPTION 'DOOR PHOTO ORDER SMOKE FAIL: Bed A leads with % -- the family''s sort_order is not honoured', pg_temp.first_photo(bedA::uuid);
  END IF;
  IF pg_temp.first_photo(bedB::uuid) IS DISTINCT FROM 'kitchen' THEN
    RAISE EXCEPTION 'DOOR PHOTO ORDER SMOKE FAIL: Bed B, with no order of its own, leads with % (expected the owning door''s order)', pg_temp.first_photo(bedB::uuid);
  END IF;

  -- 2. Bed B chooses the bedroom for its own cover.
  PERFORM pg_temp.runs(o, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 10)', bedB, bedroom, inst), 'the family gives Bed B its own cover', true);
  IF pg_temp.first_photo(bedB::uuid) IS DISTINCT FROM 'bedroom' THEN
    RAISE EXCEPTION 'DOOR PHOTO ORDER SMOKE FAIL: Bed B leads with % after choosing the bedroom', pg_temp.first_photo(bedB::uuid);
  END IF;
  IF pg_temp.first_photo(bedA::uuid) IS DISTINCT FROM 'kitchen' THEN
    RAISE EXCEPTION 'DOOR PHOTO ORDER SMOKE FAIL: Bed B''s choice moved Bed A''s cover to %', pg_temp.first_photo(bedA::uuid);
  END IF;
  PERFORM pg_temp.runs(o, format('UPDATE door_photo_order SET position = 5 WHERE rental_id = %L AND photo_id = %L', bedB, bedroom), 'the family re-orders Bed B', true);

  -- 3. Refusals.
  PERFORM pg_temp.runs(o, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 10)', bedA, kitchen, inst), 'a door placing its own picture here', false);
  PERFORM pg_temp.runs(o, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 10)', apt2, kitchen, inst), 'a door in another building placing Apt 4''s picture', false);
  PERFORM pg_temp.runs(s, format('INSERT INTO door_photo_order (rental_id, photo_id, instance_id, position) VALUES (%L, %L, %L, 20)', bedB, kitchen, inst), 'a stranger placing a picture', false);
  PERFORM pg_temp.runs(s, format('DELETE FROM door_photo_order WHERE rental_id = %L', bedB), 'a stranger taking Bed B''s cover away', false);

  -- 4. A stranger reads nothing.
  PERFORM pg_temp.as_user(s);
  SELECT count(*) INTO n FROM door_photo_order;
  PERFORM pg_temp.as_postgres();
  IF n <> 0 THEN RAISE EXCEPTION 'DOOR PHOTO ORDER SMOKE FAIL: a stranger read % order row(s)', n; END IF;

  RAISE NOTICE 'DOOR PHOTO ORDER SMOKE: PASS';
END $$;

ROLLBACK;
