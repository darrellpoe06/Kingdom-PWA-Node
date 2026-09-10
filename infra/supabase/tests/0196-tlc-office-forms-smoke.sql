-- =============================================================================
-- 0196 TLC OFFICE-FORMS SMOKE — the office edits its own forms, versioned;
-- the live required questions are enforced at submit (0196, DR-0352). Run on
-- the LIVE Supabase (as postgres) AFTER 0187..0196. Runs in a transaction and
-- ROLLS BACK. PASS prints 'TLC OFFICE FORMS SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: practice instance P — owner O, therapist T (member), assistant A;
-- colleague C (invited, a packet); stranger S.
--
-- Assertions:
--   O saves the intake form without a note                    -> REFUSED ✘
--   O saves the intake form (a custom required question) v1    -> allowed, version 1 ✔
--   O saves it again v2; the history holds both bodies         ✔
--   O saves the handbook without a title                       -> REFUSED ✘
--   O saves the confidentiality agreement                       -> version 1 ✔
--   T / A save a form                                           -> REFUSED ✘
--   O updates the row by hand                                   -> DENIED (no policy) ✘
--   T reads the live definitions through the function          -> 2 keys ✔
--   T reads the rows directly                                   -> 2 ✔
--   T reads the history directly                                -> 0 (owner/admin only) ✔
--   C (a packet, no membership) reads through the function      -> 2 keys ✔
--   S reads through the function                                -> {} ✔
--   C submits without the custom required answer                -> missing x_pronouns ✔
--   C submits with it                                           -> submitted ✔
--   the audit row carries the version                            ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000196'
\set t 'b0000000-0000-4000-a000-000000000196'
\set a 'c0000000-0000-4000-a000-000000000196'
\set c 'd0000000-0000-4000-a000-000000000196'
\set s 'e0000000-0000-4000-a000-000000000196'
\set instP 'f0000000-0000-4000-b000-000000000196'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0196@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'t', 'authenticated','authenticated','t0196@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0196@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0196@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0196@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instP', 'prac-0196', 'TLC office-forms smoke', 'therapy-practice');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instP', :'o', 'owner',     'Owner O'),
  (:'instP', :'t', 'member',    'Therapist T'),
  (:'instP', :'a', 'assistant', 'Assistant A');

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

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
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
  o uuid := 'a0000000-0000-4000-a000-000000000196';
  t uuid := 'b0000000-0000-4000-a000-000000000196';
  a uuid := 'c0000000-0000-4000-a000-000000000196';
  c uuid := 'd0000000-0000-4000-a000-000000000196';
  s uuid := 'e0000000-0000-4000-a000-000000000196';
  instP uuid := 'f0000000-0000-4000-b000-000000000196';
  form1 text := '{"sections":[{"id":"about","title":"About you","fields":[{"key":"firstName","type":"text","label":"First Name","required":true},{"key":"x_pronouns","type":"text","label":"Pronouns","required":true,"custom":true}]}]}';
  form2 text := '{"sections":[{"id":"about","title":"About you (v2)","fields":[{"key":"firstName","type":"text","label":"Given name","required":true},{"key":"x_pronouns","type":"text","label":"Pronouns","required":true,"custom":true}]}]}';
  j jsonb;
  n integer;
  v_token text;
  pkt uuid;
  v_base jsonb := jsonb_build_object('firstName', 'Cora', 'lastName', 'Colleague', 'phone', '3095550196', 'preferredEmail', 'c0196@test.local',
                  'licenseType', 'LCSW', 'employmentStatus', '1099',
                  'acknowledgments', jsonb_build_object(
                    'policies',            jsonb_build_object('agreed', true, 'signature', 'Cora Colleague', 'docVersion', 'v1'),
                    'confidentiality',     jsonb_build_object('agreed', true, 'signature', 'Cora Colleague', 'docVersion', 'v1'),
                    'contractorAgreement', jsonb_build_object('agreed', true, 'signature', 'Cora Colleague', 'docVersion', 'v1')));
BEGIN
  -- ── Saving ────────────────────────────────────────────────────────────────
  IF pg_temp.as_user(o, 'o0196@test.local', format('SELECT public.tlc_office_document_save(''intake-form'', %L::jsonb, NULL)', form1)) THEN
    RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: a save without a note was accepted';
  END IF;
  j := pg_temp.json_as(o, 'o0196@test.local', format('SELECT public.tlc_office_document_save(''intake-form'', %L::jsonb, ''added pronouns'')', form1));
  IF (j->>'version')::int <> 1 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: first save is version %', j->>'version'; END IF;
  j := pg_temp.json_as(o, 'o0196@test.local', format('SELECT public.tlc_office_document_save(''intake-form'', %L::jsonb, ''renamed first name'')', form2));
  IF (j->>'version')::int <> 2 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: second save is version %', j->>'version'; END IF;
  SELECT count(*)::int INTO n FROM tlc_office_document_history h JOIN tlc_office_documents d ON d.id = h.document_id WHERE d.instance_id = instP AND d.key = 'intake-form';
  IF n <> 2 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: history holds % versions, expected 2', n; END IF;
  SELECT count(*)::int INTO n FROM tlc_office_document_history h WHERE h.instance_id = instP AND h.version = 1 AND h.body->'sections'->0->>'title' = 'About you';
  IF n <> 1 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: version 1 body was not kept whole'; END IF;
  IF pg_temp.as_user(o, 'o0196@test.local', 'SELECT public.tlc_office_document_save(''policies'', ''{"sections":[]}''::jsonb, ''no title'')') THEN
    RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: a document without a title was accepted';
  END IF;
  j := pg_temp.json_as(o, 'o0196@test.local', 'SELECT public.tlc_office_document_save(''confidentiality'', ''{"title":"Confidentiality Agreement (NDA)","preamble":"x","sections":[{"n":1,"title":"Purpose","text":"y"}]}''::jsonb, ''first edit'')');
  IF (j->>'version')::int <> 1 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the agreement save is version %', j->>'version'; END IF;
  IF pg_temp.as_user(t, 't0196@test.local', format('SELECT public.tlc_office_document_save(''intake-form'', %L::jsonb, ''sneaky'')', form1)) THEN
    RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: a member changed the office form';
  END IF;
  IF pg_temp.as_user(a, 'a0196@test.local', format('SELECT public.tlc_office_document_save(''intake-form'', %L::jsonb, ''sneaky'')', form1)) THEN
    RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the assistant changed the office form';
  END IF;
  PERFORM pg_temp.as_user(o, 'o0196@test.local', format('UPDATE tlc_office_documents SET note = ''by hand'' WHERE instance_id = %L', instP));
  SELECT count(*)::int INTO n FROM tlc_office_documents WHERE instance_id = instP AND note = 'by hand';
  IF n <> 0 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the owner changed a row by hand (no policy should allow it)'; END IF;

  -- ── Reading ───────────────────────────────────────────────────────────────
  j := pg_temp.json_as(t, 't0196@test.local', 'SELECT public.tlc_office_documents_read(''tlc'')');
  IF NOT (j ? 'intake-form') OR NOT (j ? 'confidentiality') OR (j->'intake-form'->>'version')::int <> 2 THEN
    RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the member reads %', j;
  END IF;
  n := pg_temp.count_as(t, 't0196@test.local', format('SELECT count(*)::int FROM tlc_office_documents WHERE instance_id = %L', instP));
  IF n <> 2 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the member reads % rows directly, expected 2', n; END IF;
  n := pg_temp.count_as(t, 't0196@test.local', format('SELECT count(*)::int FROM tlc_office_document_history WHERE instance_id = %L', instP));
  IF n <> 0 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the member reads the history (% rows)', n; END IF;
  n := pg_temp.count_as(o, 'o0196@test.local', format('SELECT count(*)::int FROM tlc_office_document_history WHERE instance_id = %L', instP));
  IF n <> 3 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the owner reads % history rows, expected 3', n; END IF;

  -- a colleague with a packet (no membership) reads the live form; a stranger nothing
  j := pg_temp.json_as(o, 'o0196@test.local', 'SELECT public.tlc_onboarding_invite(''c0196@test.local'', ''smoke'')');
  v_token := j->>'token';
  j := pg_temp.json_as(c, 'c0196@test.local', format('SELECT public.tlc_onboarding_open(%L)', v_token));
  pkt := (j->>'packet_id')::uuid;
  IF pkt IS NULL THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the packet did not open'; END IF;
  j := pg_temp.json_as(c, 'c0196@test.local', 'SELECT public.tlc_office_documents_read(''tlc'')');
  IF NOT (j ? 'intake-form') THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the colleague with a packet cannot read the live form: %', j; END IF;
  j := pg_temp.json_as(s, 's0196@test.local', 'SELECT public.tlc_office_documents_read(''tlc'')');
  IF j <> '{}'::jsonb THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: a stranger reads the office forms: %', j; END IF;

  -- ── The live required question at submit ─────────────────────────────────
  j := pg_temp.json_as(c, 'c0196@test.local', format('SELECT public.tlc_onboarding_save(%L, %L::jsonb, NULL, NULL, true)', pkt, v_base));
  IF (j->>'submitted')::boolean IS DISTINCT FROM false OR NOT (j->'missing' ? 'x_pronouns') THEN
    RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: a submit without the office''s required question went through: %', j;
  END IF;
  j := pg_temp.json_as(c, 'c0196@test.local', format('SELECT public.tlc_onboarding_save(%L, %L::jsonb, NULL, NULL, true)', pkt, v_base || '{"x_pronouns":"she/her"}'::jsonb));
  IF j->>'status' <> 'submitted' THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the submit with the answer did not land: %', j; END IF;
  IF j->'packet'->>'x_pronouns' <> 'she/her' THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the custom answer was not kept'; END IF;

  SELECT count(*)::int INTO n FROM audit_log WHERE entity_type = 'tlc_office_document' AND instance_id = instP AND action = 'update' AND (to_value->>'version')::int = 2;
  IF n <> 1 THEN RAISE EXCEPTION 'TLC OFFICE FORMS SMOKE FAIL: the audit row for version 2 is missing (% rows)', n; END IF;

  RAISE NOTICE 'TLC OFFICE FORMS SMOKE: PASS';
END $$;

SELECT 'TLC OFFICE FORMS SMOKE: PASS' AS result;

ROLLBACK;
