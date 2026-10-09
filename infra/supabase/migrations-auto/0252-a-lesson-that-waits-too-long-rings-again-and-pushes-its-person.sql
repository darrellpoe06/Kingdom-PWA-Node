-- =============================================================================
-- 0252 — A lesson that waits too long rings the bell again and pushes its
--        person (DR-0771)
-- =============================================================================
-- Darrell 2026-10-07, after the weekend audit found two lesson rows that waited
-- from Sunday 13:50 UTC until Tuesday with nobody told: "build the stale-row
-- alarm". DR-0725 made a saved lesson ring the bell ONCE, with no timer; the
-- builder's own milestones ring again. But a row that simply WAITS reaches no
-- milestone, so after the first ring the road was silent: the bell comment it
-- made was already read, the push outbox (0246) fires only on ready/published,
-- and the waiting list was printed only when a person asked. A waiting row
-- had no deterministic owner.
--
-- THIS IS THE OWNER. One SQL function the NAS lesson builder calls on each of
-- its own wakes (it already wakes at least every 300 s to LISTEN; this adds no
-- new timer fleet): every lesson row still WAITING (the one definition,
-- scripts/lesson-inbox-waiting.sql) that is older than p_first_hours, and has
-- not been alarmed in the last p_repeat_hours, is alarmed:
--   1. its tags gain `stale-alarm@<time>` — a FIELD on the row itself, so every
--      reader of the row sees the alarm: the bell's milestone becomes
--      waiting#s<n> (a new key, so the bell rings and the intake wakes; the
--      0243 notify trigger fires on this very tag change), the bell comment
--      names it, and Your lessons in the app shows it;
--   2. one push_outbox row is enqueued for the row's own person (0246's shape
--      and road: kind lesson, target_role person, the Your lessons landing),
--      keyed lesson:<row>:stale:<n>, so the drain delivers it exactly once.
-- Only the ROOT row of a teaching is alarmed (a transcript names its parent
-- with of:<id>): one teaching, one alarm, however many rows carry it. Canary
-- rows (bell-proof) never alarm. The words are never read or carried.
--
-- BRAKES (deterministic class, DR-0248: budget + lock): bounded work per call
-- (one SELECT over waiting rows, one UPDATE and one INSERT per alarmed row);
-- re-alarm no sooner than p_repeat_hours; the push dedupes on its key; the
-- caller is the single lesson-builder service (its own lock and stop-paths:
-- ARMED-BY-RECORD, services.json enabled:false, LESSON_BELL=off). p_now is a
-- parameter so the smoke proves the clock without waiting on it.
--
-- DEPENDS ON: 0127 (agent_inbox), 0220 + 0246 (push_outbox and its columns).
-- IDEMPOTENT: CREATE OR REPLACE. Callable by the owner role and service_role
-- (the NAS builder's door); never by a signed-in person.
-- =============================================================================

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
