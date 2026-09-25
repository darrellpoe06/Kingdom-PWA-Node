// =============================================================================
// reader-bookmarks — where each reading was left, per lesson or page
// =============================================================================
// Darrell 2026-09-24: "start where I left off" in the player, and "starting at
// any chapter or step, not just beginning to end."
//
// learn-resume.js keeps ONE place: the lesson open last. That is right for
// "reopen the app where I was", and wrong for a listener who moves between two
// lessons, a Bible chapter and a page: each has its own place. This keeps a
// small bookmark per reading (keyed by the read target's owner), written by the
// reader as each sentence is reached:
//   { sentence, key, para, paras, at, done }
// sentence = absolute sentence index; key = the sentence's fingerprint (so a
// reworded lesson still finds its place, lib/learn-resume findSentence);
// para/paras = which paragraph of how many, for the "Resume · Paragraph N of M"
// button; done = heard to the end (the next start is the top).
//
// Bounded: at most MAX_BOOKMARKS readings, the oldest dropped first. Every
// storage call is guarded; a device that cannot store simply has no bookmarks.
// =============================================================================

export const BOOKMARKS_KEY = 'poe-reader-bookmarks';
export const MAX_BOOKMARKS = 200;

const defaultStorage = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; } };
const nat = (n) => (Number.isFinite(Number(n)) && Number(n) >= 0 ? Math.floor(Number(n)) : 0);

function readAll(storage) {
  try {
    const raw = storage && storage.getItem(BOOKMARKS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch (_) { return {}; }
}

function writeAll(storage, all) {
  try {
    const entries = Object.entries(all).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, MAX_BOOKMARKS);
    storage.setItem(BOOKMARKS_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (_) { /* full or blocked: no bookmark, never a throw */ }
}

/** The bookmark for one reading, or null. */
export function getBookmark(owner, { storage = defaultStorage() } = {}) {
  if (!owner || !storage) return null;
  const b = readAll(storage)[String(owner)];
  if (!b || typeof b !== 'object') return null;
  return { sentence: nat(b.sentence), key: String(b.key || ''), para: nat(b.para), paras: nat(b.paras), at: nat(b.at), done: !!b.done };
}

/** Record where a reading is. `done` is set when the last sentence is reached. */
export function saveBookmark(owner, { sentence, key = '', para = 0, paras = 0, done = false } = {}, { storage = defaultStorage(), now = Date.now() } = {}) {
  if (!owner || !storage) return;
  const all = readAll(storage);
  all[String(owner)] = { sentence: nat(sentence), key: String(key || ''), para: nat(para), paras: nat(paras), at: nat(now), done: !!done };
  writeAll(storage, all);
}

/** Forget one reading's place (Start over). */
export function clearBookmark(owner, { storage = defaultStorage() } = {}) {
  if (!owner || !storage) return;
  const all = readAll(storage);
  delete all[String(owner)];
  writeAll(storage, all);
}

/** Should the panel offer "Resume"? Only for a real place that is not the top and not finished. */
export function offersResume(b) {
  return !!(b && !b.done && (b.sentence > 0 || b.para > 0));
}

/** The words on the Resume button: "Resume · Paragraph 3 of 12". */
export function resumeLabel(b) {
  if (!b) return '';
  const n = (b.para || 0) + 1;
  return b.paras > 0 ? `Resume · Paragraph ${n} of ${b.paras}` : `Resume · Paragraph ${n}`;
}

/** Which paragraph (0-based) holds sentence `idx`, given the paragraph starts. */
export function paragraphOf(starts, idx) {
  if (!Array.isArray(starts) || !starts.length) return 0;
  let p = 0;
  for (let i = 0; i < starts.length; i++) { if (starts[i] <= idx) p = i; else break; }
  return p;
}

/** Short labels for a "Start at" picker: the first words of each paragraph. */
export function paragraphLabels(segments, starts, { words = 7 } = {}) {
  if (!Array.isArray(segments) || !Array.isArray(starts)) return [];
  return starts.map((s, i) => {
    const text = String((segments[s] && segments[s].text) || '').trim();
    const w = text.split(/\s+/).filter(Boolean);
    const head = w.slice(0, words).join(' ');
    return { index: i, sentence: s, label: `${i + 1}. ${head}${w.length > words ? '…' : ''}` };
  });
}
