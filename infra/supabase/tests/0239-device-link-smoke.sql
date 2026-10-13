-- =============================================================================
-- 0239 DEVICE LINK SMOKE — the TV signs in only through a signed-in phone (DR-0658)
-- =============================================================================
-- Run as postgres AFTER applying 0222 and 0239, in a transaction that ROLLS
-- BACK. PROVES:
--   - anon can start a link and poll it, and reads NOTHING from device_link;
--   - anon cannot describe, decide or claim; a signed-in person cannot claim;
--   - approve -> the service role claims once -> a second claim finds nothing;
--   - the user_code, passed where the hash belongs, claims nothing;
--   - deny -> the claim finds nothing and the poll says denied;
--   - an expired link cannot be approved or claimed;
--   - the 21st look-up in ten minutes is refused (rate-limited).
-- PASS prints 'DEVICE LINK SMOKE: PASS'; any wrong grant RAISES.
-- =============================================================================
BEGIN;

\set a 'a0000000-0000-4000-a000-000000000239'
\set b 'b0000000-0000-4000-a000-000000000239'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0239@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'b', 'authenticated','authenticated','b0239@test.local','', now(), now());

-- Run _sql as a role (anon / authenticated / service_role) with an optional
-- signed-in subject. True when it ran, false when it raised.
CREATE OR REPLACE FUNCTION pg_temp.as_role(_role text, _who uuid, _sql text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', _role, true);
  PERFORM set_config('request.jwt.claims',
    CASE WHEN _who IS NULL THEN json_build_object('role', _role)::text
         ELSE json_build_object('sub', _who, 'role', _role)::text END, true);
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN true;
END $$;

-- Same, returning a single text value (NULL when there is no row).
CREATE OR REPLACE FUNCTION pg_temp.text_as(_role text, _who uuid, _sql text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  PERFORM set_config('role', _role, true);
  PERFORM set_config('request.jwt.claims',
    CASE WHEN _who IS NULL THEN json_build_object('role', _role)::text
         ELSE json_build_object('sub', _who, 'role', _role)::text END, true);
  EXECUTE _sql INTO v;
  PERFORM set_config('role', 'postgres', true);
  RETURN v;
END $$;

DO $$
DECLARE
  a uuid := 'a0000000-0000-4000-a000-000000000239';
  b uuid := 'b0000000-0000-4000-a000-000000000239';
  h1 text := repeat('1', 64);
  h2 text := repeat('2', 64);
  h3 text := repeat('3', 64);
  c1 text := 'ACDEFGHJ';
  c2 text := 'KMNPQRTU';
  c3 text := 'VWXY3467';
  v text;
  i int;
BEGIN
  -- anon starts three links.
  IF NOT pg_temp.as_role('anon', NULL, format('SELECT * FROM public.device_link_start(%L, %L, ''Fire TV'')', h1, c1)) THEN
    RAISE EXCEPTION 'FAIL: anon could not start a link';
  END IF;
  PERFORM pg_temp.as_role('anon', NULL, format('SELECT * FROM public.device_link_start(%L, %L, ''Fire TV'')', h2, c2));
  PERFORM pg_temp.as_role('anon', NULL, format('SELECT * FROM public.device_link_start(%L, %L, ''Fire TV'')', h3, c3));

  -- A malformed code or hash is refused.
  IF pg_temp.as_role('anon', NULL, format('SELECT * FROM public.device_link_start(%L, ''abc'', ''x'')', repeat('4', 64))) THEN
    RAISE EXCEPTION 'FAIL: a malformed user_code was stored';
  END IF;

  -- anon reads nothing from the table: the short code must not find the long one.
  IF pg_temp.as_role('anon', NULL, 'SELECT device_hash FROM public.device_link LIMIT 1')
     AND pg_temp.text_as('anon', NULL, 'SELECT count(*)::text FROM public.device_link') <> '0' THEN
    RAISE EXCEPTION 'FAIL: anon can read device_link rows';
  END IF;
  IF pg_temp.as_role('authenticated', a, 'SELECT device_hash FROM public.device_link LIMIT 1')
     AND pg_temp.text_as('authenticated', a, 'SELECT count(*)::text FROM public.device_link') <> '0' THEN
    RAISE EXCEPTION 'FAIL: a signed-in person can read device_link rows';
  END IF;

  -- anon cannot describe, decide or claim.
  IF pg_temp.as_role('anon', NULL, format('SELECT * FROM public.device_link_describe(%L)', c1)) THEN
    RAISE EXCEPTION 'FAIL: anon can describe a link';
  END IF;
  IF pg_temp.as_role('anon', NULL, format('SELECT public.device_link_decide(%L, true)', c1)) THEN
    RAISE EXCEPTION 'FAIL: anon can approve a link';
  END IF;
  IF pg_temp.as_role('anon', NULL, format('SELECT * FROM public.device_link_claim(%L)', h1)) THEN
    RAISE EXCEPTION 'FAIL: anon can call device_link_claim';
  END IF;

  -- A signed-in person approves c1 and sees what they approve.
  v := pg_temp.text_as('authenticated', a, format('SELECT device_label FROM public.device_link_describe(%L)', c1));
  IF v IS DISTINCT FROM 'Fire TV' THEN
    RAISE EXCEPTION 'FAIL: describe did not show the device label (got %)', v;
  END IF;
  v := pg_temp.text_as('authenticated', a, format('SELECT public.device_link_decide(%L, true)::text', c1));
  IF v <> 'true' THEN
    RAISE EXCEPTION 'FAIL: a signed-in person could not approve';
  END IF;
  v := pg_temp.text_as('anon', NULL, format('SELECT state FROM public.device_link_poll(%L)', h1));
  IF v <> 'approved' THEN
    RAISE EXCEPTION 'FAIL: poll says % after approval', v;
  END IF;

  -- Even signed in, nobody but the service role claims.
  IF pg_temp.as_role('authenticated', a, format('SELECT * FROM public.device_link_claim(%L)', h1)) THEN
    RAISE EXCEPTION 'FAIL: a signed-in person can call device_link_claim';
  END IF;

  -- The user_code where the hash belongs claims nothing.
  v := pg_temp.text_as('service_role', NULL, format('SELECT user_id::text FROM public.device_link_claim(%L)', c1));
  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: the user_code alone claimed a session';
  END IF;

  -- The service role claims once, and only once.
  v := pg_temp.text_as('service_role', NULL, format('SELECT user_id::text FROM public.device_link_claim(%L)', h1));
  IF v IS DISTINCT FROM a::text THEN
    RAISE EXCEPTION 'FAIL: the claim did not return the approver (got %)', v;
  END IF;
  v := pg_temp.text_as('service_role', NULL, format('SELECT user_id::text FROM public.device_link_claim(%L)', h1));
  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: a second claim succeeded';
  END IF;
  -- A consumed link cannot be approved again.
  v := pg_temp.text_as('authenticated', b, format('SELECT public.device_link_decide(%L, true)::text', c1));
  IF v <> 'false' THEN
    RAISE EXCEPTION 'FAIL: a consumed link was approved again';
  END IF;

  -- Deny leaves the TV with nothing to claim.
  PERFORM pg_temp.text_as('authenticated', a, format('SELECT public.device_link_decide(%L, false)::text', c2));
  v := pg_temp.text_as('anon', NULL, format('SELECT state FROM public.device_link_poll(%L)', h2));
  IF v <> 'denied' THEN
    RAISE EXCEPTION 'FAIL: poll says % after deny', v;
  END IF;
  v := pg_temp.text_as('service_role', NULL, format('SELECT user_id::text FROM public.device_link_claim(%L)', h2));
  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: a denied link was claimed';
  END IF;

  -- An expired link cannot be approved or claimed.
  UPDATE public.device_link SET expires_at = now() - interval '1 second' WHERE device_hash = h3;
  v := pg_temp.text_as('authenticated', a, format('SELECT public.device_link_decide(%L, true)::text', c3));
  IF v <> 'false' THEN
    RAISE EXCEPTION 'FAIL: an expired link was approved';
  END IF;
  UPDATE public.device_link SET approved_at = now(), user_id = a WHERE device_hash = h3;
  v := pg_temp.text_as('service_role', NULL, format('SELECT user_id::text FROM public.device_link_claim(%L)', h3));
  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: an expired link was claimed';
  END IF;

  -- The per-person meter: b has used 1 decision; 19 more look-ups pass, the next is refused.
  FOR i IN 1..19 LOOP
    IF NOT pg_temp.as_role('authenticated', b, format('SELECT * FROM public.device_link_describe(%L)', c3)) THEN
      RAISE EXCEPTION 'FAIL: look-up % was refused under the limit', i;
    END IF;
  END LOOP;
  IF pg_temp.as_role('authenticated', b, format('SELECT * FROM public.device_link_describe(%L)', c3)) THEN
    RAISE EXCEPTION 'FAIL: the 21st look-up in ten minutes was allowed';
  END IF;

  RAISE NOTICE 'DEVICE LINK SMOKE: PASS';
END $$;

ROLLBACK;
