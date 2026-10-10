-- =============================================================================
-- 0269 SMOKE — a short-stay door has a booking calendar (DR-0930)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'BOOKING CALENDAR SMOKE: PASS'; any break RAISES.
--
--   the family blacks out nights; the public sees the range, no reason       ✔
--   a guest (no account) asks for taken nights                               ✘
--   a guest who is not 21+ or does not accept the house rules                ✘
--   a guest asks for open nights                                             ✔
--   a guest's 30+ nights; a door not taking stays; a past first night         ✘
--   the family enters a longer stay itself                                   ✔
--   the family confirms; an overlapping confirmation                         ✔ / ✘
--   a fourth open ask from the same contact                                  ✘
--   a stranger or a guest reads the calendar's rows                          ✘
--   cancelled frees the nights; cancelled never comes back                   ✔ / ✘
--   blocked, asked, confirmed, cancelled are on the clock                    ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0269', 'authenticated','authenticated','owner269@test.local','',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0269', 'authenticated','authenticated','stranger269@test.local','',now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010269', 'booking-smoke-269', 'Booking Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010269', '00000000-0000-4000-a000-0000000a0269', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status, listed_at, offering, nightly_rate) VALUES
  ('00000000-0000-4000-c000-0000000a0269', '00000000-0000-4000-b000-000000010269', '00000000-0000-4000-a000-0000000a0269', 'STAY-A-269', 'Stay A', '805 A St', 'multi-family', 'vacant', now(), 'short-term', 150),
  ('00000000-0000-4000-c000-0000000b0269', '00000000-0000-4000-b000-000000010269', '00000000-0000-4000-a000-0000000a0269', 'LEASE-B-269', 'Lease B', '806 B St', 'multi-family', 'vacant', now(), 'long-term', NULL),
  ('00000000-0000-4000-c000-0000000c0269', '00000000-0000-4000-b000-000000010269', '00000000-0000-4000-a000-0000000a0269', 'HIDDEN-C-269', 'Hidden C', '807 C St', 'multi-family', 'vacant', NULL, 'short-term', 150);

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); PERFORM set_config('request.jwt.claims', '', true); END $$;

-- _who NULL = a guest with no account (anon).
CREATE OR REPLACE FUNCTION pg_temp.runs(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR raise_exception THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.val_as(_who uuid, _sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  IF _who IS NULL THEN PERFORM pg_temp.as_anon(); ELSE PERFORM pg_temp.as_user(_who); END IF;
  EXECUTE _sql INTO v;
  PERFORM pg_temp.as_postgres();
  RETURN v;
END $$;

DO $$
DECLARE
  o     uuid := '00000000-0000-4000-a000-0000000a0269';
  s     uuid := '00000000-0000-4000-a000-0000000e0269';
  inst  text := '00000000-0000-4000-b000-000000010269';
  doorA text := '00000000-0000-4000-c000-0000000a0269';
  doorB text := '00000000-0000-4000-c000-0000000b0269';
  doorC text := '00000000-0000-4000-c000-0000000c0269';
  d0    date := (now() AT TIME ZONE 'utc')::date + 30;   -- a month out, always in the future
  blk   uuid := '00000000-0000-4000-d000-0000000a0269';
  ask   text;
  ask2  text;
  v     text;
BEGIN
  -- 1. The family blacks out three nights; the public sees the range and nothing else.
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO door_stays (id, instance_id, rental_id, kind, status, check_in, check_out, block_reason) VALUES (%L, %L, %L, ''block'', ''confirmed'', %L, %L, ''Turnover and deep clean'')',
    blk, inst, doorA, d0, d0 + 3), 'the family blacks out nights', true);
  v := pg_temp.val_as(NULL, format('SELECT string_agg(taken_from || ''..'' || taken_to, '','') FROM door_booked_nights(%L, %L, %L)', doorA, d0 - 5, d0 + 40));
  IF v IS DISTINCT FROM (d0::text || '..' || (d0 + 3)::text) THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the public calendar did not show the blackout (%)', v; END IF;
  IF pg_temp.val_as(NULL, format('SELECT count(*) FROM door_booked_nights(%L, %L, %L) b WHERE b::text LIKE ''%%Turnover%%''', doorA, d0 - 5, d0 + 40))::int <> 0 THEN
    RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the public calendar leaks the reason';
  END IF;

  -- 2. A guest with no account asks.
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorA, d0 + 1, d0 + 4),
    'a guest asks for taken nights', false);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, false, true)', doorA, d0 + 5, d0 + 8),
    'a guest who does not attest 21+', false);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, false)', doorA, d0 + 5, d0 + 8),
    'a guest who does not accept the house rules', false);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorA, d0 + 5, d0 + 35),
    'a guest asks for thirty nights on their own', false);
  -- The family may enter a longer stay itself; the cap is a guest default.
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO door_stays (instance_id, rental_id, kind, status, check_in, check_out, guest_name, guest_phone) VALUES (%L, %L, ''stay'', ''requested'', %L, %L, ''Visiting professor'', ''217-555-0199'')',
    inst, doorA, d0 + 100, d0 + 160), 'the family enters a sixty-night stay', true);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorB, d0 + 5, d0 + 8),
    'a door that is not taking stays', false);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorC, d0 + 5, d0 + 8),
    'an unlisted door', false);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorA, d0 - 40, d0 - 37),
    'a first night already past', false);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana Guest'', ''217-555-0100'', ''ana@example.com'', 2, ''Visiting campus'', true, true, ''Coffee and oat milk'', true)', doorA, d0 + 5, d0 + 8),
    'a guest asks for open nights, says what they like, and says yes to offers by email', true);
  SELECT id::text INTO ask FROM door_stays WHERE rental_id = doorA::uuid AND kind = 'stay' AND check_in = d0 + 5;
  IF (SELECT stay_wishes || '|' || offers_by_email || '|' || (offers_by_email_at IS NOT NULL) FROM door_stays WHERE id = ask::uuid) <> 'Coffee and oat milk|true|true' THEN
    RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the guest''s wishes and offers yes (with its moment) were not kept';
  END IF;
  -- A yes to offers with no email to send them to is not kept as a yes.
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ben'', ''217-555-0111'', NULL, 1, NULL, true, true, NULL, true)', doorA, d0 + 22, d0 + 24),
    'a yes to offers with no email', true);
  IF (SELECT offers_by_email FROM door_stays WHERE rental_id = doorA::uuid AND check_in = d0 + 22) THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: offers yes kept with no email'; END IF;
  IF (SELECT status || '|' || requested_by_family || '|' || attests_21_plus FROM door_stays WHERE id = ask::uuid) <> 'requested|false|true' THEN
    RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the ask is not a requested, guest-made, 21+-attested stay';
  END IF;
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorA, d0 + 10, d0 + 12), 'a second ask', true);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorA, d0 + 14, d0 + 16), 'a third ask', true);
  PERFORM pg_temp.runs(NULL, format('SELECT request_a_stay(%L, %L, %L, ''Ana'', ''217-555-0100'', NULL, 2, NULL, true, true)', doorA, d0 + 18, d0 + 20),
    'a fourth open ask from the same contact', false);

  -- 3. Only the family reads and decides; a guest with no account reads no rows.
  BEGIN
    PERFORM pg_temp.as_anon();
    PERFORM count(*) FROM door_stays;
    PERFORM pg_temp.as_postgres();
    RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: a guest with no account reads the calendar rows';
  EXCEPTION WHEN insufficient_privilege THEN PERFORM pg_temp.as_postgres();
  END;
  IF pg_temp.val_as(s, 'SELECT count(*) FROM door_stays')::int <> 0 THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: a stranger reads the calendar'; END IF;
  IF pg_temp.val_as(o, format('SELECT count(*) FROM door_stays WHERE rental_id = %L', doorA))::int <> 6 THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the family does not see the block, the long stay and the three asks'; END IF;

  -- 4. Confirm; an overlapping confirmation is refused.
  PERFORM pg_temp.runs(o, format('UPDATE door_stays SET status = ''confirmed'' WHERE id = %L', ask), 'the family confirms the ask', true);
  IF (SELECT decided_by FROM door_stays WHERE id = ask::uuid) IS DISTINCT FROM o THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the confirmation does not name who decided'; END IF;
  PERFORM pg_temp.runs(o, format(
    'INSERT INTO door_stays (instance_id, rental_id, kind, status, check_in, check_out, block_reason) VALUES (%L, %L, ''block'', ''confirmed'', %L, %L, ''Repair'')',
    inst, doorA, d0 + 6, d0 + 7), 'a blackout over a confirmed stay', false);
  -- A stranger cannot confirm anything.
  PERFORM pg_temp.runs(s, format('UPDATE door_stays SET status = ''declined'' WHERE id = %L', ask), 'a stranger moves a stay (no rows reachable)', true);
  IF (SELECT status FROM door_stays WHERE id = ask::uuid) <> 'confirmed' THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: a stranger changed a stay'; END IF;

  -- 5. Cancelled frees the nights and never comes back.
  PERFORM pg_temp.runs(o, format('UPDATE door_stays SET status = ''cancelled'' WHERE id = %L', ask), 'the family cancels', true);
  v := pg_temp.val_as(NULL, format('SELECT count(*) FROM door_booked_nights(%L, %L, %L) WHERE taken_from = %L', doorA, d0 - 5, d0 + 40, d0 + 5));
  IF v::int <> 0 THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: cancelled nights still read as taken'; END IF;
  PERFORM pg_temp.runs(o, format('UPDATE door_stays SET status = ''confirmed'' WHERE id = %L', ask), 'a cancelled stay confirmed again', false);

  -- 6. A guest with an account keeps their own stays, and only theirs.
  SELECT id::text INTO ask2 FROM door_stays WHERE rental_id = doorA::uuid AND check_in = d0 + 10;
  PERFORM pg_temp.runs(s, format('UPDATE door_stays SET requested_by = %L WHERE id = %L', s, ask2), 'a stranger claims a stay (no rows reachable)', true);
  IF (SELECT requested_by FROM door_stays WHERE id = ask2::uuid) IS NOT NULL THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: a stranger claimed a stay'; END IF;
  PERFORM pg_temp.runs(o, format('UPDATE door_stays SET requested_by = %L WHERE id = %L', s, ask2), 'the family attaches a stay to a guest''s account', true);
  PERFORM pg_temp.runs(o, format('UPDATE door_stays SET requested_by = %L WHERE id = %L', o, ask2), 'a stay that belongs to a guest is re-pointed', false);
  IF pg_temp.val_as(s, 'SELECT count(*) FROM door_stays')::int <> 1 THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: a signed-in guest does not see exactly their own stay'; END IF;

  -- 7. The clock.
  IF (SELECT count(*) FROM door_events WHERE subject = 'stay' AND subject_id = blk AND event = 'blocked') <> 1 THEN RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the blackout is not on the clock'; END IF;
  IF (SELECT string_agg(event, ',' ORDER BY at) FROM door_events WHERE subject = 'stay' AND subject_id = ask::uuid) <> 'asked,confirmed,cancelled' THEN
    RAISE EXCEPTION 'BOOKING CALENDAR SMOKE FAIL: the stay''s life is not on the clock in order (%)', (SELECT string_agg(event, ',' ORDER BY at) FROM door_events WHERE subject = 'stay' AND subject_id = ask::uuid);
  END IF;

  RAISE NOTICE 'BOOKING CALENDAR SMOKE: PASS';
END $$;

ROLLBACK;
