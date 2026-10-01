-- =============================================================================
-- arrivals-ci-smoke.sql — 0245 proven on a real PostgreSQL (DR-0728)
-- =============================================================================
-- Run by the CI `arrivals-push` job after the two bootstraps and 0245 applied
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
-- =============================================================================
\set ON_ERROR_STOP 1
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'speaker@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'other@example.test');
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
RESET ROLE;

SELECT 'every wall held' AS result;
ROLLBACK;
