-- =============================================================================
-- 0028 — The Word — Migdal: inaugural archived sermon (Darrell 2026-06-16)
-- =============================================================================
-- The first real archived message in The Word — Migdal: this past Sunday's
-- service, Bishop Gwin preaching, embedded directly from YouTube (the video is
-- the archive — embedding is cleaner than extracting frames). Same pattern as the
-- 0013 backfill: targets the church instance by slug ('colg', seeded by 0012),
-- metadata-only (a LINK, no download), idempotent via ON CONFLICT (instance_id,
-- video_id) so the lane never duplicates it.
--
-- DATE: 2026-06-14 (this past Sunday, per Darrell). SPEAKER: Bishop Gwin.
-- TITLE: a factual placeholder ("Sunday Service — June 14, 2026") — the exact
-- sermon title is set in-app by BG/Christina (the Edit action exists). We do NOT
-- bake an unverified title: a WebFetch of the video returned a title identical to
-- an existing 2026-06-10 backfill row (a DIFFERENT video id), so it was not
-- trusted (DR-0076: no claim without evidence).
INSERT INTO choir_sermons (instance_id, video_id, youtube_url, service_date, service_type, title, speaker, source)
VALUES (
  (SELECT id FROM instances WHERE slug = 'colg'),
  'ZAmmNGVxd1U',
  'https://www.youtube.com/watch?v=ZAmmNGVxd1U',
  '2026-06-14',
  'sunday',
  'Sunday Service — June 14, 2026',
  'Bishop Lloyd E. Gwin',
  'youtube'
)
ON CONFLICT (instance_id, video_id) WHERE video_id IS NOT NULL DO NOTHING;
