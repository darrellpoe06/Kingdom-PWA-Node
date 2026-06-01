-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.10-ai-workflow-state.sql
--
-- v2.10 SITUATIONAL ANALYSIS — sustainability state for the auto-mutation
-- + recommendation workflow shipped 2026-05-26 (n8n workflow 06).
--
-- This migration introduces:
--   1. workflow_state — per-workflow rolling state (last_run_at, budgets
--      spent so far, run counter), so the workflow can self-throttle.
--   2. workflow_settings — per-workflow flags (enabled, dry_run, budget
--      caps), set out of band by Darrell to disable or tune the workflow
--      WITHOUT redeploying the JSON.
--   3. ai_kudos — celebration log per POE binding ("celebrate wins
--      explicitly"). Append-only, instance-scoped.
--   4. Extension of audit_log's CHECK constraint so we can write
--      `actor='n8n-situational-analyzer-v0'` style rows. The constraint
--      currently lists 'system' which would technically cover it, but we
--      add 'ai-suggestion' explicitly so the daily-report SQL can filter
--      on a single value.
--
-- Sovereignty-First binding: this schema is part of the autonomy
-- substrate for workflow 06. Without it the workflow has nowhere to
-- store the per-run counters and the daily budget cap can't be enforced.
-- The schema lands BEFORE the workflow goes live (commit ordering: this
-- migration's commit precedes workflow 06's activation).
--
-- IDEMPOTENT. CREATE TABLE IF NOT EXISTS, ALTER … ADD CONSTRAINT in a
-- DO-block that catches duplicate_object, INSERT … ON CONFLICT DO
-- NOTHING for the seed rows.
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. workflow_state — per-workflow rolling counters
-- =====================================================================

CREATE TABLE IF NOT EXISTS workflow_state (
  workflow_key       text PRIMARY KEY,
  instance_id        uuid REFERENCES instances(id) ON DELETE CASCADE,
  last_run_at        timestamptz,
  last_run_status    text CHECK (last_run_status IN
                       ('ok','dry-run-ok','disabled','budget-exhausted',
                        'rate-limited','error','partial')),
  last_run_summary   text,
  -- Rolling daily counters (UTC day; reset by the workflow itself when the
  -- date changes between runs)
  current_day_utc    date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  runs_today         int NOT NULL DEFAULT 0,
  cost_cents_today   int NOT NULL DEFAULT 0,
  -- Health
  last_ntfy_ping_at  timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workflow_state_last_run_idx
  ON workflow_state (last_run_at DESC);

ALTER TABLE workflow_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY workflow_state_member_read ON workflow_state FOR SELECT
    USING (instance_id IS NULL OR user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Writes go through the workflow itself (the n8n Postgres credential is
-- a service role) — no end-user INSERT/UPDATE policies needed.

-- Seed the row for the situational-analysis workflow so the first run
-- doesn't need to figure out whether to INSERT or UPDATE.
INSERT INTO workflow_state (workflow_key, instance_id)
SELECT 'situational-analyzer-v0', id FROM instances LIMIT 1
ON CONFLICT (workflow_key) DO NOTHING;

-- =====================================================================
-- 2. workflow_settings — Darrell-facing flags + budget caps
-- =====================================================================

CREATE TABLE IF NOT EXISTS workflow_settings (
  workflow_key            text PRIMARY KEY,
  enabled                 boolean NOT NULL DEFAULT true,
  dry_run                 boolean NOT NULL DEFAULT true,
  daily_budget_cents      int NOT NULL DEFAULT 500,    -- $5.00
  per_run_budget_cents    int NOT NULL DEFAULT 50,     -- $0.50
  max_runs_per_day        int NOT NULL DEFAULT 6,
  min_minutes_between_runs int NOT NULL DEFAULT 240,   -- 4 hours
  notes                   text,
  updated_at              timestamptz NOT NULL DEFAULT now(),
  updated_by              uuid REFERENCES auth.users(id)
);

ALTER TABLE workflow_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY workflow_settings_read ON workflow_settings FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UPDATE policy intentionally absent. Darrell tweaks settings via the
-- service-role SQL editor for now; a future UI toggle can be added with
-- a member/role-gated update policy.

-- Seed the row for the situational-analyzer with the documented defaults.
-- dry_run = TRUE so the first three runs are dry by design.
INSERT INTO workflow_settings
  (workflow_key, enabled, dry_run, daily_budget_cents, per_run_budget_cents,
   max_runs_per_day, min_minutes_between_runs, notes)
VALUES
  ('situational-analyzer-v0', true, true, 500, 50, 6, 240,
   'Dry-run for first 3 runs. Flip dry_run=false manually when Darrell is satisfied with the would-have-done reports.')
ON CONFLICT (workflow_key) DO NOTHING;

-- =====================================================================
-- 3. ai_kudos — POE binding: celebrate wins explicitly
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_kudos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  source_feedback_id uuid REFERENCES feedback(id) ON DELETE SET NULL,
  recipient_user_id  uuid REFERENCES auth.users(id),
  context_text  text NOT NULL,
  for_what      text,
  surfaced_in_report_run_id uuid
);

CREATE INDEX IF NOT EXISTS ai_kudos_instance_at_idx
  ON ai_kudos (instance_id, created_at DESC);

ALTER TABLE ai_kudos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY ai_kudos_member_read ON ai_kudos FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 4. audit_log — widen the action CHECK so workflow 06 can write its own
--    bucket. We don't ALTER the existing constraint (PG can't easily
--    modify a CHECK in place); instead we DROP-AND-ADD inside a DO-block
--    that's safe to re-run.
-- =====================================================================

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
   WHERE t.relname = 'audit_log'
     AND c.contype = 'c'
     AND pg_get_constraintdef(c.oid) ILIKE '%action%';
  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE audit_log DROP CONSTRAINT ' || quote_ident(v_constraint_name);
  END IF;

  ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check
    CHECK (action IN (
      'create','update','delete','status-change','export',
      'login','logout','permission-grant','permission-revoke',
      'invite','accept-invite','pin-change','export-privileged',
      'export-stripped','failed-auth','system',
      -- v2.10 additions:
      'ai-mutation','ai-suggestion','ai-feedback-classified',
      'ai-priority-recompute','ai-stale-mark','ai-kudo'
    ));
END $$;

-- Add a column to flag the AI actor cleanly. The schema previously inferred
-- "system" / "human" from user_id IS NULL, but with the situational
-- analyzer writing rows we want it explicit so the daily report can
-- separate "what the AI did" from "what Darrell did."
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor text;
CREATE INDEX IF NOT EXISTS audit_log_actor_at_idx
  ON audit_log (actor, at DESC) WHERE actor IS NOT NULL;

COMMIT;

-- =====================================================================
-- Verification queries:
--
--   SELECT workflow_key, enabled, dry_run, daily_budget_cents
--     FROM workflow_settings;
--
--   SELECT workflow_key, last_run_at, last_run_status, runs_today
--     FROM workflow_state;
--
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='audit_log' AND column_name='actor';
--
-- To disable workflow 06 (from Darrell's phone over SQL editor or psql):
--   UPDATE workflow_settings SET enabled=false WHERE workflow_key='situational-analyzer-v0';
--
-- To flip the workflow from dry-run to live after the first three runs:
--   UPDATE workflow_settings SET dry_run=false WHERE workflow_key='situational-analyzer-v0';
-- =====================================================================
