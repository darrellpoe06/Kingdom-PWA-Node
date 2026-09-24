-- =============================================================================
-- 0230 — the Decision Intelligence board keeps a daily record of what it saw
-- (DR-0612, Phase 1 of the Decision Intelligence Layer)
-- =============================================================================
-- Darrell 2026-09-24: "Build phase 1 of the decision intelligence layer."
-- The seven readouts (risks, dependencies, ownership gaps, escalations,
-- patterns, timeline threats, decisions required) were computed on screen and
-- forgotten, so nobody could see a trend or audit what a leader was shown. One
-- row per instance per day holds the counts and how many rows of each kind
-- were read. The board writes it when a governor opens it; a day nobody
-- opened the board has no row, and the trend says so.
--
-- Instance-scoped like every tenant table: members of the instance read it;
-- collaborators (owner / admin / member) write it, as themselves; a viewer
-- reads only (the overlay below); a non-member sees nothing. Proven by
-- infra/supabase/tests/0230-decision-readouts-smoke.sql in the RLS matrix.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.decision_readouts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  day          date NOT NULL,
  counts       jsonb NOT NULL DEFAULT '{}'::jsonb,
  read         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, day)
);
CREATE INDEX IF NOT EXISTS decision_readouts_instance_day_idx
  ON public.decision_readouts (instance_id, day DESC);

COMMENT ON TABLE public.decision_readouts IS 'One row per instance per day: the Decision Intelligence readout counts and the rows read. DR-0612.';

ALTER TABLE public.decision_readouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS decision_readouts_read   ON public.decision_readouts;
DROP POLICY IF EXISTS decision_readouts_insert ON public.decision_readouts;
DROP POLICY IF EXISTS decision_readouts_update ON public.decision_readouts;

CREATE POLICY decision_readouts_read ON public.decision_readouts FOR SELECT
  USING (user_role_in_instance(instance_id) IS NOT NULL);
CREATE POLICY decision_readouts_insert ON public.decision_readouts FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              AND created_by = auth.uid());
-- The same day's row is refreshed as the board is reopened (upsert).
CREATE POLICY decision_readouts_update ON public.decision_readouts FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));

GRANT SELECT, INSERT, UPDATE ON public.decision_readouts TO authenticated;

-- The viewer read-only overlay covers the new instance-scoped table (DR-0241).
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
