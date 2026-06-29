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

// Turn raw channel items (with descriptions) into choir_songs-shaped archive
// rows, ALWAYS needs_review (a description is real but not authoritative). Items:
// [{ videoId, title (service title, for date), description, serviceDate, serviceType }].
export function buildArchiveSongsFromChannel(items) {
  const rows = [];
  for (const it of items || []) {
    const videoId = cap(it && it.videoId, 100);
    if (!videoId) continue;
    const url = youtubeWatch(videoId, null);
    for (const cand of parseDescriptionSongs(it.description)) {
      rows.push({
        title: cand.title,
        titleKey: normalizeTitle(cand.title),
        youtubeUrl: url,
        videoId,
        startSeconds: cand.startSeconds,
        serviceDate: cap(it.serviceDate, 20),
        serviceType: okType(it.serviceType),
        scriptureRef: null,
        source: 'archive',
        confidence: 'low',
        needsReview: true,
        sourceQuote: null,
      });
    }
  }
  return rows;
}

// --- Harvest the HISTORICAL repertoire from the services we ALREADY have ------
// One source, two harvests (Darrell 2026-06-25): the SAME service videos already
// ingested for sermons (choir_sermons) contain the choir songs. So we don't pull
// a new video list — we attribute the extracted songs to the existing services
// and REUSE their video link + date. Each linked song becomes a rendition tied to
// that real service (Song -> Renditions = the ways we've sung it, by date).

// Attribute extracted song rows to the existing service corpus (choir_sermons
// shapes: { videoId, youtubeUrl, serviceDate, serviceType }). A song matches its
// service by video_id first, else by the service date it was sung on; on a match
// it INHERITS the service's video link + date/type (reuse, don't re-fetch),
// keeping its own timestamp into that video. Faithful: a song that matches no
// known service is kept but flagged unlinked (it's still real repertoire; it
// just isn't tied to a service video we hold yet). Returns { rows, scope }.
export function attributeToCorpus(rows, services) {
  const byVideo = new Map();
  const byDate = new Map();
  for (const s of services || []) {
    if (s && s.videoId) byVideo.set(s.videoId, s);
    if (s && s.serviceDate && !byDate.has(s.serviceDate)) byDate.set(s.serviceDate, s);
  }
  const out = [];
  let matched = 0;
  for (const r of rows || []) {
    const svc = (r.videoId && byVideo.get(r.videoId)) || (r.serviceDate && byDate.get(r.serviceDate)) || null;
    if (svc) {
      matched += 1;
      const videoId = r.videoId || svc.videoId || null;
      out.push({
        ...r,
        videoId,
        youtubeUrl: r.youtubeUrl || youtubeWatch(svc.videoId, svc.youtubeUrl),
        serviceDate: r.serviceDate || svc.serviceDate || null,
        serviceType: r.serviceType || svc.serviceType || 'sunday',
        fromService: true,
      });
    } else {
      out.push({ ...r, fromService: false });
    }
  }
  return {
    rows: out,
    scope: {
      services: (services || []).length,
      matched,
      unmatched: out.length - matched,
      unmatchedTitles: out.filter((r) => !r.fromService).map((r) => r.title),
    },
  };
}

// How far the historical sweep has gotten: of the service videos we already hold
// (the corpus), how many have at least one harvested choir song. Real denominators
// only (no fabrication) for the honest "songs harvested from X of N services"
// readout. `services` = choir_sermons shapes; `songs` = current choir_songs shapes.
export function repertoireCoverage(services, songs) {
  const totalServices = (services || []).length;
  const videoIds = new Set((services || []).map((s) => s && s.videoId).filter(Boolean));
  const dates = new Set((services || []).map((s) => s && s.serviceDate).filter(Boolean));
  const covered = new Set();
  for (const song of songs || []) {
    if (song && song.videoId && videoIds.has(song.videoId)) covered.add(`v:${song.videoId}`);
    else if (song && song.serviceDate && dates.has(song.serviceDate)) covered.add(`d:${song.serviceDate}`);
  }
  const coveredServices = Math.min(covered.size, totalServices);
  return { totalServices, coveredServices, pendingServices: Math.max(0, totalServices - coveredServices) };
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
