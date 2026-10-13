-- =============================================================================
-- 0206 PLAN IMPORT SMOKE — the plan becomes rows (0206, DR-0362).
-- Run on the LIVE Supabase (as postgres) AFTER 0200..0206. Rolls back.
-- PASS prints 'PLAN IMPORT SMOKE: PASS'; any wrong behaviour RAISES.
--
-- Household F: owner O, member M, child C. One plan with four dated bills —
-- two of which share a PAYEE and a DAY (the case that cost $184.99 when the
-- dedupe key was payee+day alone), one incomplete, one ordinary — and one debt
-- with no due day.
--
-- Assertions
--   a dry run proposes and writes NOTHING                          ✔
--   an apply creates every complete bill                           ✔
--   the ordinal keeps BOTH bills that share a payee and a day      ✔
--   a second apply skips every one — no duplicates                 ✔
--   the incomplete bill is refused, never guessed                  ✔
--   the debt is NOT imported, and is counted and explained         ✔
--   a member importing                                  -> REFUSED ✘
--   a child importing                                   -> REFUSED ✘
--   another household importing into ours               -> REFUSED ✘
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000206'
\set m 'b0000000-0000-4000-a000-000000000206'
\set c 'c0000000-0000-4000-a000-000000000206'
\set z 'f0000000-0000-4000-a000-000000000206'
\set instF '10000000-0000-4000-b000-000000000206'
\set instX '20000000-0000-4000-b000-000000000206'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0206@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0206@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0206@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0206@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0206', 'The 0206 household', 'family'),
  (:'instX', 'fam-0206-x', 'Another household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',  'Owner O'),
  (:'instF', :'m', 'member', 'Member M'),
  (:'instF', :'c', 'child',  'Child C'),
  (:'instX', :'z', 'owner',  'Owner Z');

-- Two bills share payee AND day on purpose: both must survive the import.
INSERT INTO family_plans (instance_id, slug, title, plan, updated_by)
VALUES (:'instF', 'plan-0206', 'Test plan', '{
  "billCalendar": { "dated": [
    { "day": 5,  "payee": "Ameren",   "amount": 120.50 },
    { "day": 5,  "payee": "Ameren",   "amount": 64.49  },
    { "day": 31, "payee": "Late Co",  "amount": 10.00  },
    { "day": 12, "payee": "",         "amount": 99.00  }
  ] },
  "debtTracker": [ { "debt": "A card", "balance": 1550, "apr": 28.99 } ]
}'::jsonb, :'o');

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

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000206';
  m uuid := 'b0000000-0000-4000-a000-000000000206';
  c uuid := 'c0000000-0000-4000-a000-000000000206';
  z uuid := 'f0000000-0000-4000-a000-000000000206';
  instF uuid := '10000000-0000-4000-b000-000000000206';
  j jsonb; n int; feb date := '2026-02-01';
BEGIN
  -- ---------------- dry run writes nothing ----------------
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',o,'role','authenticated','email','o0206@test.local')::text,true);
  j := public.plan_bills_import(feb, true, instF);
  PERFORM set_config('role','postgres',true);

  IF (j->>'proposed')::int <> 3 THEN
    RAISE EXCEPTION 'FAIL: dry run proposed %, expected 3 complete bills', j->>'proposed';
  END IF;
  IF (j->>'created')::int <> 0 THEN RAISE EXCEPTION 'FAIL: a dry run wrote rows'; END IF;
  SELECT count(*)::int INTO n FROM public.obligations WHERE instance_id = instF;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a dry run wrote rows — % in the table', n; END IF;
  IF (j->>'refusedIncomplete')::int <> 1 THEN
    RAISE EXCEPTION 'FAIL: the bill with no payee was not refused (refused=%)', j->>'refusedIncomplete';
  END IF;
  IF (j->>'debtsNotImported')::int <> 1 THEN
    RAISE EXCEPTION 'FAIL: the debt was not counted as not-imported';
  END IF;

  -- ---------------- apply ----------------
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',o,'role','authenticated','email','o0206@test.local')::text,true);
  j := public.plan_bills_import(feb, false, instF);
  PERFORM set_config('role','postgres',true);

  IF (j->>'created')::int <> 3 THEN
    RAISE EXCEPTION 'FAIL: the ordinal kept both bills that share a payee and a day — created %, expected 3', j->>'created';
  END IF;

  SELECT count(*)::int INTO n FROM public.obligations
   WHERE instance_id = instF AND counterparty = 'Ameren';
  IF n <> 2 THEN
    RAISE EXCEPTION 'FAIL: the ordinal kept both bills that share a payee and a day — found % Ameren rows, expected 2', n;
  END IF;

  -- Day 31 in February lands on the 28th, never in March.
  SELECT count(*)::int INTO n FROM public.obligations
   WHERE instance_id = instF AND counterparty = 'Late Co' AND due_date = '2026-02-28';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: day 31 of February did not land on the 28th'; END IF;

  -- Cents, not floats: 120.50 + 64.49 + 10.00 = 19499
  SELECT coalesce(sum(amount_cents),0)::int INTO n FROM public.obligations WHERE instance_id = instF;
  IF n <> 19499 THEN RAISE EXCEPTION 'FAIL: imported total was % cents, expected 19499', n; END IF;

  -- ---------------- apply again: no duplicates ----------------
  PERFORM set_config('role','authenticated',true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',o,'role','authenticated','email','o0206@test.local')::text,true);
  j := public.plan_bills_import(feb, false, instF);
  PERFORM set_config('role','postgres',true);

  IF (j->>'created')::int <> 0 OR (j->>'skippedAlreadyImported')::int <> 3 THEN
    RAISE EXCEPTION 'FAIL: a second import duplicated the bills (created=%, skipped=%)',
      j->>'created', j->>'skippedAlreadyImported';
  END IF;
  SELECT count(*)::int INTO n FROM public.obligations WHERE instance_id = instF;
  IF n <> 3 THEN RAISE EXCEPTION 'FAIL: a second import duplicated the bills — % rows', n; END IF;

  -- The debt is still not an obligation.
  SELECT count(*)::int INTO n FROM public.obligations WHERE instance_id = instF AND counterparty = 'A card';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a debt with no due day was imported as an obligation'; END IF;

  -- ---------------- who may import ----------------
  IF pg_temp.as_user(m, 'm0206@test.local',
      format('SELECT public.plan_bills_import(%L::date, false, %L)', feb, instF)) THEN
    RAISE EXCEPTION 'FAIL: a member imported into the books';
  END IF;

  IF pg_temp.as_user(c, 'c0206@test.local',
      format('SELECT public.plan_bills_import(%L::date, false, %L)', feb, instF)) THEN
    RAISE EXCEPTION 'FAIL: a child imported into the books';
  END IF;

  IF pg_temp.as_user(z, 'z0206@test.local',
      format('SELECT public.plan_bills_import(%L::date, false, %L)', feb, instF)) THEN
    RAISE EXCEPTION 'FAIL: another household imported into ours';
  END IF;

  RAISE NOTICE 'PLAN IMPORT SMOKE: PASS';
END $$;

ROLLBACK;
