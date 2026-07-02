// =============================================================================
// sermon-points — BG's numbered teaching outline, per video, for the library.
// =============================================================================
// Darrell 2026-07-01: under each of Bishop Gwin's videos, list the harvest-
// extracted POINTS — his numbered teaching outline (e.g. today's 5 Elijah points,
// scriptures Isaiah 61:7 / 2 Kings 2:9-10) — so a user can BROWSE the library and
// pick a video BASED ON its points ("show me the one about X").
//
// This module is the PRESENTATION + DISCOVERY layer over the harvest lane's
// output. It does NOT add a harvest TYPE (the coverage denominator + its
// 11%-baseline guard stay untouched) — it reads the points the harvest already
// produced and, where a transcript is present, derives the numbered outline live.
//
// SOURCE PRECEDENCE (most-trusted first):
//   0. 'prep'      — BG's OWN pre-service prep document (emailed to Christina),
//                    parsed by prep-outline.js into his numbered points + the
//                    scriptures under each. His own words + structure = ground
//                    truth; it beats anything parsed from the noisy transcript.
//                    Where a prep outline exists for a service, IT WINS (Darrell
//                    2026-07-02: "where BG's email exists, it wins"). The transcript
//                    lane fills gaps only — never overrides his own outline.
//   1. 'harvest'   — the recorded `lessons` refs on the video_harvests row: BG's
//                    own teaching beats, already mined by the harvest lane.
//   2. 'transcript'— derived live from the service transcript (YouTube captions),
//                    the same corpus, via extractSermonPoints below.
//   3. 'title'     — graceful fallback: the anchor scripture(s) named in the
//                    message title / scriptureRef, so a video with no transcript
//                    yet still shows something real, never a broken/empty state.
//
// HONESTY (DR-0076): every point is a REAL sentence BG said (or a real recorded
// beat) and every scripture literally appears in the source text. Nothing is
// invented; an absent signal stays an honest gap. Pure + dependency-light (only
// the equally-pure extractScriptureRefs), so it is safe in Node + browser + tests.
// =============================================================================
import { extractScriptureRefs } from './video-harvest.js';

// --- Sentence handling (mirrors transcript-harvest.js, kept local so this file
// stays a small, self-contained unit) ----------------------------------------
function normalize(text) {
  return String(text || '')
    .replace(/>>/g, ' ')          // caption speaker carets
    .replace(/\[[^\]]*\]/g, ' ')  // [Music] / [Applause]
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  const norm = normalize(text);
  if (!norm) return [];
  return norm.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
}

// Ordinal words → number. Covers BG's observed range (typically 4-6 points).
const ORDINAL = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8,
};

// A point-opening marker in the SPOKEN transcript. Each returns the ordinal it
// names, or null for a "next/last/another" running-counter marker. Conservative
// on purpose: a bare "first I want to say hi" won't match — the marker must read
// like the start of a teaching point.
// The leading (?<!verse )(?<!chapter ) guard stops a SCRIPTURE citation ("verse
// number seven", "chapter 2 verse number two") from being read as a point ordinal
// — a top cause of the broken numbering (verse numbers leaking in as "points").
const NUMBERED_RE = /(?<!verse )(?<!chapter )\b(?:number|point|reason|key|step|principle|thing|truth)\s+(one|two|three|four|five|six|seven|eight|\d)\b/i;
const MY_POINT_RE = /\bmy\s+(first|second|third|fourth|fifth|sixth|seventh|eighth)\s+(?:point|reason|key)\b/i;
const THE_NTH_RE  = /\bthe\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|next|last|final)\s+(?:point|thing|key|reason|principle|step|truth)\b/i;
const LEADING_ORD_RE = /^(?:and\s+|so\s+|now\s+|but\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth)(?:ly)?\b/i;

// Detect whether a sentence OPENS a teaching point. Returns { ordinal|null } or
// null when the sentence is not a point-opener.
function pointOpener(sentence) {
  const s = sentence;
  let m;
  if ((m = s.match(NUMBERED_RE))) {
    const raw = m[1].toLowerCase();
    const n = /^\d$/.test(raw) ? Number(raw) : (ORDINAL[raw] || null);
    return { ordinal: n };
  }
  if ((m = s.match(MY_POINT_RE)))  return { ordinal: ORDINAL[m[1].toLowerCase()] || null };
  if ((m = s.match(THE_NTH_RE)))   return { ordinal: ORDINAL[m[1].toLowerCase()] || null };  // next/last -> null (running)
  if ((m = s.match(LEADING_ORD_RE))) return { ordinal: ORDINAL[m[1].toLowerCase()] || null };
  return null;
}

// Trim an over-long point sentence to a readable claim without cutting a word.
function tidyClaim(s, max = 160) {
  const clean = normalize(s);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:]$/, '') + '…';
}

// =============================================================================
// extractSermonPoints — derive BG's numbered outline from a service transcript.
// Returns [{ n, text, scriptures: [refs] }] in spoken order. Scriptures for a
// point = the refs found in the point's own sentence plus the following
// sentences up to the next point-opener (the passages he reads under the claim).
// =============================================================================
export function extractSermonPoints(transcript, { limit = 8 } = {}) {
  const sentences = splitSentences(transcript);
  if (!sentences.length) return [];

  // First pass: find the index + ordinal of every point-opener.
  const openers = [];
  for (let i = 0; i < sentences.length; i += 1) {
    const op = pointOpener(sentences[i]);
    if (op) openers.push({ i, ordinal: op.ordinal });
  }
  if (!openers.length) return [];

  // Walk the openers in SPOKEN order and keep only those that ADVANCE the outline.
  // BG restates a beat ("the first thing" said three times) and reads many verses
  // ("verse number seven"), so the raw spoken ordinal is noisy and repeats. Rules:
  //   - a null-ordinal marker ("the next point") advances by one;
  //   - an explicit ordinal is kept only when it is exactly the next number
  //     (maxOrd + 1) — a repeat/regression (a restated point) or a jump (a leaked
  //     verse number like 7, 9) does NOT start a new point.
  // The kept points are then numbered SEQUENTIALLY by order, so the display shows
  // 1, 2, 3, 4… — never a duplicated or out-of-order "1." for every point.
  const kept = [];
  let maxOrd = 0;
  const seen = new Set();
  for (let k = 0; k < openers.length; k += 1) {
    const { i, ordinal } = openers[k];
    const nextI = k + 1 < openers.length ? openers[k + 1].i : Math.min(sentences.length, i + 5);
    const claim = tidyClaim(sentences[i]);
    const key = claim.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
    if (key.length < 8 || seen.has(key)) continue;
    if (ordinal == null) {
      // running marker — advances the outline by one
    } else if (ordinal === maxOrd + 1) {
      maxOrd = ordinal; // the clean next point
    } else {
      continue; // repeat / regression / verse-number jump — not a new point
    }
    seen.add(key);
    // The claim is the opener sentence; scriptures come from the opener + the
    // window up to the next opener (where he reads the supporting passage).
    const windowText = sentences.slice(i, nextI).join(' ');
    kept.push({ text: claim, scriptures: extractScriptureRefs([windowText]).slice(0, 6) });
    if (kept.length >= limit) break;
  }

  // Number sequentially by order — the outline reads 1..n regardless of the noisy
  // spoken ordinals.
  return kept.map((p, idx) => ({ n: idx + 1, text: p.text, scriptures: p.scriptures }));
}

// =============================================================================
// pointsFromHarvest — read the recorded `lessons` refs off a video_harvests row
// as ordered points. These are BG's own teaching beats already mined by the
// harvest lane; each becomes a point, scriptures scanned from its own text.
// =============================================================================
export function pointsFromHarvest(harvestRow, { limit = 8 } = {}) {
  const lessons = harvestRow?.harvests?.lessons;
  const refs = Array.isArray(lessons?.refs) ? lessons.refs.filter((r) => typeof r === 'string' && r.trim()) : [];
  if (!refs.length) return [];
  const out = [];
  const seen = new Set();
  for (const raw of refs) {
    const claim = tidyClaim(raw);
    const key = claim.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
    if (key.length < 8 || seen.has(key)) continue;
    seen.add(key);
    out.push({ n: out.length + 1, text: claim, scriptures: extractScriptureRefs([raw]).slice(0, 6) });
    if (out.length >= limit) break;
  }
  return out;
}

// =============================================================================
// pointsFromPrep — read BG's parsed pre-service prep outline (from sermon_prep,
// produced by prep-outline.js) as the display points. His numbered points already
// carry their own (correct, incrementing) number and the scriptures under each,
// plus any lettered sub-points — the authoritative structure, passed through as-is.
// =============================================================================
export function pointsFromPrep(prep, { limit = 12 } = {}) {
  const raw = Array.isArray(prep?.points) ? prep.points : [];
  const out = [];
  for (const p of raw) {
    const text = tidyClaim(p?.text || '', 200);
    if (!text) continue;
    const n = Number.isFinite(p?.n) && p.n > 0 ? p.n : out.length + 1;
    const scriptures = Array.isArray(p?.scriptures) ? p.scriptures.filter((s) => typeof s === 'string' && s.trim()).slice(0, 10) : [];
    const subpoints = Array.isArray(p?.subpoints)
      ? p.subpoints.map((s) => ({
        label: String(s?.label || '').slice(0, 3),
        text: tidyClaim(s?.text || '', 200),
        scriptures: Array.isArray(s?.scriptures) ? s.scriptures.filter((x) => typeof x === 'string' && x.trim()).slice(0, 10) : [],
      })).filter((s) => s.text)
      : [];
    out.push({ n, text, scriptures, subpoints });
    if (out.length >= limit) break;
  }
  return out;
}

// =============================================================================
// pointsForVideo — the ONE call the library surface uses. Resolves points by
// source precedence (prep -> harvest -> transcript -> title fallback) and rolls
// up the distinct scriptures across all points (+ the message's own anchor
// scripture) so the card can show a scripture strip even with zero numbered
// points. Always returns a well-formed bundle; never throws.
//
//   sermon:     { title, scriptureRef, ... }   — the message row (for fallback)
//   prep:       a sermon_prep row (or null)     — BG's own emailed outline (WINS)
//   harvestRow: a toHarvestShape() row (or null) — recorded lessons refs
//   transcript: { text } | string | null       — the service transcript
//
// When a prep outline exists for the service it WINS: the transcript lane never
// overrides BG's own words. A prep with scriptures but no numbered points (a
// scripture-reading service) still supplies the scripture strip — honestly his.
// =============================================================================
export function pointsForVideo({ sermon = {}, prep = null, harvestRow = null, transcript = null } = {}) {
  const transcriptText = transcript && typeof transcript === 'object'
    ? (transcript.text || '') : (typeof transcript === 'string' ? transcript : '');

  const prepPoints = pointsFromPrep(prep);
  const prepScriptures = Array.isArray(prep?.scriptures)
    ? prep.scriptures.filter((s) => typeof s === 'string' && s.trim()) : [];
  const prepActive = prepPoints.length > 0 || prepScriptures.length > 0;

  let points;
  let source;
  if (prepActive) {
    points = prepPoints;
    source = 'prep';
  } else {
    points = pointsFromHarvest(harvestRow);
    source = points.length ? 'harvest' : 'none';
    if (!points.length && transcriptText.trim()) {
      points = extractSermonPoints(transcriptText);
      if (points.length) source = 'transcript';
    }
  }

  // Roll up every distinct scripture: BG's prep list (his key text first) + the
  // anchor(s) named on the row + the ones attached to points and sub-points.
  // De-duped, order preserved.
  const anchor = extractScriptureRefs([sermon.scriptureRef, sermon.title]);
  const pointRefs = points.flatMap((p) => [...(p.scriptures || []), ...((p.subpoints || []).flatMap((s) => s.scriptures || []))]);
  const seen = new Set();
  const scriptures = [];
  for (const ref of [...(prepActive ? prepScriptures : []), ...anchor, ...pointRefs]) {
    const key = ref.toLowerCase();
    if (!seen.has(key)) { seen.add(key); scriptures.push(ref); }
  }

  if (!prepActive && !points.length && scriptures.length) source = 'title';
  return { points, scriptures, source, count: points.length };
}

// A flat searchable string for a video's points bundle — folded into the
// library search so "show me the one about X" matches a point's text or a
// scripture, not just the title. Kept tiny + deterministic.
export function pointsSearchText(bundle) {
  if (!bundle) return '';
  const pts = (bundle.points || []).map((p) => p.text).join(' ');
  const scr = (bundle.scriptures || []).join(' ');
  return `${pts} ${scr}`.trim();
}
