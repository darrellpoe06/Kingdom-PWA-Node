-- =============================================================================
-- 0264 SMOKE — a job can require proof before it is done, and paid (DR-0937)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'PROOF SMOKE: PASS'; any break RAISES.
--
--   the family sets a job's proof; the worker cannot change it        ✔ / ✘
--   "Fixed" on a photos job with no picture                            ✘
--   a picture, then "Fixed"                                            ✔ (and the job resolves)
--   "Fixed" on a photos-and-video job with a picture but no video      ✘
--   a video, then "Fixed"                                              ✔
--   a "video" that is not a video                                      ✘
--   a job with no proof required is fixed as before                   ✔
--   the requirement's change is on the clock                          ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0264', 'authenticated','authenticated','owner264@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0264', 'authenticated','authenticated','worker264@test.local','', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010264', 'proof-smoke-264', 'Proof Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010264', '00000000-0000-4000-a000-0000000a0264', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0264', '00000000-0000-4000-b000-000000010264', '00000000-0000-4000-a000-0000000a0264', 'DOOR-P-264', 'Door P', '1 P St', 'multi-family', 'vacant');
INSERT INTO delegated_capabilities (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label) VALUES
  ('00000000-0000-4000-b000-000000010264', '00000000-0000-4000-a000-0000000b0264', 'DOOR-P-264', 'docs.add', 'allow', '00000000-0000-4000-a000-0000000a0264', 'field_worker');
INSERT INTO tenant_maintenance_requests (id, instance_id, rental_id, created_by, created_by_role, title) VALUES
  ('00000000-0000-4000-d000-0000000a0264', '00000000-0000-4000-b000-000000010264', '00000000-0000-4000-c000-0000000a0264', '00000000-0000-4000-a000-0000000a0264', 'landlord', 'Install microwave'),
  ('00000000-0000-4000-d000-0000000b0264', '00000000-0000-4000-b000-000000010264', '00000000-0000-4000-c000-0000000a0264', '00000000-0000-4000-a000-0000000a0264', 'landlord', 'Run the ductwork'),
  ('00000000-0000-4000-d000-0000000c0264', '00000000-0000-4000-b000-000000010264', '00000000-0000-4000-c000-0000000a0264', '00000000-0000-4000-a000-0000000a0264', 'landlord', 'Change a bulb');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); END $$;
CREATE OR REPLACE FUNCTION pg_temp.runs(_who uuid, _sql text, _label text, _should boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation OR raise_exception THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'PROOF SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.changes(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int := 0;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN
    EXECUTE _sql;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN insufficient_privilege THEN n := 0;
  END;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0264';
  w    uuid := '00000000-0000-4000-a000-0000000b0264';
  inst text := '00000000-0000-4000-b000-000000010264';
  jp   text := '00000000-0000-4000-d000-0000000a0264';
  jv   text := '00000000-0000-4000-d000-0000000b0264';
  jn   text := '00000000-0000-4000-d000-0000000c0264';
  doc  text := 'INSERT INTO request_documentation (instance_id, request_id, outcome, note, image_data, video_data) VALUES (%L, %L, %L, %L, %L, %L)';
BEGIN
  -- 1. The family sets the proof; the worker cannot.
  IF pg_temp.changes(o, format('UPDATE tenant_maintenance_requests SET proof_required = ''photos'', proof_note = ''The microwave mounted and running'' WHERE id = %L', jp)) <> 1 THEN
    RAISE EXCEPTION 'PROOF SMOKE FAIL: the family could not require proof';
  END IF;
  PERFORM pg_temp.changes(o, format('UPDATE tenant_maintenance_requests SET proof_required = ''photos-and-video'' WHERE id = %L', jv));
  IF pg_temp.changes(w, format('UPDATE tenant_maintenance_requests SET proof_required = ''none'' WHERE id = %L', jp)) <> 0 THEN
    RAISE EXCEPTION 'PROOF SMOKE FAIL: the worker lifted the proof requirement';
  END IF;

  -- 2. Photos: no picture, no "Fixed"; a picture, then "Fixed" resolves it.
  PERFORM pg_temp.runs(w, format(doc, inst, jp, 'fixed', 'Done', NULL, NULL), '"Fixed" on a photos job with no picture', false);
  PERFORM pg_temp.runs(w, format(doc, inst, jp, NULL, 'Mounted', 'data:image/jpeg;base64,AAAA', NULL), 'the worker adds a picture', true);
  PERFORM pg_temp.runs(w, format(doc, inst, jp, 'fixed', 'Done', NULL, NULL), '"Fixed" after the picture', true);
  IF (SELECT status FROM tenant_maintenance_requests WHERE id = jp::uuid) <> 'resolved' THEN
    RAISE EXCEPTION 'PROOF SMOKE FAIL: the proven job did not resolve';
  END IF;

  -- 3. Photos and video: a picture is not enough; a video completes it.
  PERFORM pg_temp.runs(w, format(doc, inst, jv, NULL, 'Ducts in', 'data:image/jpeg;base64,AAAA', NULL), 'a picture on the video job', true);
  PERFORM pg_temp.runs(w, format(doc, inst, jv, 'fixed', 'Done', NULL, NULL), '"Fixed" on a photos-and-video job with no video', false);
  PERFORM pg_temp.runs(w, format(doc, inst, jv, NULL, 'Air moving', NULL, 'not a video'), 'a "video" that is not a video', false);
  PERFORM pg_temp.runs(w, format(doc, inst, jv, NULL, 'Air moving', NULL, 'data:video/mp4;base64,AAAA'), 'the worker adds a video', true);
  PERFORM pg_temp.runs(w, format(doc, inst, jv, 'fixed', 'Done', NULL, NULL), '"Fixed" after the video', true);
  IF NOT (SELECT bool_or(has_video) FROM request_documentation WHERE request_id = jv::uuid) THEN
    RAISE EXCEPTION 'PROOF SMOKE FAIL: has_video does not say a video is there';
  END IF;

  -- 4. No proof required: fixed as before.
  PERFORM pg_temp.runs(w, format(doc, inst, jn, 'fixed', 'Swapped', NULL, NULL), 'a job with no proof required', true);

  -- 5. On the clock.
  IF (SELECT count(*) FROM door_events WHERE subject_id = jp::uuid AND event = 'proof' AND to_value = 'photos') <> 1 THEN
    RAISE EXCEPTION 'PROOF SMOKE FAIL: the proof requirement is not on the clock';
  END IF;

  RAISE NOTICE 'PROOF SMOKE: PASS';
END $$;

ROLLBACK;
