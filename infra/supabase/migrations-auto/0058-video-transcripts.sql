-- =============================================================================
-- 0058 — video transcripts: the un-freeze of the Harvest % past 22%
-- =============================================================================
-- Declared by Darrell 2026-06-30 (the Harvest % was stuck at 22%):
--   Source the service transcript from YouTube's OWN auto-captions — no GPU, no
--   Whisper, no n8n — and let the app derive the transcript-gated harvests
--   (lessons / discernment / testimony / trivia / full Scripture sweep) LIVE.
--
-- WHY THIS TABLE EXISTS. #399 shipped the pure extractors (transcript-harvest.js)
-- and a fromRow/fromTranscript split in video-harvest.js, and it WAS served. But
-- the % never climbed because the served app had no transcript to derive from:
-- fetchLedger() called buildLedger() WITHOUT transcripts, and there was nowhere
-- for a transcript to live. The only path that lit the transcript harvests was a
-- 3-step MANUAL dance (youtube-captions.py -> harvest-from-transcripts.mjs -> hand-
-- applied SQL) that was never run. This table removes that gate: a plain Python
-- loader (infra/nas-sme-pipeline/load-transcripts.py) upserts the raw caption text
-- here, and the app derives coverage LIVE off it. Store the transcript ONCE;
-- deriving is deterministic and re-derives for free when an extractor improves.
--
-- HONESTY (DR-0076). We store the RAW transcript text as real evidence. A video
-- with no captions records `error` (the no-caption verdict) with empty text, so it
-- reads as an honest gap surfaced for the Whisper-on-NAS fallback — never painted,
-- never retried forever.
--
-- ROLE-SCOPED / NO LEAK (mirrors video_harvests, 0050): READ = the whole choir/
-- leadership (user_in_choir, the same wall as the sermon library); WRITE =
-- owner/admin. NO anon policy — transcripts are never public. The Python loader
-- writes with the SERVICE ROLE key (bypasses RLS), stored on the NAS like the
-- finance-ingest secret; it is never in client code.
--
-- DEPENDS ON (all present since 0011/0050): instances, user_role_in_instance,
--   user_in_choir, engagement_touch_updated_at.
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--   publication add. Additive, church-internal.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- One row per (instance, source video). `text` is the raw caption transcript;
-- `source` records where it came from (youtube-asr | whisper-nas | manual).
-- `error` (with empty text) records a no-caption verdict so the loader skips it
-- next run and the surface can route it to the Whisper fallback.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_transcripts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  video_id     text NOT NULL,                 -- stable source key (YouTube id; matches choir_sermons.video_id)
  text         text NOT NULL DEFAULT '',      -- the raw caption transcript ('' when no captions)
  source       text NOT NULL DEFAULT 'youtube-asr'
                 CHECK (source IN ('youtube-asr','whisper-nas','manual')),
  lang         text,
  words        integer NOT NULL DEFAULT 0,
  error        text,                          -- no-caption verdict (empty text) -> Whisper fallback
  fetched_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz
);

-- One transcript row per (instance, video) so an idempotent re-fetch can't dup.
CREATE UNIQUE INDEX IF NOT EXISTS video_transcripts_uniq     ON video_transcripts(instance_id, video_id);
CREATE INDEX        IF NOT EXISTS video_transcripts_inst_idx ON video_transcripts(instance_id);

-- updated_at touch (reuses the shared function from 0010/0011/0050).
DROP TRIGGER IF EXISTS video_transcripts_touch_updated ON video_transcripts;
CREATE TRIGGER video_transcripts_touch_updated
  BEFORE UPDATE ON video_transcripts
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. Leave `anon` untouched (the Choir 42501 incident): a signed-in role
-- needs the EXPLICIT grant. NO grant to anon — transcripts are never public.
-- The Python loader uses the SERVICE ROLE key, which bypasses RLS entirely.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON video_transcripts TO authenticated;

ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS video_transcripts_read   ON video_transcripts;
DROP POLICY IF EXISTS video_transcripts_insert ON video_transcripts;
DROP POLICY IF EXISTS video_transcripts_update ON video_transcripts;
DROP POLICY IF EXISTS video_transcripts_delete ON video_transcripts;

-- READ = whole choir/leadership (same wall as the message library + the ledger).
CREATE POLICY video_transcripts_read ON video_transcripts FOR SELECT
  TO authenticated
  USING (user_in_choir(instance_id));
-- WRITE = owner/admin (the stewards; the loader writes as service_role, RLS-exempt).
CREATE POLICY video_transcripts_insert ON video_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY video_transcripts_update ON video_transcripts FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY video_transcripts_delete ON video_transcripts FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a transcript landed by the loader lights the ledger live
-- on every open surface, the same way video_harvests streams (0050).
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'video_transcripts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE video_transcripts;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
