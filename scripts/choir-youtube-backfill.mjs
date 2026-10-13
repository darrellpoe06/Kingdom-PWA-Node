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
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { parseServiceTitle, extractYoutubeId } from '../app/src/lib/youtube-title-parse.js';
import { classifyServiceType } from '../app/src/lib/service-day.js';

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
    dateSource: parsed.serviceDate ? 'title' : null,
  });
}

// UPLOAD-DATE FALLBACK (2026-08-04, the "666 undated forever" audit). Hundreds
// of titles carry NO date at all ("Watch God Deliver Me", "Love Hurts") — no
// title parse can ever date them, and the panel's promise that "they join this
// list as the corpus pipeline dates them" was TRUE OF NOTHING: the pipeline
// re-listed the channel twice a week and dated zero existing rows. For a
// channel that live-streams its services, the stream's actual start time IS
// the service date — exact, from YouTube's own metadata (never approximated).
// Fetched via the Data API (50 ids/call — the whole backlog is ~14 calls) when
// YOUTUBE_API_KEY is present; without the key the title-dated rows still flow
// and the gap is NAMED in the summary, not hidden (DR-0076).
// TRIM the secret — this repo's stored secrets carry trailing whitespace (the
// SUPABASE_DB_URL apply step strips it the same way; run 30869311632 proved a
// raw key in the query string reads as "API key not valid" 400).
const API_KEY = (process.env.YOUTUBE_API_KEY || '').trim();
// A service's calendar date is its LOCAL date at the church (America/New_York,
// COLG) — a Wednesday 8pm EST stream is 01:00 UTC Thursday, and dating it
// Thursday would file the service on the wrong night.
const easternDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};
async function fetchUploadDates(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${chunk.join(',')}&key=${encodeURIComponent(API_KEY)}`;
    // Referer: the key is the app's website key (VITE_), which may be
    // referrer-restricted to the site — identify as the site we are.
    const res = await fetch(url, { headers: { Referer: 'https://poetech.us/' } });
    if (!res.ok) throw new Error(`videos.list ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json();
    for (const item of (body.items || [])) {
      const started = item.liveStreamingDetails?.actualStartTime || item.snippet?.publishedAt;
      const date = started ? easternDate(started) : null;
      if (date) out.set(item.id, date);
    }
  }
  return out;
}
// KEYLESS fallback — yt-dlp reads each watch page's own release/upload stamp
// (a stream's release_timestamp IS the service start). No API, no key, no
// human step (DR-0108: a "needs the key fixed first" wait is a challengeable
// premise — the tool already in this lane can source the same truth). One
// invocation, page-per-video, so a big backlog takes minutes, not quota.
// --ignore-errors: a private/members-only item skips loudly, never kills the
// sweep — so the spawn is accepted even on a non-zero exit if it printed rows.
function fetchUploadDatesYtdlp(ids) {
  const args = ['--skip-download', '--no-warnings', '--ignore-errors',
    '--print', '%(id)s\t%(release_timestamp,upload_date)s',
    ...ids.map((id) => `https://www.youtube.com/watch?v=${id}`)];
  let stdout = '';
  for (const cmd of [['yt-dlp', args], ['python', ['-m', 'yt_dlp', ...args]]]) {
    const r = spawnSync(cmd[0], cmd[1], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    stdout = r.stdout || '';
    if (r.status === 0 || stdout.trim()) break;
  }
  const out = new Map();
  for (const line of stdout.split('\n')) {
    const [id, stamp] = line.trim().split('\t');
    if (!id || !stamp || stamp === 'NA') continue;
    // release_timestamp = epoch seconds; upload_date = YYYYMMDD (date-only).
    const date = /^\d{8}$/.test(stamp)
      ? `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`
      : easternDate(Number(stamp) * 1000);
    if (date) out.set(id, date);
  }
  return out;
}

const undatedByTitle = rows.filter((r) => !r.serviceDate);
if (undatedByTitle.length) {
  let dates = new Map();
  if (API_KEY) {
    try {
      dates = await fetchUploadDates(undatedByTitle.map((r) => r.videoId));
    } catch (e) {
      console.error(`WARNING: API upload-date fallback failed (${e.message}). Falling back to yt-dlp page metadata (keyless).`);
    }
  }
  if (!dates.size) dates = fetchUploadDatesYtdlp(undatedByTitle.map((r) => r.videoId));
  let filled = 0;
  for (const r of undatedByTitle) {
    const date = dates.get(r.videoId);
    if (!date) continue;
    r.serviceDate = date;
    r.dateSource = 'upload';
    // Weekday is known now — re-classify with the same one rule the app uses.
    r.serviceType = classifyServiceType(r.rawTitle, date) || r.serviceType;
    filled += 1;
  }
  if (filled) console.log(`Upload-date fallback: dated ${filled} of ${undatedByTitle.length} title-dateless videos from YouTube's own stream/publish times.`);
  else console.error(`WARNING: upload-date fallback dated 0 of ${undatedByTitle.length} — the remainder stays NAMED undated (never painted).`);
}

const withDate = rows.filter((r) => r.serviceDate);
const undated = rows.filter((r) => !r.serviceDate);

// HISTORICAL-RECORD GUARD (2026-08-03, Darrell: "supposed to be an historical
// events review every time? what happened?"). The repo's own record measured
// the channel at 836 videos on 2026-06-23 (memory/MEMORY.md; the course-
// pipeline research review) while the /videos-only manifest read 339 — and NO
// instrument diffed the two, so the gap sat invisible until the Governor asked.
// Two deterministic checks close the class:
//   1. MONOTONIC: a new listing may never SHRINK the committed manifest — a
//      partial listing (a tab failed, YouTube throttled) must not quietly
//      replace a fuller one. Shrink = hard red.
//   2. RECORDED FLOOR: the channel's own page reported 836 on 2026-06-23; a
//      listing far below that is loudly named PARTIAL (warn, not red — the 836
//      may include Shorts/members-only items the sweep rightly excludes; the
//      warning is the instrument, the manifest stays honest either way).
const RECORDED_CHANNEL_TOTAL_2026_06_23 = 836;
let prevTotal = 0;
try { prevTotal = JSON.parse(readFileSync('app/src/lib/corpus-manifest.json', 'utf8')).total || 0; } catch { /* first generation */ }
if (rows.length < prevTotal) {
  console.error(`REFUSING to shrink the corpus: this listing found ${rows.length} videos but the committed manifest holds ${prevTotal}. A partial listing must never replace a fuller one (DR-0076).`);
  process.exit(1);
}
if (rows.length < RECORDED_CHANNEL_TOTAL_2026_06_23 * 0.9) {
  console.error(`WARNING: listed ${rows.length} videos, but the channel itself reported ~${RECORDED_CHANNEL_TOTAL_2026_06_23} on 2026-06-23 — this sweep is likely PARTIAL (a tab failed, or content sits outside /videos+/streams). The gap is named, not hidden.`);
}

mkdirSync('scripts/out', { recursive: true });
writeFileSync('scripts/out/choir-sermons-backfill.json', JSON.stringify(rows, null, 2));

// EVERY video lands (DR-0135 — the 2026-07-10 corpus-gap heal). The original
// generator emitted only the dated rows; the 0013 seed therefore carried 125 of
// 335 videos and the other 210 were silently "left for manual entry" — the gap
// Darrell photographed in every tab. Undated rows now insert with a NULL
// service_date (the schema allows it; the app labels undated as undated,
// DR-0124) instead of being dropped. Idempotent either way.
const CHURCH = "(SELECT id FROM instances WHERE slug = 'colg')";
// ON CONFLICT: DATE the existing row when it has no date yet (2026-08-04 fix).
// The old DO NOTHING made the pipeline insert-only — it re-listed the whole
// channel twice a week and dated ZERO already-imported rows, so the "undated"
// backlog could never shrink. The update is guarded to rows whose service_date
// IS NULL: a date someone set by hand (or a prior run derived) is never
// overwritten, and dated rows are untouched entirely. Still idempotent.
const insertRow = (r) =>
  `INSERT INTO choir_sermons (instance_id, video_id, youtube_url, service_date, service_type, title, speaker, source) ` +
  `VALUES (${CHURCH}, ${sqlEsc(r.videoId)}, ${sqlEsc(r.youtubeUrl)}, ${sqlEsc(r.serviceDate)}, ${sqlEsc(r.serviceType)}, ${sqlEsc(r.title)}, ${sqlEsc(r.speaker)}, 'youtube') ` +
  `ON CONFLICT (instance_id, video_id) WHERE video_id IS NOT NULL DO UPDATE SET ` +
  `service_date = EXCLUDED.service_date, ` +
  `service_type = COALESCE(choir_sermons.service_type, EXCLUDED.service_type), ` +
  `speaker = COALESCE(choir_sermons.speaker, EXCLUDED.speaker) ` +
  `WHERE choir_sermons.service_date IS NULL AND EXCLUDED.service_date IS NOT NULL;`;
const sql = [
  '-- choir_sermons FULL backfill from @thelovecorner (generated; metadata only, no downloads).',
  `-- ${rows.length} videos: ${withDate.length} dated + ${undated.length} undated (undated insert with NULL service_date — labeled undated in-app, never dropped).`,
  '-- Conflict rule: an existing UNDATED row receives this run\'s derived date (title parse or the stream\'s own start time); a dated row is never touched.',
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
  videos: rows.map((r) => ({ videoId: r.videoId, serviceDate: r.serviceDate, title: r.title || r.rawTitle, ...(r.dateSource ? { dateSource: r.dateSource } : {}) })),
};
writeFileSync('app/src/lib/corpus-manifest.json', JSON.stringify(manifest, null, 2) + '\n');

console.log(`Parsed ${rows.length} videos (${withDate.length} dated, ${undated.length} undated — ALL emitted). Tabs: ${JSON.stringify(perTab)} (overlap deduped by id).`);
console.log(`Sunday: ${withDate.filter((r) => r.serviceType === 'sunday').length} · Wednesday: ${withDate.filter((r) => r.serviceType === 'wednesday').length}`);
console.log('Wrote scripts/out/choir-sermons-backfill.{json,sql} and app/src/lib/corpus-manifest.json');
if (rows.length) console.log('Sample:', JSON.stringify(rows[0], null, 2));
