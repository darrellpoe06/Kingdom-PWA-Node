-- =============================================================================
-- 0306 TENANT WINDOW SMOKE — a tenant sees their own tenancy, from the day it
-- became theirs (0306, DR-1159). Runs in a transaction and ROLLS BACK.
-- PASS prints 'TENANT WINDOW SMOKE: PASS'; any wrong sight RAISES.
--
-- Scenario: landlord instance F, owner O.
--   V  a vacant unit record (nobody on it). Ten days ago the landlord wrote on
--      it: a message, a note, a work order, a payment, a notice and a paper.
--      Then T claims it, and the landlord messages T.
--   E  an ENDED tenancy in J's name (j0306@...), a year old, with a message
--      from its tenancy. J claims it later; a stranger S claims E2, its twin.
--   H  a household member on V.
--
-- Assertions
--   V's window opens at the claim, not at the row's birth                 ✔
--   T reads the landlord's message after the claim and nothing before     ✔
--   T reads no vacancy-era note, work order, payment, notice or paper     ✔
--   T writes a message on V and reads it back                             ✔
--   H (household) reads what T reads, no more                             ✔
--   O (owner) reads every row, before and after                           ✔
--   J claiming the ended tenancy in their own name keeps all of it        ✔
--   S claiming an ended tenancy in someone else's name reads none of it   ✔
--   a row born with a person on it opens its window at birth              ✔
--   the landlord can set the window by hand, and it is kept               ✔
-- =============================================================================
BEGIN;

\set o  'a0000000-0000-4000-a000-000000000306'
\set t  'b0000000-0000-4000-a000-000000000306'
\set h  'c0000000-0000-4000-a000-000000000306'
\set j  'd0000000-0000-4000-a000-000000000306'
\set s  'e0000000-0000-4000-a000-000000000306'
\set instF '10000000-0000-4000-b000-000000000306'
\set v  '30000000-0000-4000-c000-000000000306'
\set e  '31000000-0000-4000-c000-000000000306'
\set e2 '32000000-0000-4000-c000-000000000306'
\set n  '33000000-0000-4000-c000-000000000306'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0306@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'t', 'authenticated','authenticated','t0306@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'h', 'authenticated','authenticated','h0306@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'j', 'authenticated','authenticated','j0306@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0306@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'land-0306', 'The 0306 landlord', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner', 'Owner O');

-- V: a vacant unit record, made a month ago.
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, status, created_at)
VALUES (:'v', :'instF', :'o', 'apt-2-0306', '805 Test Avenue', 'pending', now() - interval '30 days');

DO $$
DECLARE f timestamptz;
BEGIN
  SELECT tenant_from INTO f FROM rental_tenancies WHERE id = '30000000-0000-4000-c000-000000000306';
  IF f IS NOT NULL THEN RAISE EXCEPTION 'FAIL: a vacant unit record has a window (%)', f; END IF;
END $$;

-- Ten days ago, on the vacant record, the landlord's own business.
INSERT INTO tenant_messages (instance_id, tenancy_id, body, from_role, sender_user_id, sent_at)
VALUES (:'instF', :'v', 'Testing the process (vacant)', 'landlord', :'o', now() - interval '10 days');
INSERT INTO tenancy_notes (instance_id, tenancy_id, author_user_id, author_role, body, created_at)
VALUES (:'instF', :'v', :'o', 'landlord', 'The last tenant left it dirty and kept the keys', now() - interval '10 days');
INSERT INTO tenant_maintenance_requests (instance_id, tenancy_id, created_by, created_by_role, title, created_at)
VALUES (:'instF', :'v', :'o', 'landlord', 'Turn the unit', now() - interval '10 days');
INSERT INTO rent_records (instance_id, tenancy_id, amount, status, reported_by_role, reported_at)
VALUES (:'instF', :'v', 900, 'confirmed', 'landlord', now() - interval '10 days');
INSERT INTO tenant_notices (instance_id, tenancy_id, title, posted_at)
VALUES (:'instF', :'v', 'Vacancy inspection', now() - interval '10 days');
INSERT INTO property_documents (instance_id, tenancy_id, title, storage_path, uploaded_at)
VALUES (:'instF', :'v', 'Move-out inspection', 'x/y.pdf', now() - interval '10 days');

-- T claims V (what 0151's claim does), then the landlord writes to T.
UPDATE rental_tenancies SET tenant_user_id = :'t' WHERE id = :'v';
INSERT INTO tenant_messages (instance_id, tenancy_id, body, from_role, sender_user_id, sent_at)
VALUES (:'instF', :'v', 'Welcome home', 'landlord', :'o', now() + interval '1 minute');
INSERT INTO tenancy_household (instance_id, tenancy_id, member_user_id, display_name, added_by)
VALUES (:'instF', :'v', :'h', 'Household H', :'o');

-- E: an ENDED tenancy in J's name, a year old; E2 its twin in another name.
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, tenant_name, tenant_email, status, created_at)
VALUES (:'e',  :'instF', :'o', 'apt-3-0306', 'J', 'J0306@test.local', 'ended', now() - interval '400 days'),
       (:'e2', :'instF', :'o', 'apt-4-0306', 'Somebody else', 'else0306@test.local', 'ended', now() - interval '400 days');
INSERT INTO tenant_messages (instance_id, tenancy_id, body, from_role, sender_user_id, sent_at)
VALUES (:'instF', :'e',  'Rent is late', 'landlord', :'o', now() - interval '100 days'),
       (:'instF', :'e2', 'Rent is late', 'landlord', :'o', now() - interval '100 days');
UPDATE rental_tenancies SET tenant_user_id = :'j' WHERE id = :'e';
UPDATE rental_tenancies SET tenant_user_id = :'s' WHERE id = :'e2';

-- N: born with a person on it.
INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, tenant_name, status, created_at)
VALUES (:'n', :'instF', :'o', 'apt-5-0306', 'New tenant', 'active', now() - interval '5 days');

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
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated', 'email', _email)::text, true);
  EXECUTE _sql INTO n;
  PERFORM set_config('role', 'postgres', true);
  RETURN n;
END $$;

DO $$
DECLARE
  o uuid := 'a0000000-0000-4000-a000-000000000306';
  t uuid := 'b0000000-0000-4000-a000-000000000306';
  h uuid := 'c0000000-0000-4000-a000-000000000306';
  j uuid := 'd0000000-0000-4000-a000-000000000306';
  s uuid := 'e0000000-0000-4000-a000-000000000306';
  v text := '30000000-0000-4000-c000-000000000306';
  e text := '31000000-0000-4000-c000-000000000306';
  e2 text := '32000000-0000-4000-c000-000000000306';
  n uuid := '33000000-0000-4000-c000-000000000306';
  got int;
  f timestamptz;
  born timestamptz;
BEGIN
  -- The window opened at the claim (this transaction's now()), not at birth.
  SELECT tenant_from INTO f FROM rental_tenancies WHERE id = v::uuid;
  IF f IS DISTINCT FROM now() THEN RAISE EXCEPTION 'FAIL: V''s window opened at % (expected the claim, %)', f, now(); END IF;

  -- T: the message after the claim, nothing before it.
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM tenant_messages WHERE tenancy_id = %L', v));
  IF got <> 1 THEN RAISE EXCEPTION 'FAIL: the new tenant read % messages on V (expected 1: only after their claim)', got; END IF;
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM tenancy_notes WHERE tenancy_id = %L', v));
  IF got <> 0 THEN RAISE EXCEPTION 'FAIL: the new tenant read % vacancy-era notes', got; END IF;
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM tenant_maintenance_requests WHERE tenancy_id = %L', v));
  IF got <> 0 THEN RAISE EXCEPTION 'FAIL: the new tenant read % vacancy-era work orders', got; END IF;
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM rent_records WHERE tenancy_id = %L', v));
  IF got <> 0 THEN RAISE EXCEPTION 'FAIL: the new tenant read % vacancy-era payments', got; END IF;
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM tenant_notices WHERE tenancy_id = %L', v));
  IF got <> 0 THEN RAISE EXCEPTION 'FAIL: the new tenant read % vacancy-era notices', got; END IF;
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM property_documents WHERE tenancy_id = %L', v));
  IF got <> 0 THEN RAISE EXCEPTION 'FAIL: the new tenant read % vacancy-era papers', got; END IF;

  -- T writes and reads their own message back (the insert returns through
  -- the narrowed SELECT).
  IF NOT pg_temp.as_user(t, 't0306@test.local', format(
      'INSERT INTO tenant_messages (instance_id, tenancy_id, body, from_role, sender_user_id) VALUES (%L, %L, %L, %L, %L) RETURNING id',
      '10000000-0000-4000-b000-000000000306', v, 'The sink drips', 'tenant', t)) THEN
    RAISE EXCEPTION 'FAIL: the tenant could not write a message on their own tenancy';
  END IF;
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM tenant_messages WHERE tenancy_id = %L', v));
  IF got <> 2 THEN RAISE EXCEPTION 'FAIL: the tenant read % messages after writing one (expected 2)', got; END IF;

  -- H: the household reads what the tenant reads.
  got := pg_temp.count_as(h, 'h0306@test.local', format('SELECT count(*)::int FROM tenant_messages WHERE tenancy_id = %L', v));
  IF got <> 2 THEN RAISE EXCEPTION 'FAIL: the household read % messages on V (expected 2)', got; END IF;
  got := pg_temp.count_as(h, 'h0306@test.local', format('SELECT count(*)::int FROM tenancy_notes WHERE tenancy_id = %L', v));
  IF got <> 0 THEN RAISE EXCEPTION 'FAIL: the household read % vacancy-era notes', got; END IF;

  -- O: the landlord reads everything, before and after.
  got := pg_temp.count_as(o, 'o0306@test.local', format('SELECT count(*)::int FROM tenant_messages WHERE tenancy_id = %L', v));
  IF got <> 3 THEN RAISE EXCEPTION 'FAIL: the landlord read % messages on V (expected 3)', got; END IF;
  got := pg_temp.count_as(o, 'o0306@test.local', format('SELECT count(*)::int FROM tenancy_notes WHERE tenancy_id = %L', v));
  IF got <> 1 THEN RAISE EXCEPTION 'FAIL: the landlord read % notes on V (expected 1)', got; END IF;
  got := pg_temp.count_as(o, 'o0306@test.local', format('SELECT count(*)::int FROM property_documents WHERE tenancy_id = %L', v));
  IF got <> 1 THEN RAISE EXCEPTION 'FAIL: the landlord read % papers on V (expected 1)', got; END IF;

  -- J claimed the ended tenancy in their own name: all of it is theirs.
  got := pg_temp.count_as(j, 'j0306@test.local', format('SELECT count(*)::int FROM tenant_messages WHERE tenancy_id = %L', e));
  IF got <> 1 THEN RAISE EXCEPTION 'FAIL: the tenant the ended tenancy names read % of its messages (expected 1)', got; END IF;

  -- S claimed an ended tenancy in someone else's name: none of it.
  got := pg_temp.count_as(s, 's0306@test.local', format('SELECT count(*)::int FROM tenant_messages WHERE tenancy_id = %L', e2));
  IF got <> 0 THEN RAISE EXCEPTION 'FAIL: a stranger on an ended tenancy read % of the old tenant''s messages', got; END IF;

  -- N, born with a person on it, opens its window at birth.
  SELECT tenant_from, created_at INTO f, born FROM rental_tenancies WHERE id = n;
  IF f IS DISTINCT FROM born THEN RAISE EXCEPTION 'FAIL: a tenancy born with a tenant opened its window at %, not at birth %', f, born; END IF;

  -- The landlord moves V's window back by hand; it is kept, and T sees more.
  UPDATE rental_tenancies SET tenant_from = now() - interval '20 days' WHERE id = v::uuid;
  SELECT tenant_from INTO f FROM rental_tenancies WHERE id = v::uuid;
  IF f IS DISTINCT FROM now() - interval '20 days' THEN RAISE EXCEPTION 'FAIL: the landlord''s window was not kept (%)', f; END IF;
  got := pg_temp.count_as(t, 't0306@test.local', format('SELECT count(*)::int FROM tenancy_notes WHERE tenancy_id = %L', v));
  IF got <> 1 THEN RAISE EXCEPTION 'FAIL: after the landlord opened the window, the tenant read % notes (expected 1)', got; END IF;

  RAISE NOTICE 'TENANT WINDOW SMOKE: PASS';
END $$;

ROLLBACK;
