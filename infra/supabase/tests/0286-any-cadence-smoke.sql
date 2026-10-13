-- =============================================================================
-- 0286 SMOKE — a door is priced by any cadence, and the shelf says so (DR-1003)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'ANY CADENCE SMOKE: PASS'.
--
--   the shelf carries the weekly and every-two-weeks prices the family set   ✔
--   a door priced monthly only reads NULL for the others, never $0          ✔
--   a rate below zero is refused by the database                            ✘
--   a door stores nothing of the building: it reads its sibling's note      ✔
--   the same street in another family lends no note                         ✘
--   among equal showcase order a private room is offered before a bed       ✔
--   the shelf still carries no street for a held door, no tenant, no point  ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0286', 'authenticated','authenticated','owner286@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0286', 'authenticated','authenticated','other286@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010286', 'cadence-smoke-286', 'Cadence Smoke', 'business'),
  ('00000000-0000-4000-b000-000000020286', 'cadence-smoke-286-other', 'Cadence Smoke Other', 'business')
ON CONFLICT (id) DO NOTHING;

-- Apt 2: every cadence, and the building's note. The bed: monthly only, no
-- note of its own, same building, same showcase order as the room. The room:
-- same showcase order as the bed, listed earlier. Another family's door on
-- the same street holds a note nobody here may borrow.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at, address_visibility, showcase_order, monthly_rent, weekly_rate, biweekly_rate, nightly_rate, offering, building_note, rentable_level) VALUES
  ('00000000-0000-4000-c000-0000000a0286', '00000000-0000-4000-b000-000000010286', '00000000-0000-4000-a000-0000000a0286', 'CAD-A2-286', '9806 Cadence Smoke Avenue Apt 2', '9806 Cadence Smoke Avenue', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'vacant', now() - interval '3 days', 'public', 1, 800, 200, 400, 150, 'both', 'Laundry in the entry', 'unit'),
  ('00000000-0000-4000-c000-0000000b0286', '00000000-0000-4000-b000-000000010286', '00000000-0000-4000-a000-0000000a0286', 'CAD-BED-286', '9806 Cadence Smoke Avenue Room 1 - Bed A', '9806 Cadence Smoke Avenue', 'Room 1 - Bed A', 'Champaign', 'Illinois', 'multi-family', 'vacant', now() - interval '1 day', 'after-application', 2, 500, NULL, NULL, NULL, 'long-term', NULL, 'bed'),
  ('00000000-0000-4000-c000-0000000c0286', '00000000-0000-4000-b000-000000010286', '00000000-0000-4000-a000-0000000a0286', 'CAD-ROOM-286', '9806 Cadence Smoke Avenue Room 2', '9806 Cadence Smoke Avenue', 'Room 2', 'Champaign', 'Illinois', 'multi-family', 'vacant', now() - interval '2 days', 'after-application', 2, 650, NULL, NULL, NULL, 'long-term', NULL, 'room'),
  ('00000000-0000-4000-c000-0000000e0286', '00000000-0000-4000-b000-000000020286', '00000000-0000-4000-a000-0000000b0286', 'CAD-OTHER-286', 'Another family''s door', '9806 Cadence Smoke Avenue', 'Apt 9', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'public', 1, 700, NULL, NULL, NULL, 'long-term', 'A pool nobody here has', 'unit');

DO $$
DECLARE
  apt2 uuid := '00000000-0000-4000-c000-0000000a0286';
  bed  uuid := '00000000-0000-4000-c000-0000000b0286';
  room uuid := '00000000-0000-4000-c000-0000000c0286';
  r record;
  shelf text;
  room_pos integer; bed_pos integer;
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  -- 1. Every cadence the family set comes through, and the building's note.
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = apt2;
  IF r.id IS NULL THEN RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: Apt 2 left the shelf'; END IF;
  IF r.rent IS DISTINCT FROM 800 OR r.weekly_rate IS DISTINCT FROM 200 OR r.biweekly_rate IS DISTINCT FROM 400 OR r.nightly_rate IS DISTINCT FROM 150 THEN
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: Apt 2 reads month %, week %, two weeks %, night % -- not 800 / 200 / 400 / 150', r.rent, r.weekly_rate, r.biweekly_rate, r.nightly_rate;
  END IF;
  IF r.building_note IS DISTINCT FROM 'Laundry in the entry' THEN
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: Apt 2''s building note reads %', r.building_note;
  END IF;

  -- 2. Monthly only: the other cadences are NULL, never 0.
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = bed;
  IF r.id IS NULL THEN RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: the bed left the shelf'; END IF;
  IF r.weekly_rate IS NOT NULL OR r.biweekly_rate IS NOT NULL OR r.nightly_rate IS NOT NULL THEN
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: the monthly-only bed reads week %, two weeks %, night %', r.weekly_rate, r.biweekly_rate, r.nightly_rate;
  END IF;

  -- 4. The bed stored no note; it reads its building's (Apt 2's), same family.
  IF r.building_note IS DISTINCT FROM 'Laundry in the entry' THEN
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: the bed did not borrow its building''s note: %', r.building_note;
  END IF;
  -- 5. ... and never another family's.
  IF r.building_note ILIKE '%pool%' THEN
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: another family''s note was lent: %', r.building_note;
  END IF;

  -- 6. Rooms before beds among equal showcase order (the bed is the newer listing).
  SELECT p INTO room_pos FROM (SELECT v.id, row_number() OVER () AS p FROM public_vacancies() v) s WHERE s.id = room;
  SELECT p INTO bed_pos  FROM (SELECT v.id, row_number() OVER () AS p FROM public_vacancies() v) s WHERE s.id = bed;
  IF room_pos IS NULL OR bed_pos IS NULL OR room_pos > bed_pos THEN
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: the bed (position %) is offered before the private room (position %)', bed_pos, room_pos;
  END IF;

  -- 7. Nothing 0283 held is let go: the held bed still shows no street, no unit.
  SELECT row_to_json(v)::text INTO shelf FROM public_vacancies() v WHERE v.id = bed;
  IF shelf NOT LIKE '%"street":null%' OR shelf NOT LIKE '%"unit":null%' OR shelf NOT LIKE '%"address_shown":false%' OR shelf ILIKE '%tenant%' OR shelf ILIKE '%mortgage%' THEN
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: the held bed let something through: %', shelf;
  END IF;

  PERFORM set_config('role', 'postgres', true);
END $$;

-- 3. A rate below zero is refused by the database (as the family, as anyone).
DO $$
BEGIN
  BEGIN
    UPDATE rentals SET weekly_rate = -1 WHERE id = '00000000-0000-4000-c000-0000000a0286';
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: a weekly rate below zero was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE rentals SET biweekly_rate = -0.5 WHERE id = '00000000-0000-4000-c000-0000000a0286';
    RAISE EXCEPTION 'ANY CADENCE SMOKE FAIL: a rate every two weeks below zero was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

SELECT 'ANY CADENCE SMOKE: PASS' AS result;
ROLLBACK;
