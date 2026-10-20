-- =============================================================================
-- 0304 WITHDRAW MY WORDS SMOKE — only the writer withdraws, the children
-- follow, a built row refuses, the sweep leaves a withdrawn row alone (DR-1137)
-- =============================================================================
-- Run as postgres AFTER scripts/curriculum-ci-bootstrap.sql,
-- scripts/withdraw-ci-bootstrap.sql and 0304, in a transaction that ROLLS BACK.
-- PROVES:
--   a member of the same house cannot withdraw another's row (42501);
--   an outsider cannot (42501); anon cannot call it at all;
--   the writer withdraws their own waiting recording, and its transcript child
--   is marked with it, both stamped withdrawn@<time>;
--   withdrawing twice changes nothing; a child row and a captured row refuse;
--   the stale sweep alarms a waiting row and NOT a withdrawn one, NOT a reading
--   (not-a-lesson); after undo the row alarms again (proven-to-catch: the
--   exclusion is the tag, nothing else), and the undo stamps restored@<time>.
-- PASS prints 'WITHDRAW MY WORDS SMOKE: PASS'; any leak or miss RAISES.
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-a000-000000000304', 'authenticated','authenticated','writer0304@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000304', 'authenticated','authenticated','member0304@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-a000-000000000304', 'authenticated','authenticated','outsider0304@test.local','', now(), now());
INSERT INTO public.instances (id, slug) VALUES
  ('f0000000-0000-4000-b000-000000000304', 'house-0304'),
  ('f0000000-0000-4000-b000-000000010304', 'other-house-0304');
INSERT INTO public.instance_members (instance_id, user_id, role) VALUES
  ('f0000000-0000-4000-b000-000000000304', 'a0000000-0000-4000-a000-000000000304', 'owner'),
  ('f0000000-0000-4000-b000-000000000304', 'b0000000-0000-4000-a000-000000000304', 'member'),
  ('f0000000-0000-4000-b000-000000010304', 'c0000000-0000-4000-a000-000000000304', 'owner');

-- Rows are written as postgres (the smoke tests the move, not the insert).
--   r1  the writer's spoken lesson, waiting, 10 hours old   (withdrawn below)
--   r1t its transcript child (of:r1)
--   r2  the writer's typed lesson, already captured         (must refuse)
--   r3  the member's typed lesson, 10 hours old             (the sweep's control: alarms)
--   r4  the writer's reading, not-a-lesson, 10 hours old    (never alarms)
INSERT INTO public.agent_inbox (id, instance_id, body, tags, created_by, created_at) VALUES
  ('d0000000-0000-4000-a000-0000000a0304', 'f0000000-0000-4000-b000-000000000304', 'Lesson. A spoken lesson (28:24)', '["lesson","voice","audio:a/1.webm"]', 'a0000000-0000-4000-a000-000000000304', now() - interval '10 hours'),
  ('d0000000-0000-4000-a000-0000000b0304', 'f0000000-0000-4000-b000-000000000304', 'Lesson. transcribed words', '["lesson","voice-transcript","of:d0000000-0000-4000-a000-0000000a0304","whisper:nas-cpu"]', 'a0000000-0000-4000-a000-000000000304', now() - interval '9 hours'),
  ('d0000000-0000-4000-a000-0000000c0304', 'f0000000-0000-4000-b000-000000000304', 'Lesson. typed and built', '["lesson","lesson-captured","lesson-id:ll900"]', 'a0000000-0000-4000-a000-000000000304', now() - interval '3 days'),
  ('d0000000-0000-4000-a000-0000000d0304', 'f0000000-0000-4000-b000-000000000304', 'Lesson. the member waits', '["lesson"]', 'b0000000-0000-4000-a000-000000000304', now() - interval '10 hours'),
  ('d0000000-0000-4000-a000-0000000e0304', 'f0000000-0000-4000-b000-000000000304', 'Lesson. a reading (3:00)', '["lesson","voice","reading-aloud","not-a-lesson"]', 'a0000000-0000-4000-a000-000000000304', now() - interval '10 hours');

-- Call as a signed-in person; the SQLSTATE comes back as text when it refuses.
CREATE OR REPLACE FUNCTION pg_temp.try_as(_who uuid, _row uuid, _undo boolean)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE out jsonb;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  BEGIN
    out := public.withdraw_my_inbox_row(_row, _undo);
  EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN 'ERR ' || SQLSTATE;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN out::text;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.try_anon(_row uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE out jsonb;
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '', true);
  BEGIN
    out := public.withdraw_my_inbox_row(_row, false);
  EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('role', 'postgres', true);
    RETURN 'ERR ' || SQLSTATE;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN out::text;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.tags_of(_row uuid) RETURNS jsonb LANGUAGE sql AS $$
  SELECT tags FROM public.agent_inbox WHERE id = _row $$;

CREATE OR REPLACE FUNCTION pg_temp.swept() RETURNS text LANGUAGE sql AS $$
  SELECT coalesce(string_agg(right(s.id::text, 5), ',' ORDER BY s.id), '')
    FROM public.lesson_inbox_stale_sweep(4, 24, now()) s $$;

DO $$
DECLARE
  W  constant uuid := 'a0000000-0000-4000-a000-000000000304';
  M  constant uuid := 'b0000000-0000-4000-a000-000000000304';
  O  constant uuid := 'c0000000-0000-4000-a000-000000000304';
  R1 constant uuid := 'd0000000-0000-4000-a000-0000000a0304';
  R1T constant uuid := 'd0000000-0000-4000-a000-0000000b0304';
  R2 constant uuid := 'd0000000-0000-4000-a000-0000000c0304';
  R3 constant uuid := 'd0000000-0000-4000-a000-0000000d0304';
  R4 constant uuid := 'd0000000-0000-4000-a000-0000000e0304';
  got text; t jsonb;
BEGIN
  -- 1. Not yours: the same house's member, an outsider, anon.
  got := pg_temp.try_as(M, R1, false);
  IF got <> 'ERR 42501' THEN RAISE EXCEPTION 'LEAK: a member withdrew another''s row: %', got; END IF;
  got := pg_temp.try_as(O, R1, false);
  IF got <> 'ERR 42501' THEN RAISE EXCEPTION 'LEAK: an outsider withdrew a row: %', got; END IF;
  got := pg_temp.try_anon(R1);
  IF got NOT LIKE 'ERR %' THEN RAISE EXCEPTION 'LEAK: anon withdrew a row: %', got; END IF;
  IF (pg_temp.tags_of(R1) ? 'withdrawn') THEN RAISE EXCEPTION 'LEAK: the row was marked by a refused call'; END IF;

  -- 2. The writer withdraws; the child follows; both stamped.
  got := pg_temp.try_as(W, R1, false);
  IF got NOT LIKE '{%' THEN RAISE EXCEPTION 'FAIL: the writer could not withdraw their own row: %', got; END IF;
  IF (got::jsonb->>'withdrawn') <> 'true' OR (got::jsonb->>'rows') <> '2' THEN RAISE EXCEPTION 'FAIL: expected withdrawn=true over 2 rows, got %', got; END IF;
  t := pg_temp.tags_of(R1);
  IF NOT (t ? 'withdrawn') OR NOT (t ? 'lesson') OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(t) x WHERE x.value LIKE 'withdrawn@%Z') THEN
    RAISE EXCEPTION 'FAIL: the parent is not marked and stamped: %', t; END IF;
  t := pg_temp.tags_of(R1T);
  IF NOT (t ? 'withdrawn') OR NOT (t ? 'voice-transcript') OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(t) x WHERE x.value LIKE 'withdrawn@%Z') THEN
    RAISE EXCEPTION 'FAIL: the transcript child did not follow: %', t; END IF;
  IF (pg_temp.tags_of(R3) ? 'withdrawn') THEN RAISE EXCEPTION 'LEAK: another person''s row was marked'; END IF;

  -- 3. Twice changes nothing; a child refuses; a captured row refuses.
  got := pg_temp.try_as(W, R1, false);
  IF (got::jsonb->>'changed') <> 'false' THEN RAISE EXCEPTION 'FAIL: a second withdraw changed something: %', got; END IF;
  got := pg_temp.try_as(W, R1T, false);
  IF got NOT LIKE 'ERR %' THEN RAISE EXCEPTION 'FAIL: a child row was withdrawn on its own: %', got; END IF;
  got := pg_temp.try_as(W, R2, false);
  IF got NOT LIKE 'ERR %' THEN RAISE EXCEPTION 'FAIL: a captured row was withdrawn: %', got; END IF;
  IF (pg_temp.tags_of(R2) ? 'withdrawn') THEN RAISE EXCEPTION 'FAIL: the captured row was marked'; END IF;

  -- 4. The sweep: the member's waiting row alarms; the withdrawn one and the reading do not.
  got := pg_temp.swept();
  IF got <> 'd0304' THEN RAISE EXCEPTION 'FAIL: the sweep alarmed % (expected only the waiting row d0304)', got; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(pg_temp.tags_of(R1)) x WHERE x.value LIKE 'stale-alarm@%') THEN RAISE EXCEPTION 'FAIL: a withdrawn row was stale-alarmed'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(pg_temp.tags_of(R4)) x WHERE x.value LIKE 'stale-alarm@%') THEN RAISE EXCEPTION 'FAIL: a reading (not-a-lesson) was stale-alarmed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(pg_temp.tags_of(R3)) x WHERE x.value LIKE 'stale-alarm@%') THEN RAISE EXCEPTION 'FAIL: the waiting row was not alarmed (the sweep itself is broken)'; END IF;
  IF (SELECT count(*) FROM public.push_outbox WHERE target_user = M AND kind = 'lesson') <> 1 THEN RAISE EXCEPTION 'FAIL: the waiting row''s person was not pushed once'; END IF;
  IF (SELECT count(*) FROM public.push_outbox WHERE target_user = W) <> 0 THEN RAISE EXCEPTION 'FAIL: the writer was pushed for a withdrawn row or a reading'; END IF;

  -- 5. Undo: the member cannot; the writer can; the tag goes, the stamp stays; the child follows.
  got := pg_temp.try_as(M, R1, true);
  IF got <> 'ERR 42501' THEN RAISE EXCEPTION 'LEAK: a member restored another''s row: %', got; END IF;
  got := pg_temp.try_as(W, R1, true);
  IF (got::jsonb->>'withdrawn') <> 'false' OR (got::jsonb->>'rows') <> '2' THEN RAISE EXCEPTION 'FAIL: undo: %', got; END IF;
  t := pg_temp.tags_of(R1);
  IF (t ? 'withdrawn') OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(t) x WHERE x.value LIKE 'restored@%Z') OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(t) x WHERE x.value LIKE 'withdrawn@%Z') THEN
    RAISE EXCEPTION 'FAIL: undo did not restore the parent with both stamps kept: %', t; END IF;
  t := pg_temp.tags_of(R1T);
  IF (t ? 'withdrawn') OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(t) x WHERE x.value LIKE 'restored@%Z') THEN
    RAISE EXCEPTION 'FAIL: undo did not restore the child: %', t; END IF;
  got := pg_temp.try_as(W, R1, true);
  IF (got::jsonb->>'changed') <> 'false' THEN RAISE EXCEPTION 'FAIL: a second undo changed something: %', got; END IF;

  -- 6. PROVEN-TO-CATCH: restored, the row alarms on the next sweep (the
  --    member's row sits inside its repeat window and is skipped).
  got := pg_temp.swept();
  IF got <> 'a0304' THEN RAISE EXCEPTION 'FAIL: after undo the sweep alarmed % (expected the restored row a0304 alone)', got; END IF;

  RAISE NOTICE 'WITHDRAW MY WORDS SMOKE: PASS';
END $$;

ROLLBACK;
