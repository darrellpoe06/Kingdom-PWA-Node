-- =============================================================================
-- 0095 — sovereign captions: give video_transcripts a timestamped VTT track
-- =============================================================================
-- Declared by Darrell 2026-07-09: "we want live perpetual and historical
-- sovereign captions asap." YouTube shows captions on our Sunday livestream only
-- because Google runs ASR server-side and paints them onto ITS player; those
-- captions never leave the YouTube watch page (not on the in-room projection, the
-- PoeTech app, the Presenter/NDI output, Facebook, or a downloaded clip). We want
-- captions we OWN, on every surface.
--
-- WHY ONLY TWO COLUMNS (no duplication — Darrell: "combine what makes sense").
-- 0058 already stores everything a caption needs EXCEPT the timing:
--   * source  -> provenance enum (youtube-asr | whisper-nas | manual) — REUSED as
--                the caption's provenance; captions.js speaks the same vocabulary.
--   * lang    -> caption language — REUSED.
--   * updated_at -> freshness (touched by the existing trigger) — REUSED.
-- The ONLY genuinely new facts a synced caption track adds are:
--   * vtt        -> the WebVTT document (the timestamped cues themselves). The
--                   `text` blob 0058 already stores is the UNtimed transcript,
--                   which cannot follow a video; `vtt` is what makes it a caption.
--   * cue_count  -> number of timed cues, the coverage metric (0 = an untimed
--                   transcript, honestly NOT a caption track — DR-0076).
--
-- IDEMPOTENT: ALTER TABLE ... ADD COLUMN IF NOT EXISTS. Additive, forward-only,
--   church-internal. The existing authenticated GRANT (0058:73) covers the new
--   columns (a grant is table-level, not per-column), so NO new grant and NO RLS
--   change is needed — READ stays user_in_choir, WRITE stays owner/admin (0058).
-- DEPENDS ON: 0058 (video_transcripts).
-- =============================================================================

ALTER TABLE video_transcripts ADD COLUMN IF NOT EXISTS vtt       text;
ALTER TABLE video_transcripts ADD COLUMN IF NOT EXISTS cue_count integer NOT NULL DEFAULT 0;

-- Tell PostgREST to pick up the new columns immediately.
NOTIFY pgrst, 'reload schema';
