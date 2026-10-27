-- =============================================================================
-- 0311 — a published lesson's push lands on the lesson, not on the work that
--        made it (DR-1253)
-- =============================================================================
-- Darrell, 2026-10-27, with the Arrivals card for L265 on screen: "These
-- lessons should go to the actual lesson... not the research road work
-- lesson... The links need to be changed to go to the correct page... to read
-- or have a lesson read to you... Users would be confused."
--
-- WHAT STOOD (0246): agent_inbox_arrival_enqueue wrote ONE landing for both
-- lesson events — '/poetech-app/?view=create&panel=your-lessons', the lane's
-- record of the request — and the published push said "Open Your lessons to
-- read it." The row that gains `lesson-published` also carries the lesson's
-- id as `lesson-id:<id>` (lesson-review-messages.js publishedLessonOf reads
-- the same tag), so the push can carry the lesson's own link.
--
-- NOW: the READY push still lands on Your lessons, where the version is
-- chosen. The PUBLISHED push lands in Learn on the lesson — the same query
-- the app's own lesson links use (lib/lesson-links.js lessonQuery) — and says
-- "Open it to read it, or have it read to you." A row with no lesson id falls
-- back to Your lessons rather than to a dead link. Nothing else in the
-- function changes: the gate, the root, the dedupe keys, the best-effort
-- block. Idempotent: CREATE OR REPLACE, applied twice in CI.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.agent_inbox_arrival_enqueue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_root   text;
  v_url    text := '/poetech-app/?view=create&panel=your-lessons';
  v_lesson text;
  v_lesson_url text;
  v_gained_ready     boolean;
  v_gained_published boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;
  IF NOT (NEW.tags @> '["lesson"]'::jsonb) THEN RETURN NEW; END IF;
  IF NEW.created_by IS NULL THEN RETURN NEW; END IF;

  v_gained_ready     := (NEW.tags @> '["awaiting-review"]'::jsonb)  AND NOT (coalesce(OLD.tags, '[]'::jsonb) @> '["awaiting-review"]'::jsonb);
  v_gained_published := (NEW.tags @> '["lesson-published"]'::jsonb) AND NOT (coalesce(OLD.tags, '[]'::jsonb) @> '["lesson-published"]'::jsonb);
  IF NOT (v_gained_ready OR v_gained_published) THEN RETURN NEW; END IF;

  -- The teaching's root row: a transcript names its parent with of:<id>.
  SELECT substr(t, 4) INTO v_root
    FROM jsonb_array_elements_text(NEW.tags) AS t
   WHERE t LIKE 'of:%'
   LIMIT 1;
  v_root := coalesce(nullif(v_root, ''), NEW.id::text);

  -- THE LESSON ITSELF (DR-1253): the published row names its lesson as
  -- lesson-id:<id>; the push lands there, in Learn, where it is read or read
  -- aloud. No id, no guess: Your lessons, as before.
  SELECT substr(t, 11) INTO v_lesson
    FROM jsonb_array_elements_text(NEW.tags) AS t
   WHERE t LIKE 'lesson-id:%'
   LIMIT 1;
  v_lesson := nullif(trim(coalesce(v_lesson, '')), '');
  v_lesson_url := CASE
    WHEN v_lesson IS NOT NULL AND v_lesson ~ '^[A-Za-z0-9._-]+$'
      THEN '/poetech-app/?view=church&sub=learn&course=living-lessons&lesson=' || v_lesson
    ELSE v_url
  END;

  -- Best-effort, as 0220: the row's own change must never fail over a notice.
  BEGIN
    IF v_gained_ready THEN
      INSERT INTO public.push_outbox (instance_id, kind, title, body, target_role, target_user, url, dedupe_key)
      VALUES (NEW.instance_id, 'lesson', 'Your lesson is ready to review',
              'Every version is written. Open Your lessons to choose.',
              'person', NEW.created_by, v_url, 'lesson:' || v_root || ':ready')
      ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    END IF;
    IF v_gained_published THEN
      INSERT INTO public.push_outbox (instance_id, kind, title, body, target_role, target_user, url, dedupe_key)
      VALUES (NEW.instance_id, 'lesson', 'Your lesson is published',
              CASE WHEN v_lesson IS NOT NULL THEN 'Open it to read it, or have it read to you.' ELSE 'Open Your lessons to read it.' END,
              'person', NEW.created_by, v_lesson_url, 'lesson:' || v_root || ':published')
      ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- the enqueue is additive; never turn a tag change into a failed update
  END;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.agent_inbox_arrival_enqueue() FROM PUBLIC;
