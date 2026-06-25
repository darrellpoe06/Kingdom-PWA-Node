// =============================================================================
// scripture-connections — the unifying "Logos-style" scripture connections ENGINE.
// (Darrell 2026-06-25.)
// =============================================================================
// Tap a verse -> the whole navigable web of how the Word connects to itself and to
// the life of the church: classic cross-references, the themes it sits in, the
// original-language word study, the verbatim text, and WHERE this passage already
// shows up in the church's own work (sermons / lessons / songs — the harvest).
//
// MODULAR BY COMPOSITION (the shared-primitives standard): this module invents no
// new data. It COMPOSES the verified sources that already exist —
//   • scriptures.js      — verbatim KJV/WEB text, the curated themes, and the
//                          theme-overlap cross-references (crossRefsFor).
//   • scripture-tsk.js   — public-domain Treasury of Scripture Knowledge cross-refs.
//   • scripture-strongs.js — the public-domain Strong's word study (derived index).
//   • study-edition.js   — the two-layer Scripture + clarification entry.
// — into ONE shape any surface can render. A new connection TYPE (e.g. a maps layer,
// a timeline) becomes one more field here + one more renderer; the contract holds.
//
// REAL DATA ONLY (DR-0076 reality-trace): every cross-ref resolves its real KJV text
// where the library carries it (`navigable: true`) and is otherwise marked link-out
// (never a painted verse). "Appearances" in sermons/lessons/songs are computed from
// REAL rows the caller injects (dependency injection — same pattern as the harvest
// ledger's buildLedger); with no rows injected, the section is honestly empty, not
// faked. Pure: no I/O, no Date.now — deterministic for tests.
// =============================================================================
import {
  normalizeRef, kjvText, webText, hasVerse, findByRef, crossRefsFor,
} from './scriptures.js';
import { tskRefsFor, TSK_LICENSE } from './scripture-tsk.js';
import { strongsForRef, STRONGS_LICENSE } from './scripture-strongs.js';
import { buildStudyEntry } from './study-edition.js';

const arr = (v) => (Array.isArray(v) ? v : []);

// -----------------------------------------------------------------------------
// Reference parsing — just enough to tell whether two references touch the same
// passage (book + chapter, optionally verse). Used for "appearances" matching so a
// sermon on "John 3:16-21" surfaces under John 3:16 without over-claiming.
// -----------------------------------------------------------------------------
export function parseRef(ref) {
  const s = normalizeRef(ref);
  // "1 John 4:9-10" -> book "1 John", chapter 4, verses 9..10
  const m = s.match(/^((?:[1-3]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) {
    // chapter-only ("John 3") still useful for book+chapter matching
    const c = s.match(/^((?:[1-3]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+)$/);
    if (c) return { book: c[1].trim().toLowerCase(), chapter: Number(c[2]), v1: null, v2: null, raw: s };
    return { book: s.toLowerCase(), chapter: null, v1: null, v2: null, raw: s };
  }
  const v1 = Number(m[3]);
  const v2 = m[4] ? Number(m[4]) : v1;
  return { book: m[1].trim().toLowerCase(), chapter: Number(m[2]), v1, v2, raw: s };
}

// Do two references touch the same passage? Same book+chapter is the floor; when
// both name verses, their verse ranges must overlap. A chapter-only ref matches any
// verse in that chapter. Honest, conservative (book-only never matches).
export function refsOverlap(a, b) {
  const x = parseRef(a);
  const y = parseRef(b);
  if (!x.book || !y.book || x.book !== y.book) return false;
  if (x.chapter == null || y.chapter == null) return false;
  if (x.chapter !== y.chapter) return false;
  if (x.v1 == null || y.v1 == null) return true; // chapter-level touch
  return x.v1 <= y.v2 && y.v1 <= x.v2;            // verse ranges overlap
}

// -----------------------------------------------------------------------------
// Cross-references — merge the two real sources into one ranked, de-duped list.
// TSK (the classic apparatus) leads; the theme-overlap links (the app's own
// curation) fill in and add the "why" (theme + role + gloss). Each entry carries
// where it came from and whether it is navigable in-app (has verbatim text here).
// -----------------------------------------------------------------------------
export function mergeCrossRefs(ref, opts = {}) {
  const limit = Number.isFinite(opts.limit) ? opts.limit : 14;
  const self = normalizeRef(ref);
  const seen = new Set([self]);
  const out = [];

  const push = (r, source, extra = {}) => {
    const key = normalizeRef(r);
    if (!key || seen.has(key)) {
      // already present — note the second source so a ref found BY BOTH is labeled so
      const existing = out.find((o) => o.ref === key);
      if (existing && !existing.sources.includes(source)) existing.sources.push(source);
      return;
    }
    seen.add(key);
    out.push({
      ref: key,
      sources: [source],
      navigable: hasVerse(key),
      kjv: kjvText(key),
      ...extra,
    });
  };

  // 1) Classic TSK cross-references (public domain), in TSK rank order.
  tskRefsFor(self).forEach((r) => push(r, 'tsk'));

  // 2) The app's theme-overlap cross-references (curated, with the connecting theme).
  crossRefsFor(self, 24).forEach((v) => push(v.ref, 'theme', {
    themeId: v.themeId, themeTitle: v.themeTitle, role: v.role, gloss: v.gloss,
  }));

  return out.slice(0, limit);
}

// -----------------------------------------------------------------------------
// Appearances — where this passage shows up in the church's REAL work. Caller
// injects rows (sermons with scriptureRef, lesson modules with anchor.ref, songs
// with scriptureRefs); we match on passage overlap. No rows -> empty, never faked.
// -----------------------------------------------------------------------------
function sermonRefs(s) {
  return [s.scriptureRef, s.scripture_ref].filter(Boolean);
}
function lessonRefs(m) {
  const a = m.anchor || {};
  // anchor.ref may be "Matthew 5:48; Genesis 17:1" — split on ; so each is matched
  return String(a.ref || m.scriptureRef || '').split(/[;,]/).map((x) => x.trim()).filter(Boolean);
}
function songRefs(g) {
  return arr(g.scriptureRefs).concat([g.scriptureRef].filter(Boolean));
}

function matchRows(ref, rows, getRefs, shape) {
  return arr(rows)
    .map((row) => {
      const refs = getRefs(row).filter((r) => refsOverlap(ref, r));
      return refs.length ? shape(row, refs) : null;
    })
    .filter(Boolean);
}

export function appearancesFor(ref, ctx = {}) {
  const sermons = matchRows(ref, ctx.sermons, sermonRefs, (s, refs) => ({
    id: s.id, title: s.title || 'Message', date: s.serviceDate || s.service_date || null,
    speaker: s.speaker || null, refs,
  }));
  const lessons = matchRows(ref, ctx.lessons, lessonRefs, (m, refs) => ({
    id: m.id, title: m.title || 'Lesson', refs,
  }));
  const songs = matchRows(ref, ctx.songs, songRefs, (g, refs) => ({
    id: g.id, title: g.title || 'Song', refs,
  }));
  return {
    sermons, lessons, songs,
    total: sermons.length + lessons.length + songs.length,
  };
}

// -----------------------------------------------------------------------------
// connectionsFor — the whole web for one reference, assembled. The single call a
// surface makes; everything below it is composed, verified, and honestly bounded.
// -----------------------------------------------------------------------------
export function connectionsFor(ref, ctx = {}) {
  const normalized = normalizeRef(ref);
  const studyEntry = buildStudyEntry(normalized); // verbatim text + clarification, or null
  const crossRefs = mergeCrossRefs(normalized, { limit: ctx.crossRefLimit });
  const themes = findByRef(normalized).map((v) => ({
    themeId: v.themeId, themeTitle: v.themeTitle, role: v.role, gloss: v.gloss,
  }));
  const wordStudy = strongsForRef(normalized);
  const appearances = appearancesFor(normalized, ctx);

  return {
    ref: normalized,
    text: {
      kjv: kjvText(normalized),
      web: webText(normalized),
      hasText: hasVerse(normalized),
    },
    themes,
    crossRefs,
    wordStudy,
    studyEdition: studyEntry,             // the two-layer Scripture + clarification
    appearances,                          // real harvest links (empty if none injected)
    counts: {
      crossRefs: crossRefs.length,
      navigableCrossRefs: crossRefs.filter((c) => c.navigable).length,
      themes: themes.length,
      wordStudy: wordStudy.length,
      appearances: appearances.total,
    },
    sources: { tsk: TSK_LICENSE, strongs: STRONGS_LICENSE },
  };
}

// -----------------------------------------------------------------------------
// relatedWeb — the navigable neighbours for graph-style exploration: the
// cross-references that are in-library (so they resolve to real text and can be
// tapped to recenter the web). The component walks this for "tap to follow".
// -----------------------------------------------------------------------------
export function relatedWeb(ref, ctx = {}) {
  const conn = connectionsFor(ref, ctx);
  const nodes = conn.crossRefs
    .filter((c) => c.navigable)
    .map((c) => ({ ref: c.ref, kjv: c.kjv, via: c.sources, themeTitle: c.themeTitle || null }));
  return { center: conn.ref, nodes, hasText: conn.text.hasText };
}
