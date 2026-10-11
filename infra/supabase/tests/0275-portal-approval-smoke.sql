-- =============================================================================
-- 0275 SMOKE — a tenant waits for the landlord's yes
-- =============================================================================
-- One transaction, ROLLS BACK. PASS prints 'PORTAL APPROVAL SMOKE: PASS'.
--
-- MUST BE TRUE:
--   a registering stranger reads NO tenancy, rental, photo or note          ✔
--   asking files a PENDING request whatever the client sent                 ✔
--   email and phone are normalized before they are compared                 ✔
--   the landlord is shown a POSSIBLE match on email or on phone             ✔
--   the dropdown offers OCCUPIED doors, with the unit named                 ✔
--   the landlord's yes links the account to the tenancy he confirmed        ✔
--   and only then does she read her own door                                ✔
--   revoking clears the login and keeps every record                        ✔
--
-- MUST NOT BE TRUE — the walls, each a distinct way in:
--   she cannot file a request as somebody else                              ✘
--   she cannot set her own status, now or by UPDATE                         ✘
--   she cannot link herself to a tenancy she names by id                    ✘
--   she cannot stamp herself verified                                       ✘
--   she cannot call the approval function on herself                        ✘
--   she cannot revoke the real tenant                                       ✘
--   she cannot delete her request to erase the record                       ✘
--   she never sees another applicant's row                                  ✘
--   the landlord cannot approve onto another instance's tenancy             ✘
--   approval cannot evict an account already holding the seat               ✘
--   the dropdown carries no tenant name, phone, email or rent               ✘
--
-- WHY THE AUTHORIZATION TESTS ARE WRITTEN `coalesce(..., false)` IN 0275:
-- user_role_in_instance() is NULL for a non-member, `NOT (NULL IN (...))` is
-- NULL, and `IF NULL THEN RAISE` does not fire. The first version of the guard
-- waved a stranger straight through. The case below named
-- 'a stranger cannot approve herself' is that bug's gate.
-- =============================================================================

BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000','00000000-0000-4000-a000-0000000a0275','authenticated','authenticated','owner275@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-4000-a000-0000000b0275','authenticated','authenticated','tenant275@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-4000-a000-0000000c0275','authenticated','authenticated','other275@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010275','portal-smoke-275','Portal Smoke','business'),
  ('00000000-0000-4000-b000-000000020275','other-family-275','Another Family','business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010275','00000000-0000-4000-a000-0000000a0275','owner','Owner')
ON CONFLICT DO NOTHING;

-- Apt 2 is OCCUPIED and is the door she lives in. Apt 9 is hidden from the
-- dropdown by the landlord. Apt 7 belongs to another family entirely.
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, unit, property_type, status, city, state, portal_registration_enabled) VALUES
 ('00000000-0000-4000-c000-000000000275','00000000-0000-4000-b000-000000010275','00000000-0000-4000-a000-0000000a0275','apt-2-275','Apt 2','805 N Prospect','2','multi-family','occupied','Champaign','Illinois',true),
 ('00000000-0000-4000-c000-000000009275','00000000-0000-4000-b000-000000010275','00000000-0000-4000-a000-0000000a0275','apt-9-275','Apt 9','805 N Prospect','9','multi-family','vacant','Champaign','Illinois',false),
 ('00000000-0000-4000-c000-000000007275','00000000-0000-4000-b000-000000020275','00000000-0000-4000-a000-0000000a0275','apt-7-275','Apt 7','9 Elsewhere','7','multi-family','occupied','Urbana','Illinois',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_email, tenant_phone, monthly_rent, deposit, status) VALUES
 ('00000000-0000-4000-d000-000000000275','00000000-0000-4000-b000-000000010275','00000000-0000-4000-a000-0000000a0275','apt-2-275','Apt 2','Christina Real','Christina@Test.Local','(217) 555-0101',750,750,'active'),
 ('00000000-0000-4000-d000-000000007275','00000000-0000-4000-b000-000000020275','00000000-0000-4000-a000-0000000a0275','apt-7-275','Apt 7','Someone Else','else@test.local','217-555-0999',800,800,'active')
ON CONFLICT (id) DO NOTHING;

-- DROP TO `authenticated` FOR EVERY ASSERTION BELOW. The seeds above need the
-- superuser; the walls do not exist for one. A DO block runs as the session
-- role, and postgres BYPASSES RLS — so the first version of this file read 3
-- tenancies as "a stranger" and would have proven nothing while passing.
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  owner_id  uuid := '00000000-0000-4000-a000-0000000a0275';
  her       uuid := '00000000-0000-4000-a000-0000000b0275';
  other     uuid := '00000000-0000-4000-a000-0000000c0275';
  inst      uuid := '00000000-0000-4000-b000-000000010275';
  apt2      uuid := '00000000-0000-4000-c000-000000000275';
  ten2      uuid := '00000000-0000-4000-d000-000000000275';
  ten7      uuid := '00000000-0000-4000-d000-000000007275';
  req       uuid;
  n         int;
  st        text;
  lbl       text;
  hit       uuid;
BEGIN
  -- =========================================================================
  -- 1. BEFORE SHE ASKS, SHE READS NOTHING. This is the claim in the directive
  --    ("they can see information that should not be accessible") measured
  --    rather than assumed.
  -- =========================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', her, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM rental_tenancies;
  IF n <> 0 THEN RAISE EXCEPTION 'a stranger reads % tenancies', n; END IF;
  SELECT count(*) INTO n FROM rentals;
  IF n <> 0 THEN RAISE EXCEPTION 'a stranger reads % rentals', n; END IF;
  SELECT state INTO st FROM my_portal_status();
  IF st <> 'none' THEN RAISE EXCEPTION 'a person who never asked reads as %', st; END IF;

  -- =========================================================================
  -- 2. THE DROPDOWN. Occupied doors ARE offered; a hidden door is not; another
  --    family's door is never on this instance's list.
  -- =========================================================================
  SELECT count(*) INTO n FROM registerable_doors(inst);
  IF n <> 1 THEN RAISE EXCEPTION 'the dropdown offered % doors, expected the one occupied, listed door', n; END IF;
  SELECT label INTO lbl FROM registerable_doors(inst);
  IF lbl !~ 'Unit 2' THEN RAISE EXCEPTION 'the dropdown does not name the unit: %', lbl; END IF;
  IF EXISTS (SELECT 1 FROM registerable_doors(inst) WHERE NOT occupied) THEN
    RAISE EXCEPTION 'the occupied door was dropped — the people this is for could not find their home';
  END IF;
  -- Nothing about a person may ride along. The row is four columns and these
  -- are the only four.
  IF lbl ~* 'Christina|555|test\.local|750' THEN
    RAISE EXCEPTION 'A TENANT''S DETAILS REACHED THE REGISTRATION DROPDOWN: %', lbl;
  END IF;

  -- =========================================================================
  -- 3. ASKING IS ONLY ASKING — whatever the client sends.
  -- =========================================================================
  INSERT INTO tenant_portal_requests
    (instance_id, first_name, last_name, email, phone, rental_id, unit_label,
     status, linked_tenancy_id, verified_email_at)
  VALUES (inst, 'Christina', 'Real', '  CHRISTINA@Test.Local ', '(217) 555-0101', apt2, '2',
          'approved', ten2, now())            -- she sends herself an approval
  RETURNING id INTO req;

  SELECT status INTO st FROM tenant_portal_requests WHERE id = req;
  IF st <> 'pending' THEN RAISE EXCEPTION 'a self-declared status survived the insert: %', st; END IF;
  IF (SELECT linked_tenancy_id FROM tenant_portal_requests WHERE id = req) IS NOT NULL THEN
    RAISE EXCEPTION 'a self-declared LINK survived the insert';
  END IF;
  IF (SELECT verified_email_at FROM tenant_portal_requests WHERE id = req) IS NOT NULL THEN
    RAISE EXCEPTION 'a self-declared VERIFICATION survived the insert';
  END IF;
  IF (SELECT requested_by FROM tenant_portal_requests WHERE id = req) <> her THEN
    RAISE EXCEPTION 'the request is not attributed to the session that filed it';
  END IF;

  -- Normalization, which is what makes matching work at all.
  IF (SELECT email_norm FROM tenant_portal_requests WHERE id = req) <> 'christina@test.local' THEN
    RAISE EXCEPTION 'the email was not normalized';
  END IF;
  IF (SELECT phone_norm FROM tenant_portal_requests WHERE id = req) <> '2175550101' THEN
    RAISE EXCEPTION 'the phone was not normalized';
  END IF;

  -- THE POSSIBLE MATCH. This is the case that caught the real bug: email_norm
  -- is GENERATED, so it is still NULL inside a BEFORE trigger, and the first
  -- version matched nothing while failing nowhere.
  SELECT matched_tenancy_id INTO hit FROM tenant_portal_requests WHERE id = req;
  IF hit IS DISTINCT FROM ten2 THEN
    RAISE EXCEPTION 'the landlord was shown no possible match (got %), so the hint is dead', coalesce(hit::text, 'none');
  END IF;

  -- A match is NOT access.
  SELECT count(*) INTO n FROM rental_tenancies;
  IF n <> 0 THEN RAISE EXCEPTION 'MATCHING ALONE GAVE HER % TENANCIES', n; END IF;
  SELECT state INTO st FROM my_portal_status();
  IF st <> 'pending' THEN RAISE EXCEPTION 'she reads as % rather than pending', st; END IF;

  -- =========================================================================
  -- 4. THE WALLS. Each is a distinct way a person could let themselves in.
  -- =========================================================================
  BEGIN
    UPDATE tenant_portal_requests SET status = 'approved' WHERE id = req;
    RAISE EXCEPTION 'SHE APPROVED HERSELF BY UPDATE';
  EXCEPTION WHEN check_violation OR insufficient_privilege THEN NULL;
  END;

  BEGIN
    UPDATE tenant_portal_requests SET linked_tenancy_id = ten2 WHERE id = req;
    RAISE EXCEPTION 'SHE LINKED HERSELF TO A TENANCY SHE NAMED BY ID';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE tenant_portal_requests SET verified_email_at = now() WHERE id = req;
    RAISE EXCEPTION 'SHE STAMPED HERSELF VERIFIED';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- A STRANGER CANNOT APPROVE HERSELF. The NULL-role gate (see the header).
  BEGIN
    PERFORM decide_portal_request(req, 'approved', ten2);
    RAISE EXCEPTION 'A STRANGER CALLED THE APPROVAL FUNCTION AND IT LET HER IN';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM revoke_portal_access(ten2);
    RAISE EXCEPTION 'A STRANGER REVOKED THE REAL TENANT';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- Deleting is refused by RLS, which means ZERO ROWS rather than an error.
  -- The record of what was asked has to survive a withdrawal attempt.
  DELETE FROM tenant_portal_requests WHERE id = req;
  IF NOT EXISTS (SELECT 1 FROM tenant_portal_requests WHERE id = req) THEN
    RAISE EXCEPTION 'SHE DELETED HER OWN REQUEST AND ERASED THE RECORD';
  END IF;

  -- Another applicant's row is never hers to read.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM tenant_portal_requests;
  IF n <> 0 THEN RAISE EXCEPTION 'ANOTHER APPLICANT READ % REGISTRATION ROWS', n; END IF;

  -- =========================================================================
  -- 5. THE LANDLORD'S YES.
  -- =========================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM tenant_portal_requests WHERE instance_id = inst;
  IF n <> 1 THEN RAISE EXCEPTION 'the landlord sees % requests, expected 1', n; END IF;

  -- He cannot approve onto a tenancy that is not his.
  BEGIN
    PERFORM decide_portal_request(req, 'approved', ten7);
    RAISE EXCEPTION 'APPROVAL CROSSED INTO ANOTHER FAMILY''S TENANCY';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  PERFORM decide_portal_request(req, 'approved', ten2);
  IF (SELECT tenant_user_id FROM rental_tenancies WHERE id = ten2) <> her THEN
    RAISE EXCEPTION 'approval did not link the account to the tenancy';
  END IF;
  IF (SELECT decided_by FROM tenant_portal_requests WHERE id = req) <> owner_id THEN
    RAISE EXCEPTION 'the decision is not attributed to the landlord who made it';
  END IF;

  -- AND THE LANDLORD CANNOT FILE A REQUEST IN SOMEBODY ELSE'S NAME. Asking is
  -- the asker's own act; the landlord's path to bringing a tenant in is an
  -- invitation (0150), not a row typed on their behalf.
  BEGIN
    INSERT INTO tenant_portal_requests (instance_id, requested_by, first_name, last_name, email)
    VALUES (inst, other, 'Someone', 'Else', 'other275@test.local');
    RAISE EXCEPTION 'THE LANDLORD FILED A REGISTRATION REQUEST AS ANOTHER PERSON';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- A second account cannot be moved onto a seat somebody holds.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  INSERT INTO tenant_portal_requests (instance_id, first_name, last_name, email)
  VALUES (inst, 'Someone', 'Else', 'other275@test.local');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  BEGIN
    PERFORM decide_portal_request(
      (SELECT id FROM tenant_portal_requests WHERE requested_by = other), 'approved', ten2);
    RAISE EXCEPTION 'A SECOND ACCOUNT WAS MOVED ONTO AN OCCUPIED TENANCY SEAT';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- =========================================================================
  -- 6. AND NOW, AND ONLY NOW, SHE READS HER OWN DOOR.
  -- =========================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', her, 'role', 'authenticated')::text, true);
  SELECT state INTO st FROM my_portal_status();
  IF st <> 'approved' THEN RAISE EXCEPTION 'after approval she still reads as %', st; END IF;
  SELECT count(*) INTO n FROM rental_tenancies;
  IF n <> 1 THEN RAISE EXCEPTION 'an approved tenant reads % tenancies, expected her own 1', n; END IF;
  IF EXISTS (SELECT 1 FROM rental_tenancies WHERE id = ten7) THEN
    RAISE EXCEPTION 'SHE READS ANOTHER FAMILY''S TENANCY';
  END IF;

  -- =========================================================================
  -- 7. REVOKING TAKES THE LOGIN, NOT THE HISTORY.
  -- =========================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  PERFORM revoke_portal_access(ten2);
  IF (SELECT tenant_user_id FROM rental_tenancies WHERE id = ten2) IS NOT NULL THEN
    RAISE EXCEPTION 'revoking did not clear the login';
  END IF;
  IF (SELECT monthly_rent FROM rental_tenancies WHERE id = ten2) <> 750
     OR (SELECT tenant_name FROM rental_tenancies WHERE id = ten2) <> 'Christina Real' THEN
    RAISE EXCEPTION 'REVOKING DAMAGED THE TENANCY RECORD';
  END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', her, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM rental_tenancies;
  IF n <> 0 THEN RAISE EXCEPTION 'a revoked account still reads % tenancies', n; END IF;

  RAISE NOTICE 'PORTAL APPROVAL SMOKE: PASS';
END $$;

ROLLBACK;
