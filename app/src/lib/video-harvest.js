// =============================================================================
// video-harvest — the one-source-many-harvests model + coverage ledger math
// =============================================================================
// Binding principle (Darrell 2026-06-25):
//   "No video should be lost to that Sunday or Wednesday — we need each video to
//    give us new content and context to something."
//
// Every ingested church recording is ONE source that fans out into MANY harvests.
// This module is the PURE, dependency-free core: the harvest-type registry, the
// per-video coverage math, and the corpus roll-up that MEASURES "no video lost".
// No imports -> safe in Node + browser + tests. The Supabase wiring lives in
// harvest-ledger.js; the surface in components/HarvestLedger.jsx.
//
// HONESTY (DR-0076 verification doctrine): coverage is derived, never painted.
// A harvest type is only ever 'complete'/'partial' when there's a recorded run
// OR real downstream rows evidencing it (deriveSignals). An untouched type reads
// as 'none' — a gap, surfaced for processing, not hidden.
// =============================================================================

// The harvests every service recording can yield. Order = display order.
// `derived: 'transcript'` marks a harvest that comes from re-reading the already-
// ingested corpus (the Whisper transcript), NOT from re-fetching the video — the
// one-source-many-harvests rule.
export const HARVEST_TYPES = [
  { key: 'transcript', label: 'Transcript', short: 'Words', foundation: true,
    surface: 'sme-pipeline',
    description: 'The base corpus — the Whisper transcript every other harvest derives from. Mine this once; reuse it for all the rest.' },
  { key: 'sermon', label: 'Message', short: 'Sermon', surface: 'pulpit', derived: 'transcript',
    description: 'The teaching itself — speaker, title, the message-library entry congregants watch.' },
  { key: 'scripture', label: 'Scripture', short: 'Refs', surface: 'scripture', derived: 'transcript',
    description: 'Every Scripture reference cited in the service, fed to the Scripture library.' },
  { key: 'songs', label: 'Worship songs', short: 'Songs', surface: 'choir', derived: 'transcript',
    description: 'Choir / worship songs sung, fed to the historical choir library (the choir lane consumes these).' },
  { key: 'lessons', label: 'Lessons', short: 'Learn', surface: 'learn', derived: 'transcript',
    description: 'The teaching turned into paced Learn course material.' },
  { key: 'discernment', label: 'Discernment', short: 'World', surface: 'discernment', derived: 'transcript',
    description: 'World-issue / cultural context the teaching engages (e.g. the African-American plight), fed to the discernment track.' },
  { key: 'testimony', label: 'Testimony & stories', short: 'Stories', surface: 'study', derived: 'transcript',
    description: 'Quotable testimonies and Sermon Stories worth keeping.' },
  { key: 'trivia', label: 'Trivia', short: 'Trivia', surface: 'engagement', derived: 'transcript',
    description: 'Engagement questions drawn from the message (BG’s own end-of-message questions).' },
  { key: 'events', label: 'Events-as-data', short: 'Events', surface: 'institutional-memory', derived: 'transcript',
    description: 'Institutional-memory events — what happened this service, captured as structured data.' },
];

export const HARVEST_KEYS = HARVEST_TYPES.map((t) => t.key);
const TYPE_BY_KEY = Object.fromEntries(HARVEST_TYPES.map((t) => [t.key, t]));
export function harvestType(key) { return TYPE_BY_KEY[key] || null; }

export const STATUS = Object.freeze({ NONE: 'none', PARTIAL: 'partial', COMPLETE: 'complete', NA: 'na' });
const VALID_STATUS = new Set(['none', 'partial', 'complete', 'na']);
// 'na' (a steward marking a type genuinely absent — e.g. a Bible study with no
// choir song) ranks as a settled, non-gap state alongside 'complete'.
const RANK = { none: 0, partial: 1, complete: 2, na: 2 };

// --- Single harvest record ---------------------------------------------------

// Normalize one harvest record to a stable shape. Unknown / missing -> a clean
// 'none' (an untouched, honest gap). Accepts both camelCase (app) and snake_case
// (raw jsonb) keys so it works straight off a DB row.
export function normalizeHarvest(rec) {
  const r = rec || {};
  const status = VALID_STATUS.has(r.status) ? r.status : 'none';
  const countRaw = r.count;
  const count = Number.isFinite(countRaw) ? countRaw : Number.isFinite(Number(countRaw)) ? Number(countRaw) : 0;
  return {
    status,
    count: count > 0 ? count : 0,
    refs: Array.isArray(r.refs) ? r.refs.filter(Boolean) : [],
    note: r.note ?? null,
    harvestedAt: r.harvestedAt ?? r.harvested_at ?? null,
    harvestedBy: r.harvestedBy ?? r.harvested_by ?? null,
    // `evidenced` = backed by real downstream rows (not just a recorded claim).
    evidenced: !!r.evidenced,
  };
}

// A full, type-complete harvest map for one video: every registered type present,
// untouched ones filled as 'none'. Idempotent (safe on already-normalized maps).
export function harvestMapFor(rawMap) {
  const out = {};
  for (const key of HARVEST_KEYS) out[key] = normalizeHarvest(rawMap ? rawMap[key] : null);
  return out;
}

// --- Per-video coverage ------------------------------------------------------

// Coverage for ONE video from its harvest map. 'na' types are excluded from the
// denominator (they can't be a gap); 'partial' counts as half. The honest signal
// the ledger turns on is `untouchedTypes` — the harvests this video still owes.
export function videoCoverage(rawMap) {
  const map = harvestMapFor(rawMap);
  const applicable = HARVEST_KEYS.filter((k) => map[k].status !== 'na');
  const complete = applicable.filter((k) => map[k].status === 'complete');
  const partial = applicable.filter((k) => map[k].status === 'partial');
  const none = applicable.filter((k) => map[k].status === 'none');
  const total = applicable.length;
  const ratio = total === 0 ? 0 : (complete.length + partial.length * 0.5) / total;
  return {
    total,
    complete: complete.length,
    partial: partial.length,
    none: none.length,
    na: HARVEST_KEYS.length - applicable.length,
    ratio,
    pct: Math.round(ratio * 100),
    started: complete.length + partial.length > 0,
    fullyHarvested: total > 0 && none.length === 0 && partial.length === 0,
    untouchedTypes: none,            // <- the gaps surfaced for processing
    completeTypes: complete,
    partialTypes: partial,
  };
}

// --- Real-state signals (anti-painted-number cross-check) ---------------------

// Derive harvest signals from real, queryable app rows for one video. This is
// the verification-doctrine bridge: scripture present ON the sermon row, songs
// LINKED to the video — evidence that lives in the DB now, not a recorded claim.
// Returns a sparse map (only evidenced types). `evidenced: true` on each.
export function deriveSignals({ sermon, songs } = {}) {
  const sig = {};
  if (sermon) {
    // The sermon row existing IS the message captured.
    sig.sermon = { status: 'complete', count: 1, evidenced: true };
    const ref = sermon.scriptureRef && String(sermon.scriptureRef).trim();
    if (ref) sig.scripture = { status: 'partial', count: 1, refs: [ref], evidenced: true };
  }
  const linked = (songs || []).filter(Boolean);
  if (linked.length) {
    sig.songs = { status: 'partial', count: linked.length, evidenced: true };
  }
  return sig;
}

// Merge real signals OVER a recorded harvest map. Evidence can only CONFIRM or
// STRENGTHEN — it never downgrades a recorded 'complete'/'na'. When real evidence
// meets or beats the recorded status, the type is marked `evidenced` (trustworthy
// without taking the recorder's word). Returns a full normalized map.
export function mergeHarvests(recorded, signals) {
  const out = harvestMapFor(recorded);
  for (const key of HARVEST_KEYS) {
    const sig = signals && signals[key] ? normalizeHarvest(signals[key]) : null;
    if (!sig) continue;
    const cur = out[key];
    if (RANK[sig.status] >= RANK[cur.status]) {
      out[key] = {
        ...cur,
        // 'na' is a human steward call; real evidence shouldn't flip it back on.
        status: cur.status === 'na' ? 'na' : sig.status,
        count: sig.count || cur.count,
        refs: sig.refs.length ? sig.refs : cur.refs,
        evidenced: true,
      };
    }
  }
  return out;
}

// --- Corpus roll-up: the measurable "no video lost" --------------------------

// Per-video flag: 'orphan' = ingested but NOTHING harvested (lost to that day —
// the case we refuse to allow); 'partial' = started but owes harvests; 'ok' =
// fully harvested (or every applicable type settled).
export function flagVideo(video) {
  const coverage = videoCoverage(video && video.harvests);
  let flag = 'ok';
  if (!coverage.started) flag = 'orphan';
  else if (!coverage.fullyHarvested) flag = 'partial';
  return { ...video, coverage, flag };
}

// Sort for the ledger surface: surface the under-harvested FIRST (orphans, then
// partials), each newest-first, with fully-harvested videos last. The whole point
// is to put what still needs processing at the top.
const FLAG_ORDER = { orphan: 0, partial: 1, ok: 2 };
export function sortForProcessing(rows) {
  return [...(rows || [])].sort((a, b) => {
    const f = (FLAG_ORDER[a.flag] ?? 3) - (FLAG_ORDER[b.flag] ?? 3);
    if (f !== 0) return f;
    return String(b.serviceDate || '').localeCompare(String(a.serviceDate || ''));
  });
}

// Roll the whole corpus into the ledger summary. This is the number that makes
// "100% of videos mined" visible and that enforces no-video-lost: `orphans` must
// be 0 and `noVideoLost` true. `byType` shows where the corpus is thin.
export function harvestLedgerSummary(videos) {
  const rows = sortForProcessing((videos || []).map(flagVideo));
  const n = rows.length;
  const orphans = rows.filter((r) => r.flag === 'orphan');
  const partials = rows.filter((r) => r.flag === 'partial');
  const full = rows.filter((r) => r.flag === 'ok');
  const avg = n === 0 ? 0 : rows.reduce((acc, r) => acc + r.coverage.ratio, 0) / n;

  const byType = {};
  for (const key of HARVEST_KEYS) {
    let complete = 0, partial = 0, none = 0, na = 0, evidenced = 0;
    for (const r of rows) {
      const rec = harvestMapFor(r.harvests)[key];
      if (rec.status === 'complete') complete++;
      else if (rec.status === 'partial') partial++;
      else if (rec.status === 'na') na++;
      else none++;
      if (rec.evidenced) evidenced++;
    }
    byType[key] = { complete, partial, none, na, evidenced };
  }

  return {
    videos: n,
    fullyHarvested: full.length,
    partiallyHarvested: partials.length,
    orphans: orphans.length,
    avgCoverage: avg,
    avgPct: Math.round(avg * 100),
    fullyPct: n === 0 ? 0 : Math.round((full.length / n) * 100),
    // The binding promise, measured. Vacuously true with an empty corpus; the
    // surface keys its empty state off `videos === 0`, not off this flag.
    noVideoLost: orphans.length === 0,
    byType,
    rows,
  };
}

// =============================================================================
// buildLedger — the honest bridge from the REAL corpus to the coverage ledger.
// =============================================================================
// Every ingested service video (a choir_sermons row carrying a video_id) MUST
// appear, even with no ledger row — that absence is exactly an ORPHAN, the thing
// we refuse to allow. Harvest rows whose video isn't a sermon (e.g. an SME lesson
// recording) are included too, so the ledger covers the full ingested corpus.
//
//   sermons:  [{ videoId, title, serviceDate, serviceType, youtubeUrl, scriptureRef }]
//   harvests: [{ videoId, title, serviceDate, serviceType, sourceKind, harvests }]
//   songs:    [{ id, title, sourceVideoId, ... }]   (linked back to their source video)
//
// Returns harvestLedgerSummary(...) over the merged corpus.
export function buildLedger({ sermons = [], harvests = [], songs = [] } = {}) {
  const harvestByVideo = new Map();
  for (const h of harvests) if (h && h.videoId) harvestByVideo.set(h.videoId, h);

  const songsByVideo = new Map();
  for (const s of songs) {
    const v = s && s.sourceVideoId;
    if (!v) continue;
    if (!songsByVideo.has(v)) songsByVideo.set(v, []);
    songsByVideo.get(v).push(s);
  }

  const videos = [];
  const seen = new Set();

  for (const sermon of sermons) {
    const vid = sermon && sermon.videoId;
    if (!vid || seen.has(vid)) continue;   // a manual sermon with no video isn't a "video" to harvest
    seen.add(vid);
    const ledgerRow = harvestByVideo.get(vid);
    const merged = mergeHarvests(
      ledgerRow ? ledgerRow.harvests : null,
      deriveSignals({ sermon, songs: songsByVideo.get(vid) || [] }),
    );
    videos.push({
      videoId: vid,
      title: sermon.title || (ledgerRow && ledgerRow.title) || null,
      serviceDate: sermon.serviceDate || (ledgerRow && ledgerRow.serviceDate) || null,
      serviceType: sermon.serviceType || (ledgerRow && ledgerRow.serviceType) || null,
      youtubeUrl: sermon.youtubeUrl || null,
      sourceKind: (ledgerRow && ledgerRow.sourceKind) || 'service',
      hasLedgerRow: !!ledgerRow,
      harvests: merged,
    });
  }

  // Ledger rows with no matching sermon (lesson recordings, manually added sources).
  for (const h of harvests) {
    if (!h || !h.videoId || seen.has(h.videoId)) continue;
    seen.add(h.videoId);
    videos.push({
      videoId: h.videoId,
      title: h.title || null,
      serviceDate: h.serviceDate || null,
      serviceType: h.serviceType || null,
      youtubeUrl: h.youtubeUrl || null,
      sourceKind: h.sourceKind || 'other',
      hasLedgerRow: true,
      harvests: mergeHarvests(h.harvests, deriveSignals({ songs: songsByVideo.get(h.videoId) || [] })),
    });
  }

  return harvestLedgerSummary(videos);
}
