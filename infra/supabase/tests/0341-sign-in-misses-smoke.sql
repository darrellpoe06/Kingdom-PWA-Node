-- =============================================================================
-- 0341 SMOKE — a try with no account is counted, not kept (DR-1593)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'SIGN-IN MISSES SMOKE: PASS'.
-- Needs: the door-work bootstrap, schema-v1 / v1.1 / v2.1, then 0341. Also
-- run against the real database by the rls-isolation leg, so every assertion
-- is scoped to this smoke's own addresses (found by their salted hash) and the
-- cap is measured from the meter as it stands, never assumed empty.
--
--   anon counts a try for an address with no account, one row per day         ✔
--   the address is never stored: only a salted hash and a masked hint         ✔
--   a try for an address that HAS an account writes nothing                   ✘
--   a non-address and an oversized input write nothing                        ✘
--   the hourly cap stops counting and tallies the rest as dropped             ✘
--   switched off, nothing is counted                                          ✘
--   rows older than 30 days are deleted on the next write                     ✔
--   anon cannot read the tables, the salt, or the governor's read             ✘
--   the governor reads the hints, matched to an unclaimed invitation          ✔
--   a signed-in person outside poe-family is refused                          ✘
-- =============================================================================
BEGIN;

DO $shape$
BEGIN
  IF to_regclass('public.property_access_invites') IS NULL THEN
    CREATE TABLE public.property_access_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), instance_id uuid, email text NOT NULL,
      role_label text NOT NULL, display_name text, claimed_at timestamptz, claimed_by uuid,
      revoked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END
$shape$;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0341', 'authenticated','authenticated','gov339@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0341', 'authenticated','authenticated','15555550199@phone.poetech.us', '', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010341', 'poe-family', 'Poe Family', 'family')
ON CONFLICT DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name)
SELECT i.id, '00000000-0000-4000-a000-0000000a0341', 'member', 'Gov' FROM instances i WHERE i.slug = 'poe-family'
ON CONFLICT DO NOTHING;
INSERT INTO property_access_invites (instance_id, email, role_label, display_name)
SELECT i.id, '15555550142@phone.poetech.us', 'tenant', 'Invited Tenant' FROM instances i WHERE i.slug = 'poe-family';
-- A row 40 days old, to be swept by the next write.
INSERT INTO sign_in_misses (hash, day, hint, tries, first_at, last_at)
VALUES (repeat('a', 64), current_date - 40, 'old', 1, now() - interval '40 days', now() - interval '40 days');

-- This smoke's addresses, by the hash the counter would give them.
CREATE TEMP TABLE smoke339 ON COMMIT DROP AS
SELECT a.addr, encode(sha256(convert_to(s.salt || a.addr, 'UTF8')), 'hex') AS hash
  FROM sign_in_miss_settings s,
       (VALUES ('15555550142@phone.poetech.us'), ('15555550199@phone.poetech.us'),
               ('first339@example.org'), ('second339@example.org'), ('third339@example.org'),
               ('not an address'), (repeat('x', 250) || '@example.org')) AS a(addr)
 WHERE s.id;
GRANT SELECT ON smoke339 TO PUBLIC;

SET LOCAL ROLE anon;
SELECT public.note_sign_in_miss('15555550142@phone.poetech.us');
SELECT public.note_sign_in_miss(' 15555550142@Phone.PoeTech.us ');
SELECT public.note_sign_in_miss('15555550142@phone.poetech.us');
SELECT public.note_sign_in_miss('15555550199@phone.poetech.us');   -- has an account
SELECT public.note_sign_in_miss('not an address');
SELECT public.note_sign_in_miss(repeat('x', 250) || '@example.org');
SELECT public.note_sign_in_miss(NULL);

DO $$
BEGIN
  PERFORM count(*) FROM public.sign_in_misses;
  RAISE EXCEPTION 'anon must not read the misses';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM salt FROM public.sign_in_miss_settings;
  RAISE EXCEPTION 'anon must not read the salt';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM public.admin_sign_in_misses();
  RAISE EXCEPTION 'anon must not read the governor''s list';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
RESET ROLE;

DO $$
DECLARE n int; r record;
BEGIN
  IF EXISTS (SELECT 1 FROM sign_in_misses WHERE hash = repeat('a', 64)) THEN RAISE EXCEPTION 'the 40-day row must be swept'; END IF;
  IF EXISTS (SELECT 1 FROM sign_in_misses m JOIN smoke339 t ON t.hash = m.hash WHERE t.addr = '15555550199@phone.poetech.us') THEN
    RAISE EXCEPTION 'an address with an account must write nothing';
  END IF;
  IF EXISTS (SELECT 1 FROM sign_in_misses m JOIN smoke339 t ON t.hash = m.hash WHERE t.addr IN ('not an address', repeat('x', 250) || '@example.org')) THEN
    RAISE EXCEPTION 'junk and oversized input must write nothing';
  END IF;
  SELECT m.* INTO r FROM sign_in_misses m JOIN smoke339 t ON t.hash = m.hash WHERE t.addr = '15555550142@phone.poetech.us';
  IF r IS NULL THEN RAISE EXCEPTION 'the try with no account must be counted'; END IF;
  IF r.tries <> 3 THEN RAISE EXCEPTION 'three tries on one address, case and spaces aside, got %', r.tries; END IF;
  IF r.hint <> 'phone ending 0142' THEN RAISE EXCEPTION 'the hint must be the last four only, got %', r.hint; END IF;
  IF row_to_json(r)::text LIKE '%5555550142%' THEN RAISE EXCEPTION 'the address must never be stored: %', row_to_json(r); END IF;
  IF r.hash = encode(sha256(convert_to('15555550142@phone.poetech.us', 'UTF8')), 'hex') THEN
    RAISE EXCEPTION 'the hash must be salted, not a bare sha256 of the address';
  END IF;
END $$;

-- The cap: set one above what this hour has counted, then two new addresses:
-- the first is counted, the second dropped.
CREATE TEMP TABLE meter339 ON COMMIT DROP AS
SELECT coalesce((SELECT counted FROM sign_in_miss_meter WHERE hour = date_trunc('hour', now())), 0) AS counted,
       coalesce((SELECT dropped FROM sign_in_miss_meter WHERE hour = date_trunc('hour', now())), 0) AS dropped;
UPDATE sign_in_miss_settings SET hourly_cap = (SELECT counted + 1 FROM meter339);
SET LOCAL ROLE anon;
SELECT public.note_sign_in_miss('first339@example.org');
SELECT public.note_sign_in_miss('second339@example.org');
RESET ROLE;
DO $$
DECLARE d0 int; d1 int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sign_in_misses m JOIN smoke339 t ON t.hash = m.hash WHERE t.addr = 'first339@example.org') THEN
    RAISE EXCEPTION 'under the cap, the first address must be counted';
  END IF;
  IF EXISTS (SELECT 1 FROM sign_in_misses m JOIN smoke339 t ON t.hash = m.hash WHERE t.addr = 'second339@example.org') THEN
    RAISE EXCEPTION 'at the cap, the second address must not be counted';
  END IF;
  SELECT dropped INTO d0 FROM meter339;
  SELECT dropped INTO d1 FROM sign_in_miss_meter WHERE hour = date_trunc('hour', now());
  IF d1 <> d0 + 1 THEN RAISE EXCEPTION 'the dropped try must be tallied (was %, now %)', d0, d1; END IF;
END $$;
UPDATE sign_in_miss_settings SET hourly_cap = 10000, enabled = false;
SET LOCAL ROLE anon;
SELECT public.note_sign_in_miss('third339@example.org');
RESET ROLE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sign_in_misses m JOIN smoke339 t ON t.hash = m.hash WHERE t.addr = 'third339@example.org') THEN
    RAISE EXCEPTION 'switched off must count nothing';
  END IF;
END $$;
UPDATE sign_in_miss_settings SET enabled = true;

-- The governor's read.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000b0341","role":"authenticated"}';
DO $$
BEGIN
  PERFORM public.admin_sign_in_misses();
  RAISE EXCEPTION 'a person outside poe-family must not read the misses';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000a0341","role":"authenticated"}';
DO $$
DECLARE r jsonb; m jsonb;
BEGIN
  r := public.admin_sign_in_misses();
  IF NOT (r->>'enabled')::boolean THEN RAISE EXCEPTION 'enabled must be read: %', r->>'enabled'; END IF;
  SELECT e INTO m FROM jsonb_array_elements(r->'misses') e
   WHERE e->>'hint' = 'phone ending 0142' AND e->'invite'->>'display_name' = 'Invited Tenant';
  IF m IS NULL OR (m->>'tries')::int < 3 THEN RAISE EXCEPTION 'the phone hint, matched to the unclaimed invitation, with its tries: %', r->'misses'; END IF;
  IF (r->'meter'->>'dropped_24h')::int < 1 OR NOT (r->'meter'->>'cap_tripped_24h')::boolean THEN
    RAISE EXCEPTION 'the meter must show the drop and the tripped cap: %', r->'meter';
  END IF;
  IF r::text LIKE '%5555550142%' THEN RAISE EXCEPTION 'the read must never carry an address'; END IF;
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'SIGN-IN MISSES SMOKE: PASS'; END $$;
ROLLBACK;
