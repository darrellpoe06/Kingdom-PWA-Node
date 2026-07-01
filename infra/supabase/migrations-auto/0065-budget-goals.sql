-- =============================================================================
-- 0065 — budget_goals: the family's stated financial GOALS (the budget engine).
-- =============================================================================
-- Darrell 2026-07-01: a goal-driven, forward-looking budget engine on top of the
-- Forecast / cash-flow layer. A goal is the family's OWN target — "save $X by
-- date Y" or "pay off Z" — and the deterministic engine (lib/budget-engine.js)
-- plans from real income + obligations to say what must be set aside per period,
-- on/off track, projected finish, and proactive spend/hold guidance WITH REASONS.
-- This table just persists the goals so the plan is the same on every device the
-- family signs in from (createTableSync, wholesale-column pattern — mirrors
-- forecast_snapshots + board_tasks). NO money movement; display + guidance only.
--
-- GUARDRAIL (in-app + here): this is a budgeting / cash-flow PLANNING tool on the
-- owner's own goals + data, NOT personalized investment advice — no schema here
-- records or recommends a trade; goals are savings/payoff targets only.
--
-- SCOPE / GATING: family-internal. RLS scopes every row to owner/admin/member of
-- the goal's instance (the Forecast surface is already family/governor-gated).
-- No anon policy — a goal is never publicly readable or writable. DELETE is
-- tightened to owner/admin; a member can add/edit/archive but not hard-drop.
--
-- DEPENDS ON: instances, user_role_in_instance (0011/0050), 0024
--   (restore-authenticated-grants — a signed-in read/write 403s 42501 without the
--   EXPLICIT authenticated grant; the Choir/0039 incident), engagement_touch_updated_at.
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--   publication add. Additive, family-internal — no public surface.
-- APPLY: db-migrate. Until applied, goals persist to localStorage and the engine
--   plans locally; sync resumes cleanly once the table exists (never throws).
-- =============================================================================

CREATE TABLE IF NOT EXISTS budget_goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by     uuid REFERENCES auth.users(id),
  slug           text NOT NULL,                  -- stable local id (e.g. 'goal-...')
  name           text NOT NULL DEFAULT '',       -- what the family is aiming at
  goal_type      text NOT NULL DEFAULT 'save'
                   CHECK (goal_type IN ('save','payoff')),
  scope          text NOT NULL DEFAULT 'consolidated', -- 'consolidated' | entityId
  target_amount  numeric NOT NULL DEFAULT 0,     -- the number to reach / clear
  target_date    date,                            -- the deadline (nullable = open-ended)
  start_date     date,                            -- when the plan begins (nullable)
  current_amount numeric NOT NULL DEFAULT 0,      -- already set aside (save goals)
  linked_debt_id text,                            -- deriveDebts id (payoff goals; live balance)
  priority       integer NOT NULL DEFAULT 0,      -- tie-break ordering (lower = sooner)
  note           text NOT NULL DEFAULT '',        -- free-text detail
  archived       boolean NOT NULL DEFAULT false,  -- soft-hide without losing history
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

CREATE INDEX IF NOT EXISTS budget_goals_instance_idx ON budget_goals(instance_id);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate a goal.
CREATE UNIQUE INDEX IF NOT EXISTS budget_goals_slug_uniq ON budget_goals(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS budget_goals_touch_updated ON budget_goals;
CREATE TRIGGER budget_goals_touch_updated
  BEFORE UPDATE ON budget_goals
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore leaves `anon` untouched. So `authenticated` needs the EXPLICIT grant
-- (without it a signed-in read/write 403s with 42501 — the Choir/0039 incident).
-- NO grant to anon: goals are never public. RLS still gates ROWS.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_goals TO authenticated;

ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

-- Family/governor scope: owner/admin/member of the row's instance. No anon
-- policy exists, so a logged-out client can neither read nor write. DELETE is
-- tightened to owner/admin — a member can add/edit/archive but not hard-delete.
DROP POLICY IF EXISTS budget_goals_read   ON budget_goals;
DROP POLICY IF EXISTS budget_goals_insert ON budget_goals;
DROP POLICY IF EXISTS budget_goals_update ON budget_goals;
DROP POLICY IF EXISTS budget_goals_delete ON budget_goals;

CREATE POLICY budget_goals_read ON budget_goals FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY budget_goals_insert ON budget_goals FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY budget_goals_update ON budget_goals FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY budget_goals_delete ON budget_goals FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — a goal added/edited on one device updates the plan live on another.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'budget_goals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE budget_goals;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
