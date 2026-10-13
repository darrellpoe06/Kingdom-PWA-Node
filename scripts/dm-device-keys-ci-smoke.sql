-- =============================================================================
-- dm-device-keys-ci-smoke.sql — 0249's walls, proven on a real PostgreSQL (DR-0737)
-- =============================================================================
-- Runs in CI after scripts/curriculum-ci-bootstrap.sql and 0249 (applied
-- twice). Every check RAISEs on a wrong answer, so a break is a red job.
--   * one person publishes two devices and reads both; a second person
--     publishes one;
--   * the second person reads the first person's TWO device keys (a sender
--     needs every device of the recipient);
--   * publishing the same device again UPDATES the row (still two rows,
--     last_seen_at moved);
--   * forgetting a device deletes exactly that row;
--   * another person cannot insert a row as the owner, nor update or forget
--     the owner's devices;
--   * anon reads none and cannot insert;
--   * a device id shorter than 8 characters is refused.
-- Prints 'every wall held' at the end; the job greps for it.
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'darrell@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'shay@example.test');

-- Darrell, signed in: a phone and a desktop.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

INSERT INTO public.dm_device_keys (user_id, device_id, public_jwk, label) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'phone-aaaaaaaa', '{"kty":"EC","crv":"P-256","x":"a","y":"a"}', 'Galaxy Fold'),
  ('00000000-0000-0000-0000-00000000000a', 'desk-aaaaaaaaa', '{"kty":"EC","crv":"P-256","x":"b","y":"b"}', 'Tower');

DO $$ BEGIN
  IF (SELECT count(*) FROM public.dm_device_keys WHERE user_id = '00000000-0000-0000-0000-00000000000a') <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the owner does not read their own two devices'; END IF;
END $$;

-- The same phone again: an update, not a third row, and last_seen_at moves.
UPDATE public.dm_device_keys SET last_seen_at = now() - interval '1 day' WHERE device_id = 'phone-aaaaaaaa';
INSERT INTO public.dm_device_keys (user_id, device_id, public_jwk, label)
  VALUES ('00000000-0000-0000-0000-00000000000a', 'phone-aaaaaaaa', '{"kty":"EC","crv":"P-256","x":"a2","y":"a2"}', 'Galaxy Fold 7')
  ON CONFLICT (user_id, device_id) DO UPDATE SET public_jwk = EXCLUDED.public_jwk, label = EXCLUDED.label, last_seen_at = now();
DO $$ DECLARE r record; BEGIN
  IF (SELECT count(*) FROM public.dm_device_keys WHERE user_id = '00000000-0000-0000-0000-00000000000a') <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: re-publishing a device duplicated it'; END IF;
  SELECT * INTO r FROM public.dm_device_keys WHERE device_id = 'phone-aaaaaaaa';
  IF r.label <> 'Galaxy Fold 7' THEN RAISE EXCEPTION 'SMOKE FAIL: re-publishing did not update the label (%)', r.label; END IF;
  IF r.last_seen_at < now() - interval '1 hour' THEN RAISE EXCEPTION 'SMOKE FAIL: last_seen_at did not move on re-publish'; END IF;
END $$;

-- A short device id is refused.
DO $$ BEGIN
  BEGIN
    INSERT INTO public.dm_device_keys (user_id, device_id, public_jwk) VALUES ('00000000-0000-0000-0000-00000000000a', 'short', '{}');
    RAISE EXCEPTION 'SMOKE FAIL: a short device id was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

-- Shay, signed in: one phone; she reads Darrell's two devices.
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
INSERT INTO public.dm_device_keys (user_id, device_id, public_jwk, label) VALUES
  ('00000000-0000-0000-0000-00000000000b', 'phone-bbbbbbbb', '{"kty":"EC","crv":"P-256","x":"c","y":"c"}', 'Pixel');

DO $$ DECLARE n int; BEGIN
  IF (SELECT count(*) FROM public.dm_device_keys WHERE user_id = '00000000-0000-0000-0000-00000000000a') <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: a sender cannot read every device of the recipient'; END IF;
  IF (SELECT count(*) FROM public.dm_device_keys) <> 3 THEN RAISE EXCEPTION 'SMOKE FAIL: a signed-in person does not read all three device keys'; END IF;
  BEGIN
    INSERT INTO public.dm_device_keys (user_id, device_id, public_jwk) VALUES ('00000000-0000-0000-0000-00000000000a', 'planted-device', '{}');
    RAISE EXCEPTION 'SMOKE FAIL: another person published a device as the owner';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.dm_device_keys SET label = 'Changed' WHERE device_id = 'desk-aaaaaaaaa';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person updated the owner''s device'; END IF;
  DELETE FROM public.dm_device_keys WHERE device_id = 'desk-aaaaaaaaa';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person forgot the owner''s device'; END IF;
END $$;

-- Darrell forgets the desktop: exactly that row goes.
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
DELETE FROM public.dm_device_keys WHERE user_id = '00000000-0000-0000-0000-00000000000a' AND device_id = 'desk-aaaaaaaaa';
DO $$ BEGIN
  IF (SELECT count(*) FROM public.dm_device_keys WHERE user_id = '00000000-0000-0000-0000-00000000000a') <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: forgetting a device did not remove exactly one row'; END IF;
  IF (SELECT count(*) FROM public.dm_device_keys WHERE user_id = '00000000-0000-0000-0000-00000000000b') <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: forgetting my device touched another person''s'; END IF;
END $$;

-- Anon: reads none, writes none.
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
DO $$ BEGIN
  BEGIN
    PERFORM count(*) FROM public.dm_device_keys;
    RAISE EXCEPTION 'SMOKE FAIL: anon can read device keys';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.dm_device_keys (user_id, device_id, public_jwk) VALUES ('00000000-0000-0000-0000-00000000000a', 'anon-device-x', '{}');
    RAISE EXCEPTION 'SMOKE FAIL: anon published a device';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

ROLLBACK;
\echo every wall held
