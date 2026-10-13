-- =============================================================================
-- 0203 DOOR ECONOMICS SMOKE — a mortgage in line items, and what each door
-- costs against what it collects (0203, DR-0359). Run on the LIVE Supabase
-- (as postgres) AFTER 0200..0203. Runs in a transaction and ROLLS BACK.
-- PASS prints 'DOOR ECONOMICS SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: household F owns one door. Owner O, member M, child C,
-- assistant A. Household X — owner Z, one door of their own.
--
-- Assertions
--   O writes a PITI breakdown whose parts sum to the payment              ✔
--   a breakdown that does NOT sum to the payment            -> REFUSED    ✘
--   a breakdown that OVERSHOOTS the payment                 -> REFUSED    ✘
--   an 'other' line with no label                           -> REFUSED    ✘
--   a line of zero                                          -> REFUSED    ✘
--   an escrow CREDIT (negative) that makes the total work                 ✔
--   M (member) writes lines                                 -> REFUSED    ✘
--   Z writes lines on F's obligation                        -> REFUSED    ✘
--   C (child) and A (assistant) cannot READ the lines       -> REFUSED    ✘
--   a direct INSERT into obligation_lines bypassing the fn  -> REFUSED    ✘
--   door_month reports cost, collected and the gap from real rows         ✔
--   door_month on an untouched month reports entered=false, not zeros     ✔
--   C (child) calling door_month                            -> REFUSED    ✘
--   Z calling door_month on F's door                        -> REFUSED    ✘
--   a second identical open charge on the same door+month   -> REFUSED    ✘
--   a period that is not the first of a month               -> REFUSED    ✘
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000203'
\set m 'b0000000-0000-4000-a000-000000000203'
\set c 'c0000000-0000-4000-a000-000000000203'
\set a 'd0000000-0000-4000-a000-000000000203'
\set z 'f0000000-0000-4000-a000-000000000203'
\set instF '10000000-0000-4000-b000-000000000203'
\set instX '20000000-0000-4000-b000-000000000203'
\set doorF '60000000-0000-4000-f000-000000000203'
\set doorX '61000000-0000-4000-f000-000000000203'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0203@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0203@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0203@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0203@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0203@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0203', 'The 0203 household', 'family'),
  (:'instX', 'fam-0203-x', 'Another household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',     'Owner O'),
  (:'instF', :'m', 'member',    'Member M'),
  (:'instF', :'c', 'child',     'Child C'),
  (:'instF', :'a', 'assistant', 'Assistant A'),
  (:'instX', :'z', 'owner',     'Owner Z');

-- One door each. This is the real table the 12 doors live in.
INSERT INTO rentals (id, instance_id, created_by, slug, address, status)
VALUES (:'doorF', :'instF', :'o', 'door-0203', '1 Test Street', 'occupied'),
       (:'doorX', :'instX', :'z', 'door-0203x', '2 Other Street', 'occupied');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _email text, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO j;
  PERFORM set_config('role', 'postgres', true);
  RETURN j;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE c int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO c;
  PERFORM set_config('role', 'postgres', true);
  RETURN c;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000203';
  m uuid := 'b0000000-0000-4000-a000-000000000203';
  c uuid := 'c0000000-0000-4000-a000-000000000203';
  a uuid := 'd0000000-0000-4000-a000-000000000203';
  z uuid := 'f0000000-0000-4000-a000-000000000203';
  instF uuid := '10000000-0000-4000-b000-000000000203';
  doorF uuid := '60000000-0000-4000-f000-000000000203';
  doorX uuid := '61000000-0000-4000-f000-000000000203';
  j jsonb; n int; v_mort uuid; v_rent uuid;
  -- The PITI payment: 942.12 + 315.00 + 98.00 = 1355.12
  v_good text := '[{"kind":"principal-interest","amountCents":94212},{"kind":"taxes","amountCents":31500},{"kind":"insurance","amountCents":9800}]';
  v_short text := '[{"kind":"principal-interest","amountCents":94212},{"kind":"taxes","amountCents":31500}]';
  v_over text := '[{"kind":"principal-interest","amountCents":94212},{"kind":"taxes","amountCents":31500},{"kind":"insurance","amountCents":9800},{"kind":"hoa","amountCents":5000}]';
BEGIN
  -- ------------------------------------------------------------------
  -- The mortgage for July, on this door, with the month pinned.
  -- ------------------------------------------------------------------
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role','authenticated','email','o0203@test.local')::text, true);
  j := public.obligation_record(
    ('{"direction":"payable","counterparty":"The lender","description":"Mortgage","amountCents":135512,'
     || '"terms":"custom","dueDate":"2026-07-01","product":"properties","place":"1 Test Street",'
     || '"rentalId":"' || doorF || '","periodMonth":"2026-07-01"}')::jsonb, instF);
  v_mort := (j->>'id')::uuid;
  -- The rent the tenant owes for the same month.
  j := public.obligation_record(
    ('{"direction":"receivable","counterparty":"The tenant","description":"Rent","amountCents":160000,'
     || '"terms":"custom","dueDate":"2026-07-01","product":"properties","place":"1 Test Street",'
     || '"rentalId":"' || doorF || '","periodMonth":"2026-07-01"}')::jsonb, instF);
  v_rent := (j->>'id')::uuid;
  PERFORM set_config('role', 'postgres', true);

  IF v_mort IS NULL OR v_rent IS NULL THEN
    RAISE EXCEPTION 'FAIL: the owner could not record the door''s July obligations';
  END IF;

  -- ------------------------------------------------------------------
  -- The parts must add up to the total.
  -- ------------------------------------------------------------------
  IF NOT pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort, v_good)) THEN
    RAISE EXCEPTION 'FAIL: a breakdown that sums exactly to the payment was refused';
  END IF;

  SELECT count(*) INTO n FROM public.obligation_lines WHERE obligation_id = v_mort;
  IF n <> 3 THEN RAISE EXCEPTION 'FAIL: expected 3 line items, found %', n; END IF;

  IF pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort, v_short)) THEN
    RAISE EXCEPTION 'FAIL: a breakdown SHORT of the payment was accepted';
  END IF;

  IF pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort, v_over)) THEN
    RAISE EXCEPTION 'FAIL: a breakdown OVER the payment was accepted';
  END IF;

  -- The refused writes must not have disturbed the good set.
  SELECT count(*) INTO n FROM public.obligation_lines WHERE obligation_id = v_mort;
  IF n <> 3 THEN
    RAISE EXCEPTION 'FAIL: a refused breakdown left % lines behind — the rollback did not hold', n;
  END IF;

  -- An 'other' line has to say what it is.
  IF pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort,
        '[{"kind":"principal-interest","amountCents":125512},{"kind":"other","amountCents":10000}]')) THEN
    RAISE EXCEPTION 'FAIL: an unlabelled "other" line was accepted';
  END IF;

  -- A line for nothing is not a line.
  IF pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort,
        '[{"kind":"principal-interest","amountCents":135512},{"kind":"taxes","amountCents":0}]')) THEN
    RAISE EXCEPTION 'FAIL: a zero line was accepted';
  END IF;

  -- An escrow CREDIT is negative, and the set still has to work.
  IF NOT pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort,
        '[{"kind":"principal-interest","amountCents":94212},{"kind":"taxes","amountCents":31500},'
        || '{"kind":"insurance","amountCents":13800},{"kind":"escrow","amountCents":-4000}]')) THEN
    RAISE EXCEPTION 'FAIL: a negative escrow credit that balanced the total was refused';
  END IF;

  -- Put the plain PITI back for the reporting assertions below.
  PERFORM pg_temp.as_user(o, 'o0203@test.local',
    format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort, v_good));

  -- ------------------------------------------------------------------
  -- Who may write the lines.
  -- ------------------------------------------------------------------
  IF pg_temp.as_user(m, 'm0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort, v_good)) THEN
    RAISE EXCEPTION 'FAIL: a plain member wrote the mortgage breakdown';
  END IF;

  IF pg_temp.as_user(z, 'z0203@test.local',
      format('SELECT public.obligation_set_lines(%L, %L::jsonb)', v_mort, v_good)) THEN
    RAISE EXCEPTION 'FAIL: another household''s owner wrote our mortgage breakdown';
  END IF;

  -- The function is the ONLY door in: a direct insert has no policy to allow it.
  IF pg_temp.as_user(o, 'o0203@test.local',
      format('INSERT INTO public.obligation_lines (instance_id, obligation_id, created_by, kind, amount_cents) '
             || 'VALUES (%L, %L, %L, ''taxes'', 100)', instF, v_mort, o)) THEN
    RAISE EXCEPTION 'FAIL: a direct insert bypassed obligation_set_lines and its sum rule';
  END IF;

  -- ------------------------------------------------------------------
  -- Who may read them. The books' own wall (0082/0100), kept.
  -- ------------------------------------------------------------------
  n := pg_temp.count_as(c, 'c0203@test.local', 'SELECT count(*)::int FROM public.obligation_lines');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a child read % mortgage line item(s)', n; END IF;

  n := pg_temp.count_as(a, 'a0203@test.local', 'SELECT count(*)::int FROM public.obligation_lines');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: an assistant read % mortgage line item(s)', n; END IF;

  n := pg_temp.count_as(m, 'm0203@test.local', 'SELECT count(*)::int FROM public.obligation_lines');
  IF n <> 3 THEN RAISE EXCEPTION 'FAIL: a member of the household saw % lines, expected 3', n; END IF;

  -- ------------------------------------------------------------------
  -- The gap, from real rows. $1,200 arrived against a $1,355.12 cost.
  -- ------------------------------------------------------------------
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role','authenticated','email','o0203@test.local')::text, true);
  PERFORM public.obligation_settle(v_rent, 120000, '2026-07-03'::date, 'transfer', NULL, NULL);
  PERFORM set_config('role', 'postgres', true);

  j := pg_temp.json_as(o, 'o0203@test.local',
         format('SELECT public.door_month(%L, %L::date)', doorF, '2026-07-01'));

  IF (j->>'entered')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: a month with real rows reported entered=false';
  END IF;
  IF (j->>'costCents')::bigint <> 135512 THEN
    RAISE EXCEPTION 'FAIL: cost was %, expected 135512', j->>'costCents';
  END IF;
  IF (j->>'billedCents')::bigint <> 160000 THEN
    RAISE EXCEPTION 'FAIL: billed was %, expected 160000', j->>'billedCents';
  END IF;
  IF (j->>'collectedCents')::bigint <> 120000 THEN
    RAISE EXCEPTION 'FAIL: collected was %, expected 120000', j->>'collectedCents';
  END IF;
  -- The gap is against money that ARRIVED, so this month did not fund itself.
  IF (j->>'gapCents')::bigint <> (120000 - 135512) THEN
    RAISE EXCEPTION 'FAIL: gap was %, expected %', j->>'gapCents', 120000 - 135512;
  END IF;
  -- And the tenant still owes the rest.
  IF (j->>'shortfallCents')::bigint <> 40000 THEN
    RAISE EXCEPTION 'FAIL: shortfall was %, expected 40000', j->>'shortfallCents';
  END IF;
  -- The cost is broken into the parts, and the parts are the whole cost.
  IF (j->'costByKind'->>'principal-interest')::bigint <> 94212
     OR (j->'costByKind'->>'taxes')::bigint <> 31500
     OR (j->'costByKind'->>'insurance')::bigint <> 9800 THEN
    RAISE EXCEPTION 'FAIL: the cost breakdown did not match the lines: %', j->'costByKind';
  END IF;

  -- ------------------------------------------------------------------
  -- Not entered is NOT zero. This is 11 of the 12 real doors today.
  -- ------------------------------------------------------------------
  j := pg_temp.json_as(o, 'o0203@test.local',
         format('SELECT public.door_month(%L, %L::date)', doorF, '2026-03-01'));
  IF (j->>'entered')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'FAIL: an untouched month claimed to be entered';
  END IF;

  -- ------------------------------------------------------------------
  -- Who may ask the question at all.
  -- ------------------------------------------------------------------
  IF pg_temp.as_user(c, 'c0203@test.local',
      format('SELECT public.door_month(%L, %L::date)', doorF, '2026-07-01')) THEN
    RAISE EXCEPTION 'FAIL: a child read the door''s books through door_month';
  END IF;

  IF pg_temp.as_user(a, 'a0203@test.local',
      format('SELECT public.door_month(%L, %L::date)', doorF, '2026-07-01')) THEN
    RAISE EXCEPTION 'FAIL: an assistant read the door''s books through door_month';
  END IF;

  IF pg_temp.as_user(z, 'z0203@test.local',
      format('SELECT public.door_month(%L, %L::date)', doorF, '2026-07-01')) THEN
    RAISE EXCEPTION 'FAIL: another household read our door''s books';
  END IF;

  -- Our own owner cannot read THEIR door either.
  IF pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.door_month(%L, %L::date)', doorX, '2026-07-01')) THEN
    RAISE EXCEPTION 'FAIL: we read another household''s door';
  END IF;

  -- ------------------------------------------------------------------
  -- A double-count is refused by the index, not by a habit.
  -- ------------------------------------------------------------------
  IF pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_record(%L::jsonb, %L)',
        '{"direction":"payable","counterparty":"The lender","description":"Mortgage","amountCents":135512,'
        || '"terms":"custom","dueDate":"2026-07-01","rentalId":"' || doorF || '","periodMonth":"2026-07-01"}',
        instF)) THEN
    RAISE EXCEPTION 'FAIL: the same July mortgage was recorded on this door twice';
  END IF;

  -- ------------------------------------------------------------------
  -- A period is a MONTH. Mid-month is refused so one July is one July.
  -- ------------------------------------------------------------------
  IF pg_temp.as_user(o, 'o0203@test.local',
      format('SELECT public.obligation_record(%L::jsonb, %L)',
        '{"direction":"payable","counterparty":"Someone","description":"Mid-month","amountCents":100,'
        || '"terms":"custom","dueDate":"2026-08-14","rentalId":"' || doorF || '","periodMonth":"2026-08-14"}',
        instF)) THEN
    RAISE EXCEPTION 'FAIL: a period that is not the first of a month was accepted';
  END IF;

  RAISE NOTICE 'DOOR ECONOMICS SMOKE: PASS';
END $$;

ROLLBACK;
