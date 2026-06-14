-- =============================================================================
-- 0016 — sermon document link (Darrell 2026-06-14)
-- =============================================================================
-- BG emails his final Sunday sermon document to mrspoe06@gmail.com each week
-- (years of them). The sermon-prep area combines the YouTube video (already
-- sourced) with the original document so BG can draw on his own prep material.
-- document_url holds the link to the stored copy; document_source records where
-- it came from. Fillable by a director now (paste a link); auto-filled later by
-- the Gmail ingestion (gated on Christina's one-time OAuth + a storage decision).
-- Additive, nullable, idempotent.

ALTER TABLE choir_sermons ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE choir_sermons ADD COLUMN IF NOT EXISTS document_source text
  CHECK (document_source IN ('email','upload','manual'));

NOTIFY pgrst, 'reload schema';
