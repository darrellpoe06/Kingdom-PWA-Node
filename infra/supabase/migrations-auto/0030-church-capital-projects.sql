-- =============================================================================
-- 0030 — church capital projects + budget lines (facilities / CapEx, GATED)
-- =============================================================================
-- The sanctuary LED video wall is the church's first tracked CAPITAL PROJECT.
-- This is REAL church financial data (an invoice total, community donations),
-- so it must NOT live in the public seed/community surface and must NOT ship in
-- the client JS bundle. It lives ONLY here, server-side, scoped to the church
-- instance and gated to owner/admin by RLS. The PWA's Video Wall page renders it
-- to church STAFF only (isChurchStaff) and fetches it through video-wall-sync.
--
-- PRIVACY / NO-LEAK (binding, per the build brief + DR-0060/0076):
--   - READ + WRITE are owner/admin ONLY (NOT every instance member) — tighter
--     than the choir read gate, because dollar figures are involved.
--   - RLS scopes every row to the caller's instance (no cross-tenant leak,
--     enforced the same way tenancy-guard proves for every instance_id table).
--   - `authenticated` table GRANTs are EXPLICIT here (the 2026-06-16 Choir 42501
--     incident: a table with RLS but no grant 403s before RLS ever runs).
--
-- SCHEMA ONLY — NO FIGURES IN THIS FILE (the repo is PUBLIC):
--   This repository is public on GitHub, so a committed dollar figure (or an
--   invoice number that pins one) would itself be a public exposure — the exact
--   thing the binding privacy rule forbids. Therefore the grounded amounts
--   (the purchase invoice total, the 2024 estimate, donation envelopes) are NOT seeded
--   here. They are loaded ONCE, server-side, from an UNCOMMITTED seed the family
--   runs in the Studio SQL editor (infra/supabase/seeds/colg-video-wall.sql,
--   gitignored), or entered in-app by staff. This file ships only the structure.
--
-- Spec (P2.97mm, dimensions) and the engineering opportunities/constraints are
-- NON-financial and live in the component (public-safe). Money lives only in the
-- gated rows the family seeds — never in this public file, never in the bundle.
--
-- Tier: financial surface for the church -> Tier C by nature, but additive +
-- gated; the lane ships the schema, BG/Darrell validate by USE. Idempotent.
-- =============================================================================

-- 1. The capital project record (one row per tracked CapEx project). ----------
CREATE TABLE IF NOT EXISTS church_capital_projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  slug              text NOT NULL,                       -- stable per-instance key
  name              text NOT NULL,
  category          text NOT NULL DEFAULT 'facilities'   -- facilities / av / capex
                      CHECK (category IN ('facilities','av','capex','other')),
  status            text NOT NULL DEFAULT 'planning'
                      CHECK (status IN ('planning','purchased','delivered','staged','installing','live','on-hold')),
  vendor            text,
  vendor_url        text,
  summary           text,
  install_note      text,                                -- where it is / what's next
  pledged_total     numeric(12,2),                       -- NULL until known (no fabrication)
  received_total    numeric(12,2),                       -- NULL until known
  donation_note     text,
  hero_image_url    text,                                -- stage-visual image slot (added later)
  sort_order        integer NOT NULL DEFAULT 0,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  updated_by        uuid REFERENCES auth.users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS church_capital_projects_slug_uniq
  ON church_capital_projects(instance_id, slug);
CREATE INDEX IF NOT EXISTS church_capital_projects_instance_idx
  ON church_capital_projects(instance_id, sort_order);

-- 2. Budget line items — each number carries its OWN source (Darrell's -------
--    clickable-source-links principle: every figure traces to its invoice/email).
CREATE TABLE IF NOT EXISTS church_capex_budget_lines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES church_capital_projects(id) ON DELETE CASCADE,
  label         text NOT NULL,
  amount        numeric(12,2),                           -- NULL = not yet quoted
  currency      text NOT NULL DEFAULT 'USD',
  kind          text NOT NULL DEFAULT 'current'
                  CHECK (kind IN ('current','superseded','discussed','donation')),
  source_label  text,                                    -- always shown (e.g. an invoice / email citation)
  source_url    text,                                    -- link when one exists (vendor / doc)
  note          text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS church_capex_budget_lines_project_idx
  ON church_capex_budget_lines(instance_id, project_id, sort_order);

-- 3. RLS — owner/admin ONLY, both directions (financial data). ----------------
ALTER TABLE church_capital_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_capex_budget_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS church_capital_projects_read   ON church_capital_projects;
DROP POLICY IF EXISTS church_capital_projects_write  ON church_capital_projects;
DROP POLICY IF EXISTS church_capital_projects_update ON church_capital_projects;
DROP POLICY IF EXISTS church_capital_projects_delete ON church_capital_projects;
CREATE POLICY church_capital_projects_read   ON church_capital_projects FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_capital_projects_write  ON church_capital_projects FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_capital_projects_update ON church_capital_projects FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_capital_projects_delete ON church_capital_projects FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

DROP POLICY IF EXISTS church_capex_budget_lines_read   ON church_capex_budget_lines;
DROP POLICY IF EXISTS church_capex_budget_lines_write  ON church_capex_budget_lines;
DROP POLICY IF EXISTS church_capex_budget_lines_update ON church_capex_budget_lines;
DROP POLICY IF EXISTS church_capex_budget_lines_delete ON church_capex_budget_lines;
CREATE POLICY church_capex_budget_lines_read   ON church_capex_budget_lines FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_capex_budget_lines_write  ON church_capex_budget_lines FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_capex_budget_lines_update ON church_capex_budget_lines FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_capex_budget_lines_delete ON church_capex_budget_lines FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- 4. Explicit authenticated GRANTs (belt-and-suspenders vs the 42501 class). ---
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_capital_projects   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_capex_budget_lines TO authenticated;

-- 5. updated_at triggers (reuse the shared touch function). --------------------
DROP TRIGGER IF EXISTS church_capital_projects_touch_updated ON church_capital_projects;
CREATE TRIGGER church_capital_projects_touch_updated
  BEFORE UPDATE ON church_capital_projects
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
DROP TRIGGER IF EXISTS church_capex_budget_lines_touch_updated ON church_capex_budget_lines;
CREATE TRIGGER church_capex_budget_lines_touch_updated
  BEFORE UPDATE ON church_capex_budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- 6. Realtime so every staff device sees the same figures live. -----------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='church_capital_projects')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE church_capital_projects; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='church_capex_budget_lines')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE church_capex_budget_lines; END IF;
END $realtime$;

-- 7. NO SEED HERE (public repo). The grounded Video Wall project + budget lines
--    for COLG are loaded once from the uncommitted, gitignored seed
--    infra/supabase/seeds/colg-video-wall.sql (run in Studio by the family), or
--    entered in-app by staff. That keeps every real figure server-side only.

NOTIFY pgrst, 'reload schema';
