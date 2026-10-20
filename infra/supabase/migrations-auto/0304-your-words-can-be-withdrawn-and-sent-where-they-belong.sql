-- =============================================================================
-- 0304 — Your words can be withdrawn, and sent where they belong (DR-1137)
-- =============================================================================
-- Darrell 2026-10-20: "Do we have the ability to send our words anywhere after
-- collected???! We need that in case it goes to the wrong location or we may
-- want to create a lesson from a situation or few" — then: "just to make
-- sure... it goes to the correct location... for processing".
--
-- WHAT EXISTED. agent_inbox is append-only from the app (0127: INSERT only,
-- no UPDATE/DELETE by a client). The words of a row could come back to the box
-- and be sent anywhere (DR-0636, DR-1135), but the row that went to the wrong
-- door STAYED there: the NAS lesson builder would still build a lesson from a
-- recording that was meant for PoeTech, or for a prayer, or for nobody.
--
-- WHAT THIS ADDS. withdraw_my_inbox_row(p_id, p_undo): the person who WROTE a
-- row marks it `withdrawn` (with a `withdrawn@<time>` stamp) — on the row and
-- on every child row that names it (`of:<id>`: its transcript, its failure
-- report). A withdrawn row is left where it is and nothing builds from it:
--   * the NAS lesson builder's eligibility refuses it (lesson_builder.py),
--   * the waiting list and the bell skip it (scripts/lesson-inbox-waiting.sql),
--   * the stale sweep below never alarms or pushes for it.
-- Its WORDS still come back: the voice rider transcribes a withdrawn recording
-- as before and carries the tag onto the transcript, so the person can put the
-- words in the box and send them where they belong (the same move DR-1135
-- built, now with the route pre-chosen). p_undo = true takes it back
-- (`restored@<time>`); nothing is ever deleted (HOLD-THE-HAND-OF-THE-PROCESS).
--
-- WHO. Only the row's own writer (created_by = auth.uid()) while still a
-- member of its instance. Never the Governor on another person's row, never a
-- member on another's, never anon. REFUSES: a row that is not yours (42501), a
-- child row (withdraw the parent), and a row already captured / building /
-- published / awaiting review — a lesson exists or is being decided from it,
-- which is a different act with its own door (DR-0669 decisions).
--
-- ALSO CLOSED HERE. 0252's stale sweep did not skip `not-a-lesson` (a reading
-- recorded as such, DR-0810, carries that tag WITHOUT lesson-captured), so a
-- reading would ring the stale alarm and push a phone forever. The sweep is
-- re-declared with both exclusions, matching lesson-inbox-waiting.sql's one
-- definition of "waiting".
--
-- IDEMPOTENT: CREATE OR REPLACE. DEPENDS ON: 0127 (agent_inbox), 0220/0246
-- (push_outbox for the sweep), 0252 (the sweep's signature, kept).
-- Proven by infra/supabase/tests/0304-withdraw-my-words-smoke.sql on a real
-- PostgreSQL in CI (the withdraw-walls job).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.withdraw_my_inbox_row(p_id uuid, p_undo boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_row      public.agent_inbox%ROWTYPE;
  v_stamp    text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  v_mark     text := CASE WHEN p_undo THEN 'restored@' ELSE 'withdrawn@' END || v_stamp;
  v_already  boolean;
  v_rows     int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'withdraw_my_inbox_row: sign in first' USING ERRCODE = '42501';
  END IF;
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'withdraw_my_inbox_row: no row named';
  END IF;

  SELECT * INTO v_row FROM public.agent_inbox WHERE id = p_id FOR UPDATE;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'withdraw_my_inbox_row: no such row';
  END IF;
  -- The one wall: your own row, in a house you are still part of.
  IF v_row.created_by IS DISTINCT FROM auth.uid()
     OR public.user_role_in_instance(v_row.instance_id) IS NULL THEN
    RAISE EXCEPTION 'withdraw_my_inbox_row: only the person who wrote it may withdraw it' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_row.tags) AS t(tag) WHERE t.tag LIKE 'of:%') THEN
    RAISE EXCEPTION 'withdraw_my_inbox_row: this row belongs to another (of:); withdraw that one';
  END IF;
  IF v_row.tags ?| array['lesson-captured', 'lesson-building', 'lesson-published', 'awaiting-review'] THEN
    RAISE EXCEPTION 'withdraw_my_inbox_row: a lesson is already built or being decided from this one; it is not withdrawn here';
  END IF;

  v_already := v_row.tags ? 'withdrawn';
  IF (p_undo AND NOT v_already) OR (NOT p_undo AND v_already) THEN
    RETURN jsonb_build_object('id', p_id, 'withdrawn', v_already, 'changed', false, 'rows', 0);
  END IF;

  -- The row and every child that names it (its own writer's rows only), in
  -- one statement: `withdrawn` taken out, put back unless undoing, the stamp
  -- appended so the record says when, and by which act.
  UPDATE public.agent_inbox a
     SET tags = (SELECT coalesce(jsonb_agg(t.tag), '[]'::jsonb)
                   FROM jsonb_array_elements(a.tags) AS t(tag)
                  WHERE t.tag <> to_jsonb('withdrawn'::text))
                || CASE WHEN p_undo THEN '[]'::jsonb ELSE '["withdrawn"]'::jsonb END
                || jsonb_build_array(v_mark)
   WHERE a.id = p_id
      OR (a.created_by = v_row.created_by AND a.tags ? ('of:' || p_id::text));
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN jsonb_build_object('id', p_id, 'withdrawn', NOT p_undo, 'changed', true, 'rows', v_rows, 'at', v_stamp);
END $$;
REVOKE ALL ON FUNCTION public.withdraw_my_inbox_row(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_my_inbox_row(uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- The stale sweep (0252), re-declared: a withdrawn row, and a reading marked
-- not-a-lesson, never ring the stale alarm. Everything else is 0252 verbatim.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lesson_inbox_stale_sweep(
  p_first_hours  int DEFAULT 4,
  p_repeat_hours int DEFAULT 24,
  p_now          timestamptz DEFAULT now()
)
RETURNS TABLE (id uuid, created_by uuid, waited_hours int, alarm_no int)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r        record;
  v_first  int := CASE WHEN p_first_hours  IS NULL OR p_first_hours  < 1 THEN 4  ELSE p_first_hours  END;
  v_repeat int := CASE WHEN p_repeat_hours IS NULL OR p_repeat_hours < 1 THEN 24 ELSE p_repeat_hours END;
  v_now    timestamptz := coalesce(p_now, now());
  v_stamp  text := to_char(coalesce(p_now, now()) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  v_n      int;
  v_last   timestamptz;
  v_hours  int;
BEGIN
  FOR r IN
    SELECT a.id, a.instance_id, a.created_by, a.created_at, a.tags
      FROM public.agent_inbox a
     WHERE a.tags ? 'lesson'
       AND NOT (a.tags ? 'lesson-captured')
       AND NOT (a.tags ? 'lesson-building')
       AND NOT (a.tags ? 'awaiting-review')
       AND NOT (a.tags ? 'canary')
       AND NOT (a.tags ? 'withdrawn')      -- DR-1137: taken back by its person
       AND NOT (a.tags ? 'not-a-lesson')   -- DR-0810: a reading, never a lesson
       AND a.created_by IS NOT NULL
       AND a.created_at <= v_now - make_interval(hours => v_first)
       AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(a.tags) AS t(tag) WHERE t.tag LIKE 'of:%')
     ORDER BY a.created_at
  LOOP
    SELECT count(*), max(substring(t.tag FROM '@(.+)$')::timestamptz)
      INTO v_n, v_last
      FROM jsonb_array_elements_text(r.tags) AS t(tag)
     WHERE t.tag ~ '^stale-alarm@[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$';
    IF v_last IS NOT NULL AND v_last > v_now - make_interval(hours => v_repeat) THEN
      CONTINUE; -- alarmed recently: wait the repeat window
    END IF;
    v_n := coalesce(v_n, 0) + 1;
    v_hours := floor(extract(epoch FROM (v_now - r.created_at)) / 3600)::int;

    UPDATE public.agent_inbox a
       SET tags = a.tags || jsonb_build_array('stale-alarm@' || v_stamp)
     WHERE a.id = r.id;

    -- Best-effort, as 0220/0246: the alarm tag is written even if the push cannot be.
    BEGIN
      INSERT INTO public.push_outbox (instance_id, kind, title, body, target_role, target_user, url, dedupe_key)
      VALUES (r.instance_id, 'lesson', 'A lesson is still waiting',
              'Recorded ' || v_hours || ' hours ago and not yet built. Open Your lessons.',
              'person', r.created_by, '/poetech-app/?view=create&panel=your-lessons',
              'lesson:' || r.id || ':stale:' || v_n)
      ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    id := r.id; created_by := r.created_by; waited_hours := v_hours; alarm_no := v_n;
    RETURN NEXT;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.lesson_inbox_stale_sweep(int, int, timestamptz) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.lesson_inbox_stale_sweep(int, int, timestamptz) TO service_role;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
