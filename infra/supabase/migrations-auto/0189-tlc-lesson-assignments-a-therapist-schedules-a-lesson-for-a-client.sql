-- =============================================================================
-- 0189 — TLC lesson assignments: a therapist schedules a lesson for a client
-- to review before the next session (DR-0345)
-- =============================================================================
-- Darrell 2026-09-10: "Therapist should be able to schedule lessons for their
-- clients to review before their next session etc... all low hanging fruit
-- we want."
--
-- One row per assignment. The THERAPIST (a member of the office instance)
-- creates it, addressed to the client's email; the CLIENT reads the rows
-- addressed to the email Supabase verified on their session, and may mark
-- one reviewed. No client health information: the lesson id, its title, a
-- due date and a short note from the therapist. RLS decides everything; no
-- function is needed. Both overlays re-run at the end.
CREATE TABLE IF NOT EXISTS public.tlc_lesson_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  office_id     text NOT NULL DEFAULT 'tlc' CHECK (char_length(office_id) BETWEEN 1 AND 40),
  therapist_id  uuid NOT NULL DEFAULT auth.uid(),
  therapist_email text NOT NULL DEFAULT lower(coalesce(auth.jwt() ->> 'email', '')),
  client_email  text NOT NULL CHECK (client_email = lower(client_email) AND char_length(client_email) BETWEEN 5 AND 200),
  lesson_id     text NOT NULL CHECK (char_length(lesson_id) BETWEEN 1 AND 120),
  lesson_title  text NOT NULL CHECK (char_length(lesson_title) BETWEEN 1 AND 200),
  track         text NOT NULL DEFAULT 'client' CHECK (char_length(track) BETWEEN 1 AND 40),
  note          text CHECK (note IS NULL OR char_length(note) <= 500),
  due_on        date,
  status        text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','reviewed')),
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tlc_lesson_assignments_client_idx ON public.tlc_lesson_assignments (client_email, status);
CREATE INDEX IF NOT EXISTS tlc_lesson_assignments_therapist_idx ON public.tlc_lesson_assignments (instance_id, therapist_id);

ALTER TABLE public.tlc_lesson_assignments ENABLE ROW LEVEL SECURITY;

-- The therapist: a member of the office instance, on rows they created.
DROP POLICY IF EXISTS tlc_lesson_assignments_therapist_read ON public.tlc_lesson_assignments;
CREATE POLICY tlc_lesson_assignments_therapist_read ON public.tlc_lesson_assignments
  FOR SELECT TO authenticated
  USING (public.user_in_instance(instance_id) AND therapist_id = auth.uid());
DROP POLICY IF EXISTS tlc_lesson_assignments_therapist_write ON public.tlc_lesson_assignments;
CREATE POLICY tlc_lesson_assignments_therapist_write ON public.tlc_lesson_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.user_in_instance(instance_id)
              AND therapist_id = auth.uid()
              AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin','member'));
DROP POLICY IF EXISTS tlc_lesson_assignments_therapist_update ON public.tlc_lesson_assignments;
CREATE POLICY tlc_lesson_assignments_therapist_update ON public.tlc_lesson_assignments
  FOR UPDATE TO authenticated
  USING (public.user_in_instance(instance_id) AND therapist_id = auth.uid())
  WITH CHECK (public.user_in_instance(instance_id) AND therapist_id = auth.uid());
DROP POLICY IF EXISTS tlc_lesson_assignments_therapist_delete ON public.tlc_lesson_assignments;
CREATE POLICY tlc_lesson_assignments_therapist_delete ON public.tlc_lesson_assignments
  FOR DELETE TO authenticated
  USING (public.user_in_instance(instance_id) AND therapist_id = auth.uid());

-- The client: the rows addressed to the email on their verified session.
-- No instance membership is needed (a client is not a member of the office);
-- the address is the key, as 0150's invite claim does.
DROP POLICY IF EXISTS tlc_lesson_assignments_client_read ON public.tlc_lesson_assignments;
CREATE POLICY tlc_lesson_assignments_client_read ON public.tlc_lesson_assignments
  FOR SELECT TO authenticated
  USING (client_email = lower(coalesce(auth.jwt() ->> 'email', '')));
DROP POLICY IF EXISTS tlc_lesson_assignments_client_review ON public.tlc_lesson_assignments;
CREATE POLICY tlc_lesson_assignments_client_review ON public.tlc_lesson_assignments
  FOR UPDATE TO authenticated
  USING (client_email = lower(coalesce(auth.jwt() ->> 'email', '')))
  WITH CHECK (client_email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- A client may change only the review fields; a trigger keeps the rest fixed
-- when the writer is not the therapist who made the row.
CREATE OR REPLACE FUNCTION public.tlc_lesson_assignments_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.therapist_id <> auth.uid() THEN
    -- the client's own review: nothing else moves
    NEW.instance_id := OLD.instance_id; NEW.office_id := OLD.office_id;
    NEW.therapist_id := OLD.therapist_id; NEW.therapist_email := OLD.therapist_email;
    NEW.client_email := OLD.client_email; NEW.lesson_id := OLD.lesson_id; NEW.lesson_title := OLD.lesson_title;
    NEW.track := OLD.track; NEW.note := OLD.note; NEW.due_on := OLD.due_on; NEW.created_at := OLD.created_at;
  END IF;
  IF NEW.status = 'reviewed' AND NEW.reviewed_at IS NULL THEN NEW.reviewed_at := now(); END IF;
  IF NEW.status = 'assigned' THEN NEW.reviewed_at := NULL; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tlc_lesson_assignments_guard ON public.tlc_lesson_assignments;
CREATE TRIGGER tlc_lesson_assignments_guard
  BEFORE UPDATE ON public.tlc_lesson_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tlc_lesson_assignments_guard();

-- The two overlays cover the new instance-scoped table.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
