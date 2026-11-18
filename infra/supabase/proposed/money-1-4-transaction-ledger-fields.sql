-- =============================================================================
-- PROPOSED (not applied): FOS Money Phase 1.4 — what the bank has and has not
-- taken, where a row came from, and a pending row that later posts.
-- =============================================================================
-- STAGED OUTSIDE migrations-auto/ ON PURPOSE. Every file in migrations-auto/
-- is applied to production on merge to main (.github/workflows/db-migrate.yml).
-- Christina 2026-11-17: no production migration until authorized database
-- access is restored, a backup is confirmed, and the migration is tested.
-- Applying this is a deliberate act: move it into migrations-auto/ with the
-- next free number, in its own PR, after those three.
--
-- WHY (each column answers a measured defect; Phase 1.4 handoff,
-- docs/99-session-notes/2026-11-17-fos-money-phase-1-4-handoff.md):
--   outstanding  — a check written but not yet presented. Every balance read
--                  it as inside the bank's figure; check #9879 ($2,200.88)
--                  left Personal 7206 reading $2,200.88 too high. The engine
--                  already honors it (lib/outstanding-checks.js, PR #2720).
--   cleared_on   — the day the bank took it, so it is subtracted once, never
--                  twice.
--   pending      — a pending card row that later posts with a new date or
--                  description was a new dedupe key and could be counted
--                  twice. Today the app keeps the flag locally and the sync
--                  drops it.
--   source       — where the row came from (screenshot, statement, manual,
--                  bank feed). The sync drops it today.
--   doc_id       — the uploaded document the row was read from, so the
--                  original can always be opened from the row.
-- Links to a bill, debt or obligation need no new column: transactions
-- already carries linked_to_kind / linked_to_id (schema-v1).
--
-- SAFETY:
--   · ADDITIVE: nullable columns, no default, no backfill. Every existing row
--     reads NULL = "not marked", which the engine treats exactly as before.
--   · IDEMPOTENT: ADD COLUMN IF NOT EXISTS; applying twice is a no-op.
--   · NO RLS CHANGE: transactions is already family-private (schema-v1).
--   · REVERSIBLE: infra/supabase/proposed/money-1-4-transaction-ledger-fields.down.sql
--     drops exactly these five columns.
--   · TESTED: scripts/money-migration-replay.sh applies it twice to a
--     throwaway PostgreSQL over a stand-in transactions table holding rows,
--     proves every existing value is unchanged, then applies the down file.
-- DEPENDS ON: schema-v1 (transactions).
-- =============================================================================

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS outstanding boolean;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cleared_on  date;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pending     boolean;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source      text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doc_id      text;

COMMENT ON COLUMN transactions.outstanding IS 'A check or payment written but not yet taken by the bank (FOS Money Phase 1.4). NULL = not marked.';
COMMENT ON COLUMN transactions.cleared_on  IS 'The day the bank took this row. On or before a balance checkpoint = inside that figure.';
COMMENT ON COLUMN transactions.pending     IS 'The bank showed this row as pending when it was recorded.';
COMMENT ON COLUMN transactions.source      IS 'Where the row came from: screenshot, statement, manual, bank feed.';
COMMENT ON COLUMN transactions.doc_id      IS 'The uploaded document this row was read from.';
