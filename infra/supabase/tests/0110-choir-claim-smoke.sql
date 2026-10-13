-- =============================================================================
-- 0110 CHOIR-CLAIM SMOKE TEST — the enablement gate for choir roster self-claim
-- =============================================================================
-- Run on the LIVE NAS Supabase (as postgres) AFTER applying
-- 0110-choir-member-self-claim.sql. PROVES the SECURITY-DEFINER claim functions
-- actually enforce their guards — the verification DR-0076 requires ("no
-- unverified access path marked done"). Everything runs in a transaction and
-- ROLLS BACK, leaving no data. A PASS prints 'CHOIR CLAIM SMOKE: PASS'; any
-- wrong grant or missing guard RAISES.
--
-- The scenario (two DIFFERENT church instances I and I2):
--   Instance I,  owner O.   Roster rows: Alice (user_id NULL), Bob (user_id NULL).
--   Instance I2, owner O2.  Roster row:  Carol (user_id NULL).
--   User U  — an app account with no choir link (the real Alice).
--   User S  — a stranger with an account but no role in I.
--
-- Assertions (what MUST hold):
--   mint by S (not owner/admin of I)          -> RAISES (unauthorized)          ✘
--   mint by O for Alice                        -> returns a 6-char code          ✔
--   claim by U with a WRONG code               -> status 'invalid', no link      ✘
--   claim by U with Alice's code               -> status 'linked', user_id=U      ✔
--   the code is ONE-TIME (re-claim same code)  -> status 'invalid'               ✘
--   mint by O for the now-linked Alice row     -> RAISES (already linked)        ✘
--   claim by U with a FRESH Bob code (same I)  -> 'already-linked' (one per inst)✘
--   my_choir_membership(I)  as U               -> 1 row (Alice)                   ✔
--   my_choir_membership(I2) as U               -> 0 rows (no cross-instance leak) ✘
-- =============================================================================
BEGIN;

\set o     '00000000-0000-4000-a000-0000000a0110'
\set o2    '00000000-0000-4000-a000-0000000b0110'
\set u     '00000000-0000-4000-a000-0000000c0110'
\set s     '00000000-0000-4000-a000-0000000d0110'

\set inst  '00000000-0000-4000-b000-000000010110'
\set inst2 '00000000-0000-4000-b000-000000020110'

\set alice '00000000-0000-4000-c000-0000000a0110'
\set bob   '00000000-0000-4000-c000-0000000b0110'
\set carol '00000000-0000-4000-c000-0000000c0110'

-- Minimal auth.users rows so the FKs resolve.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o',  'authenticated','authenticated','o0110@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'o2', 'authenticated','authenticated','o2-0110@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u',  'authenticated','authenticated','u0110@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s',  'authenticated','authenticated','s0110@test.local','', now(), now());

-- Two separate church instances, each with its own owner.
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst',  'colg-0110',  'COLG choir test',   'church'),
  (:'inst2', 'other-0110', 'Other church test', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst',  :'o',  'owner', 'Owner O'),
  (:'inst2', :'o2', 'owner', 'Owner O2');

-- Unclaimed roster rows (user_id NULL — the exact inert state 0110 fixes).
INSERT INTO choir_members (id, instance_id, user_id, display_name, section, choir_role) VALUES
  (:'alice', :'inst',  NULL, 'Alice', 'soprano', 'member'),
  (:'bob',   :'inst',  NULL, 'Bob',   'bass',    'member'),
  (:'carol', :'inst2', NULL, 'Carol', 'alto',    'member');

-- ── Helpers ────────────────────────────────────────────────────────────────
-- Call claim_choir_member(code) AS a user; return the status string.
CREATE OR REPLACE FUNCTION pg_temp.claim_as(_who uuid, _code text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE r jsonb;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  r := public.claim_choir_member(_code);
  PERFORM set_config('role','postgres', true);
  RETURN r->>'status';
END $$;

-- Call mint_choir_claim_code(member) AS a user; return the code, or NULL if it RAISED.
CREATE OR REPLACE FUNCTION pg_temp.mint_as(_who uuid, _member uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE r jsonb;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  BEGIN
    r := public.mint_choir_claim_code(_member);
  EXCEPTION WHEN others THEN
    PERFORM set_config('role','postgres', true);
    RETURN NULL;
  END;
  PERFORM set_config('role','postgres', true);
  RETURN r->>'code';
END $$;

-- Count rows my_choir_membership returns for a user in an instance.
CREATE OR REPLACE FUNCTION pg_temp.my_count(_who uuid, _inst uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.my_choir_membership(_inst);
  PERFORM set_config('role','postgres', true);
  RETURN n;
END $$;

-- ── Assertions ───────────────────────────────────────────────────────────────
DO $$
DECLARE
  o     uuid := '00000000-0000-4000-a000-0000000a0110';
  u     uuid := '00000000-0000-4000-a000-0000000c0110';
  s     uuid := '00000000-0000-4000-a000-0000000d0110';
  inst  uuid := '00000000-0000-4000-b000-000000010110';
  inst2 uuid := '00000000-0000-4000-b000-000000020110';
  alice uuid := '00000000-0000-4000-c000-0000000a0110';
  bob   uuid := '00000000-0000-4000-c000-0000000b0110';
  alice_code text;
  bob_code   text;
  st         text;
  linked_uid uuid;
BEGIN
  -- 1. A stranger cannot mint (mint_as returns NULL when the function RAISES).
  IF pg_temp.mint_as(s, alice) IS NOT NULL THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: a non-owner/admin was able to mint a claim code';
  END IF;

  -- 2. The owner mints a real code for Alice.
  alice_code := pg_temp.mint_as(o, alice);
  IF alice_code IS NULL OR length(alice_code) <> 6 THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: owner mint did not return a 6-char code (got %)', alice_code;
  END IF;

  -- 3. A wrong code links nothing.
  st := pg_temp.claim_as(u, 'ZZZZZZ');
  IF st <> 'invalid' THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: a wrong code returned % (expected invalid)', st;
  END IF;
  SELECT user_id INTO linked_uid FROM choir_members WHERE id = alice;
  IF linked_uid IS NOT NULL THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: Alice was linked by a WRONG code';
  END IF;

  -- 4. The correct code links Alice to U and consumes the code.
  st := pg_temp.claim_as(u, alice_code);
  IF st <> 'linked' THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: the correct code returned % (expected linked)', st;
  END IF;
  SELECT user_id INTO linked_uid FROM choir_members WHERE id = alice;
  IF linked_uid <> u THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: Alice.user_id is % (expected the claimant)', linked_uid;
  END IF;
  IF (SELECT claim_code FROM choir_members WHERE id = alice) IS NOT NULL THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: the code was not consumed on claim';
  END IF;

  -- 5. The code is one-time: re-claiming the same code is now invalid.
  st := pg_temp.claim_as(u, alice_code);
  IF st <> 'invalid' THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: a consumed code re-claimed as % (expected invalid)', st;
  END IF;

  -- 6. Minting for an already-linked row RAISES (mint_as -> NULL).
  IF pg_temp.mint_as(o, alice) IS NOT NULL THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: minted a code for an already-linked roster row';
  END IF;

  -- 7. One account -> at most one roster row per instance. A fresh Bob code
  --    (same instance) must be refused because U is already linked to Alice.
  bob_code := pg_temp.mint_as(o, bob);
  st := pg_temp.claim_as(u, bob_code);
  IF st <> 'already-linked' THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: U claimed a SECOND row in the same instance (%), expected already-linked', st;
  END IF;

  -- 8. my_choir_membership: U sees exactly its own row in I, and NOTHING in I2.
  IF pg_temp.my_count(u, inst) <> 1 THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: my_choir_membership(I) returned % rows (expected 1)', pg_temp.my_count(u, inst);
  END IF;
  IF pg_temp.my_count(u, inst2) <> 0 THEN
    RAISE EXCEPTION 'CHOIR CLAIM SMOKE FAIL: my_choir_membership(I2) leaked % rows across the instance boundary (expected 0)', pg_temp.my_count(u, inst2);
  END IF;

  RAISE NOTICE 'CHOIR CLAIM SMOKE: PASS';
END $$;

ROLLBACK;
