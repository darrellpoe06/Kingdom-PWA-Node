-- =============================================================================
-- 0004 — projects manual priority rank (2026-06-13)
-- =============================================================================
-- Darrell's ask: "make it so we can rearrange the list so we can reprioritize
-- based on current needs." This is the HUMAN-decide half of "system ranks, the
-- human decides" — a persisted manual order the user sets by hand on their real
-- projects. The AI-pushback half (the local-model ranking) lands later on the
-- cycle_items engine (DR-0056 / DR-0062); this column is the human override that
-- always wins.
--
-- Lower rank = higher priority (rank 0 sits at the top). NULL = unranked, which
-- sorts after every ranked item and falls back to the timeline date order.
--
-- Deploy-ordering safe: the client writes priority_rank DEFENSIVELY (it retries
-- the upsert without the field if the column isn't live yet), so feedback/sync
-- never breaks whether this migration lands before or after the client bundle.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority_rank integer;

-- Refresh PostgREST's schema cache so the new column is writable immediately.
NOTIFY pgrst, 'reload schema';
