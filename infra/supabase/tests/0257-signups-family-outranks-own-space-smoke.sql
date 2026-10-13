-- =============================================================================
-- 0257 SIGNUPS CATEGORY SMOKE — the membership that names an account is chosen
-- by what the space is, not by which was joined first (DR-0836). Runs after
-- the chain, in a transaction, and ROLLS BACK. PASS prints
-- 'SIGNUPS CATEGORY SMOKE: PASS'; any breach RAISES.
--
-- Assertions
--   a self-serve account made family LATER reads 'family', spaces = 2        ✔
--   a self-serve account in its own space alone reads 'self-serve'           ✔
--   a self-serve account added to a church reads 'church'                    ✔
--   a self-serve account added to a business reads 'other'                   ✔
--   an account with no space at all reads 'unprovisioned'                    ✔
--   a caller outside poe-family is refused                        -> REFUSED ✘
--
-- The governor circle is the REAL poe-family space when it exists (hosted DB);
-- the smoke joins its own governor to it inside the transaction and reads only
-- its own rows out of the answer, never a total.
-- =============================================================================
BEGIN;

\set gov    'a0000000-0000-4000-a000-000000000257'
\set chris  'b0000000-0000-4000-a000-000000000257'
\set alone  'c0000000-0000-4000-a000-000000000257'
\set church 'd0000000-0000-4000-a000-000000000257'
\set biz    'e0000000-0000-4000-a000-000000000257'
\set nobody 'f0000000-0000-4000-a000-000000000257'
\set own_c  '10000000-0000-4000-b000-000000000257'
\set own_a  '20000000-0000-4000-b000-000000000257'
\set own_h  '30000000-0000-4000-b000-000000000257'
\set own_b  '40000000-0000-4000-b000-000000000257'
\set chu    '50000000-0000-4000-b000-000000000257'
\set bz     '60000000-0000-4000-b000-000000000257'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'gov',    'authenticated','authenticated','gov0257@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'chris',  'authenticated','authenticated','14475550257@phone.poetech.us','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'alone',  'authenticated','authenticated','alone0257@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'church', 'authenticated','authenticated','church0257@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'biz',    'authenticated','authenticated','biz0257@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'nobody', 'authenticated','authenticated','nobody0257@test.local','', now(), now());

-- The family: the real poe-family when the database has one, else this smoke's own.
INSERT INTO instances (id, slug, display_name, instance_type)
VALUES ('70000000-0000-4000-b000-000000000257', 'poe-family', 'Poe Family (smoke)', 'family')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'own_c', 'u-chris-0257',  'Chris''s own space',  'family'),
  (:'own_a', 'u-alone-0257',  'Alone''s own space',  'family'),
  (:'own_h', 'u-church-0257', 'Church''s own space', 'family'),
  (:'own_b', 'u-biz-0257',    'Biz''s own space',    'family'),
  (:'chu',   'church-0257',   'A Church 0257',       'church'),
  (:'bz',    'business-0257', 'A Business 0257',     'business');

-- Everyone's OWN space first (joined a month ago), the granted space later (today).
INSERT INTO instance_members (instance_id, user_id, role, display_name, joined_at) VALUES
  ((SELECT id FROM instances WHERE slug = 'poe-family'), :'gov',   'member', 'The Governor', now() - interval '60 days'),
  (:'own_c', :'chris',  'owner',  'Chris, own space',  now() - interval '30 days'),
  (:'own_a', :'alone',  'owner',  'Alone, own space',  now() - interval '30 days'),
  (:'own_h', :'church', 'owner',  'Church, own space', now() - interval '30 days'),
  (:'own_b', :'biz',    'owner',  'Biz, own space',    now() - interval '30 days'),
  ((SELECT id FROM instances WHERE slug = 'poe-family'), :'chris', 'member', 'Christyn (smoke)', now()),
  (:'chu',   :'church', 'member', 'A congregant',      now()),
  (:'bz',    :'biz',    'member', 'A worker',          now());

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000257","role":"authenticated"}';

DO $$
DECLARE
  r jsonb;
  row_chris jsonb; row_alone jsonb; row_church jsonb; row_biz jsonb; row_nobody jsonb;
BEGIN
  r := public.admin_signup_metrics();
  SELECT s INTO row_chris  FROM jsonb_array_elements(r->'signups') s WHERE s->>'user_id' = 'b0000000-0000-4000-a000-000000000257';
  SELECT s INTO row_alone  FROM jsonb_array_elements(r->'signups') s WHERE s->>'user_id' = 'c0000000-0000-4000-a000-000000000257';
  SELECT s INTO row_church FROM jsonb_array_elements(r->'signups') s WHERE s->>'user_id' = 'd0000000-0000-4000-a000-000000000257';
  SELECT s INTO row_biz    FROM jsonb_array_elements(r->'signups') s WHERE s->>'user_id' = 'e0000000-0000-4000-a000-000000000257';
  SELECT s INTO row_nobody FROM jsonb_array_elements(r->'signups') s WHERE s->>'user_id' = 'f0000000-0000-4000-a000-000000000257';
  IF row_chris IS NULL OR row_alone IS NULL OR row_church IS NULL OR row_biz IS NULL OR row_nobody IS NULL THEN
    RAISE EXCEPTION 'SMOKE FAIL: a test account is missing from the signups answer';
  END IF;
  IF row_chris->>'category' <> 'family' THEN RAISE EXCEPTION 'SMOKE FAIL: made family later still reads % (0079 picked the earliest space)', row_chris->>'category'; END IF;
  IF (row_chris->>'spaces')::int <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the family row should count 2 spaces, read %', row_chris->>'spaces'; END IF;
  IF row_chris->>'display_name' <> 'Christyn (smoke)' THEN RAISE EXCEPTION 'SMOKE FAIL: the family membership should name the row, read %', row_chris->>'display_name'; END IF;
  IF row_alone->>'category' <> 'self-serve' THEN RAISE EXCEPTION 'SMOKE FAIL: own space alone should read self-serve, read %', row_alone->>'category'; END IF;
  IF row_church->>'category' <> 'church' THEN RAISE EXCEPTION 'SMOKE FAIL: a church outranks the own space, read %', row_church->>'category'; END IF;
  IF row_biz->>'category' <> 'other' THEN RAISE EXCEPTION 'SMOKE FAIL: a business outranks the own space, read %', row_biz->>'category'; END IF;
  IF row_nobody->>'category' <> 'unprovisioned' THEN RAISE EXCEPTION 'SMOKE FAIL: no space should read unprovisioned, read %', row_nobody->>'category'; END IF;
  IF (r->'summary'->>'family_members')::int < 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the family tile does not count the new member'; END IF;
END $$;

-- ── a caller outside poe-family is refused ──────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000257","role":"authenticated"}';
DO $$ BEGIN
  PERFORM public.admin_signup_metrics();
  RAISE EXCEPTION 'SMOKE FAIL: a non-governor read the signups list';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;

RESET ROLE;
SELECT 'SIGNUPS CATEGORY SMOKE: PASS' AS result;
ROLLBACK;
