-- =============================================================================
-- 0194 TLC ACKNOWLEDGMENT-STAMP SMOKE — the office's clock on every signed
-- acknowledgment (0194, DR-0350 amended). Run on
-- the LIVE Supabase (as postgres) AFTER 0187..0194. Runs in a transaction
-- and ROLLS BACK. PASS prints 'TLC ACK STAMP SMOKE: PASS'; any wrong answer
-- RAISES.
--
-- Scenario: practice instance P — owner O; colleague A (invited by email).
--
-- Assertions:
--   O invites A; A opens the packet                               ✔
--   A submits with three signed acknowledgments                    -> each carries signedAtServer ✔
--   the audit row of the submit carries the three versions + stamps ✔
--   O returns the packet; A resubmits the SAME signatures           -> stamps unchanged ✔
--   O returns again; A re-signs one document                        -> only that stamp moves ✔
--   a submit without the checkbox                                   -> refused (missing) ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000194'
\set a 'b0000000-0000-4000-a000-000000000194'
\set instP 'f0000000-0000-4000-b000-000000000194'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0194@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0194@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instP', 'prac-0194', 'TLC ack-stamp smoke', 'therapy-practice');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instP', :'o', 'owner', 'Owner O');

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  IF _who IS NULL THEN
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  ELSE
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  END IF;
  EXECUTE _sql INTO j;
  PERFORM set_config('role', 'postgres', true);
  RETURN j;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000194';
  a uuid := 'b0000000-0000-4000-a000-000000000194';
  instP uuid := 'f0000000-0000-4000-b000-000000000194';
  j jsonb;
  token text;
  pkt uuid;
  packet jsonb;
  s_pol text; s_con text; s_agr text;
  s_pol2 text; s_con2 text; s_agr2 text;
  n integer;
  ack jsonb := jsonb_build_object(
    'policies',           jsonb_build_object('agreed', true, 'signature', 'Amy Applicant', 'signedOn', '2026-09-10', 'signedAt', '2026-09-10T16:00:00.000Z', 'docVersion', 'vtestpol', 'attestation', 'By checking this box, I acknowledge that I have read the Employee Handbook in full and I agree to be bound by it.'),
    'confidentiality',    jsonb_build_object('agreed', true, 'signature', 'Amy Applicant', 'signedOn', '2026-09-10', 'signedAt', '2026-09-10T16:00:00.000Z', 'docVersion', 'vtestcon'),
    'contractorAgreement',jsonb_build_object('agreed', true, 'signature', 'Amy Applicant', 'signedOn', '2026-09-10', 'signedAt', '2026-09-10T16:00:00.000Z', 'docVersion', 'vtestagr'));
BEGIN
  -- ── Invite, open ──────────────────────────────────────────────────────────
  j := pg_temp.json_as(o, 'o0194@test.local', 'SELECT public.tlc_onboarding_invite(''a0194@test.local'', ''smoke'')');
  token := j->>'token';
  IF token IS NULL THEN RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: no invite token'; END IF;
  j := pg_temp.json_as(a, 'a0194@test.local', format('SELECT public.tlc_onboarding_open(%L)', token));
  pkt := (j->>'packet_id')::uuid;
  IF pkt IS NULL THEN RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: the packet did not open: %', j; END IF;

  packet := jsonb_build_object('firstName', 'Amy', 'lastName', 'Applicant', 'phone', '3095550194', 'preferredEmail', 'a0194@test.local',
                               'licenseType', 'LCSW', 'employmentStatus', '1099', 'acknowledgments', ack);

  -- ── A submit without the checkbox is refused as missing ──────────────────
  j := pg_temp.json_as(a, 'a0194@test.local', format('SELECT public.tlc_onboarding_save(%L, %L::jsonb, NULL, NULL, true)', pkt,
         jsonb_set(packet, '{acknowledgments,policies,agreed}', 'false'::jsonb)));
  IF (j->>'submitted')::boolean IS DISTINCT FROM false OR NOT (j->'missing' ? 'acknowledgments.policies') THEN
    RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: an unchecked acknowledgment submitted: %', j;
  END IF;

  -- ── The first submit stamps all three with the office''s clock ───────────
  j := pg_temp.json_as(a, 'a0194@test.local', format('SELECT public.tlc_onboarding_save(%L, %L::jsonb, NULL, NULL, true)', pkt, packet));
  IF j->>'status' <> 'submitted' THEN RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: the submit did not land: %', j; END IF;
  s_pol := j->'packet'->'acknowledgments'->'policies'->>'signedAtServer';
  s_con := j->'packet'->'acknowledgments'->'confidentiality'->>'signedAtServer';
  s_agr := j->'packet'->'acknowledgments'->'contractorAgreement'->>'signedAtServer';
  IF coalesce(s_pol, '') = '' OR coalesce(s_con, '') = '' OR coalesce(s_agr, '') = '' THEN
    RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: a signed acknowledgment carries no server stamp (% / % / %)', s_pol, s_con, s_agr;
  END IF;
  IF s_pol !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN
    RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: the stamp is not an ISO instant: %', s_pol;
  END IF;
  -- the device time and the attestation ride through untouched
  IF j->'packet'->'acknowledgments'->'policies'->>'signedAt' <> '2026-09-10T16:00:00.000Z'
     OR j->'packet'->'acknowledgments'->'policies'->>'attestation' NOT LIKE 'By checking this box%' THEN
    RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: the device time or the attestation was altered: %', j->'packet'->'acknowledgments'->'policies';
  END IF;
  -- the audit row carries the versions and the stamps
  SELECT count(*)::int INTO n FROM audit_log
   WHERE entity_type = 'tlc_onboarding_packet' AND entity_id = pkt AND action = 'status-change'
     AND to_value->'acknowledgments'->'policies'->>'docVersion' = 'vtestpol'
     AND to_value->'acknowledgments'->'policies'->>'signedAtServer' = s_pol;
  IF n <> 1 THEN RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: the submit audit row lacks the versions and stamps (% rows)', n; END IF;

  -- ── Returned, resubmitted unchanged: the stamps hold ─────────────────────
  PERFORM pg_temp.json_as(o, 'o0194@test.local', format('SELECT public.tlc_onboarding_review(%L, ''return'', ''one more thing'')', pkt));
  PERFORM pg_sleep(0.02);
  packet := j->'packet';  -- as the app would resubmit it: the stamps carried
  j := pg_temp.json_as(a, 'a0194@test.local', format('SELECT public.tlc_onboarding_save(%L, %L::jsonb, NULL, NULL, true)', pkt, packet));
  s_pol2 := j->'packet'->'acknowledgments'->'policies'->>'signedAtServer';
  s_con2 := j->'packet'->'acknowledgments'->'confidentiality'->>'signedAtServer';
  IF s_pol2 <> s_pol OR s_con2 <> s_con THEN
    RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: an unchanged signature was re-stamped (% -> %, % -> %)', s_pol, s_pol2, s_con, s_con2;
  END IF;

  -- ── Returned, one document re-signed: only that stamp moves ──────────────
  PERFORM pg_temp.json_as(o, 'o0194@test.local', format('SELECT public.tlc_onboarding_review(%L, ''return'', ''sign the confidentiality one again'')', pkt));
  PERFORM pg_sleep(0.02);
  packet := jsonb_set(j->'packet', '{acknowledgments,confidentiality,signature}', '"Amy L. Applicant"'::jsonb);
  j := pg_temp.json_as(a, 'a0194@test.local', format('SELECT public.tlc_onboarding_save(%L, %L::jsonb, NULL, NULL, true)', pkt, packet));
  s_pol2 := j->'packet'->'acknowledgments'->'policies'->>'signedAtServer';
  s_con2 := j->'packet'->'acknowledgments'->'confidentiality'->>'signedAtServer';
  s_agr2 := j->'packet'->'acknowledgments'->'contractorAgreement'->>'signedAtServer';
  IF s_pol2 <> s_pol OR s_agr2 <> s_agr THEN
    RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: an untouched signature was re-stamped on the re-sign';
  END IF;
  IF s_con2 = s_con THEN
    RAISE EXCEPTION 'TLC ACK STAMP SMOKE FAIL: a re-signed document kept its old stamp (%)', s_con;
  END IF;

  RAISE NOTICE 'TLC ACK STAMP SMOKE: PASS';
END $$;

SELECT 'TLC ACK STAMP SMOKE: PASS' AS result;

ROLLBACK;
