-- =============================================================================
-- 0152 PUBLIC-VACANCY SMOKE — what an ANONYMOUS visitor can and cannot reach
-- =============================================================================
-- The Poe Properties door now serves someone with NO account (Darrell,
-- 2026-08-26: "See options without a user account"). That means a public read
-- path exists for the first time in this feature, and a public read path over a
-- table holding purchase prices and mortgage balances is exactly the class that
-- must be PROVEN, not reasoned about (DR-0076/DR-0060).
--
-- Asserts, as the `anon` role:
--   anon reads a LISTED, un-tenanted unit                       ✔
--   anon reads an UNLISTED unit                                  ✘ (never advertised)
--   anon reads a listed unit that HAS an active tenancy          ✘ (not available)
--   anon selects from rentals directly                           ✘ (shut: no grant, or RLS)
--   the money columns are not reachable through the RPC          ✘ (column-explicit)
--   anon INSERTS an application                                  ✔ (that is what applying is)
--   anon READS applications back                                 ✘ (incl. their own; no SELECT grant)
--   an SSN in the payload                                        ✘ (CHECK refuses it)
--   a decision with no reason                                    ✘ (CHECK refuses it)
--
-- 2026-09-06 — THE CONTRACT THIS SMOKE PROVES IS THE FULL CHAIN'S, NOT 0152's.
-- The rls-isolation leg replays 0152 -> 0161 and only then runs this file, so
-- the public_vacancies() it meets is 0158's: `label` is the display name ONLY
-- when the landlord has said the address is public (address_visibility =
-- 'public'); by default ('after-application') the door reads "place in
-- Davenport, IA" and `unit` is withheld — "Placeable, not locatable. Never
-- display_name: that is the street." Run 88's failure was this file still
-- asserting 0152's `label = 'Maple Street'` against 0158's function. Now it
-- proves BOTH sides of the switch:
--   default: display name and unit WITHHELD, the placeable label shown        ✔
--   after he says 'public': display name and unit SHOWN                        ✔
--   unlisted / occupied doors stay out even when marked public               ✔
-- Everything runs in a transaction and ROLLS BACK.
-- =============================================================================
BEGIN;

\set owner '00000000-0000-4000-a000-0000000a0152'
\set inst  '00000000-0000-4000-b000-000000010152'
\set rlist '00000000-0000-4000-c000-00000001a152'
\set rhid  '00000000-0000-4000-c000-00000001b152'
\set rtaken '00000000-0000-4000-c000-00000001c152'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', :'owner','authenticated','authenticated','owner152@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type)
VALUES (:'inst', 'poe-vacancy-smoke-152', 'Poe Vacancy Smoke', 'landlord') ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name)
VALUES (:'inst', :'owner', 'owner', 'Owner') ON CONFLICT DO NOTHING;

-- Three doors: listed+free, unlisted, listed-but-occupied. Money on every one.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, city, state, monthly_rent, purchase_price, mortgage_balance, tenant_name, listed_at, listed_rent, listed_note)
VALUES
  (:'rlist',  :'inst', :'owner', 'VAC-LISTED',   'Maple Street', '123 Secret St', 'Unit 2', 'Davenport', 'IA', 950, 180000, 120000, NULL, now(), 950, 'Available Sept 1'),
  (:'rhid',   :'inst', :'owner', 'VAC-UNLISTED', 'Hidden House', '456 Private Rd', NULL,    'Davenport', 'IA', 900, 170000, 110000, NULL, NULL, NULL, NULL),
  (:'rtaken', :'inst', :'owner', 'VAC-TAKEN',    'Taken Place',  '789 Occupied Ave','Unit 1','Davenport', 'IA', 1000, 200000, 150000, 'Current Tenant', now(), 1000, 'Listed but occupied');

INSERT INTO rental_tenancies (instance_id, created_by, rental_ref, property_label, monthly_rent, deposit, status)
VALUES (:'inst', :'owner', 'VAC-TAKEN', 'Taken Place', 1000, 1000, 'active');

CREATE OR REPLACE FUNCTION pg_temp.as_anon_count(_sql text, _label text, _expected int)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role','anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role','postgres', true);
  IF n <> _expected THEN
    RAISE EXCEPTION 'VACANCY SMOKE FAIL: % expected %, saw %', _label, _expected, n;
  END IF;
END $$;

-- A table that is SHUT to anon is shut in one of two ways, and both are the
-- promise kept: no SELECT grant at all (permission denied — rentals and
-- rental_applications, where anon may only INSERT), or a grant with RLS
-- returning no rows. Run 89 (2026-09-06) died on the first with "permission
-- denied for table rentals" because as_anon_count only understood the second.
CREATE OR REPLACE FUNCTION pg_temp.as_anon_shut(_sql text, _label text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int := 0; denied boolean := false;
BEGIN
  PERFORM set_config('role','anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  BEGIN
    EXECUTE _sql INTO n;
  EXCEPTION
    WHEN insufficient_privilege THEN denied := true;
  END;
  PERFORM set_config('role','postgres', true);
  IF NOT denied AND n <> 0 THEN
    RAISE EXCEPTION 'VACANCY SMOKE FAIL: % expected shut (no grant, or RLS returning 0 rows), saw % rows', _label, n;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.as_anon_write(_sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  PERFORM set_config('role','anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege THEN ok := false;
    WHEN check_violation THEN ok := false;
  END;
  PERFORM set_config('role','postgres', true);
  IF ok <> _should THEN
    RAISE EXCEPTION 'VACANCY SMOKE FAIL: % (expected write-succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;

DO $$
BEGIN
  -- The listed, un-tenanted unit is the ONLY one an anonymous visitor sees.
  PERFORM pg_temp.as_anon_count(
    'SELECT count(*) FROM public_vacancies()', 'anon sees exactly the listed+free unit', 1);

  -- DEFAULT (address_visibility NULL = 'after-application', 0158): the door is
  -- placeable, not locatable. No property_type and no rooms in this fixture,
  -- so the computed label is exactly "place in Davenport, IA".
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() WHERE label = 'place in Davenport, IA'$q$,
    'the listed unit is shown as a placeable label by default', 1);
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() WHERE label = 'Maple Street'$q$,
    'the display name (the street) is WITHHELD until he says so', 0);
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() v WHERE v::text LIKE '%Maple Street%' OR v::text LIKE '%Unit 2%'$q$,
    'neither the display name nor the unit rides along on a gated door', 0);
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() WHERE address_shown = false AND unit IS NULL$q$,
    'the gated door says it is gated and carries no unit', 1);

  -- WHEN HE SAYS SO: the landlord marks all three doors public. Only the listed,
  -- free one is offered — visibility never overrides listing or occupancy — and
  -- it now carries its display name and unit.
  UPDATE rentals SET address_visibility = 'public'
   WHERE slug IN ('VAC-LISTED', 'VAC-UNLISTED', 'VAC-TAKEN');
  PERFORM pg_temp.as_anon_count(
    'SELECT count(*) FROM public_vacancies()', 'marking doors public offers no extra door', 1);
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() WHERE label = 'Maple Street' AND unit = 'Unit 2' AND address_shown = true$q$,
    'the listed unit shows its display name and unit once public', 1);
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() v WHERE v::text LIKE '%Hidden House%' OR v::text LIKE '%Private Rd%'$q$,
    'an UNLISTED unit is never advertised, even marked public', 0);
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() v WHERE v::text LIKE '%Taken Place%' OR v::text LIKE '%Occupied Ave%'$q$,
    'a listed but OCCUPIED unit is not offered, even marked public', 0);

  -- The table itself stays shut, and the address never rides along.
  PERFORM pg_temp.as_anon_shut('SELECT count(*) FROM rentals', 'anon reads rentals directly');
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() v WHERE v::text LIKE '%Secret St%'$q$,
    'the street address leaks through the RPC', 0);
  PERFORM pg_temp.as_anon_count(
    $q$SELECT count(*) FROM public_vacancies() v WHERE v::text LIKE '%120000%'$q$,
    'the mortgage balance leaks through the RPC', 0);

  -- Applying is open; reading applications back is not.
  PERFORM pg_temp.as_anon_write(
    format($q$INSERT INTO rental_applications (instance_id, applicant_name, applicant_phone, answers)
              VALUES (%L, 'Hopeful Applicant', '5635550142', '{"applicant.firstName":"Hopeful"}'::jsonb)$q$,
           '00000000-0000-4000-b000-000000010152'),
    'anon files an application', true);
  PERFORM pg_temp.as_anon_shut('SELECT count(*) FROM rental_applications', 'anon reads applications back');

  -- The two CHECKs that make the promises structural.
  PERFORM pg_temp.as_anon_write(
    format($q$INSERT INTO rental_applications (instance_id, applicant_name, answers)
              VALUES (%L, 'With SSN', '{"applicant.ssn":"123-45-6789"}'::jsonb)$q$,
           '00000000-0000-4000-b000-000000010152'),
    'an SSN in the payload is REFUSED by the database', false);

  BEGIN
    UPDATE rental_applications SET status = 'declined' WHERE applicant_name = 'Hopeful Applicant';
    RAISE EXCEPTION 'VACANCY SMOKE FAIL: a decision was recorded with no reason';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE NOTICE 'VACANCY SMOKE: PASS';
END $$;

ROLLBACK;
