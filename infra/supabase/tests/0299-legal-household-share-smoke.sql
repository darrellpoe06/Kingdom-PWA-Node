-- =============================================================================
-- 0299 SMOKE — a household shares its legal papers only when the filer says so
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'LEGAL HOUSEHOLD SHARE SMOKE: PASS'.
-- Runs on the live database (rls-isolation, leg legal-household); every
-- account and instance here is a test row inside this rollback.
--
--   A files two papers in household H: d1 private, d2 shared (with a file).
--   B is a member of H, V a viewer of H, X a stranger with a household of
--   their own.
--     B reads the shared list                 -> d2 only                     ✔
--     B reads the TABLE                       -> 0 rows (creator-only kept)  ✔
--     B may open d2's file, not d1's          -> true / false                ✔
--     A reads the shared list                 -> 0 (never your own rows)     ✔
--     V (viewer) reads the shared list        -> 0                           ✘
--     X reads the shared list / opens d2      -> 0 / false                   ✘
--     B updates or deletes d2                 -> 0 rows (the pen stays)      ✘
--     X files a SHARED paper into H           -> refused by RLS              ✘
--     A un-shares d2                          -> B reads 0, cannot open      ✔
--     A re-shares, then leaves H              -> B reads 0                   ✔
-- =============================================================================
BEGIN;

\set a '00000000-0000-4000-a000-0000000a0299'
\set b '00000000-0000-4000-a000-0000000b0299'
\set v '00000000-0000-4000-a000-0000000c0299'
\set x '00000000-0000-4000-a000-0000000d0299'
\set h '00000000-0000-4000-b000-000000010299'
\set hx '00000000-0000-4000-b000-000000020299'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0299@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'b', 'authenticated','authenticated','b0299@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'v', 'authenticated','authenticated','v0299@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'x', 'authenticated','authenticated','x0299@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'h',  'hh-0299', 'Household 0299 (smoke)', 'family'),
  (:'hx', 'hx-0299', 'Stranger household 0299 (smoke)', 'family');

INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'h',  :'a', 'owner',  'Filer A'),
  (:'h',  :'b', 'member', 'Member B'),
  (:'h',  :'v', 'viewer', 'Viewer V'),
  (:'hx', :'x', 'owner',  'Stranger X');

INSERT INTO legal_documents (instance_id, created_by, slug, category, doc_type, label, privileged, where_filed, storage_path, shared_with_household) VALUES
  (:'h', :'a', 'ld-0299-private', 'business', 'Operating agreement', 'A private paper 0299', true, 'fire safe', NULL, false),
  (:'h', :'a', 'ld-0299-shared',  'business', 'Reinstatement filing', 'A shared paper 0299', true, NULL, '00000000-0000-4000-a000-0000000a0299/ld-0299-shared.pdf', true);

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.as_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_temp.as_postgres() TO authenticated;

DO $$
DECLARE
  a uuid := '00000000-0000-4000-a000-0000000a0299';
  b uuid := '00000000-0000-4000-a000-0000000b0299';
  v uuid := '00000000-0000-4000-a000-0000000c0299';
  x uuid := '00000000-0000-4000-a000-0000000d0299';
  h uuid := '00000000-0000-4000-b000-000000010299';
  p_shared  text := '00000000-0000-4000-a000-0000000a0299/ld-0299-shared.pdf';
  n int;
  lbl text;
  who text;
  ok boolean;
BEGIN
  -- B, a member, sees exactly the shared paper, named for who shared it.
  PERFORM pg_temp.as_user(b);
  SELECT count(*), max(label), max(shared_by) INTO n, lbl, who FROM public.household_shared_legal_documents();
  IF n <> 1 OR lbl <> 'A shared paper 0299' THEN
    RAISE EXCEPTION '0299: a member read % shared rows (%), expected the one shared paper', n, lbl;
  END IF;
  IF who <> 'Filer A' THEN RAISE EXCEPTION '0299: shared_by read %, expected Filer A', who; END IF;

  -- The table itself stays creator-only: the device sync cannot see A's rows.
  SELECT count(*) INTO n FROM public.legal_documents;
  IF n <> 0 THEN RAISE EXCEPTION '0299: a member read % rows from the TABLE; the sync would ingest them', n; END IF;

  -- The file opens for B while shared; a private path never does.
  IF NOT public.legal_object_shared_with_me(p_shared) THEN
    RAISE EXCEPTION '0299: a member cannot open the shared file';
  END IF;
  IF public.legal_object_shared_with_me('00000000-0000-4000-a000-0000000a0299/not-shared.pdf') THEN
    RAISE EXCEPTION '0299: a member opened a path no shared row names';
  END IF;

  -- The pen stays with the filer.
  UPDATE public.legal_documents SET label = 'rewritten by B' WHERE slug = 'ld-0299-shared';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION '0299: a member rewrote a shared paper'; END IF;
  DELETE FROM public.legal_documents WHERE slug = 'ld-0299-shared';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION '0299: a member deleted a shared paper'; END IF;

  -- The filer never sees their own rows in the household list.
  PERFORM pg_temp.as_user(a);
  SELECT count(*) INTO n FROM public.household_shared_legal_documents();
  IF n <> 0 THEN RAISE EXCEPTION '0299: the filer read % of their own rows as shared', n; END IF;

  -- A viewer is not the household for privileged paper.
  PERFORM pg_temp.as_user(v);
  SELECT count(*) INTO n FROM public.household_shared_legal_documents();
  IF n <> 0 THEN RAISE EXCEPTION '0299: a viewer read % shared legal rows', n; END IF;

  -- A stranger reads nothing and opens nothing (the NULL-role class).
  PERFORM pg_temp.as_user(x);
  SELECT count(*) INTO n FROM public.household_shared_legal_documents();
  IF n <> 0 THEN RAISE EXCEPTION '0299: a stranger read % shared legal rows', n; END IF;
  IF public.legal_object_shared_with_me(p_shared) THEN
    RAISE EXCEPTION '0299: a stranger opened the shared file';
  END IF;

  -- A stranger cannot aim a SHARED paper at a household that is not theirs.
  ok := false;
  BEGIN
    INSERT INTO public.legal_documents (instance_id, created_by, slug, category, label, privileged, where_filed, shared_with_household)
      VALUES (h, x, 'ld-0299-intruder', 'business', 'pushed in 0299', false, 'nowhere', true);
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN ok := true;
  END;
  IF NOT ok THEN RAISE EXCEPTION '0299: a stranger filed a shared paper into another household'; END IF;

  -- Un-sharing closes both the list and the file.
  PERFORM pg_temp.as_user(a);
  UPDATE public.legal_documents SET shared_with_household = false WHERE slug = 'ld-0299-shared';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION '0299: the filer could not un-share their own paper'; END IF;
  PERFORM pg_temp.as_user(b);
  SELECT count(*) INTO n FROM public.household_shared_legal_documents();
  IF n <> 0 THEN RAISE EXCEPTION '0299: an un-shared paper is still listed (% rows)', n; END IF;
  IF public.legal_object_shared_with_me(p_shared) THEN
    RAISE EXCEPTION '0299: an un-shared file still opens';
  END IF;

  -- A filer who leaves the household takes their papers with them.
  PERFORM pg_temp.as_user(a);
  UPDATE public.legal_documents SET shared_with_household = true WHERE slug = 'ld-0299-shared';
  PERFORM pg_temp.as_postgres();
  DELETE FROM instance_members WHERE instance_id = h AND user_id = a;
  PERFORM pg_temp.as_user(b);
  SELECT count(*) INTO n FROM public.household_shared_legal_documents();
  IF n <> 0 THEN RAISE EXCEPTION '0299: a departed filer''s paper is still shared (% rows)', n; END IF;

  PERFORM pg_temp.as_postgres();
  RAISE NOTICE 'LEGAL HOUSEHOLD SHARE SMOKE: PASS';
END $$;

ROLLBACK;
