-- =============================================================================
-- 0295 — every service stream keeps its length (DR-1045)
-- =============================================================================
-- Darrell 2026-10-15: "the YouTube streams on Sunday can be used to see if we as
-- a team kept the proper timetable... did we keep the time within our agreed
-- upon constraints and how well do we do weekly according to the data driven
-- information?" And then: "Did we go over or under time based on the video
-- stream that day?"
--
-- MEASURED (church-video-witness run 38740116010, 2026-10-15): the 10-11-2026
-- service is on record (choir_sermons, video skY8rJWxoZ4, "Keep Reaching!",
-- Bishop Lloyd E. Gwin), but nothing in the database holds how long the stream
-- ran, and YouTube refused its transcript ("Subtitles are disabled for this
-- video"). The tower's YouTube index reads each video's length and never writes
-- it anywhere the app can see. So the question could not be answered.
--
-- THE COLUMNS. Written by the NAS stream-length rider
-- (infra/church-media-golive/stream_length_sync.py), which reads each video's
-- own page with yt-dlp from the NAS's residential address, the same road that
-- dates every service (choir_dates_sync.py):
--   stream_seconds     how long the stream or upload runs, as YouTube reports it
--   stream_started_at  when the stream actually started (release_timestamp)
--   stream_read_at     when the NAS read it, so a stale read is visible
--
-- TRUTHFUL-OR-ABSENT (DR-0076): a stream's length includes whatever ran before
-- the first line of the order and after the benediction. The app reads it as an
-- upper bound on the service, never as the service's own clocked length. A
-- video the NAS cannot read stays NULL; nothing is guessed.
--
-- AND THE CAPTIONS KEEP THEIR TIMINGS. Darrell, the same morning: "YouTube
-- doesn't caption until a day or few later and then there is always
-- captions." The transcript trickle (load-transcripts.py) kept only the joined
-- words and threw away each caption's start second -- the very marks that say
-- when the Call to Worship, the Call to Give and the Message began.
--   video_transcripts.segments   [[start_seconds, "text"], ...] in caption
--                                order, written beside `text` by the trickle.
--
-- Additive and idempotent: ADD COLUMN IF NOT EXISTS, a named CHECK added once.
-- No policy changes: choir_sermons' existing RLS governs these columns.
-- =============================================================================

ALTER TABLE public.choir_sermons ADD COLUMN IF NOT EXISTS stream_seconds integer;
ALTER TABLE public.choir_sermons ADD COLUMN IF NOT EXISTS stream_started_at timestamptz;
ALTER TABLE public.choir_sermons ADD COLUMN IF NOT EXISTS stream_read_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'choir_sermons_stream_seconds_sane'
       AND conrelid = 'public.choir_sermons'::regclass
  ) THEN
    ALTER TABLE public.choir_sermons
      ADD CONSTRAINT choir_sermons_stream_seconds_sane
      CHECK (stream_seconds IS NULL OR (stream_seconds > 0 AND stream_seconds < 86400));
  END IF;
END $$;

ALTER TABLE public.video_transcripts ADD COLUMN IF NOT EXISTS segments jsonb;

COMMENT ON COLUMN public.choir_sermons.stream_seconds IS
  'How long the service video runs, as YouTube reports it (seconds). An upper bound on the service: it includes pre-service and closing time. Written by the NAS stream-length rider (DR-1045).';
COMMENT ON COLUMN public.choir_sermons.stream_started_at IS
  'When the stream actually started (YouTube release_timestamp). NULL for an upload that was never live.';
COMMENT ON COLUMN public.choir_sermons.stream_read_at IS
  'When the NAS last read the video''s length.';
COMMENT ON COLUMN public.video_transcripts.segments IS
  'The caption track with its timings: [[start_seconds, text], ...] in order. Locates where each line of the order began (DR-1045).';
