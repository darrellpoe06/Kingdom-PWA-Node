#!/usr/bin/env node
// load-video-engagement — aggregate YouTube public stats onto the sovereign backbone.
// =============================================================================
// Darrell 2026-07-01: "Pull YouTube public engagement stats (likes/views = data-IN
// aggregation on the sovereign backbone)... let users sort by most-viewed."
//
// This is the DATA-IN half of the sermon library's engagement ranking. It reads
// the corpus's video ids, asks the YouTube Data API for each video's PUBLIC
// statistics (views / likes / comments), and emits an IDEMPOTENT SQL upsert into
// sermon_video_stats (migration 0063). The app then reads those numbers and ranks
// by them. We hold the number on our own backbone; we embed NO tracker, no vendor
// SDK, no per-user telemetry — just the public counts (DATA-AS-EMPOWERMENT).
//
// It does NOT touch the database (mirrors harvest-from-transcripts.mjs): it writes
//   scripts/out/video-engagement.sql   (apply via Supabase Studio / db-migrate)
//
// SOURCE of video ids (first that resolves):
//   1. --videos <file.json>  — a JSON array of ids, or of { videoId } / { video_id } objects
//      (e.g. scripts/out/choir-sermons-backfill has ids; or transcripts.json).
//   2. SUPABASE_URL + SUPABASE_SERVICE_KEY env — query choir_sermons for video_id
//      (service role; the loader secret, stored on the NAS, never in client code).
//
// YouTube key: YOUTUBE_API_KEY (or VITE_YOUTUBE_API_KEY) — a read-only Data API key.
//
// This is a MANUAL, one-shot, bounded run (no timer, no loop, exits when done), so
// the autonomous-automation three-brakes rule does not apply. Re-run any time to
// refresh the numbers; the SQL upsert is idempotent.
//
// Usage:
//   YOUTUBE_API_KEY=... node scripts/load-video-engagement.mjs --videos ids.json [--slug colg]
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... YOUTUBE_API_KEY=... node scripts/load-video-engagement.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const slug = flag('--slug', 'colg');
const videosFile = flag('--videos', '');
const YT_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sqlEsc = (s) => String(s == null ? '' : s).replace(/'/g, "''");

// --- resolve the video id list ----------------------------------------------
async function resolveVideoIds() {
  if (videosFile) {
    if (!existsSync(videosFile)) { console.error(`No videos file at ${videosFile}`); process.exit(1); }
    const raw = JSON.parse(readFileSync(videosFile, 'utf8'));
    const arr = Array.isArray(raw) ? raw : (Array.isArray(raw.videos) ? raw.videos : Object.values(raw));
    const ids = arr.map((v) => (typeof v === 'string' ? v : (v.videoId || v.video_id))).filter(Boolean);
    return [...new Set(ids)];
  }
  if (SB_URL && SB_KEY) {
    const url = `${SB_URL.replace(/\/$/, '')}/rest/v1/choir_sermons?select=video_id&video_id=not.is.null`;
    const res = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if (!res.ok) { console.error(`Supabase query failed: ${res.status} ${await res.text()}`); process.exit(1); }
    const rows = await res.json();
    return [...new Set(rows.map((r) => r.video_id).filter(Boolean))];
  }
  console.error('No video source. Pass --videos <file.json> or set SUPABASE_URL + SUPABASE_SERVICE_KEY.');
  process.exit(1);
  return [];
}

// --- fetch YouTube statistics in batches of 50 ------------------------------
async function fetchStats(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${batch.join(',')}&key=${YT_KEY}`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`YouTube API failed: ${res.status} ${await res.text()}`); process.exit(1); }
    const data = await res.json();
    for (const item of data.items || []) {
      const st = item.statistics || {};
      out.push({
        videoId: item.id,
        views: Number(st.viewCount) || 0,
        likes: Number(st.likeCount) || 0,     // absent when the uploader hides likes
        comments: Number(st.commentCount) || 0,
      });
    }
  }
  return out;
}

async function main() {
  if (!YT_KEY) { console.error('Set YOUTUBE_API_KEY (a read-only Data API key).'); process.exit(1); }
  const ids = await resolveVideoIds();
  if (!ids.length) { console.error('No video ids resolved.'); process.exit(1); }
  console.log(`Resolved ${ids.length} video id(s); fetching YouTube stats…`);
  const stats = await fetchStats(ids);
  console.log(`YouTube returned stats for ${stats.length} video(s).`);

  const lines = [];
  lines.push('-- video-engagement.sql — YouTube public stats upsert into sermon_video_stats (0063).');
  lines.push('-- Generated by scripts/load-video-engagement.mjs. Idempotent: re-apply to refresh.');
  lines.push('-- Apply via Supabase Studio SQL editor or the db-migrate lane.');
  lines.push('DO $$');
  lines.push('DECLARE v_instance uuid;');
  lines.push('BEGIN');
  lines.push(`  SELECT id INTO v_instance FROM instances WHERE slug = '${sqlEsc(slug)}';`);
  lines.push("  IF v_instance IS NULL THEN RAISE NOTICE 'no instance for slug'; RETURN; END IF;");
  for (const s of stats) {
    lines.push(
      `  INSERT INTO sermon_video_stats (instance_id, video_id, yt_views, yt_likes, yt_comments, source, fetched_at)`
      + ` VALUES (v_instance, '${sqlEsc(s.videoId)}', ${s.views}, ${s.likes}, ${s.comments}, 'youtube', now())`
      + ` ON CONFLICT (instance_id, video_id) DO UPDATE SET`
      + ` yt_views = EXCLUDED.yt_views, yt_likes = EXCLUDED.yt_likes, yt_comments = EXCLUDED.yt_comments,`
      + ` source = 'youtube', fetched_at = now();`,
    );
  }
  lines.push('END $$;');
  lines.push("NOTIFY pgrst, 'reload schema';");

  mkdirSync('scripts/out', { recursive: true });
  const outPath = 'scripts/out/video-engagement.sql';
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${outPath} (${stats.length} upserts). Apply it to light the view/like ranking.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
