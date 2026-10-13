-- =============================================================================
-- 0202 OBLIGATIONS SMOKE — what is owed, what was paid, and the document that
-- proves it (0202, DR-0358). Run on the LIVE Supabase (as postgres) AFTER
-- 0200..0202. Runs in a transaction and ROLLS BACK.
-- PASS prints 'OBLIGATIONS SMOKE: PASS'; any wrong grant RAISES.
--
-- Scenario: household F — owner O, member M, CHILD C, assistant A, viewer V.
-- Household X — owner Z.
--
-- Assertions
--   O records a payable and a receivable                                    ✔
--   an amount of zero / a missing due basis                      -> REFUSED ✘
--   M (member) records                                           -> REFUSED ✘
--   V (viewer) records                                           -> REFUSED ✘
--   Z records into F's books                                     -> REFUSED ✘
--   C (child) and A (assistant) CANNOT READ the books at all     -> REFUSED ✘
--   M (member) CAN read                                                     ✔
--   O settles partly, then fully; settlements accumulate                    ✔
--   a settlement carrying a transaction links the bank row back             ✔
--   the same transaction settling twice                          -> REFUSED ✘
--   a transaction from another household                         -> REFUSED ✘
--   settling a VOID obligation                                   -> REFUSED ✘
--   a write-off with no reason                                   -> REFUSED ✘
--   a settlement UPDATE or DELETE by anyone                      -> REFUSED ✘
--   attaching a document another household owns                  -> REFUSED ✘
--   attaching an unshared document of another person             -> REFUSED ✘
--   routing a document: means + product + place, reversible                 ✔
--   routing someone else's document as a plain member            -> REFUSED ✘
--   every write audited                                                     ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000202'
\set m 'b0000000-0000-4000-a000-000000000202'
\set c 'c0000000-0000-4000-a000-000000000202'
\set a 'd0000000-0000-4000-a000-000000000202'
\set v 'e0000000-0000-4000-a000-000000000202'
\set z 'f0000000-0000-4000-a000-000000000202'
\set instF '10000000-0000-4000-b000-000000000202'
\set instX '20000000-0000-4000-b000-000000000202'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0202@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0202@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0202@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0202@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0202@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0202@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0202', 'The 0202 household', 'family'),
  (:'instX', 'fam-0202-x', 'Another household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',     'Owner O'),
  (:'instF', :'m', 'member',    'Member M'),
  (:'instF', :'c', 'child',     'Child C'),
  (:'instF', :'a', 'assistant', 'Assistant A'),
  (:'instF', :'v', 'viewer',    'Viewer V'),
  (:'instX', :'z', 'owner',     'Owner Z');

-- A bank row in each household's books, to settle against.
INSERT INTO accounts (id, instance_id, created_by, slug, display_name, account_type)
VALUES ('30000000-0000-4000-c000-000000000202', :'instF', :'o', 'acct-0202', 'Checking', 'checking'),
       ('31000000-0000-4000-c000-000000000202', :'instX', :'z', 'acct-0202x', 'Checking', 'checking');
INSERT INTO transactions (id, instance_id, created_by, account_id, txn_date, amount, description, slug)
VALUES ('40000000-0000-4000-d000-000000000202', :'instF', :'o', '30000000-0000-4000-c000-000000000202', '2026-09-05', -50.00, 'Ameren', 'txn-0202-a'),
       ('41000000-0000-4000-d000-000000000202', :'instF', :'o', '30000000-0000-4000-c000-000000000202', '2026-09-06', -75.00, 'Ameren rest', 'txn-0202-b'),
       ('42000000-0000-4000-d000-000000000202', :'instX', :'z', '31000000-0000-4000-c000-000000000202', '2026-09-06', -10.00, 'Theirs', 'txn-0202-x');

-- Documents on F's shelf: one O shared, one M keeps private.
INSERT INTO family_documents (id, instance_id, created_by, slug, category, label, where_filed, shared_with_household)
VALUES ('50000000-0000-4000-e000-000000000202', :'instF', :'o', 'ameren-bill-0202', 'money', 'Ameren bill', 'the post', true),
       ('51000000-0000-4000-e000-000000000202', :'instF', :'m', 'private-0202', 'money', 'M private note', 'the drawer', false),
       ('52000000-0000-4000-e000-000000000202', :'instX', :'z', 'theirs-0202', 'money', 'Their bill', 'their post', true);

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

CREATE OR REPLACE FUNCTION pg_temp.count_as(_who uuid, _email text, _sql text)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE c int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO c;
  PERFORM set_config('role', 'postgres', true);
  RETURN c;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000202';
  m uuid := 'b0000000-0000-4000-a000-000000000202';
  c uuid := 'c0000000-0000-4000-a000-000000000202';
  a uuid := 'd0000000-0000-4000-a000-000000000202';
  v uuid := 'e0000000-0000-4000-a000-000000000202';
  z uuid := 'f0000000-0000-4000-a000-000000000202';
  instF uuid := '10000000-0000-4000-b000-000000000202';
  txnA uuid := '40000000-0000-4000-d000-000000000202';
  txnB uuid := '41000000-0000-4000-d000-000000000202';
  txnX uuid := '42000000-0000-4000-d000-000000000202';
  docShared uuid := '50000000-0000-4000-e000-000000000202';
  docPrivate uuid := '51000000-0000-4000-e000-000000000202';
  docTheirs uuid := '52000000-0000-4000-e000-000000000202';
  j jsonb; n int; payable uuid; receivable uuid;
  v_pay text := '{"direction":"payable","counterparty":"Ameren","description":"Electric, August","amountCents":12500,"terms":"net-30","issuedOn":"2026-08-01","product":"poetech","place":"the house"}';
BEGIN
  -- ═══ RECORDING ═══════════════════════════════════════════════════════════
  j := pg_temp.json_as(o, 'o0202@test.local', format('SELECT public.obligation_record(%L::jsonb, %L)', v_pay, instF));
  payable := (j->>'id')::uuid;
  IF payable IS NULL OR (j->>'amount_cents')::bigint <> 12500 OR j->>'direction' <> 'payable' THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the payable did not record: %', j;
  END IF;
  j := pg_temp.json_as(o, 'o0202@test.local', format(
    'SELECT public.obligation_record(''{"direction":"receivable","counterparty":"Tenant at Maple","description":"September rent","amountCents":90000,"terms":"custom","dueDate":"2026-09-01","product":"properties","place":"Maple 2B"}''::jsonb, %L)', instF));
  receivable := (j->>'id')::uuid;
  IF receivable IS NULL OR j->>'direction' <> 'receivable' THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the receivable did not record'; END IF;

  -- The refusals that keep the ledger honest
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_record(''{"direction":"payable","counterparty":"X","description":"Y","amountCents":0,"terms":"net-30","issuedOn":"2026-08-01"}''::jsonb, %L)', instF)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: an amount of zero was recorded';
  END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_record(''{"direction":"payable","counterparty":"X","description":"Y","amountCents":100,"terms":"net-30"}''::jsonb, %L)', instF)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: an obligation with no basis for a due date was recorded';
  END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_record(''{"direction":"sideways","counterparty":"X","description":"Y","amountCents":100,"terms":"net-30","issuedOn":"2026-08-01"}''::jsonb, %L)', instF)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: an unknown direction was recorded';
  END IF;

  -- Who may keep the books
  IF pg_temp.as_user(m, 'm0202@test.local', format('SELECT public.obligation_record(%L::jsonb, %L)', v_pay, instF)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a member wrote the books';
  END IF;
  IF pg_temp.as_user(v, 'v0202@test.local', format('SELECT public.obligation_record(%L::jsonb, %L)', v_pay, instF)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a viewer wrote the books';
  END IF;
  IF pg_temp.as_user(z, 'z0202@test.local', format('SELECT public.obligation_record(%L::jsonb, %L)', v_pay, instF)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: another household wrote these books';
  END IF;

  -- ═══ THE ROLE WALL ═══════════════════════════════════════════════════════
  n := pg_temp.count_as(c, 'c0202@test.local', format('SELECT count(*)::int FROM obligations WHERE instance_id = %L', instF));
  IF n <> 0 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a child read % of the household debts', n; END IF;
  n := pg_temp.count_as(a, 'a0202@test.local', format('SELECT count(*)::int FROM obligations WHERE instance_id = %L', instF));
  IF n <> 0 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the assistant read % of the books', n; END IF;
  n := pg_temp.count_as(z, 'z0202@test.local', format('SELECT count(*)::int FROM obligations WHERE instance_id = %L', instF));
  IF n <> 0 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: another household read these books'; END IF;
  n := pg_temp.count_as(m, 'm0202@test.local', format('SELECT count(*)::int FROM obligations WHERE instance_id = %L', instF));
  IF n <> 2 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a member saw % obligations, expected 2', n; END IF;

  -- ═══ SETTLEMENT ══════════════════════════════════════════════════════════
  j := pg_temp.json_as(o, 'o0202@test.local', format('SELECT public.obligation_settle(%L, 5000, ''2026-09-05'', ''bank'', %L, NULL)', payable, txnA));
  IF (j->>'settled_cents')::bigint <> 5000 OR (j->>'balance_cents')::bigint <> 7500 THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the partial settlement did not land: %', j;
  END IF;
  -- The bank row now knows what it settled.
  SELECT count(*)::int INTO n FROM transactions WHERE id = txnA AND linked_to_kind = 'obligation' AND linked_to_id = payable;
  IF n <> 1 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the transaction was not tied back to its obligation'; END IF;

  j := pg_temp.json_as(o, 'o0202@test.local', format('SELECT public.obligation_settle(%L, 7500, ''2026-09-06'', ''bank'', %L, NULL)', payable, txnB));
  IF (j->>'settled_cents')::bigint <> 12500 OR (j->>'balance_cents')::bigint <> 0 THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: settlements did not accumulate: %', j;
  END IF;

  -- One bank row settles one obligation, once.
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_settle(%L, 100, ''2026-09-07'', NULL, %L, NULL)', receivable, txnA)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: one transaction settled two obligations';
  END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_settle(%L, 100, ''2026-09-07'', NULL, %L, NULL)', receivable, txnX)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a transaction from another household settled these books';
  END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_settle(%L, 0, ''2026-09-07'', NULL, NULL, NULL)', receivable)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a settlement of zero was accepted';
  END IF;
  IF pg_temp.as_user(m, 'm0202@test.local', format('SELECT public.obligation_settle(%L, 100, ''2026-09-07'', NULL, NULL, NULL)', receivable)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a member settled an obligation';
  END IF;

  -- APPEND-ONLY: a settlement can never be rewritten or removed, by anyone.
  IF pg_temp.as_user(o, 'o0202@test.local', format('UPDATE obligation_settlements SET amount_cents = 1 WHERE obligation_id = %L', payable)) THEN
    IF (SELECT sum(amount_cents) FROM obligation_settlements WHERE obligation_id = payable) <> 12500 THEN
      RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a settlement was rewritten';
    END IF;
  END IF;
  PERFORM pg_temp.as_user(o, 'o0202@test.local', format('DELETE FROM obligation_settlements WHERE obligation_id = %L', payable));
  SELECT count(*)::int INTO n FROM obligation_settlements WHERE obligation_id = payable;
  IF n <> 2 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a settlement was deleted (% left)', n; END IF;

  -- ═══ LIFECYCLE ═══════════════════════════════════════════════════════════
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_set_lifecycle(%L, ''written-off'', NULL)', receivable)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a write-off with no reason was accepted';
  END IF;
  j := pg_temp.json_as(o, 'o0202@test.local', format('SELECT public.obligation_set_lifecycle(%L, ''void'', ''billed in error'')', receivable));
  IF j->>'lifecycle' <> 'void' THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the void did not take'; END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_settle(%L, 100, ''2026-09-08'', NULL, NULL, NULL)', receivable)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a voided obligation was settled';
  END IF;

  -- ═══ THE PAPER ═══════════════════════════════════════════════════════════
  j := pg_temp.json_as(o, 'o0202@test.local', format('SELECT public.obligation_attach_document(%L, %L, ''the-bill'')', payable, docShared));
  IF j->>'role' <> 'the-bill' THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the bill would not attach'; END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_attach_document(%L, %L, ''supporting'')', payable, docTheirs)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a document from another household was attached';
  END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_attach_document(%L, %L, ''supporting'')', payable, docPrivate)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: another person''s unshared document was attached';
  END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.obligation_attach_document(%L, %L, ''whatever'')', payable, docShared)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: an unknown document role was accepted';
  END IF;

  -- ═══ THE DAY'S POST ══════════════════════════════════════════════════════
  j := pg_temp.json_as(o, 'o0202@test.local', format('SELECT public.document_route(%L, ''bill-to-pay'', ''properties'', ''Maple 2B'', ''2026-09-11'')', docShared));
  IF j->>'means' <> 'bill-to-pay' OR j->>'routed_product' <> 'properties' OR j->>'routed_place' <> 'Maple 2B' OR j->>'routed_at' IS NULL THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the document did not sort: %', j;
  END IF;
  -- Reversible: clearing it puts the document back in the day's pile.
  j := pg_temp.json_as(o, 'o0202@test.local', format('SELECT public.document_route(%L, NULL, NULL, NULL, NULL)', docShared));
  IF j->>'routed_at' IS NOT NULL OR j->>'means' IS NOT NULL THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: sorting could not be undone: %', j;
  END IF;
  IF pg_temp.as_user(o, 'o0202@test.local', format('SELECT public.document_route(%L, ''nonsense'', NULL, NULL, NULL)', docShared)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a document was sorted to a meaning that does not exist';
  END IF;
  -- The person who filed it may sort it; a plain member may not sort another's.
  IF NOT pg_temp.as_user(m, 'm0202@test.local', format('SELECT public.document_route(%L, ''for-the-record'', ''poetech'', NULL, NULL)', docPrivate)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a person could not sort their own document';
  END IF;
  IF pg_temp.as_user(m, 'm0202@test.local', format('SELECT public.document_route(%L, ''for-the-record'', ''poetech'', NULL, NULL)', docShared)) THEN
    RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: a member sorted a document they did not file';
  END IF;

  -- ═══ THE RECORD ══════════════════════════════════════════════════════════
  SELECT count(*)::int INTO n FROM audit_log WHERE instance_id = instF AND entity_type = 'obligation' AND action = 'create';
  IF n <> 2 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: expected 2 audited recordings, found %', n; END IF;
  SELECT count(*)::int INTO n FROM audit_log WHERE instance_id = instF AND entity_type = 'obligation' AND action = 'update' AND note = 'obligation_settle';
  IF n <> 2 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: expected 2 audited settlements, found %', n; END IF;
  SELECT count(*)::int INTO n FROM audit_log WHERE instance_id = instF AND entity_type = 'obligation' AND action = 'status-change';
  IF n <> 1 THEN RAISE EXCEPTION 'OBLIGATIONS SMOKE FAIL: the void was not audited'; END IF;

  RAISE NOTICE 'OBLIGATIONS SMOKE: PASS';
END $$;

SELECT 'OBLIGATIONS SMOKE: PASS' AS result;

ROLLBACK;
