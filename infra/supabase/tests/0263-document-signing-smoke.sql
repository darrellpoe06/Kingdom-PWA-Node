-- =============================================================================
-- 0263 SMOKE — a document is signed in the app and filed where it belongs
-- (DR-0936)
-- =============================================================================
-- Runs in CI on a throwaway PostgreSQL (the door-work leg) and on the LIVE
-- database in the rls-isolation poe-properties leg. One transaction; ROLLS
-- BACK. PASS prints 'DOCUMENT SIGNING SMOKE: PASS'; any break RAISES.
--
--   a tenant uploads a paper to their tenancy, claiming it is signed  → it is
--     filed, and unsigned
--   a tenant asks for signatures                                      ✘
--   the family asks: tenant + landlord; the database fingerprints it  ✔
--   a generated draft without counsel's review                        ✘
--   a generated draft with it: who and when are kept                  ✔
--   another door's tenant signs                                       ✘
--   the tenant signs a different version                              ✘
--   the tenant signs; signs again                                     ✔ / ✘
--   the tenant writes the sign state directly                         ✘
--   the family signs as landlord: the document is SIGNED              ✔
--   the signatures are read where the document is read; nobody
--     edits or deletes one                                           ✔ / ✘
--   request, each signature and completion are on the clock           ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0263', 'authenticated','authenticated','owner263@test.local','',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0263', 'authenticated','authenticated','tenant263@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0263', 'authenticated','authenticated','other263@test.local','',  now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010263', 'doc-sign-smoke-263', 'Document Signing Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010263', '00000000-0000-4000-a000-0000000a0263', 'owner', 'Owner')
ON CONFLICT DO NOTHING;
INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0263', '00000000-0000-4000-b000-000000010263', '00000000-0000-4000-a000-0000000a0263', 'DOOR-A-263', 'Door A', '1 A St', 'multi-family', 'occupied'),
  ('00000000-0000-4000-c000-0000000b0263', '00000000-0000-4000-b000-000000010263', '00000000-0000-4000-a000-0000000a0263', 'DOOR-B-263', 'Door B', '2 B St', 'multi-family', 'occupied');
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0263', '00000000-0000-4000-b000-000000010263', '00000000-0000-4000-a000-0000000a0263', 'DOOR-A-263', 'Door A', 'Tenant A', '00000000-0000-4000-a000-0000000b0263', 680, 680, 'active'),
  ('00000000-0000-4000-c000-0000000f0263', '00000000-0000-4000-b000-000000010263', '00000000-0000-4000-a000-0000000a0263', 'DOOR-B-263', 'Door B', 'Tenant B', '00000000-0000-4000-a000-0000000c0263', 700, 700, 'active');

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
    WHEN insufficient_privilege OR check_violation OR raise_exception OR unique_violation THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  IF ok <> _should THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: % (expected succeeds=%, got %)', _label, _should, ok;
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
CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE _sql INTO n;
  PERFORM pg_temp.as_postgres();
  RETURN n;
END $$;

DO $$
DECLARE
  o    uuid := '00000000-0000-4000-a000-0000000a0263';
  t    uuid := '00000000-0000-4000-a000-0000000b0263';
  t2   uuid := '00000000-0000-4000-a000-0000000c0263';
  inst text := '00000000-0000-4000-b000-000000010263';
  ta   text := '00000000-0000-4000-c000-0000000e0263';
  doorA text := '00000000-0000-4000-c000-0000000a0263';
  paper uuid := '00000000-0000-4000-d000-0000000a0263';
  lease uuid := '00000000-0000-4000-d000-0000000b0263';
  gen   uuid := '00000000-0000-4000-d000-0000000c0263';
  body  text := 'data:text/plain;charset=utf-8,RESIDENTIAL%20LEASE%20Door%20A';
  v     text;
  d     record;
  n     int;
BEGIN
  -- 1. A tenant files a paper to their own tenancy; claiming it is signed does nothing.
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO property_documents (id, instance_id, rental_ref, tenancy_id, kind, title, storage_path, mime_type, uploaded_by, sign_status, signers_required, content_hash)
     VALUES (%L, %L, %L, %L, ''receipt'', ''Renter insurance card'', ''data:image/png;base64,AAAA'', ''image/png'', %L, ''signed'', ''{tenant}'', ''forged'')', paper, inst, doorA, ta, t),
    'the tenant files a paper to their tenancy', true);
  SELECT * INTO d FROM property_documents WHERE id = paper;
  IF d.sign_status <> 'none' OR d.content_hash IS NOT NULL OR cardinality(d.signers_required) <> 0 THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: an insert arrived signed (%)', d.sign_status;
  END IF;

  -- 2. Only the family sends for signature.
  INSERT INTO property_documents (id, instance_id, rental_ref, tenancy_id, kind, title, storage_path, mime_type, uploaded_by)
  VALUES (lease, inst::uuid, doorA::uuid, ta::uuid, 'lease', 'Lease, Door A', body, 'text/plain', o);
  PERFORM pg_temp.runs(t, format('SELECT public.property_document_request_signatures(%L, ARRAY[''tenant'',''landlord''])', lease), 'a tenant asks for signatures', false);
  PERFORM pg_temp.runs(o, format('SELECT public.property_document_request_signatures(%L, ARRAY[''tenant'',''landlord''])', lease), 'the family asks for both signatures', true);
  SELECT * INTO d FROM property_documents WHERE id = lease;
  v := encode(sha256(convert_to(body, 'UTF8')), 'hex');
  IF d.sign_status <> 'awaiting' OR d.content_hash <> v OR d.signers_required <> ARRAY['landlord', 'tenant'] THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the request did not fingerprint and wait (%, %)', d.sign_status, d.content_hash;
  END IF;

  -- 3. The counsel rule stands for a generated draft.
  INSERT INTO property_documents (id, instance_id, rental_ref, tenancy_id, kind, title, storage_path, mime_type, uploaded_by, source)
  VALUES (gen, inst::uuid, doorA::uuid, ta::uuid, 'notice', 'Notice of entry (generated)', 'data:text/plain;charset=utf-8,NOTICE', 'text/plain', o, 'generated');
  PERFORM pg_temp.runs(o, format('SELECT public.property_document_request_signatures(%L, ARRAY[''tenant''])', gen), 'a generated draft without counsel''s review', false);
  PERFORM pg_temp.runs(o, format('SELECT public.property_document_request_signatures(%L, ARRAY[''tenant''], true)', gen), 'a generated draft with counsel''s review recorded', true);
  SELECT * INTO d FROM property_documents WHERE id = gen;
  IF d.counsel_attested_by IS DISTINCT FROM o OR d.counsel_attested_at IS NULL THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the counsel attestation was not kept';
  END IF;

  -- 4. Signing: the right person, the exact version, once.
  PERFORM pg_temp.runs(t2, format('SELECT public.property_document_sign(%L, ''tenant'', ''Tenant B'', %L, ''I have read it'', ''I agree to sign electronically'')', lease, v),
    'another door''s tenant signs', false);
  PERFORM pg_temp.runs(t, format('SELECT public.property_document_sign(%L, ''tenant'', ''Tenant A'', %L, ''I have read it'', ''I agree to sign electronically'')', lease, repeat('0', 64)),
    'the tenant signs a different version', false);
  PERFORM pg_temp.runs(t, format('SELECT public.property_document_sign(%L, ''landlord'', ''Tenant A'', %L, ''I have read it'', ''I agree to sign electronically'')', lease, v),
    'the tenant signs as landlord', false);
  PERFORM pg_temp.runs(t, format('SELECT public.property_document_sign(%L, ''tenant'', ''Tenant A Fullname'', %L, ''I have read it'', ''I agree to sign electronically'', ''2026-10-10T12:00:00Z'')', lease, v),
    'the tenant signs', true);
  PERFORM pg_temp.runs(t, format('SELECT public.property_document_sign(%L, ''tenant'', ''Tenant A Fullname'', %L, ''I have read it'', ''I agree to sign electronically'')', lease, v),
    'the tenant signs again', false);
  IF (SELECT sign_status FROM property_documents WHERE id = lease) <> 'awaiting' THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: signed before the landlord signed';
  END IF;

  -- 5. Nobody writes the sign state directly.
  n := pg_temp.changes(t, format('UPDATE property_documents SET sign_status = ''signed'' WHERE id = %L', lease));
  IF n <> 0 THEN RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: a tenant wrote the sign state'; END IF;
  n := pg_temp.changes(o, format('UPDATE property_documents SET sign_status = ''signed'' WHERE id = %L', lease));
  IF n <> 0 THEN RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the owner wrote the sign state directly'; END IF;

  -- 6. The landlord signs; the document is signed, where it was filed.
  PERFORM pg_temp.runs(o, format('SELECT public.property_document_sign(%L, ''landlord'', ''Darrell Poe'', %L, ''I have read it'', ''I agree to sign electronically'')', lease, v),
    'the family signs as landlord', true);
  SELECT * INTO d FROM property_documents WHERE id = lease;
  IF d.sign_status <> 'signed' OR d.signed_at IS NULL OR d.tenancy_id IS DISTINCT FROM ta::uuid THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the lease is not signed in its tenancy (%)', d.sign_status;
  END IF;

  -- 7. The signatures are read where the document is read; nobody rewrites one.
  IF pg_temp.count_as(t, format('SELECT count(*)::int FROM property_document_signatures WHERE document_id = %L', lease)) <> 2 THEN RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the tenant cannot read the signatures on their lease'; END IF;
  IF pg_temp.count_as(t2, format('SELECT count(*)::int FROM property_document_signatures WHERE document_id = %L', lease)) <> 0 THEN RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: another tenant reads them'; END IF;
  IF pg_temp.changes(o, format('UPDATE property_document_signatures SET signature = ''someone else'' WHERE document_id = %L', lease)) <> 0 THEN RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: a signature was edited'; END IF;
  IF pg_temp.changes(o, format('DELETE FROM property_document_signatures WHERE document_id = %L', lease)) <> 0 THEN RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: a signature was deleted'; END IF;

  -- 8. Everything is on the clock.
  IF (SELECT count(*) FROM record_events WHERE subject = 'document' AND subject_id = lease) <> 4
     OR NOT EXISTS (SELECT 1 FROM record_events WHERE subject_id = lease AND event = 'signature-requested')
     OR (SELECT count(*) FROM record_events WHERE subject_id = lease AND event = 'signed') <> 2
     OR NOT EXISTS (SELECT 1 FROM record_events WHERE subject_id = lease AND event = 'fully-signed') THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the clock is missing events';
  END IF;
  IF pg_temp.count_as(t, format('SELECT count(*)::int FROM record_events WHERE subject_id = %L', lease)) <> 4 THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the tenant cannot read their lease''s events (saw %)',
      pg_temp.count_as(t, format('SELECT count(*)::int FROM record_events WHERE subject_id = %L', lease));
  END IF;
  IF pg_temp.count_as(t2, format('SELECT count(*)::int FROM record_events WHERE subject_id = %L', lease)) <> 0 THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: another tenant reads the lease''s events';
  END IF;

  -- 9. A picture on a work order (Darrell: "pictures for documentation...
  --    For workorders"): the tenant documents their own request, never
  --    another door's; the row takes its scope from the request (0260).
  INSERT INTO tenant_maintenance_requests (id, instance_id, tenancy_id, created_by, created_by_role, title)
  VALUES ('00000000-0000-4000-d000-0000000e0263', inst::uuid, ta::uuid, t, 'tenant', 'Leak under the sink'),
         ('00000000-0000-4000-d000-0000000f0263', inst::uuid, '00000000-0000-4000-c000-0000000f0263', t2, 'tenant', 'Their own job');
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO request_documentation (instance_id, request_id, outcome, note, image_data) VALUES (%L, %L, NULL, %L, %L)',
    inst, '00000000-0000-4000-d000-0000000e0263', 'Under the sink', 'data:image/jpeg;base64,AAAA'),
    'the tenant adds a picture to their own work order', true);
  PERFORM pg_temp.runs(t, format(
    'INSERT INTO request_documentation (instance_id, request_id, outcome, note, image_data) VALUES (%L, %L, NULL, %L, %L)',
    inst, '00000000-0000-4000-d000-0000000f0263', 'Not mine', 'data:image/jpeg;base64,AAAA'),
    'the tenant adds a picture to another door''s work order', false);
  IF pg_temp.count_as(o, 'SELECT count(*)::int FROM request_documentation WHERE request_id = ''00000000-0000-4000-d000-0000000e0263'' AND image_data IS NOT NULL') <> 1 THEN
    RAISE EXCEPTION 'DOCUMENT SIGNING SMOKE FAIL: the family cannot see the tenant''s picture on the job';
  END IF;

  RAISE NOTICE 'DOCUMENT SIGNING SMOKE: PASS';
END $$;

ROLLBACK;
