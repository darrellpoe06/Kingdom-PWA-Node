// =============================================================================
// bible-place — the Bible keeps its place on this device
// =============================================================================
// Darrell 2026-11-26, from the Church > Scripture tab: "the Bible should stay at
// the last location that it was at, that you were using it. So that way you
// don't have to go back and then jump back to where you were already at. It
// should keep its locations."
//
// Measured before this module (vite dev, Chromium, 412px): read John 3 down to
// verse 16, tap another tab, tap Bible again -> Genesis 1, verse 1. Reload ->
// Genesis 1. The reader held book, chapter and verse only in React state, so
// every remount started over. (The edition was already remembered, per device,
// by bible-kjv.js rememberReaderEdition; it is not duplicated here.)
//
// ONE place for every door into the Bible: the Church Scripture tab, the
// bottom-bar Bible button, the Institute / Love Corner / Kids "Scripture" tiles
// all mount the one BibleReader, which reads and writes this one record.
// A deliberate jump (a lesson's timeline link naming a book, a cross-reference,
// a typed reference) opens where it was sent and THEN becomes the place.
//
// SAME PRIVACY POSTURE AS lib/learn-resume.js: this device's localStorage only,
// never sent anywhere, ids and indexes only (book name from the fixed 66-book
// index, chapter number, verse number, a timestamp). No verse text, no notes.
// Fail-soft: no window, blocked storage or bad JSON -> read returns null and
// writes no-op. Pure over an injected `store` + `now` so it is unit-tested
// without a browser (DR-0076).
// =============================================================================

import { chapterCount, verseCount } from './bible-kjv.js';

export const BIBLE_PLACE_KEY = 'poetech.bible.place';

function storeOrNull() {
  try { return (typeof window !== 'undefined' && window.localStorage) || null; } catch (_) { return null; }
}

const posInt = (n) => (Number.isInteger(n) && n > 0 ? n : null);

/**
 * A place is kept only when it names a real book, a chapter that book has, and
 * (optionally) a verse that chapter has. Anything else is not a place: it is
 * dropped rather than half-honoured, so a stale or tampered record can never
 * land the reader on a chapter that does not exist.
 */
export function normalizePlace(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const book = typeof raw.book === 'string' ? raw.book : '';
  const chapters = book ? chapterCount(book) : 0;
  const chapter = posInt(raw.chapter);
  if (!chapters || !chapter || chapter > chapters) return null;
  let verse = posInt(raw.verse);
  if (verse) {
    const vs = verseCount(book, chapter);
    if (vs && verse > vs) verse = null;
  }
  return { book, chapter, verse: verse || null };
}

/** The remembered place, or null (none yet, unreadable, or not a real place). */
export function readBiblePlace(store = storeOrNull()) {
  try {
    if (!store) return null;
    const s = store.getItem(BIBLE_PLACE_KEY);
    if (!s) return null;
    const p = normalizePlace(JSON.parse(s));
    return p;
  } catch (_) { return null; }
}

/** Remember the place. Returns what was kept (null when it was not a place). */
export function saveBiblePlace(place, store = storeOrNull(), now = Date.now()) {
  const p = normalizePlace(place);
  if (!p) return null;
  try {
    if (store) store.setItem(BIBLE_PLACE_KEY, JSON.stringify({ v: 1, ...p, at: now }));
  } catch (_) { /* a blocked store never breaks the reader */ }
  return p;
}

/** Forget the place (the reader's "Start at Genesis 1"). */
export function clearBiblePlace(store = storeOrNull()) {
  try { if (store) store.removeItem(BIBLE_PLACE_KEY); } catch (_) { /* noop */ }
}

/**
 * Where the reader opens, in order:
 *   1. a deliberate jump (`jump` — e.g. a lesson's timeline link naming a book):
 *      it opens there, and becomes the new place;
 *   2. the remembered place on this device;
 *   3. Genesis 1, the start.
 * `restored` is true only for (2), so the reader can say it picked up a place.
 */
export function openingPlace({ jump = null, saved = null } = {}) {
  const j = normalizePlace(jump);
  if (j) return { ...j, restored: false };
  const s = normalizePlace(saved);
  if (s) return { ...s, restored: true };
  return { book: 'Genesis', chapter: 1, verse: null, restored: false };
}

/**
 * Which verse is the reader on? The first verse row whose bottom edge is below
 * the reading line. The reader uses the middle of the screen and lands a verse
 * centred, so a landing reads back as the same verse whatever the height of
 * the app's sticky header. `rows` is a list of { v, top, bottom } in viewport
 * pixels, in page order. Null when the first verse is still below the line.
 */
export function verseAtLine(rows, line) {
  const list = (rows || []).filter((r) => r && Number.isFinite(r.top) && Number.isFinite(r.bottom));
  // The chapter has not reached the line yet (the reader is above its first
  // verse): the place is the chapter itself, no verse.
  if (!list.length || list[0].top > line) return null;
  for (const r of list) {
    if (r.bottom > line) return posInt(r.v);
  }
  return null;
}
