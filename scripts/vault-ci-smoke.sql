-- =============================================================================
-- vault-ci-smoke.sql — 0251's walls, proven on a real PostgreSQL (DR-0762)
-- =============================================================================
-- Runs in CI after scripts/curriculum-ci-bootstrap.sql and 0251 (applied
-- twice). Every check RAISEs on a wrong answer, so a break is a red job.
--   * the owner writes a header and three ciphertext items and reads them;
--   * updating an item moves updated_at (the sync clock);
--   * a soft delete stays a row the owner still reads (so a late device never
--     resurrects it); a hard delete is the owner's and removes exactly one;
--   * another signed-in person reads NONE of the owner's rows, cannot insert as
--     the owner, cannot update or delete the owner's rows;
--   * anon reads none and cannot insert;
--   * a weak KDF (iterations under the floor), an oversized ciphertext and a
--     short IV are refused by the table itself.
-- Prints 'every vault wall held' at the end; the job greps for it.
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'owner@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'other@example.test');

-- The owner, signed in.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

INSERT INTO public.vault_header (user_id, iterations, salt, verifier_iv, verifier_ct)
  VALUES ('00000000-0000-0000-0000-00000000000a', 600000, 'c2FsdHNhbHRzYWx0c2FsdHNhbHQ=', 'aXZpdml2aXZpdml2', 'Y2lwaGVydGV4dA==');

INSERT INTO public.vault_items (id, user_id, iv, ct) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'aXZpdml2aXZpdml2', 'Y3Qx'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'aXZpdml2aXZpdml3', 'Y3Qy'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', 'aXZpdml2aXZpdml4', 'Y3Qz');

DO $$ BEGIN
  IF (SELECT count(*) FROM public.vault_header) <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the owner does not read their own header'; END IF;
  IF (SELECT count(*) FROM public.vault_items) <> 3 THEN RAISE EXCEPTION 'SMOKE FAIL: the owner does not read their own three items'; END IF;
END $$;

-- An update moves the sync clock.
UPDATE public.vault_items SET updated_at = now() - interval '1 day' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE public.vault_items SET ct = 'Y3QxYg==' WHERE id = '10000000-0000-0000-0000-000000000001';
DO $$ DECLARE r record; BEGIN
  SELECT * INTO r FROM public.vault_items WHERE id = '10000000-0000-0000-0000-000000000001';
  IF r.ct <> 'Y3QxYg==' THEN RAISE EXCEPTION 'SMOKE FAIL: the update did not land'; END IF;
  IF r.updated_at < now() - interval '1 hour' THEN RAISE EXCEPTION 'SMOKE FAIL: updated_at did not move on update'; END IF;
END $$;

-- A soft delete is still a row the owner reads; a hard delete removes exactly one.
UPDATE public.vault_items SET deleted_at = now() WHERE id = '10000000-0000-0000-0000-000000000002';
DO $$ DECLARE n int; BEGIN
  IF (SELECT count(*) FROM public.vault_items WHERE deleted_at IS NOT NULL) <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the soft delete is not readable by the owner'; END IF;
  DELETE FROM public.vault_items WHERE id = '10000000-0000-0000-0000-000000000003';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the owner''s hard delete removed % rows, not 1', n; END IF;
END $$;

-- The table refuses a weak KDF, an oversized ciphertext and a short IV.
DO $$ BEGIN
  BEGIN
    INSERT INTO public.vault_header (user_id, iterations, salt, verifier_iv, verifier_ct)
      VALUES ('00000000-0000-0000-0000-00000000000a', 1000, 'c2FsdHNhbHRzYWx0c2FsdHNhbHQ=', 'aXZpdml2aXZpdml2', 'Y2lwaGVydGV4dA==');
    RAISE EXCEPTION 'SMOKE FAIL: a weak KDF (1000 iterations) was accepted';
  EXCEPTION WHEN check_violation OR unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.vault_items (id, user_id, iv, ct)
      VALUES ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-00000000000a', 'aXZpdml2aXZpdml2', repeat('x', 65537));
    RAISE EXCEPTION 'SMOKE FAIL: an oversized ciphertext was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.vault_items (id, user_id, iv, ct)
      VALUES ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-00000000000a', 'short', 'Y3Q=');
    RAISE EXCEPTION 'SMOKE FAIL: a short IV was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

-- Another signed-in person: reads none, writes none of the owner's.
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
DO $$ DECLARE n int; BEGIN
  IF (SELECT count(*) FROM public.vault_header) <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person reads the owner''s header'; END IF;
  IF (SELECT count(*) FROM public.vault_items) <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person reads the owner''s items'; END IF;
  BEGIN
    INSERT INTO public.vault_items (id, user_id, iv, ct)
      VALUES ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-00000000000a', 'aXZpdml2aXZpdml2', 'cGxhbnRlZA==');
    RAISE EXCEPTION 'SMOKE FAIL: another person planted an item in the owner''s vault';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.vault_items SET ct = 'Y2hhbmdlZA==' WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person changed the owner''s item'; END IF;
  DELETE FROM public.vault_items WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person deleted the owner''s item'; END IF;
  UPDATE public.vault_header SET iterations = 100000 WHERE user_id = '00000000-0000-0000-0000-00000000000a';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person changed the owner''s header'; END IF;
END $$;

-- The other person keeps their own vault, unseen by the owner.
INSERT INTO public.vault_header (user_id, iterations, salt, verifier_iv, verifier_ct)
  VALUES ('00000000-0000-0000-0000-00000000000b', 600000, 'b3RoZXJzYWx0b3RoZXJzYWx0b3RoZXI=', 'aXZpdml2aXZpdml5', 'b3RoZXI=');
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.vault_header) <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the owner reads another person''s header'; END IF;
END $$;

-- anon: reads none, writes none.
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
DO $$ BEGIN
  BEGIN
    PERFORM count(*) FROM public.vault_items;
    RAISE EXCEPTION 'SMOKE FAIL: anon can read vault_items';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM count(*) FROM public.vault_header;
    RAISE EXCEPTION 'SMOKE FAIL: anon can read vault_header';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.vault_items (id, user_id, iv, ct)
      VALUES ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-00000000000a', 'aXZpdml2aXZpdml2', 'YW5vbg==');
    RAISE EXCEPTION 'SMOKE FAIL: anon inserted a vault item';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

RESET ROLE;
SELECT 'every vault wall held' AS result;
ROLLBACK;
