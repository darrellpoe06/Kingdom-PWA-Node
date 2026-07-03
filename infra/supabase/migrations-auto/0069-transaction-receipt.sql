-- =============================================================================
-- 0069 — transactions.receipt: the paper trail rides the row (DR-0090)
-- =============================================================================
-- Darrell 2026-07-03, holding a real paper receipt: "How do we upload
-- receipts?" A receipt attached in the app is stored ON its transaction as
-- jsonb — { id, src (compressed data URL), amount, merchant, note,
-- capturedAt } — mapped by transactions-sync.js toRow/fromRow, so the image
-- and its evidence travel with the row to every signed-in family device.
--
-- Same storage pattern as every photo surface in the app (inline compressed
-- data URL, ~80–250 KB): no new bucket, no dashboard-side storage policy
-- (which the migration lane cannot create — see 0021's note), fully
-- exportable with the data (DATA-AS-EMPOWERMENT). Access control is the
-- transactions table's existing instance RLS — a receipt is exactly as
-- private as the transaction it evidences.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS. Additive only.
-- =============================================================================

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt jsonb;

COMMENT ON COLUMN transactions.receipt IS
  'DR-0090: attached receipt evidence — { id, src (compressed data URL), amount, merchant, note, capturedAt }. NULL = no receipt attached.';

NOTIFY pgrst, 'reload schema';
