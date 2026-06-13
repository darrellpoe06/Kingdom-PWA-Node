-- =============================================================================
-- 0006 — project next-step + blocker fields (2026-06-13)
-- =============================================================================
-- Build backlog #2 (docs/governance/decision-queue.md): each project card shows
-- its NEXT ACTION and any BLOCKER, so the list answers what/when/why/how at a
-- glance (ANXIETY-CLARITY). Two free-text fields on the project record, edited
-- in place on the card and synced across devices.
--
-- Deploy-ordering safe: the client persists these only via UPDATE (never on
-- INSERT — projects-sync.toRow omits them), so a project create can never fail
-- on a not-yet-live column. Worst case before this lands: a next-step/blocker
-- edit no-ops until the columns exist. Same pattern as 0004 (priority_rank) and
-- 0005 (assignee_personas).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, nullable text.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_step text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS blocker text;

-- Refresh PostgREST's schema cache so the new columns are writable immediately.
NOTIFY pgrst, 'reload schema';
