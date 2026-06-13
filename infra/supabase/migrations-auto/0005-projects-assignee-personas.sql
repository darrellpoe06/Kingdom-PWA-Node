-- =============================================================================
-- 0005 — projects personal assignment (2026-06-13)
-- =============================================================================
-- Darrell's ask: "Christina's should show hers when and if she is assigned to
-- them personally." Today a project lands in someone's "Mine" list only if they
-- CREATED it (created_by). This adds explicit assignment: a project can be
-- assigned to one or more family members, and it then shows up in each of their
-- "Mine" lists too.
--
-- Stored as persona keys ('darrell', 'christina', ...) rather than raw emails so
-- a member with more than one sign-in email (Christina has two) is matched once,
-- by who they are, not by which address they used. The client maps the signed-in
-- email -> persona (FAMILY_EMAIL_PROFILES) and matches against this array.
--
-- Deploy-ordering safe: the client persists assignment only via UPDATE (never on
-- INSERT), so a project create can never fail on a not-yet-live column. Worst
-- case before this lands: an assignment edit no-ops until the column exists.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, JSONB array default.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS assignee_personas jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Refresh PostgREST's schema cache so the new column is writable immediately.
NOTIFY pgrst, 'reload schema';
