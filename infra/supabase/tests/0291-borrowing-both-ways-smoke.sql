-- =============================================================================
-- 0291 SMOKE — borrowing goes both ways (DR-1021)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'BORROW BOTH WAYS SMOKE: PASS'.
--
--   Bed B with ONE picture of its own still shows Bed A's three after it      ✔
--   Bed A shows its own three first, then Bed B's one                         ✔
--   the whole unit (Apt 4 itself) shows the beds' pictures too                ✔
--   Apt 2, another apartment at the same street, shows none of them          ✔
--   a house with no unit borrows nothing from the next house                  ✔
--   an unlisted sibling lends nothing; from_sibling tells them apart          ✔
--   0290's list wrapper reads the same rows in the same order                 ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0291', 'authenticated','authenticated','owner291@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010291', 'borrow-291', 'Borrow Both Ways Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status, city, state, listed_at, rentable_level) VALUES
  ('00000000-0000-4000-c000-0000000a0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'BW-BED-A',  'Bed A',  '9821 Borrow Smoke Way', 'Apt 4', 'multi-family', 'vacant', 'Champaign', 'Illinois', now(), 'bed'),
  ('00000000-0000-4000-c000-0000000b0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'BW-BED-B',  'Bed B',  '9821 Borrow Smoke Way Apt 4', 'Apt 4', 'multi-family', 'vacant', 'Champaign', 'Illinois', now(), 'bed'),
  ('00000000-0000-4000-c000-0000000c0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'BW-APT-4',  'Apt 4',  '9821 Borrow Smoke Way', 'Apt 4', 'multi-family', 'vacant', 'Champaign', 'Illinois', now(), 'unit'),
  ('00000000-0000-4000-c000-0000000d0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'BW-APT-2',  'Apt 2',  '9821 Borrow Smoke Way', 'Apt 2', 'multi-family', 'vacant', 'Champaign', 'Illinois', now(), 'unit'),
  ('00000000-0000-4000-c000-0000000e0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'BW-HOUSE-1','House 1','9900 Borrow Smoke Way', NULL,    'single-family', 'vacant', 'Champaign', 'Illinois', now(), 'unit'),
  ('00000000-0000-4000-c000-0000000f0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'BW-HOUSE-2','House 2','9900 Borrow Smoke Way', NULL,    'single-family', 'vacant', 'Champaign', 'Illinois', now(), 'unit'),
  ('00000000-0000-4000-c000-0000000a1291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-a000-0000000a0291', 'BW-BED-C',  'Bed C',  '9821 Borrow Smoke Way', 'Apt 4', 'multi-family', 'vacant', 'Champaign', 'Illinois', NULL,  'bed');
INSERT INTO property_photos (id, instance_id, rental_ref, kind, caption, storage_path, sort_order, taken_at) VALUES
  ('00000000-0000-4000-d000-0000000a0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-c000-0000000a0291', 'listing', 'kitchen', 'data:image/jpeg;base64,a', 10, now() - interval '5 days'),
  ('00000000-0000-4000-d000-0000000b0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-c000-0000000a0291', 'listing', 'living',  'data:image/jpeg;base64,b', 20, now() - interval '4 days'),
  ('00000000-0000-4000-d000-0000000c0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-c000-0000000a0291', 'listing', 'bedroom', 'data:image/jpeg;base64,c', 30, now() - interval '3 days'),
  ('00000000-0000-4000-d000-0000000d0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-c000-0000000b0291', 'listing', 'foyer',   'data:image/jpeg;base64,d', 10, now() - interval '1 day'),
  ('00000000-0000-4000-d000-0000000e0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-c000-0000000e0291', 'listing', 'porch',   'data:image/jpeg;base64,e', 10, now() - interval '1 day'),
  ('00000000-0000-4000-d000-0000000f0291', '00000000-0000-4000-b000-000000010291', '00000000-0000-4000-c000-0000000a1291', 'listing', 'unlisted','data:image/jpeg;base64,f', 10, now() - interval '1 day');

CREATE OR REPLACE FUNCTION pg_temp.seen(_door uuid) RETURNS text LANGUAGE plpgsql AS $$
DECLARE s text;
BEGIN
  PERFORM set_config('role', 'anon', true);
  SELECT coalesce(string_agg(caption || ':' || from_sibling::text, ',' ORDER BY n), '') INTO s
    FROM public.public_vacancy_photos(_door) WITH ORDINALITY AS p(id, caption, storage_path, taken_at, from_sibling, n);
  PERFORM set_config('role', 'postgres', true);
  RETURN s;
END $$;

DO $$
DECLARE
  bedA  uuid := '00000000-0000-4000-c000-0000000a0291';
  bedB  uuid := '00000000-0000-4000-c000-0000000b0291';
  apt4  uuid := '00000000-0000-4000-c000-0000000c0291';
  apt2  uuid := '00000000-0000-4000-c000-0000000d0291';
  h1    uuid := '00000000-0000-4000-c000-0000000e0291';
  h2    uuid := '00000000-0000-4000-c000-0000000f0291';
  got text; a text; b text;
BEGIN
  got := pg_temp.seen(bedB);
  IF got <> 'foyer:false,kitchen:true,living:true,bedroom:true' THEN
    RAISE EXCEPTION 'BORROW BOTH WAYS SMOKE FAIL: Bed B with one of its own shows [%] (expected its foyer, then Bed A''s three)', got;
  END IF;
  got := pg_temp.seen(bedA);
  IF got <> 'kitchen:false,living:false,bedroom:false,foyer:true' THEN
    RAISE EXCEPTION 'BORROW BOTH WAYS SMOKE FAIL: Bed A shows [%] (expected its three, then Bed B''s foyer)', got;
  END IF;
  got := pg_temp.seen(apt4);
  -- All borrowed, in the owning doors' sort_order, the newer first on a tie
  -- (foyer 10 / 1 day old before kitchen 10 / 5 days old).
  IF got <> 'foyer:true,kitchen:true,living:true,bedroom:true' THEN
    RAISE EXCEPTION 'BORROW BOTH WAYS SMOKE FAIL: the whole unit shows [%] (expected the beds'' four, all borrowed)', got;
  END IF;
  got := pg_temp.seen(apt2);
  IF got <> '' THEN
    RAISE EXCEPTION 'BORROW BOTH WAYS SMOKE FAIL: Apt 2 shows [%] (expected nothing from Apt 4)', got;
  END IF;
  got := pg_temp.seen(h2);
  IF got <> '' THEN
    RAISE EXCEPTION 'BORROW BOTH WAYS SMOKE FAIL: a house with no unit borrowed [%] from the next house', got;
  END IF;
  got := pg_temp.seen(h1);
  IF got <> 'porch:false' THEN
    RAISE EXCEPTION 'BORROW BOTH WAYS SMOKE FAIL: House 1 shows [%]', got;
  END IF;
  -- 0290's wrapper reads the same rows in the same order.
  PERFORM set_config('role', 'anon', true);
  SELECT string_agg(l.id::text, ',' ORDER BY l.n) INTO a
    FROM public.public_vacancy_photo_list(bedB) WITH ORDINALITY AS l(id, caption, taken_at, from_sibling, has_thumb, n);
  SELECT string_agg(p.id::text, ',' ORDER BY p.n) INTO b
    FROM public.public_vacancy_photos(bedB) WITH ORDINALITY AS p(id, caption, storage_path, taken_at, from_sibling, n);
  PERFORM set_config('role', 'postgres', true);
  IF a IS DISTINCT FROM b THEN RAISE EXCEPTION 'BORROW BOTH WAYS SMOKE FAIL: list=% photos=%', a, b; END IF;
  RAISE NOTICE 'BORROW BOTH WAYS SMOKE: PASS';
END $$;

ROLLBACK;
