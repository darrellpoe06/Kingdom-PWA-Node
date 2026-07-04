-- =============================================================================
-- 0074 ISOLATION SMOKE TEST — the enablement gate for TV Time family sharing
-- =============================================================================
-- Run this on the LIVE NAS Supabase (as the postgres superuser) AFTER applying
-- 0074-tv-circle-sharing.sql and BEFORE the Family/Circle views are turned on in
-- the app. It proves the row-level security actually isolates people — the exact
-- verification 0072 deferred and DR-0076 requires ("no unverified multi-tenant
-- isolation marked done"). Everything runs in a transaction and ROLLS BACK, so it
-- leaves no data behind. A PASS prints 'ISOLATION SMOKE: PASS'; any leak RAISES.
--
-- The scenario (mirrors the real household + a separate family + a friend circle):
--   Household H: dad (parent, spouse of mom), mom (parent, spouse of dad), kid (child)
--   Friends  F : dad + pal
--   Household B: stranger (a DIFFERENT family — must never read H or F)
--   dad shares: an 'us' show, a 'family' show, a 'circle' show (in F)
--   kid shares: a 'family' show (in H)
--
-- The assertions (what MUST hold):
--   kid   reads dad's 'family'  ✔   kid   reads dad's 'us'      ✘ (kids protected)
--   mom   reads dad's 'us'      ✔   dad   reads kid's shares    ✔ (parent oversight)
--   pal   reads dad's 'circle'  ✔   pal   reads dad's 'family'  ✘ (pal not in H)
--   stranger reads ANY of H/F   ✘ (cross-circle isolation)
-- =============================================================================
BEGIN;

-- Fixed test UUIDs (namespaced so they can't collide with real users).
\set dad      '00000000-0000-4000-a000-0000000d0074'
\set mom      '00000000-0000-4000-a000-0000000e0074'
\set kid      '00000000-0000-4000-a000-0000000c0074'
\set pal      '00000000-0000-4000-a000-0000000f0074'
\set stranger '00000000-0000-4000-a000-0000000a0074'

-- Minimal auth.users rows so the FKs resolve (superuser bypasses RLS for setup).
INSERT INTO auth.users (id, email, aud, role)
VALUES
  (:'dad','dad074@test.local','authenticated','authenticated'),
  (:'mom','mom074@test.local','authenticated','authenticated'),
  (:'kid','kid074@test.local','authenticated','authenticated'),
  (:'pal','pal074@test.local','authenticated','authenticated'),
  (:'stranger','stranger074@test.local','authenticated','authenticated')
ON CONFLICT (id) DO NOTHING;

-- Circles.
INSERT INTO tv_circle (id, name, kind, invite_code, created_by) VALUES
  ('00000000-0000-4000-b000-000000000074','The Poe Home','household','H-CODE-074', :'dad'),
  ('00000000-0000-4000-b000-000000000075','The Crew','friends','F-CODE-074', :'dad'),
  ('00000000-0000-4000-b000-000000000076','Other Family','household','B-CODE-074', :'stranger');

-- Membership (spouse_of pairs dad<->mom).
INSERT INTO tv_circle_member (circle_id, member, role, spouse_of, display) VALUES
  ('00000000-0000-4000-b000-000000000074', :'dad','parent', :'mom','Dad'),
  ('00000000-0000-4000-b000-000000000074', :'mom','parent', :'dad','Mom'),
  ('00000000-0000-4000-b000-000000000074', :'kid','child', NULL,'Kid'),
  ('00000000-0000-4000-b000-000000000075', :'dad','adult', NULL,'Dad'),
  ('00000000-0000-4000-b000-000000000075', :'pal','adult', NULL,'Pal'),
  ('00000000-0000-4000-b000-000000000076', :'stranger','parent', NULL,'Stranger');

-- Shares. dad: us + family in H, circle in F. kid: family in H.
INSERT INTO tv_share (owner, circle_id, audience, doc) VALUES
  (:'dad','00000000-0000-4000-b000-000000000074','us',     '{"shows":{"mature":{}}}'),
  (:'dad','00000000-0000-4000-b000-000000000074','family', '{"shows":{"bluey":{}}}'),
  (:'dad','00000000-0000-4000-b000-000000000075','circle', '{"shows":{"snowfall":{}}}'),
  (:'kid','00000000-0000-4000-b000-000000000074','family', '{"shows":{"paw":{}}}');

-- Helper: run a SELECT as a given user and assert the visible tv_share count.
CREATE OR REPLACE FUNCTION pg_temp.assert_reads(_who uuid, _label text, _expected int)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM tv_share;
  PERFORM set_config('role','postgres', true);   -- back to superuser for the next setup
  IF n <> _expected THEN
    RAISE EXCEPTION 'ISOLATION SMOKE FAIL: % expected % visible tv_share rows, saw %', _label, _expected, n;
  END IF;
END $$;

-- Helper: assert a specific (owner,audience) row is / is not visible to a user.
CREATE OR REPLACE FUNCTION pg_temp.assert_can(_who uuid, _owner uuid, _aud text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE seen boolean;
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role','authenticated')::text, true);
  SELECT EXISTS (SELECT 1 FROM tv_share s WHERE s.owner = _owner AND s.audience = _aud) INTO seen;
  PERFORM set_config('role','postgres', true);
  IF seen <> _should THEN
    RAISE EXCEPTION 'ISOLATION SMOKE FAIL: % (expected visible=%, got %)', _label, _should, seen;
  END IF;
END $$;

DO $$
DECLARE
  dad uuid := '00000000-0000-4000-a000-0000000d0074';
  mom uuid := '00000000-0000-4000-a000-0000000e0074';
  kid uuid := '00000000-0000-4000-a000-0000000c0074';
  pal uuid := '00000000-0000-4000-a000-0000000f0074';
  stranger uuid := '00000000-0000-4000-a000-0000000a0074';
BEGIN
  -- KIDS PROTECTED: kid sees dad's family, NOT dad's us.
  PERFORM pg_temp.assert_can(kid, dad, 'family', 'kid reads dad family', true);
  PERFORM pg_temp.assert_can(kid, dad, 'us',     'kid must NOT read dad us', false);

  -- SPOUSE: mom sees dad's us.
  PERFORM pg_temp.assert_can(mom, dad, 'us',     'mom reads dad us (spouse)', true);

  -- PARENT OVERSIGHT: dad sees kid's family share.
  PERFORM pg_temp.assert_can(dad, kid, 'family', 'dad reads kid (oversight)', true);

  -- FRIEND SCOPE: pal sees dad's circle (in F), NOT dad's family (in H, pal not a member).
  PERFORM pg_temp.assert_can(pal, dad, 'circle', 'pal reads dad circle', true);
  PERFORM pg_temp.assert_can(pal, dad, 'family', 'pal must NOT read dad household family', false);

  -- CROSS-CIRCLE ISOLATION: the stranger (other family) reads NOTHING of H/F.
  PERFORM pg_temp.assert_reads(stranger, 'stranger sees no H/F shares', 0);

  -- Sanity on totals: kid sees only family-audience rows in H (dad family + kid own = 2).
  PERFORM pg_temp.assert_reads(kid, 'kid total visible', 2);

  RAISE NOTICE 'ISOLATION SMOKE: PASS';
END $$;

ROLLBACK;
