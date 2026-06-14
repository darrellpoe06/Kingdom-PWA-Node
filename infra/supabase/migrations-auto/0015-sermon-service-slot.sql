-- =============================================================================
-- 0015 — sermon service slot (Darrell 2026-06-14)
-- =============================================================================
-- The church holds TWO Wednesday services (1pm + evening) and Sunday morning
-- only. Both Wednesday uploads land on the same date, so an optional, editable
-- service_slot ('1pm' / 'evening' / free text) lets the director label which is
-- which. Import can't set it (the video titles don't say), so it's hand-set —
-- nullable, never painted. Additive + idempotent.

ALTER TABLE choir_sermons ADD COLUMN IF NOT EXISTS service_slot text;

NOTIFY pgrst, 'reload schema';
