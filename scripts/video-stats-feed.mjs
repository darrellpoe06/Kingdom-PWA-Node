#!/usr/bin/env node
// =============================================================================
// video-stats-feed — the church channel's public reach, from its own feed,
// into sermon_video_stats (DR-0622: the orphan the flow graph found)
// =============================================================================
// The Pulpit reads sermon_video_stats (lib/sermon-library-sync.js) to rank the
// services by reach. Measured 2026-09-24 by the flow graph: NOTHING wrote it.
// Its only producer, scripts/load-video-engagement.mjs, needs a YouTube Data
// API key that services.json records as rejected, and no workflow or rider ran
// it. The channel's PUBLIC feed carries each recent video's views and likes
// (media:statistics / media:starRating) with no key, no quota and no tracker —
// the same feed the Church tab already reads through /api/church-recent.
//
// Pure parse + SQL here; the workflow (video-stats.yml) fetches the feed and
// applies the SQL on the live database through scripts/live-sql.sh. Only
// videos the service record already holds are written (a join, never a guess).
//
//   node scripts/video-stats-feed.mjs sql < feed.xml > stats.sql
// =============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CHANNEL_ID = 'UC821pJh7YR5llBNnWUJj-ZA';
export const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

/** feed XML → [{ videoId, views, likes }] for entries that carry numbers. */
export function parseFeedStats(xml) {
  const out = [];
  for (const chunk of String(xml || '').split(/<entry\b/).slice(1)) {
    const videoId = (chunk.match(/<yt:videoId>\s*([\w-]{6,})\s*<\/yt:videoId>/) || [])[1];
    if (!videoId) continue;
    const views = (chunk.match(/<media:statistics[^>]*\bviews="(\d+)"/) || [])[1];
    const likes = (chunk.match(/<media:starRating[^>]*\bcount="(\d+)"/) || [])[1];
    if (views == null && likes == null) continue;
    out.push({ videoId, views: Number(views || 0), likes: Number(likes || 0) });
  }
  return out;
}

const esc = (s) => String(s).replace(/'/g, "''");

/** The upsert: one row per (instance, video) the service record already holds. */
export function statsSql(stats) {
  if (!stats.length) return "SELECT 'no-stats', 0;\n";
  const values = stats.map((s) => `('${esc(s.videoId)}', ${Number(s.views) || 0}, ${Number(s.likes) || 0})`).join(',\n  ');
  return `WITH feed(video_id, views, likes) AS (VALUES
  ${values}
), target AS (
  SELECT DISTINCT cs.instance_id, f.video_id, f.views, f.likes
    FROM feed f JOIN public.choir_sermons cs ON cs.video_id = f.video_id
), up AS (
  INSERT INTO public.sermon_video_stats (instance_id, video_id, yt_views, yt_likes, source, fetched_at, updated_at)
  SELECT instance_id, video_id, views, likes, 'youtube', now(), now() FROM target
  ON CONFLICT (instance_id, video_id) DO UPDATE
     SET yt_views = EXCLUDED.yt_views, yt_likes = EXCLUDED.yt_likes, source = 'youtube', fetched_at = now(), updated_at = now()
  RETURNING 1
)
SELECT 'upserted', count(*) FROM up;
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd] = process.argv.slice(2);
  if (cmd === 'sql') {
    const stats = parseFeedStats(readFileSync(0, 'utf8'));
    console.error(`feed carried numbers for ${stats.length} video(s)`);
    process.stdout.write(statsSql(stats));
  } else {
    console.error('usage: node scripts/video-stats-feed.mjs sql < feed.xml');
    process.exit(2);
  }
}
