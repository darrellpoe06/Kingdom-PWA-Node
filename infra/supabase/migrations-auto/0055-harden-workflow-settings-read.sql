-- =============================================================================
-- 0055 — harden workflow_settings read policy (privacy hardening, 2026-06-29)
-- =============================================================================
-- FINDING (signup-privacy verification, 2026-06-29): workflow_settings carried
--   CREATE POLICY workflow_settings_read ... FOR SELECT USING (true);
-- (schema-v2.10-ai-workflow-state.sql:95). `USING (true)` means every signed-in
-- session — INCLUDING a brand-new stranger who just self-served an account — can
-- read the whole AI-workflow config table (enabled flags, dry_run, budget caps,
-- tuning notes). It is NOT instance-scoped (no instance_id column), so it is the
-- one global table a fresh account could read.
--
-- This is NOT a leak of family/business/church PRIVATE data (the domain tables
-- are all RLS-gated by user_in_instance — verified isolated). It is operational
-- internals, and a grep shows NOTHING reads workflow_settings from the browser
-- (app/src), nor from infra/scripts/backend — the orchestrator reads + writes it
-- via the SERVICE ROLE, which BYPASSES RLS entirely. So tightening the client
-- read policy changes nothing for the orchestrator and breaks no client path.
-- Per the verification doctrine (DR-0076) + least privilege, close it anyway:
-- defense in depth, and "USING (true)" on a non-tenant-scoped table is exactly
-- the kind of broad default that should never sit unexamined.
--
-- NEW POLICY: client reads restricted to the poe-family GOVERNOR circle (same
-- gate as admin_signup_metrics — membership in poe-family, which strangers can
-- never have). The service role is unaffected (it does not go through RLS).
--
-- IDEMPOTENT + GUARDED: only runs if the table exists (schema-v2.10 was applied
-- historically, outside this lane); DROP POLICY IF EXISTS + CREATE. Named to
-- sort ahead of the currently-failing 0055-relationship-permissions.sql so it
-- reaches cloud while that lane halt is being resolved (see the ordering note in
-- 0055-admin-signup-metrics.sql).

DO $$
BEGIN
  IF to_regclass('public.workflow_settings') IS NULL THEN
    RAISE NOTICE '0055-harden-workflow-settings-read: workflow_settings not present — skipping (no-op)';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE workflow_settings ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS workflow_settings_read ON workflow_settings';
  EXECUTE $pol$
    CREATE POLICY workflow_settings_read ON workflow_settings FOR SELECT
      USING (
        EXISTS (
          SELECT 1
            FROM instance_members im
            JOIN instances i ON i.id = im.instance_id
           WHERE im.user_id = auth.uid()
             AND i.slug = 'poe-family'
        )
      )
  $pol$;
END $$;

NOTIFY pgrst, 'reload schema';
