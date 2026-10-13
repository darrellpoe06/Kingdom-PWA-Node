-- =============================================================================
-- 0255 ADD-USER-TO-INSTANCE SMOKE — the governor makes an account that already
-- exists family, and the ceiling holds (DR-0829). Runs after the chain, in a
-- transaction, and ROLLS BACK. PASS prints 'ADD USER SMOKE: PASS'; any breach
-- RAISES.
--
-- Assertions
--   an owner adds an existing account as member; the row and the audit exist  ✔
--   adding again at the same role is a noop (one row, no second grant)        ✔
--   the owner raises them to admin; audit says grant                          ✔
--   an ADMIN cannot grant admin                                -> REFUSED     ✘
--   an admin CAN add a member                                                 ✔
--   a plain member cannot add anyone                           -> REFUSED     ✘
--   nobody can add themselves                                  -> REFUSED     ✘
--   'owner' is not a grantable role                            -> REFUSED     ✘
--   an owner's row is never touched                            -> REFUSED     ✘
--   an account that does not exist is refused                  -> REFUSED     ✘
--   a stranger (no row in the space) cannot add                -> REFUSED     ✘
--   the person's own self-serve space is untouched                           ✔
-- =============================================================================
BEGIN;

\set own    'a0000000-0000-4000-a000-000000000255'
\set adm    'b0000000-0000-4000-a000-000000000255'
\set mem    'c0000000-0000-4000-a000-000000000255'
\set newbie 'd0000000-0000-4000-a000-000000000255'
\set strng  'e0000000-0000-4000-a000-000000000255'
\set fam    '10000000-0000-4000-b000-000000000255'
\set own2   '20000000-0000-4000-b000-000000000255'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'own',    'authenticated','authenticated','own0255@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'adm',    'authenticated','authenticated','adm0255@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mem',    'authenticated','authenticated','mem0255@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'newbie', 'authenticated','authenticated','14475550255@phone.poetech.us','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'strng',  'authenticated','authenticated','strng0255@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'fam',  'family-0255', 'Test Family 0255', 'family'),
  (:'own2', 'u-newbie-0255', 'Newbie''s own space', 'family');

INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'fam',  :'own',    'owner',  'The Owner'),
  (:'fam',  :'adm',    'admin',  'The Admin'),
  (:'fam',  :'mem',    'member', 'A Member'),
  (:'own2', :'newbie', 'owner',  'Newbie, in their own space');

SET LOCAL ROLE authenticated;

-- The RPC is called as the authenticated role (so the GRANT is proven); the
-- row counts are read after RESET ROLE, because the tables' own walls are not
-- what this smoke proves and the claims setting survives the role switch.
-- ── the owner adds the newbie as member, by the contact's name ──────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000255","role":"authenticated"}';
DO $$ DECLARE r jsonb; BEGIN
  r := public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'd0000000-0000-4000-a000-000000000255', 'member', 'Christyn (test)');
  IF r->>'status' <> 'added' OR r->>'role' <> 'member' THEN RAISE EXCEPTION 'SMOKE FAIL: add did not report added/member (%)', r; END IF;
END $$;
RESET ROLE;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM instance_members WHERE instance_id = '10000000-0000-4000-b000-000000000255' AND user_id = 'd0000000-0000-4000-a000-000000000255' AND role = 'member' AND display_name = 'Christyn (test)';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the member row was not written as asked (% rows)', n; END IF;
  SELECT count(*) INTO n FROM audit_log WHERE instance_id = '10000000-0000-4000-b000-000000000255' AND note = 'add_user_to_instance' AND action = 'permission-grant';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the grant was not audited (% rows)', n; END IF;
END $$;

-- ── again at the same role: noop, still one row, no second audit ────────────
SET LOCAL ROLE authenticated;
DO $$ DECLARE r jsonb; BEGIN
  r := public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'd0000000-0000-4000-a000-000000000255', 'member');
  IF r->>'status' <> 'noop' THEN RAISE EXCEPTION 'SMOKE FAIL: a repeat add was not a noop (%)', r; END IF;
END $$;
RESET ROLE;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM instance_members WHERE instance_id = '10000000-0000-4000-b000-000000000255' AND user_id = 'd0000000-0000-4000-a000-000000000255';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: a repeat add duplicated the row (%)', n; END IF;
  SELECT count(*) INTO n FROM audit_log WHERE instance_id = '10000000-0000-4000-b000-000000000255' AND note = 'add_user_to_instance';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: a noop was audited (% rows)', n; END IF;
END $$;

-- ── the owner raises them to admin ──────────────────────────────────────────
SET LOCAL ROLE authenticated;
DO $$ DECLARE r jsonb; BEGIN
  r := public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'd0000000-0000-4000-a000-000000000255', 'admin');
  IF r->>'status' <> 'changed' OR r->>'role' <> 'admin' THEN RAISE EXCEPTION 'SMOKE FAIL: the owner could not make them admin (%)', r; END IF;
END $$;
RESET ROLE;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM audit_log WHERE instance_id = '10000000-0000-4000-b000-000000000255' AND note = 'add_user_to_instance' AND action = 'permission-grant';
  IF n <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the admin grant was not audited as a grant (% rows)', n; END IF;
END $$;

-- ── owner-only refusals ─────────────────────────────────────────────────────
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'd0000000-0000-4000-a000-000000000255', 'owner');
    RAISE EXCEPTION 'SMOKE FAIL: owner was accepted as a grantable role';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'SMOKE FAIL%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'a0000000-0000-4000-a000-000000000255', 'member');
    RAISE EXCEPTION 'SMOKE FAIL: the owner added themselves';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'SMOKE FAIL%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'f0000000-0000-4000-a000-000000000255', 'member');
    RAISE EXCEPTION 'SMOKE FAIL: an account that does not exist was added';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'SMOKE FAIL%' THEN RAISE; END IF;
  END;
END $$;

-- ── the admin: may add a member, may not grant admin, may not touch the owner ─
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"b0000000-0000-4000-a000-000000000255","role":"authenticated"}';
DO $$ DECLARE r jsonb; BEGIN
  r := public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'e0000000-0000-4000-a000-000000000255', 'member');
  IF r->>'status' <> 'added' THEN RAISE EXCEPTION 'SMOKE FAIL: an admin could not add a member (%)', r; END IF;
  BEGIN
    PERFORM public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'e0000000-0000-4000-a000-000000000255', 'admin');
    RAISE EXCEPTION 'SMOKE FAIL: an admin granted admin';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'SMOKE FAIL%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'a0000000-0000-4000-a000-000000000255', 'viewer');
    RAISE EXCEPTION 'SMOKE FAIL: an owner''s row was changed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'SMOKE FAIL%' THEN RAISE; END IF;
  END;
END $$;

-- ── a plain member, and a stranger, add nobody ──────────────────────────────
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000255","role":"authenticated"}';
DO $$ BEGIN
  BEGIN
    PERFORM public.add_user_to_instance('10000000-0000-4000-b000-000000000255', 'd0000000-0000-4000-a000-000000000255', 'viewer');
    RAISE EXCEPTION 'SMOKE FAIL: a plain member added someone';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'SMOKE FAIL%' THEN RAISE; END IF;
  END;
END $$;
SET LOCAL "request.jwt.claims" TO '{"sub":"e0000000-0000-4000-a000-000000000255","role":"authenticated"}';
DO $$ BEGIN
  BEGIN
    PERFORM public.add_user_to_instance('20000000-0000-4000-b000-000000000255', 'c0000000-0000-4000-a000-000000000255', 'member');
    RAISE EXCEPTION 'SMOKE FAIL: a stranger added someone to a space they are not in';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'SMOKE FAIL%' THEN RAISE; END IF;
  END;
END $$;

-- ── the newbie's own space is exactly as it was ─────────────────────────────
RESET ROLE;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM instance_members WHERE instance_id = '20000000-0000-4000-b000-000000000255' AND user_id = 'd0000000-0000-4000-a000-000000000255' AND role = 'owner';
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the person''s own space was changed'; END IF;
  SELECT count(*) INTO n FROM instance_members WHERE user_id = 'd0000000-0000-4000-a000-000000000255';
  IF n <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the person should be in exactly two spaces (own + family), found %', n; END IF;
END $$;

SELECT 'ADD USER SMOKE: PASS' AS result;
ROLLBACK;
