-- =============================================================================
-- 0058 — project board tasks: the Monday.com-style working board items
-- =============================================================================
-- (Numbered 0058 to avoid colliding with the family-messaging 0057 on another
-- branch — claim-your-number per HYBRID-MODULAR-IMPLEMENTATION-PLAN Stage 4.)
-- Declared by Darrell (2026-06-30): the Projects tab must become a REAL, working
-- board system INSIDE PoeTech — where all the work is tracked and DRIVEN forward
-- from inside the app (the app manages building the app). Boards with items,
-- STATUS labels (Not started / In progress / Blocked / Done), OWNERS, dates, and
-- PROGRESS that rolls up per board — live on the shared-persistence backbone,
-- synced across devices, RLS-safe. NOT static seed like the old BuildBoard.
--
-- THE MODEL (one data model, two views — coordinates with the Projects hub, does
-- not silo):
--   * A BOARD is a lightweight grouping identified by `board_slug` (+ a
--     denormalized `board_title`). A board maps 1:1 to a real project (its slug)
--     OR to a program board (e.g. 'board-modular-cutover'). No separate boards
--     table — a board exists exactly when it has at least one task, or a seed
--     spec names it. This keeps boards cheap (Monday boards are lightweight) and
--     the join-free rollup fast.
--   * A board_tasks ROW is one item on a board: a task/module/milestone with a
--     status label, an owner, dates, and a group (the column/section within a
--     board). Progress rolls up per board_slug from these real rows — an honest
--     derived percent (done / total), never a painted number (DR-0076).
--
-- ROLE-SCOPED / NO LEAK: family-internal management data, exact same scope as the
-- Projects + Discussions + Concerns surfaces (0035/0039). RLS scopes every row to
-- the caller's instance and to owner/admin/member roles. There is NO anon policy
-- — a board task is never publicly readable or writable. DELETE is tightened to
-- owner/admin (the governors); a member can move/status a task but not hard-drop
-- the record.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger,
--             guarded publication add. Additive, family-internal — no public surface.
-- =============================================================================

CREATE TABLE IF NOT EXISTS board_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id),
  slug         text NOT NULL,                  -- stable local id (e.g. 'bt-...')
  board_slug   text NOT NULL,                  -- which board (project slug or 'board-*')
  board_title  text NOT NULL,                  -- denormalized board name (display)
  title        text NOT NULL,                  -- the item / task / module / milestone
  status       text NOT NULL DEFAULT 'not-started'
                 CHECK (status IN ('not-started','in-progress','blocked','done')),
  owner        text,                            -- who owns it (persona / name), nullable
  group_label  text,                            -- the group/column within a board (nullable)
  start_date   date,                            -- when work begins (nullable)
  due_date     date,                            -- the date we hold to (nullable)
  sort_rank    integer,                         -- hand-set ordering within a group (lower = higher)
  notes        text,                            -- free-text detail
  links        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { project_slug, dr_ref, live_metric, ... }
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS board_tasks_instance_idx ON board_tasks(instance_id);
CREATE INDEX IF NOT EXISTS board_tasks_board_idx    ON board_tasks(board_slug);
CREATE INDEX IF NOT EXISTS board_tasks_status_idx   ON board_tasks(status);
-- One row per (instance, slug) so an idempotent re-seed / re-upload can't
-- duplicate an item — the seed writes stable slugs, so re-running is a no-op.
CREATE UNIQUE INDEX IF NOT EXISTS board_tasks_slug_uniq ON board_tasks(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS board_tasks_touch_updated ON board_tasks;
CREATE TRIGGER board_tasks_touch_updated
  BEFORE UPDATE ON board_tasks
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore deliberately leaves `anon` untouched. So `authenticated` needs the
-- EXPLICIT grant (without it a signed-in read/write 403s with 42501 — the Choir
-- incident, 0039). NO grant to anon: board tasks are never public. RLS still
-- gates ROWS; the grant only lets the role reach the table.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON board_tasks TO authenticated;

ALTER TABLE board_tasks ENABLE ROW LEVEL SECURITY;

-- Family/governor scope: owner/admin/member of the row's instance. No anon
-- policy exists, so a logged-out client can neither read nor write. DELETE is
-- tightened to owner/admin — a member can move/status/complete a task but not
-- hard-delete the record.
DROP POLICY IF EXISTS board_tasks_read   ON board_tasks;
DROP POLICY IF EXISTS board_tasks_insert ON board_tasks;
DROP POLICY IF EXISTS board_tasks_update ON board_tasks;
DROP POLICY IF EXISTS board_tasks_delete ON board_tasks;

CREATE POLICY board_tasks_read ON board_tasks FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY board_tasks_insert ON board_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY board_tasks_update ON board_tasks FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY board_tasks_delete ON board_tasks FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a task moved/status-changed on one device shows up live
-- on another, the same way projects/discussions/concerns sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'board_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE board_tasks;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- Verify after apply (adversarial RLS probe, mirrors the 2026-06-30 audit):
--   As anon:            GET /rest/v1/board_tasks?select=slug  -> [] or 401 (never rows)
--   As a stranger auth: GET /rest/v1/board_tasks?select=slug  -> [] (own instance empty)
--   As a family member: INSERT/UPDATE/SELECT succeed, scoped to the family instance.
-- =============================================================================
