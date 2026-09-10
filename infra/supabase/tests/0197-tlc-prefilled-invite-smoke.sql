-- =============================================================================
-- 0197 TLC PREFILLED-INVITE SMOKE — a colleague already on the form signs in
-- and their packet is there (0197, DR-0353). Run on the LIVE Supabase (as
-- postgres) AFTER 0187..0197. Runs in a transaction and ROLLS BACK. PASS
-- prints 'TLC PREFILLED INVITE SMOKE: PASS'; any wrong answer RAISES.
--
-- Scenario: practice instance P — owner O; colleague C (on the old form);
-- colleague D (a plain invite); stranger S.
--
-- Assertions:
--   O mints a prefilled invite with a password key in the prefill  -> REFUSED ✘
--   O mints a prefilled invite with a bank number in the prefill   -> REFUSED ✘
--   O mints a prefilled invite (packet body + banking apart)       -> allowed ✔
--   S claims                                                        -> null ✔
--   C signs in and claims                                           -> a packet, claimed, the answers there ✔
--   the banking numbers sit in the walled table, wiped from the invite ✔
--   C claims again                                                  -> the same packet, not claimed anew ✔
--   C opens by the link                                             -> the same packet ✔
--   D claims with no invite                                          -> null; D opens by link -> an empty packet ✔
--   the audit row says the packet was prefilled and from where       ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000197'
\set c 'b0000000-0000-4000-a000-000000000197'
\set d 'c0000000-0000-4000-a000-000000000197'
\set s 'd0000000-0000-4000-a000-000000000197'
\set instP 'f0000000-0000-4000-b000-000000000197'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0197@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0197@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'d', 'authenticated','authenticated','d0197@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0197@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instP', 'prac-0197', 'TLC prefilled-invite smoke', 'therapy-practice');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instP', :'o', 'owner', 'Owner O');

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid, _email text, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.json_as(_who uuid, _email text, _sql text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE j jsonb;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO j;
  PERFORM set_config('role', 'postgres', true);
  RETURN j;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000197';
  c uuid := 'b0000000-0000-4000-a000-000000000197';
  d uuid := 'c0000000-0000-4000-a000-000000000197';
  s uuid := 'd0000000-0000-4000-a000-000000000197';
  instP uuid := 'f0000000-0000-4000-b000-000000000197';
  j jsonb;
  j2 jsonb;
  v_token text;
  v_token_d text;
  pkt uuid;
  n integer;
  got text;
  v_prefill text := '{"firstName":"Cora","lastName":"Colleague","phone":"3095550197","preferredEmail":"c0197@test.local","licenseType":"LCSW","employmentStatus":"Independent Contractor","bio":"Twenty years beside families.","populationsServed":["families"]}';
  v_bank text := '{"bankName":"Test Bank","routingNumber":"071000013","accountNumber":"123456789","accountType":"checking"}';
BEGIN
  -- ── The walls on a prefill ────────────────────────────────────────────────
  IF pg_temp.as_user(o, 'o0197@test.local', 'SELECT public.tlc_onboarding_invite_prefilled(''c0197@test.local'', ''import'', ''{"firstName":"Cora","caqhPassword":"nope"}''::jsonb, NULL, ''old form'')') THEN
    RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: a prefill with a password was accepted';
  END IF;
  IF pg_temp.as_user(o, 'o0197@test.local', 'SELECT public.tlc_onboarding_invite_prefilled(''c0197@test.local'', ''import'', ''{"firstName":"Cora","routingNumber":"071000013"}''::jsonb, NULL, ''old form'')') THEN
    RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: a prefill with a bank number was accepted';
  END IF;
  j := pg_temp.json_as(o, 'o0197@test.local', format('SELECT public.tlc_onboarding_invite_prefilled(''c0197@test.local'', ''Imported from the hiring form'', %L::jsonb, %L::jsonb, ''hiring form responses'')', v_prefill, v_bank));
  v_token := j->>'token';
  IF v_token IS NULL OR (j->>'prefilled')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the prefilled invite did not mint: %', j; END IF;

  -- ── Claim by email ────────────────────────────────────────────────────────
  j := pg_temp.json_as(s, 's0197@test.local', 'SELECT public.tlc_onboarding_claim()');
  IF j IS NOT NULL THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: a stranger claimed a packet: %', j; END IF;
  j := pg_temp.json_as(c, 'c0197@test.local', 'SELECT public.tlc_onboarding_claim()');
  pkt := (j->>'packet_id')::uuid;
  IF pkt IS NULL OR (j->>'claimed')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the colleague did not claim a packet: %', j; END IF;
  IF j->'packet'->>'firstName' <> 'Cora' OR j->'packet'->>'bio' <> 'Twenty years beside families.' OR j->>'status' <> 'draft' THEN
    RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the answers are not in the packet: %', j;
  END IF;
  IF j->'packet' ? 'acknowledgments' AND coalesce(j->'packet'->'acknowledgments'->'policies'->>'agreed', 'false') = 'true' THEN
    RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: a signature was prefilled';
  END IF;
  -- banking behind the wall, gone from the invite
  SELECT routing_number INTO got FROM tlc_onboarding_banking WHERE packet_id = pkt;
  IF got <> '071000013' THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the banking numbers did not reach the walled table (%)', got; END IF;
  SELECT count(*)::int INTO n FROM tlc_onboarding_invites WHERE token = v_token AND prefill_banking IS NOT NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the bank numbers still sit on the invite'; END IF;
  IF (j->'banking'->>'routing_last4') <> '0013' THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the view shows % for the routing tail', j->'banking'->>'routing_last4'; END IF;

  -- again: the same packet, not a second one
  j2 := pg_temp.json_as(c, 'c0197@test.local', 'SELECT public.tlc_onboarding_claim()');
  IF (j2->>'packet_id')::uuid <> pkt OR (j2->>'claimed')::boolean IS DISTINCT FROM false THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: a second claim made a new packet: %', j2; END IF;
  -- the link lands on the same packet
  j2 := pg_temp.json_as(c, 'c0197@test.local', format('SELECT public.tlc_onboarding_open(%L)', v_token));
  IF (j2->>'packet_id')::uuid <> pkt THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the link opened a different packet'; END IF;
  SELECT count(*)::int INTO n FROM tlc_onboarding_packets WHERE applicant_user_id = c;
  IF n <> 1 THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: % packets for the colleague, expected 1', n; END IF;

  -- ── A plain invite is unchanged ───────────────────────────────────────────
  j := pg_temp.json_as(d, 'd0197@test.local', 'SELECT public.tlc_onboarding_claim()');
  IF j IS NOT NULL THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: a colleague without an invite claimed a packet'; END IF;
  j := pg_temp.json_as(o, 'o0197@test.local', 'SELECT public.tlc_onboarding_invite(''d0197@test.local'', ''plain'')');
  v_token_d := j->>'token';
  j := pg_temp.json_as(d, 'd0197@test.local', format('SELECT public.tlc_onboarding_open(%L)', v_token_d));
  IF j->>'packet_id' IS NULL OR j->'packet' <> '{}'::jsonb THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: a plain invite did not open an empty packet: %', j; END IF;

  -- ── The record ────────────────────────────────────────────────────────────
  SELECT count(*)::int INTO n FROM audit_log WHERE entity_type = 'tlc_onboarding_packet' AND entity_id = pkt AND action = 'create'
     AND (to_value->>'prefilled')::boolean AND to_value->>'source' = 'hiring form responses';
  IF n <> 1 THEN RAISE EXCEPTION 'TLC PREFILLED INVITE SMOKE FAIL: the audit row does not say the packet was prefilled from the form (% rows)', n; END IF;

  RAISE NOTICE 'TLC PREFILLED INVITE SMOKE: PASS';
END $$;

SELECT 'TLC PREFILLED INVITE SMOKE: PASS' AS result;

ROLLBACK;
