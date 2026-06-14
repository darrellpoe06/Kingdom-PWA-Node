#!/usr/bin/env node
// choir-youtube-backfill — turn @thelovecorner's video history into choir_sermons
// rows (Darrell 2026-06-14). Lists the channel with yt-dlp, parses each title
// into { date, type, title, speaker } with the SHARED parser (no drift vs the
// app), and emits an idempotent SQL seed + a JSON preview.
//
// METADATA ONLY — this NEVER downloads the videos (Darrell 2026-06-14: "we
// don't want or need to download the videos, we want to source them"). It uses
// yt-dlp's --flat-playlist, which reads id/title/date and nothing else; no media
// is fetched or stored. The app links to each video; the link is just a URL, so
// when the church later hosts the videos on its own NAS, the same field can
// point there instead of YouTube.
//
// This does NOT touch the database itself. It writes:
//   scripts/out/choir-sermons-backfill.json  (review the parse)
//   scripts/out/choir-sermons-backfill.sql   (INSERT ... ON CONFLICT DO NOTHING)
// The SQL needs the instance_id filled in (the importer/owner provides it) and
// is applied through the normal migration lane or an authenticated in-app import.
// Sourcing from YouTube is a manual/triggered job, never an unattended timer
// (CLAUDE.md three-brakes rule).
//
// Usage:
//   node scripts/choir-youtube-backfill.mjs "https://www.youtube.com/@thelovecorner/videos" [maxItems]
// Requires yt-dlp on PATH (or `python -m yt_dlp`).

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseServiceTitle, extractYoutubeId } from '../app/src/lib/youtube-title-parse.js';

const channel = process.argv[2] || 'https://www.youtube.com/@thelovecorner/videos';
const max = Number(process.argv[3]) || 0; // 0 = all

function ytdlp(args) {
  for (const cmd of [['yt-dlp', args], ['python', ['-m', 'yt_dlp', ...args]]]) {
    const r = spawnSync(cmd[0], cmd[1], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status === 0) return r.stdout;
  }
  throw new Error('yt-dlp not found. Install with: pip install --user yt-dlp');
}

const args = ['--flat-playlist', '--print', '%(id)s\t%(title)s'];
if (max > 0) args.push('--playlist-end', String(max));
args.push(channel);

const lines = ytdlp(args).split('\n').map((l) => l.trim()).filter(Boolean);
const sqlEsc = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);

const rows = [];
const seen = new Set();
for (const line of lines) {
  const [id, ...rest] = line.split('\t');
  const rawTitle = rest.join('\t');
  if (!id || seen.has(id)) continue;
  seen.add(id);
  const parsed = parseServiceTitle(rawTitle);
  rows.push({
    videoId: id,
    youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
    serviceDate: parsed.serviceDate,
    serviceType: parsed.serviceType,
    title: parsed.title || rawTitle.trim(),
    speaker: parsed.speaker,
    rawTitle,
  });
}

const withDate = rows.filter((r) => r.serviceDate);
mkdirSync('scripts/out', { recursive: true });
writeFileSync('scripts/out/choir-sermons-backfill.json', JSON.stringify(rows, null, 2));

// Migration-ready: resolves the church instance by slug (seeded by 0012), so
// the generated SQL applies through the lane with no instance_id to fill in.
const CHURCH = "(SELECT id FROM instances WHERE slug = 'colg')";
const sql = [
  '-- choir_sermons backfill from @thelovecorner (generated; metadata only, no downloads).',
  ...withDate.map((r) =>
    `INSERT INTO choir_sermons (instance_id, video_id, youtube_url, service_date, service_type, title, speaker, source) ` +
    `VALUES (${CHURCH}, ${sqlEsc(r.videoId)}, ${sqlEsc(r.youtubeUrl)}, ${sqlEsc(r.serviceDate)}, ${sqlEsc(r.serviceType)}, ${sqlEsc(r.title)}, ${sqlEsc(r.speaker)}, 'youtube') ` +
    `ON CONFLICT (instance_id, video_id) DO NOTHING;`,
  ),
].join('\n');
writeFileSync('scripts/out/choir-sermons-backfill.sql', sql + '\n');

console.log(`Parsed ${rows.length} videos (${withDate.length} with a parseable date).`);
console.log(`Sunday: ${withDate.filter((r) => r.serviceType === 'sunday').length} · Wednesday: ${withDate.filter((r) => r.serviceType === 'wednesday').length}`);
console.log('Wrote scripts/out/choir-sermons-backfill.json and .sql');
if (rows.length) console.log('Sample:', JSON.stringify(rows[0], null, 2));
