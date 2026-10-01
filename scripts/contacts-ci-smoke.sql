-- =============================================================================
-- contacts-ci-smoke.sql — 0247's walls, proven on a real PostgreSQL (DR-0736)
-- =============================================================================
-- Runs in CI after scripts/curriculum-ci-bootstrap.sql and 0247 (applied
-- twice). Every check RAISEs on a wrong answer, so a break is a red job.
--   * the owner inserts two contacts and reads exactly two;
--   * bringing the same contact in again UPDATES the row (still two rows,
--     the name changed, updated_at set);
--   * another signed-in person reads none of them, cannot insert a row as the
--     owner, cannot update or delete the owner's rows;
--   * anon reads none and cannot insert;
--   * a blank contact key is refused.
-- Prints 'every wall held' at the end; the job greps for it.
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'owner@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'other@example.test');

-- The owner, signed in.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

INSERT INTO public.contacts (owner_id, contact_key, name, phones, emails, source) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'p:2175550142', 'Shay', ARRAY['(217) 555-0142'], ARRAY[]::text[], 'file'),
  ('00000000-0000-0000-0000-00000000000a', 'e:ann@example.test', 'Sister Ann', ARRAY[]::text[], ARRAY['ann@example.test'], 'picker');

DO $$ BEGIN
  IF (SELECT count(*) FROM public.contacts) <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the owner does not read their own two rows'; END IF;
END $$;

-- The same contact again: an update, not a third row.
INSERT INTO public.contacts (owner_id, contact_key, name, phones, source)
  VALUES ('00000000-0000-0000-0000-00000000000a', 'p:2175550142', 'Shay Poe', ARRAY['(217) 555-0142'], 'file')
  ON CONFLICT (owner_id, contact_key) DO UPDATE SET name = EXCLUDED.name, phones = EXCLUDED.phones, source = EXCLUDED.source;

DO $$ DECLARE r record; BEGIN
  IF (SELECT count(*) FROM public.contacts) <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: a re-import duplicated a contact'; END IF;
  SELECT * INTO r FROM public.contacts WHERE contact_key = 'p:2175550142';
  IF r.name <> 'Shay Poe' THEN RAISE EXCEPTION 'SMOKE FAIL: the re-import did not update the name (%)', r.name; END IF;
  IF r.updated_at IS NULL THEN RAISE EXCEPTION 'SMOKE FAIL: updated_at was not touched on update'; END IF;
END $$;

-- A blank key is refused.
DO $$ BEGIN
  BEGIN
    INSERT INTO public.contacts (owner_id, contact_key, name) VALUES ('00000000-0000-0000-0000-00000000000a', '  ', 'Nobody');
    RAISE EXCEPTION 'SMOKE FAIL: a blank contact key was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

-- Another person, signed in.
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

DO $$ DECLARE n int; BEGIN
  IF (SELECT count(*) FROM public.contacts) <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person can read the owner''s contacts'; END IF;
  BEGIN
    INSERT INTO public.contacts (owner_id, contact_key, name) VALUES ('00000000-0000-0000-0000-00000000000a', 'n:planted', 'Planted');
    RAISE EXCEPTION 'SMOKE FAIL: another person inserted a contact as the owner';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.contacts SET name = 'Changed' WHERE contact_key = 'p:2175550142';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person updated the owner''s contact'; END IF;
  DELETE FROM public.contacts WHERE contact_key = 'p:2175550142';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person deleted the owner''s contact'; END IF;
END $$;

-- Their own book is their own.
INSERT INTO public.contacts (owner_id, contact_key, name) VALUES ('00000000-0000-0000-0000-00000000000b', 'n:mine', 'Mine');
DO $$ BEGIN
  IF (SELECT count(*) FROM public.contacts) <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the other person does not read exactly their one row'; END IF;
END $$;

-- Anon: reads none, writes none.
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
DO $$ BEGIN
  BEGIN
    PERFORM count(*) FROM public.contacts;
    RAISE EXCEPTION 'SMOKE FAIL: anon can read contacts';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.contacts (owner_id, contact_key, name) VALUES ('00000000-0000-0000-0000-00000000000a', 'n:anon', 'Anon');
    RAISE EXCEPTION 'SMOKE FAIL: anon inserted a contact';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

-- The owner still has both, untouched by the other person.
DO $$ BEGIN
  IF (SELECT count(*) FROM public.contacts WHERE owner_id = '00000000-0000-0000-0000-00000000000a') <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the owner''s rows changed'; END IF;
  IF (SELECT name FROM public.contacts WHERE contact_key = 'p:2175550142') <> 'Shay Poe' THEN RAISE EXCEPTION 'SMOKE FAIL: the owner''s row was altered'; END IF;
END $$;

ROLLBACK;
\echo every wall held
