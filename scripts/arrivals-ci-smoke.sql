-- =============================================================================
-- arrivals-ci-smoke.sql — 0246 proven on a real PostgreSQL (DR-0728)
-- =============================================================================
-- Run by the CI `arrivals-push` job after the two bootstraps and 0246 applied
-- twice. Every check RAISEs on a wrong answer, so a break is a red job, never a
-- quiet pass. One transaction, rolled back: nothing is left behind.
--
-- It proves what the enqueue promises:
--   * an INSERT never enqueues (the builder has not started);
--   * gaining `awaiting-review` enqueues ONE row for the row's own person, kind
--     lesson, with the key lesson:<row>:ready and the Your lessons landing;
--   * the transcript row of the same teaching (of:<id>) gaining the same tag
--     enqueues NOTHING more (one push per teaching per event);
--   * an unrelated tag change enqueues nothing;
--   * gaining `lesson-published` enqueues the second row, keyed :published;
--   * a row that is not a lesson enqueues nothing;
--   * the person reads their own outbox rows and nobody else's; anon reads none.
-- And what the stale alarm (0252, DR-0771) promises:
--   * a ROOT lesson row waiting longer than the first window is alarmed once:
--     its tags gain stale-alarm@<time>, one push for its own person keyed
--     lesson:<row>:stale:1, the Your lessons landing, no lesson text;
--   * its transcript (of:<id>), a row inside the window, a captured row and a
--     canary are left alone; a second sweep inside the repeat window does nothing;
--   * past the repeat window the same row is alarmed again (:stale:2) and the
--     row that has since aged past the first window gets its first alarm.
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'speaker@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'other@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'waiter@example.test');
INSERT INTO public.instances (id, slug) VALUES ('00000000-0000-0000-0000-0000000000f0', 'poe-family');

-- A spoken lesson and its transcript, as the NAS rider writes them.
INSERT INTO public.agent_inbox (id, instance_id, body, tags, created_by) VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f0', 'Lesson. (spoken)', '["lesson","voice","lesson-building"]', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000f0', 'the words', '["lesson","voice-transcript","of:00000000-0000-0000-0000-0000000000a1","lesson-building"]', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000f0', 'a thought, not a lesson', '["thought"]', '00000000-0000-0000-0000-00000000000b');

DO $$ BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: an INSERT enqueued a push'; END IF;
END $$;

-- The builder finishes: the parent row gains awaiting-review.
UPDATE public.agent_inbox SET tags = tags || '["awaiting-review","build:awaiting-review@2026-10-01T20:00:00Z"]'::jsonb
 WHERE id = '00000000-0000-0000-0000-0000000000a1';
DO $$
DECLARE r record;
BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: awaiting-review did not enqueue exactly one row'; END IF;
  SELECT * INTO r FROM public.push_outbox;
  IF r.kind <> 'lesson' THEN RAISE EXCEPTION 'SMOKE FAIL: kind was %, not lesson', r.kind; END IF;
  IF r.target_user <> '00000000-0000-0000-0000-00000000000a' THEN RAISE EXCEPTION 'SMOKE FAIL: addressed to %, not the speaker', r.target_user; END IF;
  IF r.target_role <> 'person' THEN RAISE EXCEPTION 'SMOKE FAIL: target_role was %', r.target_role; END IF;
  IF r.dedupe_key <> 'lesson:00000000-0000-0000-0000-0000000000a1:ready' THEN RAISE EXCEPTION 'SMOKE FAIL: dedupe key was %', r.dedupe_key; END IF;
  IF r.url <> '/poetech-app/?view=create&panel=your-lessons' THEN RAISE EXCEPTION 'SMOKE FAIL: landing was %', r.url; END IF;
  IF r.title <> 'Your lesson is ready to review' THEN RAISE EXCEPTION 'SMOKE FAIL: title was %', r.title; END IF;
  IF r.body ILIKE '%spoken%' OR r.body ILIKE '%the words%' THEN RAISE EXCEPTION 'SMOKE FAIL: the push carried lesson text'; END IF;
  IF r.sent_at IS NOT NULL THEN RAISE EXCEPTION 'SMOKE FAIL: born sent'; END IF;
END $$;

-- The transcript of the SAME teaching gains the same tag: nothing more.
UPDATE public.agent_inbox SET tags = tags || '["awaiting-review"]'::jsonb
 WHERE id = '00000000-0000-0000-0000-0000000000a2';
-- An unrelated tag change on the parent: nothing more.
UPDATE public.agent_inbox SET tags = tags || '["mirrored"]'::jsonb
 WHERE id = '00000000-0000-0000-0000-0000000000a1';
-- The same tags written again (the builder re-stamps): nothing more.
UPDATE public.agent_inbox SET tags = tags WHERE id = '00000000-0000-0000-0000-0000000000a1';
DO $$ BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: a repeat or an unrelated change enqueued again (% rows)', (SELECT count(*) FROM public.push_outbox); END IF;
END $$;

-- Published: the second event, on the transcript row (the reader tags the row it read).
UPDATE public.agent_inbox SET tags = tags || '["lesson-published","lesson-id:ll205"]'::jsonb
 WHERE id = '00000000-0000-0000-0000-0000000000a2';
DO $$ BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: lesson-published did not enqueue'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.push_outbox WHERE dedupe_key = 'lesson:00000000-0000-0000-0000-0000000000a1:published' AND title = 'Your lesson is published' AND target_user = '00000000-0000-0000-0000-00000000000a')
    THEN RAISE EXCEPTION 'SMOKE FAIL: the published row is wrong (key, title or person)'; END IF;
END $$;

-- Not a lesson: nothing.
UPDATE public.agent_inbox SET tags = tags || '["awaiting-review","lesson-published"]'::jsonb
 WHERE id = '00000000-0000-0000-0000-0000000000b1';
DO $$ BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: a non-lesson row enqueued a push'; END IF;
END $$;

-- --- the stale alarm (0252) ---------------------------------------------------
-- Five rows for a third person: a root recording 5 h old (s1) and its transcript
-- (s2), a root 2 h old (s3), a captured root 10 h old (s4), a canary 9 h old (s5).
INSERT INTO public.agent_inbox (id, instance_id, body, tags, created_by, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f0', 'Lesson. (spoken, waiting)', '["lesson","voice","lesson-name:Secret Words"]', '00000000-0000-0000-0000-00000000000c', now() - interval '5 hours'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000f0', 'the transcript words', '["lesson","voice-transcript","of:00000000-0000-0000-0000-0000000000c1"]', '00000000-0000-0000-0000-00000000000c', now() - interval '5 hours'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000f0', 'Lesson. (young)', '["lesson","voice"]', '00000000-0000-0000-0000-00000000000c', now() - interval '2 hours'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000f0', 'Lesson. (captured)', '["lesson","lesson-captured"]', '00000000-0000-0000-0000-00000000000c', now() - interval '10 hours'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000f0', 'BELL PROOF', '["lesson","canary","bell-proof"]', '00000000-0000-0000-0000-00000000000c', now() - interval '9 hours');

DO $$
DECLARE n int; r record; t jsonb;
BEGIN
  SELECT count(*) INTO n FROM public.lesson_inbox_stale_sweep(4, 24, now());
  IF n <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the first sweep alarmed % rows, not exactly the one root past 4 h', n; END IF;
  SELECT tags INTO t FROM public.agent_inbox WHERE id = '00000000-0000-0000-0000-0000000000c1';
  IF (SELECT count(*) FROM jsonb_array_elements_text(t) x WHERE x LIKE 'stale-alarm@%') <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the alarmed row does not carry exactly one stale-alarm tag: %', t; END IF;
  IF EXISTS (SELECT 1 FROM public.agent_inbox a, jsonb_array_elements_text(a.tags) x WHERE a.id <> '00000000-0000-0000-0000-0000000000c1' AND x LIKE 'stale-alarm@%')
    THEN RAISE EXCEPTION 'SMOKE FAIL: a transcript, a young, a captured or a canary row was alarmed'; END IF;
  SELECT * INTO r FROM public.push_outbox WHERE dedupe_key = 'lesson:00000000-0000-0000-0000-0000000000c1:stale:1';
  IF r.id IS NULL THEN RAISE EXCEPTION 'SMOKE FAIL: no push keyed :stale:1 for the alarmed row'; END IF;
  IF r.target_user <> '00000000-0000-0000-0000-00000000000c' OR r.target_role <> 'person' OR r.kind <> 'lesson' THEN RAISE EXCEPTION 'SMOKE FAIL: the stale push is addressed wrong (% % %)', r.target_user, r.target_role, r.kind; END IF;
  IF r.title <> 'A lesson is still waiting' OR r.body NOT LIKE 'Recorded 5 hours ago%' THEN RAISE EXCEPTION 'SMOKE FAIL: the stale push words are wrong: % / %', r.title, r.body; END IF;
  IF r.body ILIKE '%Secret Words%' OR r.body ILIKE '%transcript words%' THEN RAISE EXCEPTION 'SMOKE FAIL: the stale push carried lesson text'; END IF;
  IF r.url <> '/poetech-app/?view=create&panel=your-lessons' THEN RAISE EXCEPTION 'SMOKE FAIL: stale landing was %', r.url; END IF;
  IF (SELECT count(*) FROM public.push_outbox WHERE dedupe_key LIKE 'lesson:%:stale:%') <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: more than one stale push'; END IF;
  IF EXISTS (SELECT 1 FROM public.push_outbox WHERE dedupe_key = 'lesson:00000000-0000-0000-0000-0000000000c1:ready') THEN RAISE EXCEPTION 'SMOKE FAIL: the alarm tag tripped the ready push'; END IF;
  -- Inside the repeat window: nothing.
  SELECT count(*) INTO n FROM public.lesson_inbox_stale_sweep(4, 24, now());
  IF n <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: a second sweep inside the repeat window alarmed % rows', n; END IF;
  IF (SELECT count(*) FROM public.push_outbox WHERE dedupe_key LIKE 'lesson:%:stale:%') <> 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the second sweep enqueued again'; END IF;
  -- 25 h later: the first row alarms again (#2), the young row has aged into its first alarm.
  SELECT count(*) INTO n FROM public.lesson_inbox_stale_sweep(4, 24, now() + interval '25 hours');
  IF n <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the sweep past the repeat window alarmed % rows, not 2', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.push_outbox WHERE dedupe_key = 'lesson:00000000-0000-0000-0000-0000000000c1:stale:2') THEN RAISE EXCEPTION 'SMOKE FAIL: no second alarm for the long waiter'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.push_outbox WHERE dedupe_key = 'lesson:00000000-0000-0000-0000-0000000000c3:stale:1') THEN RAISE EXCEPTION 'SMOKE FAIL: the row that aged past the window was not alarmed'; END IF;
  SELECT tags INTO t FROM public.agent_inbox WHERE id = '00000000-0000-0000-0000-0000000000c1';
  IF (SELECT count(*) FROM jsonb_array_elements_text(t) x WHERE x LIKE 'stale-alarm@%') <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the long waiter does not carry two alarm tags'; END IF;
  -- The alarmed row still WAITS (nothing captured it): the bell's own definition.
  IF NOT EXISTS (SELECT 1 FROM public.agent_inbox WHERE id = '00000000-0000-0000-0000-0000000000c1' AND tags ? 'lesson' AND NOT (tags ? 'lesson-captured') AND NOT (tags ? 'lesson-building') AND NOT (tags ? 'awaiting-review'))
    THEN RAISE EXCEPTION 'SMOKE FAIL: the alarm changed the row''s waiting state'; END IF;
END $$;

-- --- who reads what -----------------------------------------------------------
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{}', true);
DO $$ BEGIN
  PERFORM 1 FROM public.push_outbox;
  RAISE EXCEPTION 'SMOKE FAIL: anon read push_outbox';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the person does not read their own two rows'; END IF;
END $$;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: another person read the speaker''s rows'; END IF;
END $$;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.push_outbox) <> 3 THEN RAISE EXCEPTION 'SMOKE FAIL: the waiter does not read exactly their own three stale pushes (%)', (SELECT count(*) FROM public.push_outbox); END IF;
END $$;
RESET ROLE;

SELECT 'every wall held' AS result;
ROLLBACK;
