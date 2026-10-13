-- =============================================================================
-- 0288 SMOKE — a short-stays-only season advertises the night alone (DR-1009)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'SHORT STAYS ONLY SMOKE: PASS'.
--
--   offered short-term: rent, weekly and every-two-weeks read NULL; night 150 ✔
--   ... and the stored prices are untouched on the row                       ✔
--   offered both ("all of the above"): everything is advertised              ✔
--   offered long-term: the lease prices are advertised                       ✔
--   a short-term door is still ON the shelf (gating a price never hides it)  ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0288', 'authenticated','authenticated','owner288@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010288', 'season-smoke-288', 'Season Smoke', 'business')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, property_type, status, listed_at, address_visibility, showcase_order, monthly_rent, weekly_rate, biweekly_rate, nightly_rate, min_stay_nights, offering, rentable_level) VALUES
  ('00000000-0000-4000-c000-0000000a0288', '00000000-0000-4000-b000-000000010288', '00000000-0000-4000-a000-0000000a0288', 'SEASON-A2-288', '9808 Season Smoke Avenue Apt 2', '9808 Season Smoke Avenue', 'Apt 2', 'Champaign', 'Illinois', 'multi-family', 'vacant', now(), 'public', 1, 800, 200, 400, 150, 2, 'short-term', 'unit');

DO $$
DECLARE
  door uuid := '00000000-0000-4000-c000-0000000a0288';
  r record;
  stored record;
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  -- 1. Short stays only: the night alone, the door still on the shelf.
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = door;
  IF r.id IS NULL THEN RAISE EXCEPTION 'SHORT STAYS ONLY SMOKE FAIL: a short-term door left the shelf'; END IF;
  IF r.offering IS DISTINCT FROM 'short-term' THEN RAISE EXCEPTION 'SHORT STAYS ONLY SMOKE FAIL: offering reads %', r.offering; END IF;
  IF r.rent IS NOT NULL OR r.weekly_rate IS NOT NULL OR r.biweekly_rate IS NOT NULL THEN
    RAISE EXCEPTION 'SHORT STAYS ONLY SMOKE FAIL: a short-stays-only door advertises month %, week %, two weeks %', r.rent, r.weekly_rate, r.biweekly_rate;
  END IF;
  IF r.nightly_rate IS DISTINCT FROM 150 THEN RAISE EXCEPTION 'SHORT STAYS ONLY SMOKE FAIL: the night reads %', r.nightly_rate; END IF;

  PERFORM set_config('role', 'postgres', true);
  -- 2. The stored prices are untouched: the season comes back with them.
  SELECT monthly_rent, weekly_rate, biweekly_rate INTO stored FROM rentals WHERE id = door;
  IF stored.monthly_rent IS DISTINCT FROM 800 OR stored.weekly_rate IS DISTINCT FROM 200 OR stored.biweekly_rate IS DISTINCT FROM 400 THEN
    RAISE EXCEPTION 'SHORT STAYS ONLY SMOKE FAIL: the stored prices changed (%, %, %)', stored.monthly_rent, stored.weekly_rate, stored.biweekly_rate;
  END IF;

  -- 3. All of the above: everything advertised, the first revenue that comes.
  UPDATE rentals SET offering = 'both' WHERE id = door;
  PERFORM set_config('role', 'anon', true);
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = door;
  IF r.rent IS DISTINCT FROM 800 OR r.weekly_rate IS DISTINCT FROM 200 OR r.biweekly_rate IS DISTINCT FROM 400 OR r.nightly_rate IS DISTINCT FROM 150 THEN
    RAISE EXCEPTION 'SHORT STAYS ONLY SMOKE FAIL: "both" reads month %, week %, two weeks %, night % -- not 800 / 200 / 400 / 150', r.rent, r.weekly_rate, r.biweekly_rate, r.nightly_rate;
  END IF;

  -- 4. Lease season: the lease prices are advertised.
  PERFORM set_config('role', 'postgres', true);
  -- (the database refuses a night on a lease-only door: rentals_nightly_rate_matches_offering)
  UPDATE rentals SET offering = 'long-term', nightly_rate = NULL, min_stay_nights = NULL WHERE id = door;
  PERFORM set_config('role', 'anon', true);
  SELECT * INTO r FROM public_vacancies() v WHERE v.id = door;
  IF r.rent IS DISTINCT FROM 800 OR r.weekly_rate IS DISTINCT FROM 200 OR r.biweekly_rate IS DISTINCT FROM 400 THEN
    RAISE EXCEPTION 'SHORT STAYS ONLY SMOKE FAIL: long-term reads month %, week %, two weeks %', r.rent, r.weekly_rate, r.biweekly_rate;
  END IF;
  PERFORM set_config('role', 'postgres', true);
END $$;

SELECT 'SHORT STAYS ONLY SMOKE: PASS' AS result;
ROLLBACK;
