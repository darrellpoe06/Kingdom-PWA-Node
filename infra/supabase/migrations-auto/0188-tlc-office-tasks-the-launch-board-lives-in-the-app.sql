-- =============================================================================
-- 0188 -- TLC OFFICE TASKS: the launch board lives in the app (DR-0344)
-- =============================================================================
-- Darrell, 2026-09-10, on seeing Drive links on the Team section: "why would
-- you use Google?! fix it build the whole process workflows!" The TLCTS
-- LAUNCH tracker (a sheet) becomes a board inside the TLC app: the tasks are
-- data (lib/tlc-launch-plan.js), and this table holds the office's STATUS per
-- task so Christina, Darrell and the office see one board on every device.
--
-- Shape: one row per (instance, office, task key); status + a note + who
-- touched it last. Members of the office (owner/admin/member) read and write
-- through RLS directly -- the same discipline every workspace table uses.
-- Instance-scoped, so the 0130 assistant overlay and the 0125 viewer overlay
-- cover it (re-run below). Opening the board to the assistant role is a
-- deliberate widening of ASSISTANT_ALLOWED_TABLES, tracked as a dated item,
-- not smuggled in here. Idempotent; nothing widened; no PHI.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tlc_office_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  office_id    text NOT NULL DEFAULT 'tlc' CHECK (char_length(office_id) BETWEEN 1 AND 40),
  task_key     text NOT NULL CHECK (char_length(task_key) BETWEEN 1 AND 80),
  status       text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in-progress','done')),
  note         text CHECK (note IS NULL OR char_length(note) <= 1000),
  done_at      timestamptz,
  updated_by   uuid REFERENCES auth.users(id),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, office_id, task_key)
);
CREATE INDEX IF NOT EXISTS tlc_office_tasks_instance_idx ON public.tlc_office_tasks (instance_id, office_id);

ALTER TABLE public.tlc_office_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tlc_office_tasks_member_read ON public.tlc_office_tasks;
CREATE POLICY tlc_office_tasks_member_read ON public.tlc_office_tasks
  FOR SELECT TO authenticated
  USING (public.user_in_instance(instance_id));
DROP POLICY IF EXISTS tlc_office_tasks_member_write ON public.tlc_office_tasks;
CREATE POLICY tlc_office_tasks_member_write ON public.tlc_office_tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.user_in_instance(instance_id)
              AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin','member'));
DROP POLICY IF EXISTS tlc_office_tasks_member_update ON public.tlc_office_tasks;
CREATE POLICY tlc_office_tasks_member_update ON public.tlc_office_tasks
  FOR UPDATE TO authenticated
  USING (public.user_in_instance(instance_id)
         AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin','member'))
  WITH CHECK (public.user_in_instance(instance_id)
              AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin','member'));
DROP POLICY IF EXISTS tlc_office_tasks_owner_delete ON public.tlc_office_tasks;
CREATE POLICY tlc_office_tasks_owner_delete ON public.tlc_office_tasks
  FOR DELETE TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

-- The two overlays cover the new instance-scoped table.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
