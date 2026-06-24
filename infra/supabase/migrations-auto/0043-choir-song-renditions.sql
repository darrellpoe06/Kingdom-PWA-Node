-- =============================================================================
-- 0043 — Song RENDITIONS: every choir_songs set-list row IS a past performance.
--        Add the per-rendition story (ad-libs + the keyboardist's per-PERFORMANCE
--        notes) it can carry, plus choir_rendition_loves (most-loved VERSION).
-- =============================================================================
-- Declared by Darrell 2026-06-24: the choir's past performances + their ad-libs
-- together are "THE WAYS WE HAVE SUNG THESE SONGS IN THE PAST." So a song is one
-- title with MANY renditions — one per time it was sung — and opening a song
-- shows "the ways we've sung this": rendition A (this date, this vamp/these runs),
-- rendition B (that date, different), so the choir references + reuses its own
-- history, and the music-creation process can graduate a loved ad-lib into a
-- kept arrangement.
--
-- NO NEW ENTITY — choir_songs (0011) is ALREADY one row per (title, service_date,
-- service_type): a row IS a rendition (a specific performance). The Songbook
-- (0041, lib/choir-songbook.js) groups those rows by title; this migration adds
-- the PER-RENDITION fields a single performance carries, and rendition-level
-- loves keyed by the row id (which VERSION the body loved most — distinct from
-- 0041's title-level loves = "I love this song"). Everything stays DERIVED from
-- the real rows (Reality-trace / Verification Doctrine) — nothing painted.
--
-- FAITHFUL SOURCING (no fabrication): ad_libs is a real, reviewable list. The
-- director curates them by hand, OR the content-engine / SME Whisper pipeline
-- (same archive: the 'thelovecorner' YouTube channel + church-NAS) writes
-- DETECTED candidates with a confidence and review='unreviewed' for a human to
-- confirm. A low-confidence ARCHIVE match flags itself for review; the app never
-- presents a detected ad-lib as confirmed, and never invents one. The ad_libs
-- object shape is documented in lib/choir-renditions.js (the single consumer).
--
-- ARCHIVE PROVENANCE IS NOT DUPLICATED: a rendition's source honesty (was it
-- matched from a recording, which video, how confident, does it need review)
-- already lives on choir_songs as source / video_id / confidence / needs_review
-- (migration 0042, the archive-seeded repertoire). lib/choir-renditions.js reads
-- THOSE columns (needsSourceReview); this migration adds NO parallel source
-- columns — only the ad-libs, the per-performance keyboardist notes, and the
-- rendition-level loves that 0042 did not cover.
--
-- ACCESS (matches the rest of the Choir module, decided 2026-06-14):
--   choir_songs columns       read = any choir member (existing RLS, 0011)
--                             write = owner/admin only (existing RLS, 0011)
--   choir_rendition_loves     read   = any choir member (user_in_choir)
--                             insert = any choir member, as themselves
--                             delete = own love (toggle off)
--
-- DEPENDS ON: 0011-choir-module.sql (choir_songs, user_in_choir), 0041-choir-
--             songbook-crossref.sql (the Songbook this builds on), and 0042-choir-
--             sme-notes.sql (the archive provenance columns the source flag reads).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, CREATE ... IF NOT EXISTS, DROP-then-
--             CREATE policies, guarded publication add. Safe to re-run.
-- NO ANON: choir-only surface; nothing granted to the anon role.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PER-RENDITION fields on the set-list row (a row = one performance).
--    All nullable / defaulted so existing rows are untouched (additive).
--    (Archive provenance — source/video_id/confidence/needs_review — is NOT
--    here; it is owned by 0042. See the header note.)
-- ---------------------------------------------------------------------------
-- The highlighted ad-libs / variations for THIS performance (vamps, runs,
-- soloist moments, bridge/arrangement differences that time). A JSON array of
-- objects; shape in lib/choir-renditions.js. Default empty = "none recorded".
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS ad_libs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- The keyboardist's notes specific to THIS rendition (the chord moves, the
-- modulation, the feel THAT time) — distinct from the song's general `notes`
-- AND from the song-level keyboardist knowledge in choir_sme_notes (0042, which
-- is "how to play this song" across every Sunday; this is "how we played it this
-- time").
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS keyboardist_notes text;

-- ---------------------------------------------------------------------------
-- 2. RENDITION LOVES — choir_rendition_loves (most-loved VERSION, by row id).
--    Keyed by the choir_songs row id (the specific performance), NOT the title:
--    "which way we sang it did the body love most." Complements 0041's
--    choir_song_loves (title-level = "I love this song"). One per member per
--    rendition. ON DELETE CASCADE so removing a performance clears its loves.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS choir_rendition_loves (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  rendition_id uuid NOT NULL REFERENCES choir_songs(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, rendition_id, user_id)
);
CREATE INDEX IF NOT EXISTS choir_rendition_loves_instance_idx ON choir_rendition_loves(instance_id);
CREATE INDEX IF NOT EXISTS choir_rendition_loves_rendition_idx ON choir_rendition_loves(instance_id, rendition_id);

-- ---------------------------------------------------------------------------
-- 3. GRANTS — explicit (cloud project lost its default authenticated GRANT;
--    0024 incident: new tables 403 before RLS until granted). No anon.
--    (choir_songs already carries its grant from 0011/0024; new columns inherit
--    the table grant, so only the new loves table needs one.)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON choir_rendition_loves TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS — mirror choir_song_loves (0041): members read all; cast/clear own.
-- ---------------------------------------------------------------------------
ALTER TABLE choir_rendition_loves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS choir_rendition_loves_read   ON choir_rendition_loves;
DROP POLICY IF EXISTS choir_rendition_loves_insert ON choir_rendition_loves;
DROP POLICY IF EXISTS choir_rendition_loves_delete ON choir_rendition_loves;
CREATE POLICY choir_rendition_loves_read   ON choir_rendition_loves FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_rendition_loves_insert ON choir_rendition_loves FOR INSERT
  WITH CHECK (user_in_choir(instance_id) AND user_id = auth.uid());
CREATE POLICY choir_rendition_loves_delete ON choir_rendition_loves FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. REALTIME — stream rendition loves so every choir device updates live.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'choir_rendition_loves'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE choir_rendition_loves;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
