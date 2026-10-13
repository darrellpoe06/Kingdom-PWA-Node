-- =============================================================================
-- 0210 SIGNATURE DOOR + ROSTER SMOKE — the covenant is signable, and the roster
-- says when. Run on the LIVE Supabase (as postgres) AFTER 0210. Runs in a
-- transaction and ROLLS BACK.
-- PASS prints 'SIGNATURE DOOR AND ROSTER SMOKE: PASS'; any breach RAISES.
--
-- 0209 shipped the covenant as REQUIRED and shipped no way to sign it. That is
-- the failure this file exists to catch: a promise the product asks a person to
-- make and gives them no door to make it through.
--
-- Assertions
--   the covenant CAN be signed — the acknowledge door exists                ✔
--   ... and an 'acknowledgments' cell still cannot be typed in  -> REFUSED   ✘
--   re-reading the same version does not re-date the signature               ✔
--   ... a NEW version does                                                   ✔
--   an unsigned signature or a missing attestation is refused   -> REFUSED   ✘
--   signing a document that does not exist is refused           -> REFUSED   ✘
--   the roster answers WHEN — joined_at comes back                        ✔
--   ... and a phone-door account reads as a PHONE, not as an email         ✔
--   ... and its email column is NULL rather than a synthetic address       ✔
--   an ordinary account keeps its real email, and has no phone invented    ✔
--   a NON-office member still cannot read the roster        -> 0 rows      ✘
--   a missing email or phone is never a constraint: the row is still there ✔
-- =============================================================================
BEGIN;

\set mem   'a0000000-0000-4000-a000-000000000210'
\set mem2  'b0000000-0000-4000-a000-000000000210'
\set staff 'c0000000-0000-4000-a000-000000000210'
\set phon  'd0000000-0000-4000-a000-000000000210'
\set inst  '10000000-0000-4000-b000-000000000210'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at, last_sign_in_at, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'mem',   'authenticated','authenticated','mem0210@test.local','', now(), now(), now(), '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', :'mem2',  'authenticated','authenticated','mem2-0210@test.local','', now(), now(), NULL, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', :'staff', 'authenticated','authenticated','staff0210@test.local','', now(), now(), now(), '{}'::jsonb),
  -- The phone door: the EMAIL column is carrying a PHONE NUMBER.
  ('00000000-0000-0000-0000-000000000000', :'phon',  'authenticated','authenticated','15550000210@phone.poetech.us','', now(), now(), now(), '{"phone":"15550000210"}'::jsonb);

INSERT INTO instances (id, slug, display_name, instance_type)
VALUES (:'inst', 'church-0210', 'Test Church 0210', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst', :'mem',   'member', 'A Member'),
  (:'inst', :'mem2',  'member', 'Never Signed In'),
  (:'inst', :'staff', 'admin',  'The Office'),
  (:'inst', :'phon',  'member', 'Phone Door Person');

SET LOCAL ROLE authenticated;

SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000210","role":"authenticated"}';
-- A record to sign against. (0209's read starts one by itself; this makes the
-- fixture explicit so the assertions below do not depend on that side effect.)
DO $$ BEGIN PERFORM public.church_member_record_patch(jsonb_build_object('fullName','Sister Ruth')); END $$;

-- ── THE COVENANT IS ACTUALLY SIGNABLE ──────────────────────────────────────
-- The intake REQUIRES the covenant, and the patch guard refuses an
-- 'acknowledgments' cell. So if the acknowledge door did not exist, the
-- required agreement would be unsignable and the whole intake unfinishable.
-- That is the failure this block exists to catch.
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000210","role":"authenticated"}';
DO $$
DECLARE v jsonb; a jsonb; first_stamp text;
BEGIN
  v := public.church_member_record_acknowledge(
         'churchCovenant', '  Sister Ruth  ', 'v1',
         'I have read what the church holds about me.', NULL, NULL);
  a := v->'record'->'acknowledgments'->'churchCovenant';
  IF coalesce((a->>'agreed')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'the covenant did not record as agreed: %', a;
  END IF;
  IF a->>'signature' <> 'Sister Ruth' THEN
    RAISE EXCEPTION 'the signature was not trimmed and kept: %', a->>'signature';
  END IF;
  IF coalesce(a->>'signedAtServer','') = '' THEN
    RAISE EXCEPTION 'the server did not stamp the signature';
  END IF;
  first_stamp := a->>'signedAtServer';

  -- Reading and re-signing the SAME version keeps the original date (0199).
  v := public.church_member_record_acknowledge(
         'churchCovenant', 'Sister Ruth', 'v1',
         'I have read what the church holds about me.', NULL, NULL);
  a := v->'record'->'acknowledgments'->'churchCovenant';
  IF a->>'signedAtServer' <> first_stamp THEN
    RAISE EXCEPTION 're-reading an unchanged document re-dated the signature';
  END IF;

  -- A NEW version is a new signature, and must carry a new date.
  v := public.church_member_record_acknowledge(
         'churchCovenant', 'Sister Ruth', 'v2',
         'I have read what the church holds about me.', NULL, NULL);
  a := v->'record'->'acknowledgments'->'churchCovenant';
  IF a->>'signedAtServer' = first_stamp THEN
    RAISE EXCEPTION 'a new version reused the old signature date';
  END IF;
  IF a->>'docVersion' <> 'v2' THEN RAISE EXCEPTION 'the version was not pinned'; END IF;

  -- The record itself survived: signing is not a replace.
  IF v->'record'->>'fullName' <> 'Sister Ruth' THEN
    RAISE EXCEPTION 'signing overwrote the record';
  END IF;
END $$;

-- An empty signature, a missing attestation, and an unknown document are all
-- refused — the three ways a signature could be recorded that nobody made.
DO $$
BEGIN
  BEGIN
    PERFORM public.church_member_record_acknowledge('churchCovenant', '   ', 'v2', 'checked', NULL, NULL);
    RAISE EXCEPTION 'BREACH: an empty signature was accepted';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
  BEGIN
    PERFORM public.church_member_record_acknowledge('churchCovenant', 'Sister Ruth', 'v2', '', NULL, NULL);
    RAISE EXCEPTION 'BREACH: a signature with no attestation was accepted';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
  BEGIN
    PERFORM public.church_member_record_acknowledge('someOtherDocument', 'Sister Ruth', 'v2', 'checked', NULL, NULL);
    RAISE EXCEPTION 'BREACH: a document that does not exist was signed';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
  -- And the cell door is still shut: a signature is made on the document.
  BEGIN
    PERFORM public.church_member_record_patch(
      jsonb_build_object('acknowledgments', jsonb_build_object('churchCovenant', jsonb_build_object('agreed', true))));
    RAISE EXCEPTION 'BREACH: an acknowledgment was typed in as a cell';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
END $$;

-- The signature is the person's own: another member cannot sign for them.
SET LOCAL "request.jwt.claims" TO '{"sub":"b0000000-0000-4000-a000-000000000210","role":"authenticated"}';
DO $$
DECLARE v jsonb;
BEGIN
  v := public.church_member_record_acknowledge('churchCovenant', 'Another Member', 'v2', 'checked', NULL, NULL);
  -- It signs THEIR OWN record, never the other person's — so the first
  -- member's row must still read their own name.
  IF v->'record'->>'fullName' IS NOT NULL AND v->'record'->>'fullName' = 'Sister Ruth' THEN
    RAISE EXCEPTION 'BREACH: one member signed into another member''s record';
  END IF;
END $$;


-- ── THE ROSTER SAYS WHO *AND WHEN* ─────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000210","role":"authenticated"}';
DO $$
DECLARE r record; n int; seen_phone boolean := false; seen_plain boolean := false;
BEGIN
  SELECT count(*)::int INTO n
    FROM public.list_instance_members('10000000-0000-4000-b000-000000000210');
  IF n <> 4 THEN RAISE EXCEPTION 'the office read % rows, expected 4', n; END IF;

  FOR r IN SELECT * FROM public.list_instance_members('10000000-0000-4000-b000-000000000210') LOOP
    IF r.joined_at IS NULL THEN
      RAISE EXCEPTION 'FAIL: the roster still does not say WHEN for %', r.display_name;
    END IF;
    IF r.created_at IS NULL THEN
      RAISE EXCEPTION 'FAIL: the account creation date is missing for %', r.display_name;
    END IF;

    IF r.display_name = 'Phone Door Person' THEN
      seen_phone := true;
      -- The whole point: the digits come back as a PHONE...
      IF coalesce(r.phone, '') <> '15550000210' THEN
        RAISE EXCEPTION 'FAIL: the phone door did not yield a phone, got %', r.phone;
      END IF;
      -- ...and the email column does NOT print a synthetic address as a mailbox.
      IF r.email IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL: a phone-door address was returned as an email: %', r.email;
      END IF;
      IF r.email_is_phone_door IS NOT TRUE THEN
        RAISE EXCEPTION 'FAIL: the phone-door flag is not set';
      END IF;
    END IF;

    IF r.display_name = 'A Member' THEN
      seen_plain := true;
      IF r.email <> 'mem0210@test.local' THEN
        RAISE EXCEPTION 'FAIL: an ordinary account lost its real email, got %', r.email;
      END IF;
      -- Nothing is invented. No phone means no phone.
      IF r.phone IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL: a phone was invented for an account that has none: %', r.phone;
      END IF;
      IF r.email_is_phone_door IS NOT FALSE THEN
        RAISE EXCEPTION 'FAIL: an ordinary address was flagged as a phone door';
      END IF;
    END IF;

    -- NOT A CONSTRAINT: the person who has never signed in and has no phone is
    -- still on the roster, in full, with no error attached to them.
    IF r.display_name = 'Never Signed In' AND r.last_sign_in_at IS NOT NULL THEN
      RAISE EXCEPTION 'FAIL: someone who never signed in has a last-seen date';
    END IF;
  END LOOP;

  IF NOT seen_phone THEN RAISE EXCEPTION 'FAIL: the phone-door member is missing from the roster'; END IF;
  IF NOT seen_plain THEN RAISE EXCEPTION 'FAIL: the ordinary member is missing from the roster'; END IF;
END $$;

-- A member is still not an office. The read gates inside the function body.
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000210","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*)::int INTO n
    FROM public.list_instance_members('10000000-0000-4000-b000-000000000210');
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: a plain member read the roster (% rows)', n; END IF;
END $$;

SET LOCAL ROLE postgres;
DO $$ BEGIN RAISE NOTICE 'SIGNATURE DOOR AND ROSTER SMOKE: PASS'; END $$;

ROLLBACK;
