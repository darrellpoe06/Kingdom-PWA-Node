-- =============================================================================
-- 0246 — Every arrival is counted: a lesson that finished building or went
--        live enqueues a push to its one person (DR-0728)
-- =============================================================================
-- Darrell 2026-10-01, in the installed app, beside another app's launcher
-- badge: "Why don't the PoeTech App have those types of notifications and the
-- number of them if I haven't checked them yet?" With the app OPEN the arrivals
-- watcher (app/src/lib/arrivals-watch.js) sees the row move and rings. With the
-- app CLOSED nothing could: the NAS lesson builder (DR-0669) flips tags on the
-- agent_inbox row, and no part of the house turned that flip into a push.
--
-- THE SAME SHAPE AS 0220 (DR-0400): the database ENQUEUES, the drain DELIVERS.
-- There is no pg_net on the sovereign stack, so a trigger cannot send; it writes
-- one push_outbox row and .github/workflows/push-outbox-drain.yml (armed by
-- PUSH_OUTBOX_DRAIN_ENABLED, DR-0400's own switch) calls the sender with
-- topic `lesson`. Until the drain is armed the outbox simply fills and the app's
-- own watcher still counts and shows every arrival: nothing is lost.
--
-- WHAT ENQUEUES, exactly:
--   * a `lesson` row whose tags GAIN `awaiting-review` (the builder finished
--     every version and waits for the choice)   -> "Your lesson is ready to review"
--   * a `lesson` row whose tags GAIN `lesson-published`                       -> "Your lesson is published"
-- ONE push per TEACHING per event: the builder writes its stage tags on every
-- row of a teaching (the spoken row and its transcript, which names the parent
-- with `of:<id>`), so the dedupe key is lesson:<root row>:<event>, unique.
-- Addressed to the row's created_by and nobody else (target_user); the drain
-- sends to that one person; push-send-policy refuses a lesson topic with no
-- named person. The words name no lesson text and no member.
--
-- ALSO: agent_inbox joins the realtime publication, so the open app hears the
-- flip the moment it happens (the watcher's 60 s heartbeat is the net).
--
-- DEPENDS ON: 0127 (agent_inbox), 0220 (push_outbox). IDEMPOTENT: ADD COLUMN
-- IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS, guarded publication.
-- =============================================================================

ALTER TABLE public.push_outbox ADD COLUMN IF NOT EXISTS target_user uuid;
ALTER TABLE public.push_outbox ADD COLUMN IF NOT EXISTS url         text;
ALTER TABLE public.push_outbox ADD COLUMN IF NOT EXISTS dedupe_key  text;

-- The lock: the same teaching + event enqueues once, however many rows flip.
CREATE UNIQUE INDEX IF NOT EXISTS push_outbox_dedupe_idx
  ON public.push_outbox (dedupe_key) WHERE dedupe_key IS NOT NULL;

-- A person may read the outbox rows addressed to them (and only those). The
-- office policy of 0220 stands beside it; anon still has no reach at all.
DROP POLICY IF EXISTS push_outbox_own ON public.push_outbox;
CREATE POLICY push_outbox_own ON public.push_outbox
  FOR SELECT TO authenticated
  USING (target_user IS NOT NULL AND target_user = auth.uid());

-- ---------------------------------------------------------------------------
-- The enqueue.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.agent_inbox_arrival_enqueue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_root   text;
  v_url    text := '/poetech-app/?view=create&panel=your-lessons';
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
              'Open Your lessons to read it.',
              'person', NEW.created_by, v_url, 'lesson:' || v_root || ':published')
      ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- the enqueue is additive; never turn a tag change into a failed update
  END;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.agent_inbox_arrival_enqueue() FROM PUBLIC;

DROP TRIGGER IF EXISTS agent_inbox_arrival_enqueue ON public.agent_inbox;
CREATE TRIGGER agent_inbox_arrival_enqueue
  AFTER UPDATE OF tags ON public.agent_inbox
  FOR EACH ROW EXECUTE FUNCTION public.agent_inbox_arrival_enqueue();

-- ---------------------------------------------------------------------------
-- The open app hears the flip: agent_inbox joins the realtime publication
-- (the same guarded shape 0022 uses). A database with no publication (CI's
-- bare PostgreSQL) is left as it is.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'agent_inbox')
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_inbox;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
