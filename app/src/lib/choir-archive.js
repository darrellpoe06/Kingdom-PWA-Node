// =============================================================================
// choir-archive — source the choir's PAST repertoire from the church archive.
// =============================================================================
// PURE parsers that turn the church's archive (the SAME YouTube channel + NAS
// recordings the content engine uses — reconcile, don't fork) into Songbook
// rows (choir_songs) so the historical repertoire auto-seeds instead of being
// typed in by hand. I/O + the YouTube fetch live in choir-songbook-sync.js.
//
// FAITHFUL (Reality-trace + Verification Doctrine): a YouTube service recording
// has NO machine-readable per-song index, so two honest sources feed this — and
// BOTH flag uncertainty rather than guessing a song into existence:
//   1. repertoire.json — the SME/content pipeline transcribes the recordings and
//      extracts what was actually sung (title + video + timestamp + confidence +
//      source_quote). High-confidence is the real signal; anything less seeds
//      needs_review=true. (Handoff contract below; the pipeline lane runs it.)
//   2. channel metadata — chapters / a "Songs:" list in a video DESCRIPTION are
//      real, author-entered song boundaries. Parsed here, ALWAYS needs_review
//      (a description is not a guarantee), never invented.
// Nothing is auto-confirmed: a steward reviews every seeded song before it is
// trusted. If neither source yields songs, the list stays empty — we do not
// paint a repertoire that wasn't sung.
//
// repertoire.json contract:
//   { source:{channel,kind}, songs:[ { title, video_id, youtube_url,
//     start_seconds, service_date, service_type, scripture_ref, confidence,
//     source_quote } ], unclear:[ "..." ] }
// =============================================================================
import { normalizeTitle } from './choir-songbook.js';

const cap = (s, n) => (s == null ? null : String(s).trim().slice(0, n) || null);
const okConfidence = (c) => (['high', 'med', 'low'].includes(c) ? c : null);
const okType = (t) => (['sunday', 'wednesday', 'rehearsal', 'both'].includes(t) ? t : 'sunday');

function youtubeWatch(videoId, url) {
  if (url && /^https?:\/\//i.test(url)) return url;
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

// Parse the pipeline's repertoire.json into choir_songs-shaped rows. A song with
// no title is skipped (can't seed an unnamed song). needs_review is true unless
// the pipeline is HIGH confidence (the steward confirms the rest).
export function parseRepertoireJson(input, meta = {}) {
  const json = typeof input === 'string' ? JSON.parse(input) : (input || {});
  const rows = [];
  for (const s of Array.isArray(json.songs) ? json.songs : []) {
    const title = cap(s && s.title, 200);
    if (!title) continue;
    const confidence = okConfidence(s.confidence);
    const startSeconds = Number.isFinite(Number(s.start_seconds)) ? Math.max(0, Math.floor(Number(s.start_seconds))) : null;
    rows.push({
      title,
      titleKey: normalizeTitle(title),
      youtubeUrl: youtubeWatch(cap(s.video_id, 100), cap(s.youtube_url, 300)),
      videoId: cap(s.video_id, 100),
      startSeconds,
      serviceDate: cap(s.service_date, 20),
      serviceType: okType(s.service_type),
      scriptureRef: cap(s.scripture_ref, 200),
      source: 'archive',
      confidence,
      needsReview: confidence !== 'high',
      sourceQuote: cap(s.source_quote, 2000),
    });
  }
  const unclear = (Array.isArray(json.unclear) ? json.unclear : []).map((u) => cap(u, 500)).filter(Boolean);
  return { rows, unclear };
}

// --- Channel-metadata extraction (real-today path, always needs_review) -------

const TIME_RE = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/; // h:mm:ss or mm:ss
function toSeconds(h, m, s) { return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0); }

// A non-song chapter line (intro, sermon, announcements…) we should not seed as
// a song. Conservative: only obvious service-structure words.
const NOT_A_SONG = /\b(intro|introduction|welcome|announce|offering|tithe|sermon|message|word|preach|prayer|altar|benediction|dismiss|scripture reading|responsive reading|outro|credits)\b/i;

// Pull song candidates from ONE video's description: YouTube chapter lines
// ("12:30 Total Praise" or "Total Praise - 12:30") and an explicit
// "Songs:/Selections:/Music:" list. Returns { title, startSeconds } candidates,
// de-duplicated, non-song structure lines dropped. Heuristic by design — the
// caller marks every result needs_review.
export function parseDescriptionSongs(description) {
  const text = String(description || '');
  if (!text.trim()) return [];
  const out = [];
  const seen = new Set();
  const push = (title, startSeconds) => {
    const t = cap(title, 200);
    if (!t || t.length < 2 || NOT_A_SONG.test(t)) return;
    const key = normalizeTitle(t);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ title: t, startSeconds: startSeconds ?? null });
  };

  // 1. An explicit song list block ("Songs:" / "Selections:" / "Music:").
  const listMatch = text.match(/(?:songs|selections|music|set\s*list)\s*:\s*([\s\S]*?)(?:\n\s*\n|$)/i);
  if (listMatch) {
    for (const line of listMatch[1].split(/\r?\n/)) {
      const clean = line.replace(/^[\s\-*•|>\d.)]+/, '').replace(TIME_RE, '').replace(/[\s\-|]+$/, '').trim();
      if (clean) push(clean, null);
    }
  }

  // 2. Chapter-style lines anywhere: "mm:ss Title" or "Title - mm:ss".
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(TIME_RE);
    if (!m) continue;
    const secs = toSeconds(m[1], m[2], m[3]);
    const title = line.replace(TIME_RE, '').replace(/^[\s\-*•|>]+/, '').replace(/[\s\-|]+$/, '').trim();
    if (title) push(title, secs);
  }
  return out;
}

// Channel boilerplate stripped from a clip title to recover the song name.
// NB: "praise"/"worship" are song words ("Total Praise"), so only the TEAM
// phrases are boilerplate — never the standalone words.
const TITLE_BOILERPLATE = /\b(?:colg|the church of the living god|church of the living god|mass choir|sanctuary choir|praise (?:&|and) worship|praise team|worship team|choir|live|official|video|audio|hd|4k|full service|service|sunday|wednesday|morning|evening|feat\.?|featuring|ft\.?)\b/gi;

// Many church channels post INDIVIDUAL song clips ("Total Praise | COLG Choir",
// "COLG Mass Choir - Way Maker (Live)"). When a video isn't a dated full service,
// its title often IS the song. Recover a conservative candidate or null — always
// needs_review (a title guess is the weakest signal). Pure + tested.
const cleanBoiler = (s) => String(s).replace(TITLE_BOILERPLATE, ' ').replace(/\s+/g, ' ').trim();

export function songFromClipTitle(title) {
  const raw = String(title || '').trim();
  if (!raw) return null;
  if (NOT_A_SONG.test(raw)) return null; // a structure word anywhere (sermon/offering/…) -> not a song
  const stripped = raw.replace(/\([^)]*\)|\[[^\]]*\]/g, ' '); // drop "(Live)", "[HD]"
  // Strip boilerplate from EACH segment, then keep the one with the most real
  // content (the channel name is often the longest RAW segment but boils to ~0).
  const segs = stripped.split(/[|–—·:]+|\s-\s/).map((s) => s.trim()).filter(Boolean);
  const candidates = (segs.length > 1 ? segs : [stripped]).map(cleanBoiler).filter(Boolean);
  let t = candidates.sort((a, b) => b.length - a.length)[0] || '';
  if (!t || t.length < 3 || NOT_A_SONG.test(t)) return null;
  if (/^[\d\s.\-/]+$/.test(t) || /^\d{1,2}[-/]\d{1,2}([-/]\d{2,4})?$/.test(t)) return null; // numeric/date leftovers
  // A lone generic worship word ("Worship", "Service") isn't an identifiable
  // song; a real title like "Total Praise" keeps its other word.
  if (/^(?:worship|praise|service|music|songs?|selections?|hymn|medley)$/i.test(t)) return null;
  return cap(t, 200);
}

// Turn raw channel items into choir_songs-shaped archive rows, ALWAYS
// needs_review (real metadata, but not authoritative). Two easy-signal sources
// per video: song lists/chapters in the DESCRIPTION, and — for clips that are
// NOT a dated full service — the song name in the TITLE. Items:
// [{ videoId, title, description, serviceDate, serviceType }].
export function buildArchiveSongsFromChannel(items) {
  const rows = [];
  for (const it of items || []) {
    const videoId = cap(it && it.videoId, 100);
    if (!videoId) continue;
    const url = youtubeWatch(videoId, null);
    const serviceDate = cap(it.serviceDate, 20);
    const serviceType = okType(it.serviceType);
    const push = (title, startSeconds) => rows.push({
      title, titleKey: normalizeTitle(title), youtubeUrl: url, videoId,
      startSeconds: startSeconds ?? null, serviceDate, serviceType,
      scriptureRef: null, source: 'archive', confidence: 'low', needsReview: true, sourceQuote: null,
    });
    const before = rows.length;
    for (const cand of parseDescriptionSongs(it.description)) push(cand.title, cand.startSeconds);
    // A clip (no dated service) whose title is the song — only when the
    // description yielded nothing for this video (a full setlist always wins).
    if (!serviceDate && rows.length === before) {
      const clip = songFromClipTitle(it.title);
      if (clip) push(clip, null);
    }
  }
  return rows;
}

// Drop archive rows that already exist (dedup by video_id + normalized title),
// so re-running the seed is idempotent. `existing` = current choir_songs shapes.
export function selectNewArchiveSongs(rows, existing) {
  const have = new Set();
  for (const e of existing || []) {
    if (e.videoId) have.add(`${e.videoId}::${normalizeTitle(e.title)}`);
  }
  const seen = new Set(have);
  const out = [];
  for (const r of rows || []) {
    const key = `${r.videoId}::${r.titleKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
