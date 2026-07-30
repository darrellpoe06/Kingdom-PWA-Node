-- =============================================================================
-- 0127 — sovereign replacements for two retired n8n wires (DR-0218)
-- =============================================================================
-- Darrell 2026-07-30: "get rid of n8n... build the sovereign replacements with
-- their isolation proof." The app-side n8n calls were retired to graceful
-- degrades on 2026-07-30; THIS is their sovereign home — Supabase, RLS-scoped
-- to the tenant, no engine, no webhook.
--
--   mark-noise  ->  transaction_noise : "this imported transaction is noise"
--                   persisted per instance (was /n8n/webhook/mark-noise).
--   thought     ->  agent_inbox       : a directive/thought relayed into the
--                   agent inbox (was /n8n/webhook/thought, wf26/wf27).
--
-- TENANCY: both are scoped by user_role_in_instance(instance_id), the same
-- helper every book/church table uses (0100+). Reads = any member of the
-- instance; writes = collaborators (owner/admin/member, NOT viewer — DR-0241)
-- and only for the writer's own row (created_by = auth.uid()). A non-member
-- sees nothing and can write nothing — proven in tests/0127-*-smoke.sql.
--
-- IDEMPOTENT: IF NOT EXISTS / DROP+CREATE POLICY. Depends only on instances
-- (0001+) and user_role_in_instance (present since the books era).
-- =============================================================================

-- ── transaction_noise — the sovereign mark-noise store ──────────────────────
CREATE TABLE IF NOT EXISTS transaction_noise (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  institution  text NOT NULL,
  fitid        text NOT NULL,
  reason       text NOT NULL DEFAULT 'pwa-tx-mark-noise',
  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, institution, fitid)
);
CREATE INDEX IF NOT EXISTS transaction_noise_lookup_idx
  ON transaction_noise(instance_id, institution, fitid);

ALTER TABLE transaction_noise ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transaction_noise_read   ON transaction_noise;
DROP POLICY IF EXISTS transaction_noise_insert ON transaction_noise;
DROP POLICY IF EXISTS transaction_noise_delete ON transaction_noise;
-- Read: any member of the instance (a noise flag is shared books state).
CREATE POLICY transaction_noise_read ON transaction_noise FOR SELECT
  USING (user_role_in_instance(instance_id) IS NOT NULL);
-- Write: collaborators only (viewer excluded), and only their own row.
CREATE POLICY transaction_noise_insert ON transaction_noise FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              AND created_by = auth.uid());
-- Un-mark is a collaborator action (correct a mistaken flag). No UPDATE policy.
CREATE POLICY transaction_noise_delete ON transaction_noise FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ── agent_inbox — the sovereign thought/directive relay ─────────────────────
CREATE TABLE IF NOT EXISTS agent_inbox (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  body          text NOT NULL,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  source        text NOT NULL DEFAULT 'thinking-space',
  directive_id  text,
  relayed_at    timestamptz,
  created_by    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_inbox_instance_idx
  ON agent_inbox(instance_id, created_at DESC);

ALTER TABLE agent_inbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_inbox_read   ON agent_inbox;
DROP POLICY IF EXISTS agent_inbox_insert ON agent_inbox;
-- Read: any member of the instance (the inbox is the shared relay for that
-- tenant; the sovereign box polls it server-side via service_role, unaffected).
CREATE POLICY agent_inbox_read ON agent_inbox FOR SELECT
  USING (user_role_in_instance(instance_id) IS NOT NULL);
-- Write: collaborators only, and only their own row. No UPDATE/DELETE by
-- clients — the inbox is append-only from the app's side (mirrors the reel).
CREATE POLICY agent_inbox_insert ON agent_inbox FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              AND created_by = auth.uid());

-- Re-run the viewer read-only overlay so its RESTRICTIVE deny covers these two
-- new instance-scoped tables too (DR-0241; the tenancy-guard Check E gate).
-- Belt-and-suspenders over the collaborators-only WITH CHECK above: a viewer
-- can read but never write, both by the permissive policy AND the overlay.
SELECT public.apply_viewer_readonly_overlay();
