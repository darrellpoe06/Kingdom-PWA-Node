-- =============================================================================
-- 0038 — Re-preach lineage: credit the ORIGINAL preacher AND the re-preacher
-- =============================================================================
-- How Bishop Gwin actually works (Darrell 2026-06-17): BG follows up on whoever
-- delivers a message and RE-PREACHES it. So a re-preached message is its OWN
-- message that credits BG as the preacher, while keeping a link back to the
-- ORIGINAL deliverer's message + their canonical speaker — so both are visible
-- and BG can pull up the source preacher's material to use it.
--
-- This builds on 0037 (canonical church_speakers + choir_sermons.speaker_id).
-- It does NOT collapse a guest into BG: the original deliverer keeps their own
-- canonical entity and credit; the re-preach is a SEPARATE row crediting BG,
-- pointing at the source. Correct per-message attribution, lineage preserved.
--
--   source_sermon_id  — the original message this one re-preaches (pull up the
--                       material). ON DELETE SET NULL: deleting the source does
--                       not delete the re-preach.
--   source_speaker_id — the original deliverer's canonical entity, captured as a
--                       durable credit snapshot ("original by <guest>") that
--                       survives even if the source message is later removed.
--
-- DEPENDS ON: 0011 (choir_sermons), 0037 (church_speakers, speaker_id).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS. Safe to re-run. No new instance-scoped
--             table, so RLS/grant guards are unaffected (choir_sermons already
--             owner/admin-write, member-read per 0011/0029).
-- =============================================================================

ALTER TABLE choir_sermons
  ADD COLUMN IF NOT EXISTS source_sermon_id  uuid REFERENCES choir_sermons(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_speaker_id uuid REFERENCES church_speakers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS choir_sermons_source_idx ON choir_sermons(source_sermon_id);

NOTIFY pgrst, 'reload schema';
