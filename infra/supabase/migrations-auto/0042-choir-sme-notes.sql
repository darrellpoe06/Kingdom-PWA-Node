-- =============================================================================
-- 0042 — Choir SME notes + archive-sourced repertoire: the keyboardist's per-song
--        musical knowledge AND provenance for songs auto-seeded from the YouTube/
--        church-NAS archive, both enriching the Songbook cross-reference (0041).
-- =============================================================================
-- TWO additive pieces, one story (Darrell 2026-06-24): enrich the choir's songs
-- from the SAME archive + SME source the content engine uses.
--   (A) choir_sme_notes  — Christian (keyboardist) per-song key/arrangement/
--       how-to-play, from the SME video pipeline's knowledge.json (below).
--   (B) archive provenance on choir_songs — so the historical repertoire (what
--       the choir actually sang, extracted from the service recordings) can be
--       auto-seeded into the Songbook with a dedup key, a deep-link timestamp,
--       a confidence, and a needs-review flag (faithful: flag uncertain, never
--       guess). The Songbook (0041) is the cross-referenced home for songs, so
--       the archive seed lands there (carries scripture/theme/sermon + most-
--       loved + last-sung), not the brainstorm-only Song Workshop pool (0036).
-- =============================================================================
-- Declared by Darrell 2026-06-24: Christian (the choir keyboardist) records
-- videos explaining the choir. The SME video pipeline (infra/nas-sme-pipeline,
-- choir-keyboardist-to-knowledge.sh) transcribes them locally on the NAS and
-- extracts a structured knowledge.json — per song: key, arrangement, how-to-play
-- / technique, plus general guidance. That captured knowledge should ENRICH the
-- choir-song CROSS-REFERENCE (the Songbook, 0041) so a song carries how to play
-- it, the key, and the arrangement — sourced from the keyboardist.
--
-- WHY ITS OWN TABLE (not columns on choir_songs): SME notes are a SOURCED layer
-- distinct from the director's own key/arrangement — they carry provenance (which
-- video, a source quote, a confidence) and a review lifecycle (extracted →
-- reviewed). Verification Doctrine: extracted content is UNVERIFIED until a
-- steward confirms it; keeping it separate lets the Songbook show "from
-- Christian's video (unconfirmed)" honestly, and a confirmed note can be PROMOTED
-- onto the song's own key/arrangement (choir_songs, 0041) on review. Keyed by the
-- normalized song TITLE (like choir_song_loves), so the note rides the song
-- across every Sunday it is sung, not a single set-list row.
--
-- HANDOFF CONTRACT (consume the SME pipeline's output as-is; coordinate, no fork):
-- knowledge.json — { sme:{name,role}, songs:[{title,key_label,arrangement,note,
-- confidence,source_quote}], general_guidance:[{topic,guidance,source_quote}],
-- unclear:[] }. The director imports it (reviewed, not autonomous) via the
-- in-app "keyboardist knowledge" surface; lib/choir-sme-notes.js parseKnowledgeJson
-- maps it field-for-field into the rows below. Faithful: a field Christian didn't
-- state stays null; nothing is invented.
--
-- ACCESS (authoritative musical knowledge — steward-curated):
--   read   = any choir member (user_in_choir) — the choir sees how to play it
--   insert = owner/admin (the director imports the reviewed knowledge)
--   update = owner/admin (confirm / promote / edit)
--   delete = owner/admin
--
-- DEPENDS ON: 0011 (user_in_choir, user_role_in_instance), 0041 (the Songbook
--             cross-reference these notes enrich). schema-v2.1 (instances).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--             publication add. NO ANON.
-- =============================================================================

CREATE TABLE IF NOT EXISTS choir_sme_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  -- 'song'     = per-song musical knowledge (title_key links it to the Songbook)
  -- 'guidance' = general wisdom not tied to one song (topic + guidance)
  kind          text NOT NULL DEFAULT 'song' CHECK (kind IN ('song','guidance')),
  title_key     text          CHECK (title_key IS NULL OR char_length(title_key) <= 200),
  title_display text          CHECK (title_display IS NULL OR char_length(title_display) <= 200),
  topic         text          CHECK (topic IS NULL OR char_length(topic) <= 200),
  sme_name      text NOT NULL DEFAULT 'Christian',
  sme_role      text NOT NULL DEFAULT 'choir keyboardist',
  -- The musical knowledge (caps mirror the pipeline's knowledge.json contract).
  song_key      text          CHECK (song_key IS NULL OR char_length(song_key) <= 40),
  arrangement   text          CHECK (arrangement IS NULL OR char_length(arrangement) <= 120),
  how_to_play   text          CHECK (how_to_play IS NULL OR char_length(how_to_play) <= 2000),
  guidance      text          CHECK (guidance IS NULL OR char_length(guidance) <= 2000),
  confidence    text          CHECK (confidence IS NULL OR confidence IN ('high','med','low')),
  -- Provenance (faithfulness): the quote that anchors the entry + where it came from.
  source_quote  text          CHECK (source_quote IS NULL OR char_length(source_quote) <= 2000),
  source_video  text          CHECK (source_video IS NULL OR char_length(source_video) <= 300),
  source_run    text          CHECK (source_run IS NULL OR char_length(source_run) <= 300),
  extracted_at  timestamptz,
  -- Review lifecycle: extracted (from the pipeline, unconfirmed) -> reviewed
  -- (a steward confirmed it's faithful) -> archived.
  status        text NOT NULL DEFAULT 'extracted' CHECK (status IN ('extracted','reviewed','archived')),
  reviewed_by   uuid REFERENCES auth.users(id),
  reviewed_at   timestamptz,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);
CREATE INDEX IF NOT EXISTS choir_sme_notes_instance_idx ON choir_sme_notes(instance_id);
CREATE INDEX IF NOT EXISTS choir_sme_notes_title_idx    ON choir_sme_notes(instance_id, title_key) WHERE title_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS choir_sme_notes_status_idx   ON choir_sme_notes(instance_id, status);

-- GRANT — explicit (0024 incident; new tables 403 before RLS until granted). No anon.
GRANT SELECT, INSERT, UPDATE, DELETE ON choir_sme_notes TO authenticated;

ALTER TABLE choir_sme_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS choir_sme_notes_read   ON choir_sme_notes;
DROP POLICY IF EXISTS choir_sme_notes_insert ON choir_sme_notes;
DROP POLICY IF EXISTS choir_sme_notes_update ON choir_sme_notes;
DROP POLICY IF EXISTS choir_sme_notes_delete ON choir_sme_notes;
-- Read: any choir member sees how to play the song. Write: owner/admin only —
-- importing authoritative SME knowledge is a steward action (the director
-- confirms faithfulness before it rides on the song).
CREATE POLICY choir_sme_notes_read   ON choir_sme_notes FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY choir_sme_notes_insert ON choir_sme_notes FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin') AND created_by = auth.uid());
CREATE POLICY choir_sme_notes_update ON choir_sme_notes FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY choir_sme_notes_delete ON choir_sme_notes FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- updated_at touch (reuse the shared trigger fn from 0036).
DROP TRIGGER IF EXISTS choir_sme_notes_touch_updated ON choir_sme_notes;
CREATE TRIGGER choir_sme_notes_touch_updated
  BEFORE UPDATE ON choir_sme_notes
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- REALTIME — stream so every choir device sees confirmed knowledge live.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'choir_sme_notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE choir_sme_notes;
  END IF;
END $realtime$;

-- ---------------------------------------------------------------------------
-- (B) Archive provenance on choir_songs (the Songbook set-list, 0011/0041).
--     Additive + nullable/defaulted so existing rows are untouched. A song
--     auto-seeded from the archive carries: source='archive', the video_id it
--     was found in (dedup + deep-link with the existing start_seconds), a
--     confidence, and needs_review=true until a steward confirms the match.
-- ---------------------------------------------------------------------------
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS source       text NOT NULL DEFAULT 'manual';
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS video_id     text;
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS confidence   text CHECK (confidence IS NULL OR confidence IN ('high','med','low'));
ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

-- Dedup key for the importer: one row per (instance, video, normalized title).
-- Partial unique so only archive-seeded rows are constrained; manual rows (no
-- video_id) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS choir_songs_archive_uniq
  ON choir_songs(instance_id, video_id, title)
  WHERE video_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
