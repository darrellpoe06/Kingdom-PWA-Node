-- =============================================================================
-- 0272 SMOKE — an application is corroborated, not credentialed
-- =============================================================================
-- One transaction, ROLLS BACK. PASS prints 'CORROBORATION SMOKE: PASS'.
--
-- MUST BE REFUSED:
--   deciding with the list untouched                     ✘
--   deciding with the list only PARTLY worked            ✘
--   editing a check after the fact (append-only)         ✘
--   deleting a check                                     ✘
--   an SSN-shaped string in a call note                  ✘
--
-- MUST BE ALLOWED, and each one is a person who would be shut out otherwise:
--   'could-not-reach' on every item, then a decision     ✔
--   'not-applicable' (no prior landlord — a first lease) ✔
--   two attempts on one item, both kept                  ✔
--   checked_by recorded without the caller sending it    ✔
--
-- AND THE CLOCK:
--   the application's own events land in door_events     ✔
-- =============================================================================

BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0272', 'authenticated','authenticated','owner272@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010272', 'corroboration-smoke-272', 'Corroboration Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010272', '00000000-0000-4000-a000-0000000a0272', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-000000010272', '00000000-0000-4000-b000-000000010272',
   '00000000-0000-4000-a000-0000000a0272', 'corroboration-door-272', 'Door 272', '272 Smoke St', 'multi-family', 'vacant')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0272';
  ins  uuid := '00000000-0000-4000-b000-000000010272';
  d    uuid := '00000000-0000-4000-c000-000000010272';
  app  uuid;
  who  uuid;
  n    int;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', o, 'role','authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  INSERT INTO rental_applications (instance_id, rental_id, applicant_name, applicant_phone, answers)
  VALUES (ins, d, 'A Hopeful Neighbour', '217-555-0172', '{"applicant.firstName":"Hope"}'::jsonb)
  RETURNING id INTO app;

  -- The application itself reaches the clock, which is the DR-0903 hole.
  SELECT count(*) INTO n FROM door_events
   WHERE subject = 'application' AND subject_id = app AND event = 'applied';
  IF n <> 1 THEN RAISE EXCEPTION 'applying did not reach door_events (got % rows)', n; END IF;

  -- 1. A DECISION WITH THE LIST UNTOUCHED IS REFUSED.
  BEGIN
    UPDATE rental_applications
       SET status = 'approved', decision_reason = 'References and income both checked out well.'
     WHERE id = app;
    RAISE EXCEPTION 'a decision was recorded with NO checks at all — the list is not holding';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%not holding%' THEN RAISE; END IF;
  END;

  -- 2. PARTLY WORKED IS STILL NOT WORKED.
  INSERT INTO application_checks (instance_id, application_id, item, outcome, heard)
  VALUES (ins, app, 'prior-landlord', 'confirmed', 'Reached Ms Alvarez at Lincoln St — paid on time two years, would rent to her again.');

  BEGIN
    UPDATE rental_applications
       SET status = 'approved', decision_reason = 'References and income both checked out well.'
     WHERE id = app;
    RAISE EXCEPTION 'a decision was recorded with ONE of six checks — the list is not holding';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%not holding%' THEN RAISE; END IF;
  END;

  -- checked_by is recorded although the insert above never sent it (0271's
  -- lesson, applied at birth this time).
  SELECT checked_by INTO who FROM application_checks WHERE application_id = app AND item = 'prior-landlord';
  IF who IS NULL OR who <> o THEN
    RAISE EXCEPTION 'checked_by was not recorded from auth.uid() — who made the call would be blank';
  END IF;

  -- The attempt reached the clock too.
  SELECT count(*) INTO n FROM door_events
   WHERE subject = 'application' AND subject_id = app AND event = 'checked';
  IF n <> 1 THEN RAISE EXCEPTION 'a corroboration attempt did not reach door_events (got % rows)', n; END IF;

  -- 3. A SECOND ATTEMPT ON ONE ITEM IS A NEW ROW, NOT AN EDIT. "Called
  --    Tuesday, no answer" then "called Thursday, reached her" IS the record.
  INSERT INTO application_checks (instance_id, application_id, item, outcome, heard)
  VALUES (ins, app, 'reference', 'could-not-reach', 'Called the number for her sister Tuesday evening, no answer, left a message.');
  INSERT INTO application_checks (instance_id, application_id, item, outcome, heard)
  VALUES (ins, app, 'reference', 'confirmed', 'She called back Thursday — known her fifteen years, vouches for her.');

  SELECT count(*) INTO n FROM application_checks WHERE application_id = app AND item = 'reference';
  IF n <> 2 THEN RAISE EXCEPTION 'both attempts on one item were not kept (got % rows)', n; END IF;

  -- 4. APPEND-ONLY. Neither correctable nor removable, by anyone.
  BEGIN
    UPDATE application_checks SET outcome = 'confirmed'
     WHERE application_id = app AND item = 'reference' AND outcome = 'could-not-reach';
    RAISE EXCEPTION 'a check was EDITED after the fact — append-only is not holding';
  EXCEPTION
    WHEN raise_exception THEN IF SQLERRM LIKE '%not holding%' THEN RAISE; END IF;
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    DELETE FROM application_checks WHERE application_id = app AND item = 'reference';
    RAISE EXCEPTION 'a check was DELETED — append-only is not holding';
  EXCEPTION
    WHEN raise_exception THEN IF SQLERRM LIKE '%not holding%' THEN RAISE; END IF;
    WHEN insufficient_privilege THEN NULL;
  END;

  -- 5. THE ONE NUMBER WE PROMISED NEVER TO HOLD DOES NOT GET IN THROUGH A NOTE.
  BEGIN
    INSERT INTO application_checks (instance_id, application_id, item, outcome, heard)
    VALUES (ins, app, 'employer', 'confirmed', 'HR confirmed, gave me her SSN 123-45-6789 over the phone.');
    RAISE EXCEPTION 'an SSN-shaped string was ACCEPTED in a call note';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- 6. NOBODY IS EXCLUDED BY ARITHMETIC. The rest of the list is worked with
  --    the honest outcomes of a first-time renter: no prior landlord to call,
  --    and an employer nobody picked up at. These are ANSWERS.
  INSERT INTO application_checks (instance_id, application_id, item, outcome, heard) VALUES
    (ins, app, 'employer',      'could-not-reach',  'Rang the supervisor twice over two days, went to voicemail both times.'),
    (ins, app, 'income-shown',  'confirmed',        'Saw two pay stubs from September, consistent with what she wrote.'),
    (ins, app, 'address-shown', 'confirmed',        'Ameren bill in her name at the Lincoln St address.'),
    (ins, app, 'phone-answers', 'confirmed',        'Called the number she gave; she answered.');

  -- 'not-applicable' is a first-class outcome, and the first lease is why.
  INSERT INTO application_checks (instance_id, application_id, item, outcome, heard)
  VALUES (ins, app, 'prior-landlord', 'not-applicable', 'This is her first lease — she lived with family before this.');

  -- 7. NOW THE DECISION LANDS, and it lands on a worked list.
  UPDATE rental_applications
     SET status = 'approved', decision_reason = 'Income shown and consistent; address and personal reference both confirmed.'
   WHERE id = app;

  SELECT count(*) INTO n FROM door_events
   WHERE subject = 'application' AND subject_id = app AND event = 'approved';
  IF n <> 1 THEN RAISE EXCEPTION 'the decision did not reach door_events (got % rows)', n; END IF;

  -- 8. 0152 STILL SPEAKS FOR ITSELF. A decision with no reason must fail on
  --    rental_applications_decision_has_reason — a check_violation, NOT this
  --    migration's trigger. If 0272 shadowed it, that older gate would have
  --    been silently retired and its own smoke test would be proving nothing.
  INSERT INTO rental_applications (instance_id, rental_id, applicant_name, answers)
  VALUES (ins, d, 'Second Applicant', '{}'::jsonb) RETURNING id INTO app;
  BEGIN
    UPDATE rental_applications SET status = 'declined' WHERE id = app;
    RAISE EXCEPTION 'a decision with no reason was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE NOTICE 'CORROBORATION SMOKE: PASS';
END $$;

ROLLBACK;
