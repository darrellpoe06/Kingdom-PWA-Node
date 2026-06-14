-- =============================================================================
-- 0018 — song lyrics / words (Darrell 2026-06-14)
-- =============================================================================
-- The choir wants their own space for the WORDS to the songs they're singing,
-- editable. choir_songs is already choir-readable (members) + director-editable
-- (owner/admin), so lyrics ride the existing table + RLS — the whole choir sees
-- the words; directors edit them. Additive, nullable, idempotent.

ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS lyrics text;

NOTIFY pgrst, 'reload schema';
