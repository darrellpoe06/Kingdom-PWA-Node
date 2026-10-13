-- =============================================================================
-- 0213 ROSTER DECLARED-CONTACT SMOKE — the roster shows what the PERSON wrote,
-- and never what somebody else wrote. Run on the LIVE Supabase (as postgres)
-- AFTER 0213. Runs in a transaction and ROLLS BACK.
-- PASS prints 'ROSTER DECLARED CONTACT SMOKE: PASS'; any breach RAISES.
--
-- The failure this file exists to catch is not a missing column. It is a
-- roster row that prints a phone number beside a person's name when that
-- number is not theirs. household_records has NO user_id — it is one row for
-- the whole household — so the "easy" join would have hung the household's
-- number on every member of the instance. That is a lie in a column, and it is
-- exactly the class 0210 already refused when it stopped printing a phone-door
-- address as an email.
--
-- Assertions
--   what a member wrote in their OWN record comes back                     ✔
--   ... as declared_*, leaving the account columns alone                   ✔
--   a colleague's onboarding packet is their own answer too                ✔
--   the HOUSEHOLD's phone never lands on a member's row       -> NULL      ✘
--   nothing else from the record comes back (only the 2 contact cells)     ✘
--   a member with no record is still on the roster, declared_* NULL        ✔
--   a NON-office member still cannot read the roster          -> 0 rows    ✘
-- =============================================================================
BEGIN;

\set own   'a0000000-0000-4000-a000-000000000213'
\set tlcc  'b0000000-0000-4000-a000-000000000213'
\set bare  'c0000000-0000-4000-a000-000000000213'
\set staff 'd0000000-0000-4000-a000-000000000213'
\set inst  '10000000-0000-4000-b000-000000000213'
\set inv   '20000000-0000-4000-b000-000000000213'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at, last_sign_in_at, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'own',   'authenticated','authenticated','own0213@test.local','',   now(), now(), now(), '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', :'tlcc',  'authenticated','authenticated','tlcc0213@test.local','',  now(), now(), now(), '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', :'bare',  'authenticated','authenticated','bare0213@test.local','',  now(), now(), NULL,  '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', :'staff', 'authenticated','authenticated','staff0213@test.local','', now(), now(), now(), '{}'::jsonb);

INSERT INTO instances (id, slug, display_name, instance_type)
VALUES (:'inst', 'church-0213', 'Test Church 0213', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst', :'own',   'member', 'Wrote It Down'),
  (:'inst', :'tlcc',  'member', 'Filed A Packet'),
  (:'inst', :'bare',  'member', 'Told Us Nothing'),
  (:'inst', :'staff', 'admin',  'The Office');

-- THEIR OWN ANSWER. The prayer request rides along on purpose: it is the cell
-- that must NOT come back, and a wall is only proven with something real
-- behind it.
INSERT INTO church_member_records (instance_id, user_id, record) VALUES
  (:'inst', :'own', '{"fullName":"Wrote It Down","contactEmail":"own0213@reachme.test","contactPhone":"(563) 555-0213","prayerRequest":"UNIQUE-0213-PRAYER"}'::jsonb);

-- THE HOUSEHOLD'S NUMBER. One row for the whole instance, no user_id. It
-- belongs to nobody on this roster and must appear on nobody's row.
INSERT INTO household_records (instance_id, record) VALUES
  (:'inst', '{"householdName":"The Test House","contactPhone":"(563) 555-9999","contactEmail":"household0213@reachme.test"}'::jsonb);

-- A COLLEAGUE'S PACKET — per person, so it is their own answer.
INSERT INTO tlc_onboarding_invites (id, instance_id, email, invited_by)
VALUES (:'inv', :'inst', 'tlcc0213@test.local', :'staff');
INSERT INTO tlc_onboarding_packets (instance_id, invite_id, applicant_user_id, packet)
VALUES (:'inst', :'inv', :'tlcc', '{"firstName":"Filed","lastName":"A Packet","phone":"(563) 555-0214","preferredEmail":"tlcc0213@reachme.test"}'::jsonb);

SET LOCAL ROLE authenticated;

-- ── THE OFFICE READS THE ROSTER ────────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"d0000000-0000-4000-a000-000000000213","role":"authenticated"}';
DO $$
DECLARE r record; n int;
BEGIN
  SELECT count(*) INTO n FROM public.list_instance_members('10000000-0000-4000-b000-000000000213'::uuid);
  IF n <> 4 THEN RAISE EXCEPTION 'the office should see all 4 members, saw %', n; END IF;

  -- 1. WHAT THEY WROTE COMES BACK.
  SELECT * INTO r FROM public.list_instance_members('10000000-0000-4000-b000-000000000213'::uuid)
   WHERE user_id = 'a0000000-0000-4000-a000-000000000213'::uuid;
  IF r.declared_phone <> '(563) 555-0213' THEN
    RAISE EXCEPTION 'their own phone did not come back: %', coalesce(r.declared_phone, '<null>');
  END IF;
  IF r.declared_email <> 'own0213@reachme.test' THEN
    RAISE EXCEPTION 'their own email did not come back: %', coalesce(r.declared_email, '<null>');
  END IF;
  -- ... and the ACCOUNT columns are untouched by it. The sign-in address is
  -- still the sign-in address; a declared email does not overwrite it, because
  -- they are different facts and the client decides which to show.
  IF r.email <> 'own0213@test.local' THEN
    RAISE EXCEPTION 'the sign-in email was overwritten by the declared one: %', coalesce(r.email, '<null>');
  END IF;
  IF r.phone IS NOT NULL THEN
    RAISE EXCEPTION 'an account phone was invented from the declared one: %', r.phone;
  END IF;

  -- 2. NOTHING ELSE FROM THE RECORD. 27 other answers live in that row; two
  -- contact cells are what an owner/admin asked for and all they get.
  IF strpos(coalesce(r::text, ''), 'UNIQUE-0213-PRAYER') > 0 THEN
    RAISE EXCEPTION 'a prayer request leaked onto the roster row';
  END IF;

  -- 3. THE COLLEAGUE'S PACKET is their own answer as much as a record is.
  SELECT * INTO r FROM public.list_instance_members('10000000-0000-4000-b000-000000000213'::uuid)
   WHERE user_id = 'b0000000-0000-4000-a000-000000000213'::uuid;
  IF r.declared_phone <> '(563) 555-0214' OR r.declared_email <> 'tlcc0213@reachme.test' THEN
    RAISE EXCEPTION 'the packet answers did not come back: % / %',
      coalesce(r.declared_phone,'<null>'), coalesce(r.declared_email,'<null>');
  END IF;

  -- 4. THE WALL. A member who told us nothing is still on the roster, and the
  -- HOUSEHOLD's number is on nobody. If the join had used household_records,
  -- this row would be carrying (563) 555-9999.
  SELECT * INTO r FROM public.list_instance_members('10000000-0000-4000-b000-000000000213'::uuid)
   WHERE user_id = 'c0000000-0000-4000-a000-000000000213'::uuid;
  IF r.user_id IS NULL THEN
    RAISE EXCEPTION 'a member with no record was dropped from the roster — contact became a constraint';
  END IF;
  IF r.declared_phone IS NOT NULL OR r.declared_email IS NOT NULL THEN
    RAISE EXCEPTION 'contact was invented for somebody who gave none: % / %',
      coalesce(r.declared_phone,'<null>'), coalesce(r.declared_email,'<null>');
  END IF;

  SELECT count(*) INTO n FROM public.list_instance_members('10000000-0000-4000-b000-000000000213'::uuid)
   WHERE declared_phone = '(563) 555-9999' OR declared_email = 'household0213@reachme.test';
  IF n <> 0 THEN
    RAISE EXCEPTION 'the household''s own contact was hung on % member row(s)', n;
  END IF;
END $$;

-- ── AND THE AUDIENCE IS UNCHANGED ──────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000213","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.list_instance_members('10000000-0000-4000-b000-000000000213'::uuid);
  IF n <> 0 THEN
    RAISE EXCEPTION 'an ordinary member read the roster (% rows) — 0213 widened the audience', n;
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE 'ROSTER DECLARED CONTACT SMOKE: PASS'; END $$;

ROLLBACK;
