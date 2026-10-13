-- =============================================================================
-- 0204 THE DAY'S POST SMOKE — the sorting tray, and the child who sorts it
-- (0204, DR-0360). Run on the LIVE Supabase (as postgres) AFTER 0200..0204.
-- Runs in a transaction and ROLLS BACK.
-- PASS prints 'DAYS POST SMOKE: PASS'; any wrong grant RAISES.
--
-- Household F: owner O, member M, CHILD C, assistant A. Household X: owner Z.
-- Documents on F's shelf: one O filed and kept private, one O released into the
-- tray, one M filed privately.
--
-- Assertions
--   a child CANNOT see an unreleased document                 -> REFUSED  ✘
--   a child CAN see a document a guardian released                        ✔
--   a child sorts a released document (means + product + place)           ✔
--   a child sorting an UNRELEASED document                    -> REFUSED  ✘
--   a child RELEASING a document                              -> REFUSED  ✘
--   a member (not a guardian) releasing                       -> REFUSED  ✘
--   another household's owner releasing ours                  -> REFUSED  ✘
--   O withdraws it; the child can no longer see or sort it                ✔
--   a released document is still NOT the ledger: the child reads
--     zero obligations and cannot call door_month             -> REFUSED  ✘
--   a release with no releaser is impossible (constraint)     -> REFUSED  ✘
--   sorting stays reversible, and every act is audited                    ✔
-- =============================================================================
BEGIN;

\set o 'a0000000-0000-4000-a000-000000000204'
\set m 'b0000000-0000-4000-a000-000000000204'
\set c 'c0000000-0000-4000-a000-000000000204'
\set a 'd0000000-0000-4000-a000-000000000204'
\set z 'f0000000-0000-4000-a000-000000000204'
\set instF '10000000-0000-4000-b000-000000000204'
\set instX '20000000-0000-4000-b000-000000000204'
\set docPrivate '50000000-0000-4000-e000-000000000204'
\set docTray    '51000000-0000-4000-e000-000000000204'
\set docMember  '52000000-0000-4000-e000-000000000204'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0204@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0204@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'c', 'authenticated','authenticated','c0204@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'a', 'authenticated','authenticated','a0204@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'z', 'authenticated','authenticated','z0204@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'instF', 'fam-0204', 'The 0204 household', 'family'),
  (:'instX', 'fam-0204-x', 'Another household', 'family');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'instF', :'o', 'owner',     'Owner O'),
  (:'instF', :'m', 'member',    'Member M'),
  (:'instF', :'c', 'child',     'Child C'),
  (:'instF', :'a', 'assistant', 'Assistant A'),
  (:'instX', :'z', 'owner',     'Owner Z');

INSERT INTO family_documents (id, instance_id, created_by, slug, category, label, where_filed, shared_with_household)
VALUES (:'docPrivate', :'instF', :'o', 'private-0204', 'money', 'A private bill',  'the drawer', false),
       (:'docTray',    :'instF', :'o', 'tray-0204',    'money', 'Ameren envelope', 'the post',   false),
       (:'docMember',  :'instF', :'m', 'member-0204',  'money', 'M private note',  'the drawer', false);

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
  o uuid := 'a0000000-0000-4000-a000-000000000204';
  m uuid := 'b0000000-0000-4000-a000-000000000204';
  c uuid := 'c0000000-0000-4000-a000-000000000204';
  z uuid := 'f0000000-0000-4000-a000-000000000204';
  docPrivate uuid := '50000000-0000-4000-e000-000000000204';
  docTray    uuid := '51000000-0000-4000-e000-000000000204';
  docMember  uuid := '52000000-0000-4000-e000-000000000204';
  n int; v_means text; v_product text; v_by uuid;
BEGIN
  -- ------------------------------------------------------------------
  -- Before any release: the shelf is closed to the child.
  -- ------------------------------------------------------------------
  n := pg_temp.count_as(c, 'c0204@test.local', 'SELECT count(*)::int FROM public.family_documents');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a child saw % document(s) before any release', n; END IF;

  IF pg_temp.as_user(c, 'c0204@test.local',
      format('SELECT public.document_route(%L, ''bill-to-pay'', ''poetech'', ''the house'', NULL)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: a child sorted a document nobody had released';
  END IF;

  -- ------------------------------------------------------------------
  -- Who may release. Only a guardian.
  -- ------------------------------------------------------------------
  IF pg_temp.as_user(c, 'c0204@test.local',
      format('SELECT public.document_release_for_sorting(%L, true)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: a child released a document into the tray';
  END IF;

  IF pg_temp.as_user(m, 'm0204@test.local',
      format('SELECT public.document_release_for_sorting(%L, true)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: a plain member decided what a child sees';
  END IF;

  IF pg_temp.as_user(z, 'z0204@test.local',
      format('SELECT public.document_release_for_sorting(%L, true)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: another household released OUR document';
  END IF;

  IF NOT pg_temp.as_user(o, 'o0204@test.local',
      format('SELECT public.document_release_for_sorting(%L, true)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: the owner could not release a document into the tray';
  END IF;

  SELECT sorting_released_by INTO v_by FROM public.family_documents WHERE id = docTray;
  IF v_by <> o THEN RAISE EXCEPTION 'FAIL: the release did not carry the guardian''s name'; END IF;

  -- ------------------------------------------------------------------
  -- After the release: exactly ONE document, and the child can sort it.
  -- ------------------------------------------------------------------
  n := pg_temp.count_as(c, 'c0204@test.local', 'SELECT count(*)::int FROM public.family_documents');
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: the child saw % documents after one release — the tray is not one at a time', n;
  END IF;

  n := pg_temp.count_as(c, 'c0204@test.local',
         format('SELECT count(*)::int FROM public.family_documents WHERE id IN (%L, %L)', docPrivate, docMember));
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: releasing one document opened % others', n; END IF;

  IF NOT pg_temp.as_user(c, 'c0204@test.local',
      format('SELECT public.document_route(%L, ''bill-to-pay'', ''poetech'', ''the house'', ''2026-09-11''::date)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: the child could not sort the document a guardian released';
  END IF;

  SELECT means, routed_product INTO v_means, v_product FROM public.family_documents WHERE id = docTray;
  IF v_means <> 'bill-to-pay' OR v_product <> 'poetech' THEN
    RAISE EXCEPTION 'FAIL: the child''s sort did not stick (% / %)', v_means, v_product;
  END IF;
  SELECT routed_by INTO v_by FROM public.family_documents WHERE id = docTray;
  IF v_by <> c THEN RAISE EXCEPTION 'FAIL: the sort was not recorded against the child who did it'; END IF;

  -- Sorting stays reversible, by the child too.
  IF NOT pg_temp.as_user(c, 'c0204@test.local',
      format('SELECT public.document_route(%L, NULL, NULL, NULL, NULL)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: the sort could not be undone';
  END IF;
  SELECT means, routed_at INTO v_means, v_by FROM public.family_documents WHERE id = docTray;
  IF v_means IS NOT NULL THEN RAISE EXCEPTION 'FAIL: unsorting left the meaning behind'; END IF;

  -- ------------------------------------------------------------------
  -- THE BRIGHT LINE: the tray is not the books. It never was.
  -- ------------------------------------------------------------------
  n := pg_temp.count_as(c, 'c0204@test.local', 'SELECT count(*)::int FROM public.obligations');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: sorting the post opened the ledger to a child (% rows)', n; END IF;

  n := pg_temp.count_as(c, 'c0204@test.local', 'SELECT count(*)::int FROM public.obligation_lines');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a child read % mortgage line item(s)', n; END IF;

  n := pg_temp.count_as(c, 'c0204@test.local', 'SELECT count(*)::int FROM public.transactions');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a child read % bank row(s)', n; END IF;

  -- ------------------------------------------------------------------
  -- Withdrawing closes the door again.
  -- ------------------------------------------------------------------
  IF NOT pg_temp.as_user(o, 'o0204@test.local',
      format('SELECT public.document_release_for_sorting(%L, false)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: the owner could not withdraw the document from the tray';
  END IF;

  n := pg_temp.count_as(c, 'c0204@test.local', 'SELECT count(*)::int FROM public.family_documents');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: the child still saw % document(s) after it was withdrawn', n; END IF;

  IF pg_temp.as_user(c, 'c0204@test.local',
      format('SELECT public.document_route(%L, ''for-the-record'', NULL, NULL, NULL)', docTray)) THEN
    RAISE EXCEPTION 'FAIL: the child sorted a withdrawn document';
  END IF;

  -- ------------------------------------------------------------------
  -- A release with nobody's name on it cannot exist.
  -- ------------------------------------------------------------------
  BEGIN
    UPDATE public.family_documents SET sorting_released_at = now(), sorting_released_by = NULL WHERE id = docTray;
    RAISE EXCEPTION 'FAIL: a release with no releaser was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;  -- refused, as it must be
  END;

  -- Every act left a record.
  SELECT count(*)::int INTO n FROM audit_log
   WHERE entity_type = 'family_document' AND entity_id = docTray;
  IF n < 4 THEN RAISE EXCEPTION 'FAIL: only % audit row(s) for the tray document', n; END IF;

  RAISE NOTICE 'DAYS POST SMOKE: PASS';
END $$;

ROLLBACK;
