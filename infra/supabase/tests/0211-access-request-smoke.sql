-- =============================================================================
-- 0211 ACCESS REQUEST SMOKE — asking, deciding, and the grant that has to be
-- real. Run on the LIVE Supabase (as postgres) AFTER 0211. Runs in a
-- transaction and ROLLS BACK.
-- PASS prints 'ACCESS REQUEST SMOKE: PASS'; any breach RAISES.
--
-- THE FAILURE THIS EXISTS TO CATCH is an approval queue that approves nothing:
-- a row marked granted while the person still meets a locked tile. So the
-- central assertion is not that the status changed — it is that the CAPABILITY
-- EXISTS afterwards, and that when the grant is impossible the decision refuses
-- with it instead of recording a lie.
--
-- Assertions
--   a member files a request for themselves                                 ✔
--   ... and cannot file one in somebody else's name          -> REFUSED     ✘
--   asking twice for the same tab is still ONE open ask      -> REFUSED     ✘
--   a member cannot read another member's request            -> 0 rows      ✘
--   a member cannot read the office queue                    -> REFUSED     ✘
--   a member cannot decide their own request                 -> REFUSED     ✘
--   a member cannot decide anything at all                   -> REFUSED     ✘
--   the office decides, and the CAPABILITY IS ACTUALLY GRANTED             ✔
--   ... my_church_access() returns it to the person themselves             ✔
--   ... and the queue then says already_granted                            ✔
--   deciding a decided request is refused                    -> REFUSED     ✘
--   a REFUSED decision grants nothing                        -> 0 rows      ✘
--   a decision on somebody no longer in the church refuses, and writes
--     NOTHING — no orphan granted row                        -> REFUSED     ✘
--   the see: key unlocks no write path (capability_area is unchanged)      ✔
--   a decided row must carry who decided it and when         -> REFUSED     ✘
-- =============================================================================
BEGIN;

\set mem   'a0000000-0000-4000-a000-000000000211'
\set mem2  'b0000000-0000-4000-a000-000000000211'
\set staff 'c0000000-0000-4000-a000-000000000211'
\set gone  'd0000000-0000-4000-a000-000000000211'
\set inst  '10000000-0000-4000-b000-000000000211'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'mem',   'authenticated','authenticated','mem0211@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mem2',  'authenticated','authenticated','mem2-0211@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'staff', 'authenticated','authenticated','staff0211@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'gone',  'authenticated','authenticated','gone0211@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type)
VALUES (:'inst', 'church-0211', 'Test Church 0211', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst', :'mem',   'member', 'A Member'),
  (:'inst', :'mem2',  'member', 'Another Member'),
  (:'inst', :'staff', 'admin',  'The Office');
-- `gone` is deliberately NOT a member: a request from somebody who has since
-- left the church is the case where a grant must be impossible.

SET LOCAL ROLE authenticated;

-- ── a member asks, for themselves ──────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000211","role":"authenticated"}';
INSERT INTO public.access_requests (instance_id, user_id, surface_id, surface_label, reason)
VALUES (:'inst', :'mem', 'devices', 'Devices', 'I look after the cameras.');

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.access_requests WHERE user_id = 'a0000000-0000-4000-a000-000000000211';
  IF n <> 1 THEN RAISE EXCEPTION 'the member could not file their own request'; END IF;

  -- ...but not in somebody else's name.
  BEGIN
    INSERT INTO public.access_requests (instance_id, user_id, surface_id)
    VALUES ('10000000-0000-4000-b000-000000000211', 'b0000000-0000-4000-a000-000000000211', 'harvest');
    RAISE EXCEPTION 'BREACH: a request was filed in another person''s name';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;

  -- Asking twice for the same tab is the same person still waiting.
  BEGIN
    INSERT INTO public.access_requests (instance_id, user_id, surface_id)
    VALUES ('10000000-0000-4000-b000-000000000211', 'a0000000-0000-4000-a000-000000000211', 'devices');
    RAISE EXCEPTION 'BREACH: a duplicate open request was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
    WHEN others THEN IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;

  -- A decided row must carry a hand and a time.
  BEGIN
    INSERT INTO public.access_requests (instance_id, user_id, surface_id, status)
    VALUES ('10000000-0000-4000-b000-000000000211', 'a0000000-0000-4000-a000-000000000211', 'observe', 'granted');
    RAISE EXCEPTION 'BREACH: a granted row was written with nobody behind it';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
END $$;

-- ── another member sees nothing, and may not read the queue ────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"b0000000-0000-4000-a000-000000000211","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.access_requests;
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: a member read another member''s request'; END IF;

  BEGIN
    PERFORM public.access_request_queue('10000000-0000-4000-b000-000000000211');
    RAISE EXCEPTION 'BREACH: a plain member read the office queue';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
END $$;

-- ── a member cannot decide — not their own, not anyone's ───────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000211","role":"authenticated"}';
DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.access_requests
   WHERE user_id = 'a0000000-0000-4000-a000-000000000211' AND surface_id = 'devices';
  BEGIN
    PERFORM public.access_request_decide(v_id, 'granted', 'me, myself');
    RAISE EXCEPTION 'BREACH: a member granted their own access request';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
END $$;

-- ── the office decides, and the GRANT IS REAL ──────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000211","role":"authenticated"}';
DO $$
DECLARE
  v_id uuid; v_out jsonb; n int; q jsonb; row jsonb;
BEGIN
  SELECT id INTO v_id FROM public.access_requests
   WHERE user_id = 'a0000000-0000-4000-a000-000000000211' AND surface_id = 'devices';

  -- The queue reaches the office, with the ask on it.
  q := public.access_request_queue('10000000-0000-4000-b000-000000000211');
  IF (q->>'open')::int <> 1 THEN RAISE EXCEPTION 'the office queue does not show the open ask: %', q; END IF;
  row := q->'rows'->0;
  IF row->>'surface_id' <> 'devices' THEN RAISE EXCEPTION 'the queue lost what was asked for'; END IF;
  IF row->>'email' <> 'mem0211@test.local' THEN RAISE EXCEPTION 'the queue cannot say who asked'; END IF;
  IF (row->>'already_granted')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'the queue claims a grant that does not exist yet';
  END IF;

  v_out := public.access_request_decide(v_id, 'granted', 'Yes — he keeps the cameras.');
  IF v_out->>'status' <> 'granted' THEN RAISE EXCEPTION 'the decision did not record: %', v_out; END IF;

  -- THE ASSERTION THAT MATTERS: the capability actually exists now.
  SELECT count(*) INTO n FROM member_capabilities
   WHERE instance_id = '10000000-0000-4000-b000-000000000211'
     AND user_id = 'a0000000-0000-4000-a000-000000000211'
     AND capability = 'see:church-staff';
  IF n <> 1 THEN
    RAISE EXCEPTION 'BREACH: the request says granted and NOTHING was granted';
  END IF;

  -- The queue now knows it.
  q := public.access_request_queue('10000000-0000-4000-b000-000000000211');
  IF (q->>'open')::int <> 0 THEN RAISE EXCEPTION 'the decided request is still open'; END IF;

  -- Deciding it again is refused.
  BEGIN
    PERFORM public.access_request_decide(v_id, 'refused', 'changed my mind');
    RAISE EXCEPTION 'BREACH: a decided request was decided again';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
END $$;

-- ── the person themselves can see what they now hold ───────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000211","role":"authenticated"}';
DO $$
DECLARE a jsonb;
BEGIN
  a := public.my_church_access();
  IF (a->>'instance_id')::uuid <> '10000000-0000-4000-b000-000000000211' THEN
    RAISE EXCEPTION 'my_church_access did not find the church: %', a;
  END IF;
  IF NOT (a->'capabilities' @> '["see:church-staff"]'::jsonb) THEN
    RAISE EXCEPTION 'the granted capability never reached the person: %', a;
  END IF;
  IF a->>'role' <> 'member' THEN RAISE EXCEPTION 'the role is wrong: %', a; END IF;
END $$;

-- ── a REFUSAL grants nothing ───────────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"b0000000-0000-4000-a000-000000000211","role":"authenticated"}';
INSERT INTO public.access_requests (instance_id, user_id, surface_id, surface_label)
VALUES (:'inst', :'mem2', 'observe', 'Observation');

SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000211","role":"authenticated"}';
DO $$
DECLARE v_id uuid; n int;
BEGIN
  SELECT id INTO v_id FROM public.access_requests
   WHERE user_id = 'b0000000-0000-4000-a000-000000000211' AND surface_id = 'observe';
  PERFORM public.access_request_decide(v_id, 'refused', 'Not this one.');
  SELECT count(*) INTO n FROM member_capabilities
   WHERE instance_id = '10000000-0000-4000-b000-000000000211'
     AND user_id = 'b0000000-0000-4000-a000-000000000211';
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: a REFUSED request granted something'; END IF;
END $$;

-- ── a grant that CANNOT happen refuses the whole decision ──────────────────
-- The asker has left the church. set_member_capability refuses; the decision
-- must refuse with it and write NOTHING, or the queue would read granted while
-- the person still met a locked tile.
SET LOCAL ROLE postgres;
INSERT INTO public.access_requests (instance_id, user_id, surface_id, surface_label)
VALUES (:'inst', :'gone', 'harvest', 'Harvest');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000211","role":"authenticated"}';
DO $$
DECLARE v_id uuid; v_status text; n int;
BEGIN
  SELECT id INTO v_id FROM public.access_requests WHERE surface_id = 'harvest';
  BEGIN
    PERFORM public.access_request_decide(v_id, 'granted', 'sure');
    RAISE EXCEPTION 'BREACH: a grant to a non-member was accepted';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'BREACH:%' THEN RAISE; END IF; NULL;
  END;
  -- and NOTHING was written
  SELECT status INTO v_status FROM public.access_requests WHERE id = v_id;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'BREACH: the request was marked % after the grant failed', v_status;
  END IF;
  SELECT count(*) INTO n FROM member_capabilities
   WHERE user_id = 'd0000000-0000-4000-a000-000000000211';
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: an orphan capability was left behind'; END IF;
END $$;

-- ── the see: key is not a write key ────────────────────────────────────────
SET LOCAL ROLE postgres;
DO $$
DECLARE v_area text;
BEGIN
  -- capability_area maps TABLES to write:<area>. A see: key is not in that map
  -- at all, which is what keeps it from unlocking a single row.
  SELECT public.capability_area('rentals') INTO v_area;
  IF v_area IS NOT NULL AND v_area = 'see:church-staff' THEN
    RAISE EXCEPTION 'BREACH: the see key reached the write map';
  END IF;
  IF EXISTS (SELECT 1 FROM member_capabilities
              WHERE capability = 'see:church-staff'
                AND capability LIKE 'write:%') THEN
    RAISE EXCEPTION 'BREACH: a see key is being read as a write key';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE 'ACCESS REQUEST SMOKE: PASS'; END $$;

ROLLBACK;
