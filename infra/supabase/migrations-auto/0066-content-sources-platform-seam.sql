-- =============================================================================
-- 0066 — content-sources platform seam: pluggable multi-source aggregator
-- =============================================================================
-- Designed 2026-07-02 for the sovereign aggregator backbone.
--
-- WHAT THIS OPENS. The video_harvests / video_transcripts tables were built for
-- YouTube (video_id = YouTube ID; transcript source = 'youtube-asr'). They are
-- structurally generic — just text keys, JSONB harvests, instance-scoped — but
-- two things make them YouTube-specific in practice:
--   1. No `source_platform` column: no way to know whether a row came from YouTube,
--      an RSS podcast feed, Vimeo, or anything else.
--   2. video_transcripts.source CHECK only lists YouTube + NAS transcript origins.
--
-- This migration adds the minimum to make the backbone platform-agnostic:
--   * `source_platform text DEFAULT 'youtube'` on both tables — all existing rows
--     silently become YouTube rows; no data migration, no code change to the
--     YouTube adapter (load-transcripts.py, youtube-captions.py).
--   * `item_url text` on video_harvests — for non-YouTube items that have a
--     direct media URL (RSS enclosure, Vimeo download URL, etc.); YouTube items
--     leave this NULL (they have a stable watch URL derivable from video_id).
--   * Expand video_transcripts.source CHECK to include 'rss-feed' (description-
--     sourced text from an RSS episode) and 'rss-whisper' (Whisper-on-NAS run on
--     an RSS audio file).
--   * content_sources table: the per-tenant registry of configured platform sources.
--     Each row = one platform feed a tenant has wired up (a YouTube channel, an RSS
--     podcast, a Vimeo showcasе, ...). The adapter reads this to know what to pull.
--
-- BACKWARD COMPAT: every change is additive (new columns with DEFAULTs, new rows
-- in a new table, expanded CHECK). The YouTube adapter (load-transcripts.py) needs
-- zero changes — it never touches the new columns and its existing source values
-- are still valid.
--
-- GENERICITY PROOF (documented here for the record):
--   · video_harvests: `video_id` was always a plain text key. RSS items use
--     `rss:{guid}` as their key; YouTube items keep raw IDs — the UNIQUE constraint
--     on (instance_id, video_id) enforces per-platform dedup via the namespace.
--   · harvest math (video-harvest.js): 0 lines changed — it reads the `harvests`
--     JSONB blob; the platform of the item is irrelevant to coverage calculation.
--   · text extractors (transcript-harvest.js): 0 lines changed — they operate on
--     plain text, blind to platform.
--   · RLS policies: already instance-scoped; no platform assumption.
--   KNOWN GAP: buildLedger() computes coverage by joining choir_sermons (YouTube-
--   sourced) OVER video_harvests. RSS items written to video_harvests won't appear
--   in the coverage display until either (a) the display layer queries content_sources
--   rows, or (b) a future migration extends choir_sermons to accept non-YouTube
--   items. This gap is in the DISPLAY layer, not the STORE layer. The store is
--   platform-agnostic today. (Filed for next session.)
--
-- DEPENDS ON: instances (0001), user_role_in_instance, user_in_choir (0011),
--   video_harvests (0050), video_transcripts (0058), engagement_touch_updated_at.
-- IDEMPOTENT: all ALTER ... IF NOT EXISTS, CREATE TABLE IF NOT EXISTS, guarded
--   CHECK drop/add via DO block. Additive only.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. video_harvests: add source_platform + item_url
-- ---------------------------------------------------------------------------

ALTER TABLE video_harvests
  ADD COLUMN IF NOT EXISTS source_platform text NOT NULL DEFAULT 'youtube';

-- item_url: the direct media URL for non-YouTube items (RSS audio enclosure,
-- Vimeo download URL, etc.). YouTube items leave this NULL — the watch URL is
-- always derivable as https://youtube.com/watch?v={video_id}.
ALTER TABLE video_harvests
  ADD COLUMN IF NOT EXISTS item_url text;

-- Index: platform queries across a tenant (e.g. "all RSS items for this instance").
CREATE INDEX IF NOT EXISTS video_harvests_platform_idx
  ON video_harvests(instance_id, source_platform);


-- ---------------------------------------------------------------------------
-- 2. video_transcripts: add source_platform + expand source CHECK
-- ---------------------------------------------------------------------------

ALTER TABLE video_transcripts
  ADD COLUMN IF NOT EXISTS source_platform text NOT NULL DEFAULT 'youtube';

-- Expand the source CHECK to include RSS origins.
-- The auto-generated constraint name is video_transcripts_source_check (PostgreSQL
-- names inline CHECK constraints as {table}_{column}_check when unnamed).
DO $expand_source_check$
BEGIN
  ALTER TABLE video_transcripts DROP CONSTRAINT IF EXISTS video_transcripts_source_check;
  ALTER TABLE video_transcripts ADD CONSTRAINT video_transcripts_source_check
    CHECK (source IN (
      'youtube-asr',   -- YouTube auto-caption (original)
      'whisper-nas',   -- Whisper-on-NAS run on a video file (original)
      'manual',        -- human-transcribed (original)
      'rss-feed',      -- episode description / summary text from the RSS item
      'rss-whisper'    -- Whisper-on-NAS run on an RSS audio file (enclosure)
    ));
END $expand_source_check$;

CREATE INDEX IF NOT EXISTS video_transcripts_platform_idx
  ON video_transcripts(instance_id, source_platform);


-- ---------------------------------------------------------------------------
-- 3. content_sources: per-tenant registry of configured platform sources
-- ---------------------------------------------------------------------------
-- One row = one wired source feed (a YouTube channel, an RSS podcast URL, a Vimeo
-- showcase, ...). The adapter scripts read this table (filtered by instance) to know
-- what to pull. `config` holds the platform-specific parameters (channel_id, feed_url,
-- auth_type, max_per_run, ...) so the adapter itself needs no per-tenant hardcoding.
--
-- Design principle: "multi-tenant/channel-scoped — users pull THEIR data from any
-- platform they choose" (Darrell 2026-07-02). This table IS the config layer.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS content_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  platform        text NOT NULL,          -- 'youtube' | 'rss' | 'vimeo' | ...
  source_key      text NOT NULL,          -- platform-specific feed ID (channel_id, feed_url, ...)
  label           text NOT NULL,          -- human name, e.g. "COLG Sunday Services"
  config          jsonb NOT NULL DEFAULT '{}',  -- adapter config (channel_id, feed_url, auth_type, ...)
  enabled         boolean NOT NULL DEFAULT true,
  last_run_at     timestamptz,
  last_run_status text,                   -- 'ok' | 'stalled' | 'error' | 'dry-run'
  last_run_meta   jsonb,                  -- last-run summary: { processed, skipped, errors }
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,

  -- One source registration per (instance, platform, source_key). The same channel
  -- on two instances = two rows; the same channel registered twice = constraint error.
  UNIQUE(instance_id, platform, source_key)
);

CREATE INDEX IF NOT EXISTS content_sources_inst_idx ON content_sources(instance_id);
CREATE INDEX IF NOT EXISTS content_sources_platform_idx ON content_sources(instance_id, platform);

-- updated_at touch (reuses the shared function from 0010/0011/0050/0058).
DROP TRIGGER IF EXISTS content_sources_touch_updated ON content_sources;
CREATE TRIGGER content_sources_touch_updated
  BEFORE UPDATE ON content_sources
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- GRANTs (same stance as video_harvests: no anon, explicit authenticated grant).
GRANT SELECT, INSERT, UPDATE, DELETE ON content_sources TO authenticated;

ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_sources_read   ON content_sources;
DROP POLICY IF EXISTS content_sources_insert ON content_sources;
DROP POLICY IF EXISTS content_sources_update ON content_sources;
DROP POLICY IF EXISTS content_sources_delete ON content_sources;

-- READ = whole choir/leadership (same wall as harvest ledger — stewards see sources).
CREATE POLICY content_sources_read ON content_sources FOR SELECT
  TO authenticated
  USING (user_in_choir(instance_id));
-- WRITE = owner/admin (only the stewards who configure and wire sources).
CREATE POLICY content_sources_insert ON content_sources FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY content_sources_update ON content_sources FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY content_sources_delete ON content_sources FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));


-- ---------------------------------------------------------------------------
-- 4. Seed the COLG YouTube channel as the first registered content_source
--    (for reference; a real seed file would set the correct instance_id at deploy).
-- ---------------------------------------------------------------------------
-- NOTE: instance_id '00000000-0000-0000-0000-000000000000' is a placeholder.
-- The real COLG instance UUID is resolved at deploy time via the instances table.
-- This comment documents the expected row shape; actual seeding is in infra/supabase/seeds/.

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a newly-wired source lights up live on the Sources surface.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'content_sources'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE content_sources;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
