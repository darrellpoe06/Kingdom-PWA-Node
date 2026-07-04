// =============================================================================
// bible-kjv — the WHOLE King James Version, hosted inside PoeTech (sovereign).
// =============================================================================
// Darrell 2026-07-04: "can you build a Logos type of Bible inside the PoeTech App
// so we can not need to link out to biblegateway?" The KJV (1611) is PUBLIC
// DOMAIN, so the full text lives in-app. This module is the resolver: it turns
// any reference into VERBATIM KJV text and powers the in-app reader — no external
// host, works offline once a book is cached.
//
// DATA (see scripts/fetch-full-kjv.mjs): the 66 books are per-book static assets
// under app/public/bible/kjv/<File>.json (fetched VERBATIM, whitespace-normalized
// only — DR-0076). The tiny navigation index (book -> chapter -> verse-count) is
// bundled from ./bible-kjv-index.json for an instant picker; the heavy book text
// LAZY-LOADS on demand and is cached in memory.
//
// PURE-ISH + fail-soft: parsing and metadata are pure; the only I/O is loadBook's
// same-origin fetch, which returns null on any error and never throws into the
// render. A fetcher can be injected for tests.
import BIBLE_INDEX from './bible-kjv-index.json';

export { BIBLE_INDEX };

// First 39 books are the Old Testament, last 27 the New (canonical KJV order).
export const OLD_TESTAMENT = BIBLE_INDEX.slice(0, 39);
export const NEW_TESTAMENT = BIBLE_INDEX.slice(39);

const normName = (s) => String(s || '').toLowerCase().replace(/[.\s]+/g, '');

// A few common ways people write a book that differ from the canonical name.
const ALIASES = {
  psalm: 'psalms', song: 'songofsolomon', songofsongs: 'songofsolomon',
  canticles: 'songofsolomon', revelations: 'revelation', ecclesiates: 'ecclesiastes',
};

// normalized(name|file|alias) -> index entry
const LOOKUP = (() => {
  const m = new Map();
  for (const b of BIBLE_INDEX) {
    m.set(normName(b.name), b);
    m.set(normName(b.file), b);
  }
  for (const [k, v] of Object.entries(ALIASES)) {
    const hit = m.get(normName(v));
    if (hit) m.set(normName(k), hit);
  }
  return m;
})();

export function bookMeta(nameOrFile) {
  return LOOKUP.get(normName(nameOrFile)) || null;
}

// "1 John 2:15", "John 3:16-18", "Song of Solomon 1:1", "Psalm 23:1", and (for a
// single-chapter book) "Jude 6" -> { book, file, chapter, v1, v2 } or null.
export function parseRef(ref) {
  const s = String(ref || '').trim();
  let m = s.match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/);
  if (m) {
    const book = bookMeta(m[1]);
    if (!book) return null;
    return { book: book.name, file: book.file, chapter: +m[2], v1: +m[3], v2: m[4] ? +m[4] : +m[3] };
  }
  // Single-chapter book written without a chapter, e.g. "Jude 6".
  m = s.match(/^(.+?)\s+(\d+)(?:\s*-\s*(\d+))?$/);
  if (m) {
    const book = bookMeta(m[1]);
    if (book && book.chapters.length === 1) {
      return { book: book.name, file: book.file, chapter: 1, v1: +m[2], v2: m[3] ? +m[3] : +m[2] };
    }
  }
  return null;
}

// --- Lazy per-book loading (the only I/O; fails soft) ------------------------

const BASE = (() => {
  try { return (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/'; }
  catch { return '/'; }
})();

let fetcher = (typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null;
// Test seam: inject a fetcher (or null to reset to the global).
export function __setBibleFetcher(fn) { fetcher = fn || ((typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null); }

const cache = new Map(); // file -> { name, chapters:[[text,...],...] }

export async function loadBook(nameOrFile) {
  const meta = bookMeta(nameOrFile);
  if (!meta) return null;
  if (cache.has(meta.file)) return cache.get(meta.file);
  if (!fetcher) return null;
  try {
    const res = await fetcher(`${BASE}bible/kjv/${meta.file}.json`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.chapters)) return null;
    cache.set(meta.file, data);
    return data;
  } catch {
    return null;
  }
}

// Verbatim KJV text for a reference (a range is joined by spaces), or '' if the
// ref is unparseable or the book/verse is missing.
export async function verseText(ref) {
  const p = parseRef(ref);
  if (!p) return '';
  const book = await loadBook(p.file);
  const ch = book && book.chapters[p.chapter - 1];
  if (!ch) return '';
  const parts = [];
  for (let v = p.v1; v <= p.v2; v += 1) {
    const t = ch[v - 1];
    if (t == null) return parts.join(' '); // stop at a gap rather than invent
    parts.push(t);
  }
  return parts.join(' ');
}

// The verses of a chapter as [{ v, text }], or [] on any miss. Powers the reader.
export async function chapterVerses(nameOrFile, chapter) {
  const book = await loadBook(nameOrFile);
  const ch = book && book.chapters[Number(chapter) - 1];
  if (!ch) return [];
  return ch.map((text, i) => ({ v: i + 1, text }));
}

// How many chapters a book has (from the bundled index; no fetch). 0 if unknown.
export function chapterCount(nameOrFile) {
  const meta = bookMeta(nameOrFile);
  return meta ? meta.chapters.length : 0;
}

// How many verses a given chapter has (from the index; no fetch). 0 if unknown.
export function verseCount(nameOrFile, chapter) {
  const meta = bookMeta(nameOrFile);
  return (meta && meta.chapters[Number(chapter) - 1]) || 0;
}
