// =============================================================================
// choir-renditions — "the ways we've sung this song in the past."
// =============================================================================
// Darrell 2026-06-24: the choir's past performances + their ad-libs together are
// THE WAYS WE HAVE SUNG THESE SONGS. So a song is one title with MANY RENDITIONS
// — one per time it was sung — and opening a song shows rendition A (this date,
// this vamp/these runs), rendition B (that date, different), so the choir
// references + reuses its own history.
//
// NO NEW ENTITY (Reality-trace / Verification Doctrine): a rendition IS a real
// choir_songs set-list row — one row per (title, service_date, service_type),
// already carrying that performance's video deep-link (youtubeUrl+startSeconds),
// key, arrangement, soloist, and notes. lib/choir-songbook.js groups rows by
// title into a Song; THIS module expands the same rows into the per-performance
// list the Song collapses into unions. Everything is DERIVED — nothing painted.
//
// PURE functions only (no Supabase, no React, no URL-embed concerns — the
// component builds embed/timed URLs from the youtubeUrl + startSeconds passed
// through here). The Supabase I/O (rendition loves, ad-lib curation, graduation)
// lives in choir-renditions-sync.js; the UI in components/ChoirRenditions.jsx.
//
// FAITHFUL AD-LIBS (no fabrication): ad_libs is a real, reviewable list. The
// director curates them, OR the content-engine / SME Whisper pipeline (same
// archive) writes DETECTED candidates with a confidence + review='unreviewed'.
// A detected ad-lib is never shown as confirmed; a low-confidence ARCHIVE match
// flags the whole rendition for review (needsSourceReview). Nothing is invented.
//
// DESCRIPTIVE, NEVER PRESCRIPTIVE (binding, Darrell 2026-06-24): this is an EXACT,
// FAITHFUL RECORD of what the choir actually did — captured precisely enough to
// reproduce a past rendition exactly IF THEY CHOOSE. It informs; it does not
// dictate. The copy says "here's exactly how we sang it on [date]," never "sing
// it this way." The choir stays free to sing it however the Spirit leads next
// time; the record only preserves + clarifies what was done, available to
// reproduce OR depart from at their discretion. Fidelity (the precise detail:
// what / when in the song / who) is the priority so "get it the same" is
// possible; prescription is never the intent. (Aligns no-condemnation + choir
// freedom + Spirit-led worship.)
// =============================================================================
import { normalizeTitle } from './choir-songbook.js';

// --- Ad-lib shape ------------------------------------------------------------
// The kinds of variation a rendition can carry, with a display label and a
// stable sort rank (so "the way we sang it" reads consistently). Extend freely.
export const AD_LIB_TYPES = {
  vamp:          { label: 'Vamp',           rank: 1 },
  run:           { label: 'Run / riff',     rank: 2 },
  soloist:       { label: 'Soloist moment', rank: 3 },
  bridge:        { label: 'Bridge',         rank: 4 },
  'key-change':  { label: 'Key change',     rank: 5 },
  tempo:         { label: 'Tempo shift',    rank: 6 },
  arrangement:   { label: 'Arrangement',    rank: 7 },
  other:         { label: 'Variation',      rank: 8 },
};

// Archive-match confidence the seeder writes (text enum, choir_songs.confidence,
// 0042). 'low' on an archive match means "don't trust it — confirm." Used by
// needsSourceReview alongside the seeder's explicit needs_review flag.
export const SOURCE_REVIEW_CONFIDENCE = 'low';

// Coerce one raw ad-lib (curated object or a pipeline-detected one) into the
// canonical shape with safe defaults. Returns null for an empty/typeless entry
// (we never invent a label). `i` seeds a stable id when the row carries none.
export function normalizeAdLib(raw, i = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const type = AD_LIB_TYPES[raw.type] ? raw.type : (raw.type ? 'other' : null);
  const label = String(raw.label || '').trim();
  if (!type && !label) return null;            // nothing real to show
  const review = ['confirmed', 'unreviewed', 'rejected'].includes(raw.review) ? raw.review : 'confirmed';
  const source = raw.source === 'detected' ? 'detected' : 'curated';
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  let confidence = num(raw.confidence);
  if (confidence != null) confidence = Math.max(0, Math.min(1, confidence));
  return {
    id: String(raw.id || `adlib-${i}`),
    type: type || 'other',
    label: label || AD_LIB_TYPES[type || 'other'].label,
    at: num(raw.at),
    endAt: num(raw.endAt),
    soloist: (raw.soloist != null && String(raw.soloist).trim()) || null,
    description: (raw.description != null && String(raw.description).trim()) || null,
    source,
    // Curated entries are author-confirmed; detected entries keep their (lower)
    // confidence and start unreviewed unless the pipeline marked them otherwise.
    confidence: source === 'detected' ? confidence : null,
    review: source === 'detected' && raw.review == null ? 'unreviewed' : review,
  };
}

// Parse the ad_libs column (an array, or a JSON string for safety) into clean,
// normalized ad-libs. Always returns an array; never throws.
export function parseAdLibs(value) {
  let arr = value;
  if (typeof value === 'string') {
    try { arr = JSON.parse(value); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  const out = [];
  arr.forEach((raw, i) => { const a = normalizeAdLib(raw, i); if (a) out.push(a); });
  return out;
}

// Ad-libs to show for a rendition: drop rejected ones, order by time-in-song
// (untimed last), then by type rank. Pure + stable.
export function visibleAdLibs(adLibs, { includeRejected = false } = {}) {
  return (adLibs || [])
    .filter((a) => includeRejected || a.review !== 'rejected')
    .slice()
    .sort((a, b) => {
      const at = a.at == null ? Infinity : a.at;
      const bt = b.at == null ? Infinity : b.at;
      if (at !== bt) return at - bt;
      return (AD_LIB_TYPES[a.type]?.rank || 99) - (AD_LIB_TYPES[b.type]?.rank || 99);
    });
}

// Flip one ad-lib's review state in an array, returning a NEW array (the editor
// then persists it). No-op if the id isn't present.
export function setAdLibReview(adLibs, id, review) {
  return (adLibs || []).map((a) => (a.id === id ? { ...a, review } : a));
}

// "Vamp · 2 runs · soloist" — a short summary of a rendition's variations for
// the collapsed card. Empty string when there are none.
export function adLibSummary(adLibs) {
  const vis = visibleAdLibs(adLibs);
  if (!vis.length) return '';
  const counts = new Map();
  for (const a of vis) counts.set(a.type, (counts.get(a.type) || 0) + 1);
  const parts = [];
  for (const [type, n] of counts) {
    const base = AD_LIB_TYPES[type]?.label || 'Variation';
    parts.push(n > 1 ? `${n}× ${base}` : base);
  }
  return parts.join(' · ');
}

// --- Source honesty ----------------------------------------------------------

// A rendition flagged by the archive seeder (needsReview, 0042) — or an archive
// match the seeder rated 'low' — needs a human to confirm it's really this song
// on this date. Manual/live renditions the director set never need review.
// Reads #320's provenance columns; the renditions surface adds no parallel ones.
export function needsSourceReview(rendition) {
  if (!rendition) return false;
  if (rendition.needsReview) return true;
  return rendition.source === 'archive' && rendition.confidence === SOURCE_REVIEW_CONFIDENCE;
}

// --- Build the rendition list for a song ------------------------------------

// The set-list rows that belong to ONE song (same normalized title). Active
// only; archived performances drop out. Caller usually passes the whole songs
// array — we filter here so the component needn't.
export function renditionRowsForTitle(rows, titleKey) {
  const key = titleKey && titleKey.includes(' ') ? titleKey : normalizeTitle(titleKey);
  return (rows || []).filter((r) => r.status !== 'archived' && normalizeTitle(r.title) === key);
}

// Expand a song's set-list rows into its renditions — "the ways we've sung this"
// — newest performance first. `loves` is the tally map (renditionId ->
// {count, mine}) from tallyRenditionLoves; `today` is an ISO date so past/future
// split correctly. Each rendition carries its own ad-libs (visible, sorted),
// keyboardist notes, key/arrangement/soloist, video deep-link inputs, source
// honesty flag, and rendition-level loves. Nothing is painted.
export function buildRenditions(rows, { loves, today } = {}) {
  const todayIso = today || '';
  const lovesMap = loves || new Map();
  const list = (rows || [])
    .filter((r) => r.status !== 'archived')
    .slice()
    .sort((a, b) => String(b.serviceDate || '').localeCompare(String(a.serviceDate || '')));
  return list.map((r) => {
    const adLibs = visibleAdLibs(parseAdLibs(r.adLibs));
    const love = lovesMap.get(r.id) || { count: 0, mine: false };
    const date = r.serviceDate || null;
    const rendition = {
      id: r.id,
      titleKey: normalizeTitle(r.title),
      title: r.title,
      serviceDate: date,
      serviceType: r.serviceType || 'sunday',
      isPast: !!date && (!todayIso || date <= todayIso),
      isFuture: !!date && !!todayIso && date > todayIso,
      youtubeUrl: r.youtubeUrl ?? null,
      startSeconds: Number.isFinite(r.startSeconds) ? r.startSeconds : null,
      songKey: r.songKey ?? null,
      arrangement: r.arrangement ?? null,
      soloist: r.soloist ?? null,
      notes: r.notes ?? null,
      keyboardistNotes: r.keyboardistNotes ?? null,
      adLibs,
      adLibCount: adLibs.length,
      adLibSummary: adLibSummary(adLibs),
      hasUnreviewed: adLibs.some((a) => a.review === 'unreviewed'),
      // Archive provenance (#320's choir_songs columns) — the rendition's source
      // honesty, not parallel columns.
      source: r.source || 'manual',
      sourceVideoId: r.videoId ?? null,
      confidence: r.confidence ?? null,
      needsReview: !!r.needsReview,
      lovesCount: love.count,
      lovedByMe: !!love.mine,
    };
    rendition.needsSourceReview = needsSourceReview(rendition);
    return rendition;
  });
}

// renditionId -> { count, mine } for the rendition-level hearts. Mirrors
// tallyLoves (choir-songbook.js) but keyed by the performance, not the title.
export function tallyRenditionLoves(loves) {
  const map = new Map();
  for (const l of loves || []) {
    const cur = map.get(l.renditionId) || { count: 0, mine: false };
    cur.count += 1;
    if (l.mine) cur.mine = true;
    map.set(l.renditionId, cur);
  }
  return map;
}

// The single most-loved rendition (which VERSION the body loved most): highest
// loves, tie broken by most recent. Returns null when no rendition is loved.
export function mostLovedRendition(renditions) {
  let best = null;
  for (const r of renditions || []) {
    if (!r.lovesCount) continue;
    if (!best
      || r.lovesCount > best.lovesCount
      || (r.lovesCount === best.lovesCount && String(r.serviceDate || '').localeCompare(String(best.serviceDate || '')) > 0)) {
      best = r;
    }
  }
  return best;
}

// --- Master-program tie-in ---------------------------------------------------

// The stable reference the master Sunday program (service-program lane) persists
// to base Sunday on a SPECIFIC rendition, not just the song. `renditionId` is the
// choir_songs row id; `label` is a human caption. The program resolves it back
// with resolveProgramRendition. (Contract: docs/99-session-notes/2026-06-24-
// song-renditions-model-and-tie-ins.md.)
export function renditionRef(rendition) {
  if (!rendition) return null;
  return {
    renditionId: rendition.id,
    titleKey: rendition.titleKey,
    title: rendition.title,
    serviceDate: rendition.serviceDate,
    label: renditionLabel(rendition),
  };
}

// Resolve a persisted renditionId back to a live rendition (e.g. when the master
// program renders its chosen version). Returns null if the performance is gone.
export function resolveProgramRendition(renditions, renditionId) {
  if (!renditionId) return null;
  return (renditions || []).find((r) => r.id === renditionId) || null;
}

// "Jun 14, 2026 — Vamp · soloist" / "Jun 14, 2026" — a one-line caption.
export function renditionLabel(rendition) {
  if (!rendition) return '';
  const date = rendition.serviceDate || 'undated';
  const summary = rendition.adLibSummary || adLibSummary(rendition.adLibs);
  return summary ? `${date} — ${summary}` : date;
}

// --- Music-creation: note a loved ad-lib as a reference ----------------------

// Note a loved ad-lib from a rendition into the song's arrangement as a DATED
// REFERENCE — "this is what we did on [date]," available to reproduce or build
// from (Darrell: "graduate a loved ad-lib," reframed descriptive 2026-06-24:
// the arrangement field is a reference the choir CAN draw on, never a rule it
// MUST follow). Pure: APPENDS the dated reference to whatever the song already
// has, without clobbering it. Idempotent — noting the same ad-lib twice doesn't
// duplicate the line. Descriptive language only (no "keep/always/must").
export function graduateAdLib(existingArrangement, adLib, rendition) {
  if (!adLib) return existingArrangement || null;
  const date = rendition?.serviceDate || 'undated';
  const kind = AD_LIB_TYPES[adLib.type]?.label || 'Variation';
  const line = `As sung ${date}: ${kind} — ${adLib.label}`;
  const existing = (existingArrangement || '').trim();
  if (existing.split('\n').some((l) => l.trim() === line)) return existing || null; // already noted
  return existing ? `${existing}\n${line}` : line;
}
