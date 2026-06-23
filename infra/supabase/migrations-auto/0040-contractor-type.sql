-- =============================================================================
-- 0040 — contractor/vendor type on contractors_1099 (2026-06-23)
-- =============================================================================
-- Work orders can now carry a CREW of multiple 1099 workers (the dispatch loop
-- in lib/assignments.js + DispatchPanel). Each assigned worker is classed as a
-- `contractor` (someone you hire to do the work) or a `vendor` (someone you buy
-- goods / supplies from). That classification belongs first on the directory
-- record in Books · 1099s, so assigning a worker to a job defaults its type
-- correctly. This adds the column the app's contractor sync now reads/writes
-- (contractors-sync.js: contractorColumns.type / fromRow.type).
--
-- The actual per-job assignment list lives in the incidents.dispatch jsonb
-- column ({ assignments: [...] }) and needs NO migration — jsonb is schemaless
-- by design. This file is ONLY the directory-level type label.
--
-- DEFAULT 'contractor' backfills every existing row so there are no NULLs and
-- the historical default (everyone was an implicit contractor) is preserved.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Owner/family-scoped RLS on
-- contractors_1099 is unchanged (this is a column add, not a policy change).

ALTER TABLE contractors_1099 ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'contractor';

-- Refresh PostgREST's schema cache so the new column is writable immediately
-- (otherwise the API layer's cached schema lags Postgres and inserts/updates
-- naming `type` would 400 in the brief window after this lands).
NOTIFY pgrst, 'reload schema';
