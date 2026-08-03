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
//   node scripts/choir-youtube-backfill.mjs [channelBaseOrTabUrl] [maxItems]
// Default lists BOTH the /videos AND /streams tabs (2026-08-03, Darrell: "BG
// should have double the number of videos currently inside the Love Corner
// App" — a channel that live-streams its services accumulates the service
// archive on the STREAMS tab, which a /videos-only listing never sees; every
// prior run listed /videos only, so the streams half was structurally
// invisible). Passing an explicit tab URL (.../videos or /streams) lists just
// that tab — the old single-tab behavior, kept for targeted re-runs.
// Requires yt-dlp on PATH (or `python -m yt_dlp`).

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseServiceTitle, extractYoutubeId } from '../app/src/lib/youtube-title-parse.js';

const DEFAULT_BASE = 'https://www.youtube.com/@thelovecorner';
const TAB_NAMES = ['videos', 'streams'];
const arg = process.argv[2] || DEFAULT_BASE;
const max = Number(process.argv[3]) || 0; // 0 = all

// Explicit tab URL -> that tab only; channel base -> every tab in TAB_NAMES.
const explicitTab = TAB_NAMES.find((t) => arg.replace(/\/+$/, '').endsWith(`/${t}`));
const base = explicitTab ? arg.replace(/\/+$/, '').slice(0, -(explicitTab.length + 1)) : arg.replace(/\/+$/, '');
const tabs = explicitTab ? [explicitTab] : TAB_NAMES;
const channel = base;

function ytdlp(args) {
  let lastErr = '';
  for (const cmd of [['yt-dlp', args], ['python', ['-m', 'yt_dlp', ...args]]]) {
    const r = spawnSync(cmd[0], cmd[1], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status === 0) return r.stdout;
    lastErr = (r.stderr || r.error?.message || `exit ${r.status}`).toString().slice(-400);
  }
  throw new Error(`yt-dlp failed: ${lastErr || 'not found. Install with: pip install --user yt-dlp'}`);
}

function listTab(tab) {
  const args = ['--flat-playlist', '--print', '%(id)s\t%(title)s'];
  if (max > 0) args.push('--playlist-end', String(max));
  args.push(`${base}/${tab}`);
  return ytdlp(args).split('\n').map((l) => l.trim()).filter(Boolean);
}

// The videos tab MUST list (a channel always has it; an empty/failed listing is
// an honest-red, never a silently smaller corpus — DR-0076). The streams tab is
// OPTIONAL structurally (a channel that never streamed has no such tab) but a
// failure there is still printed loudly, because for THIS channel the streams
// tab is where the services live.
const lines = [];
const perTab = {};
for (const tab of tabs) {
  try {
    const tabLines = listTab(tab);
    perTab[tab] = tabLines.length;
    lines.push(...tabLines);
  } catch (e) {
    perTab[tab] = 0;
    if (tab === 'videos' || explicitTab) throw e;
    console.error(`WARNING: /${tab} tab listing failed (${e.message}). Continuing with the other tab(s) — if this channel DOES have streams, this run is PARTIAL.`);
  }
}
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
const undated = rows.filter((r) => !r.serviceDate);
mkdirSync('scripts/out', { recursive: true });
writeFileSync('scripts/out/choir-sermons-backfill.json', JSON.stringify(rows, null, 2));

// EVERY video lands (DR-0135 — the 2026-07-10 corpus-gap heal). The original
// generator emitted only the dated rows; the 0013 seed therefore carried 125 of
// 335 videos and the other 210 were silently "left for manual entry" — the gap
// Darrell photographed in every tab. Undated rows now insert with a NULL
// service_date (the schema allows it; the app labels undated as undated,
// DR-0124) instead of being dropped. Idempotent either way.
const CHURCH = "(SELECT id FROM instances WHERE slug = 'colg')";
const insertRow = (r) =>
  `INSERT INTO choir_sermons (instance_id, video_id, youtube_url, service_date, service_type, title, speaker, source) ` +
  `VALUES (${CHURCH}, ${sqlEsc(r.videoId)}, ${sqlEsc(r.youtubeUrl)}, ${sqlEsc(r.serviceDate)}, ${sqlEsc(r.serviceType)}, ${sqlEsc(r.title)}, ${sqlEsc(r.speaker)}, 'youtube') ` +
  `ON CONFLICT (instance_id, video_id) WHERE video_id IS NOT NULL DO NOTHING;`;
const sql = [
  '-- choir_sermons FULL backfill from @thelovecorner (generated; metadata only, no downloads).',
  `-- ${rows.length} videos: ${withDate.length} dated + ${undated.length} undated (undated insert with NULL service_date — labeled undated in-app, never dropped).`,
  ...withDate.map(insertRow),
  ...undated.map(insertRow),
].join('\n');
writeFileSync('scripts/out/choir-sermons-backfill.sql', sql + '\n');

// The committed corpus manifest — the app's coverage readout compares the LIVE
// choir_sermons rows against this expected list (corpus-coverage.js), so a
// partial backfill can never again hide as "that's all there is."
const manifest = {
  generatedAt: new Date().toISOString().slice(0, 10),
  channel,
  tabs: perTab,
  total: rows.length,
  dated: withDate.length,
  undated: undated.length,
  videos: rows.map((r) => ({ videoId: r.videoId, serviceDate: r.serviceDate, title: r.title || r.rawTitle })),
};
writeFileSync('app/src/lib/corpus-manifest.json', JSON.stringify(manifest, null, 2) + '\n');

console.log(`Parsed ${rows.length} videos (${withDate.length} dated, ${undated.length} undated — ALL emitted). Tabs: ${JSON.stringify(perTab)} (overlap deduped by id).`);
console.log(`Sunday: ${withDate.filter((r) => r.serviceType === 'sunday').length} · Wednesday: ${withDate.filter((r) => r.serviceType === 'wednesday').length}`);
console.log('Wrote scripts/out/choir-sermons-backfill.{json,sql} and app/src/lib/corpus-manifest.json');
if (rows.length) console.log('Sample:', JSON.stringify(rows[0], null, 2));
