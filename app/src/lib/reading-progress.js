// =============================================================================
// reading-progress — how much of a lesson is left, counted in its own words (DR-1282)
// =============================================================================
// Darrell 2026-10-29: "I would also like to know what percentage of the lesson
// is left in each so that I and users can verify the full reading of each
// lesson..." Then: "Hopefully helps with the reader as well so it's timed
// perfectly with the words in each lesson no matter the speed..." And: "Or
// merged version of both so it can be accurate both ways..."
//
// WHAT IS COUNTED. Words, never steps or minutes. A step is a chunk of uneven
// length (the pacer cuts at sentence ends), and a minute depends on who is
// reading; a word is the same word for every reader at every speed. So the
// percentage is words read / the words of the version being read.
//
// TWO WITNESSES, ONE NUMBER. `seen` is the furthest fraction of the lesson's
// words that has been on screen (a block counts once its last line has been
// in view). `heard` is the furthest fraction the reader has spoken (sentences
// finished). Each only ever rises (a reader scrolling back up has still read
// what was below). The lesson's `reached` is the larger of the two, so reading
// it, hearing it, or any mix of both counts. Both are kept and both are shown,
// so either way can be checked against the other.
//
// TIME LEFT IS MEASURED, NOT ASSUMED (DR-0076 §4). The reader's pace in words a
// minute is taken from this reading at this speed: words spoken over time
// spent speaking them. A speed change or a pause starts the measure again, and
// until enough has been heard to measure, no minutes are shown at all.
//
// WHOSE IT IS (DATA-AS-EMPOWERMENT). The marks live in the lesson's own saved
// place on this device (lib/learn-resume.js), beside the step it already
// keeps: no new stream, nothing sent anywhere, and Start over clears them with
// the place. It is a reader's own check on a reading, never a streak.
// =============================================================================

/** The words in a string, counted the way a reader would: runs of non-space. */
export function countWords(text) {
  const s = String(text || '').trim();
  if (!s) return 0;
  return s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** The words in texts[0 .. index-1], i.e. everything BEFORE `index`. */
export function wordsBefore(texts, index) {
  const list = Array.isArray(texts) ? texts : [];
  const end = Math.max(0, Math.min(list.length, Number(index) || 0));
  let n = 0;
  for (let i = 0; i < end; i += 1) n += countWords(typeof list[i] === 'string' ? list[i] : list[i] && list[i].text);
  return n;
}

/** The total words in a list of texts (strings or `{ text }`). */
export function wordsIn(texts) {
  return wordsBefore(texts, Array.isArray(texts) ? texts.length : 0);
}

/** A fraction 0..1, safe against a zero or missing total. */
export function fractionOf(read, total) {
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Math.max(0, Math.min(1, (Number(read) || 0) / t));
}

function clamp01(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

/**
 * Whole percent LEFT. Never rounds a lesson to "0% left" before its last word:
 * 0 is said only when everything has been read.
 */
export function percentLeft(fraction) {
  const f = clamp01(fraction);
  if (f >= 1) return 0;
  return Math.max(1, 100 - Math.floor(f * 100));
}

/** Whole percent READ, floored, so 100 is said only at the end. */
export function percentRead(fraction) {
  return 100 - percentLeft(fraction);
}

/** "62% left", or "all read" at the end. */
export function leftLabel(fraction) {
  const left = percentLeft(fraction);
  return left === 0 ? 'all read' : `${left}% left`;
}

/**
 * The share of a laid-out text that has been on screen. `blocks` are the
 * text's blocks in order, each `{ words, bottom }` (bottom in viewport px); a
 * block counts once its bottom edge is within the viewport (`viewBottom`).
 */
export function seenFraction(blocks, viewBottom) {
  const list = Array.isArray(blocks) ? blocks : [];
  let all = 0;
  let seen = 0;
  for (const b of list) {
    const w = Math.max(0, Number(b && b.words) || 0);
    all += w;
    if (Number(b && b.bottom) <= viewBottom) seen += w;
  }
  return all > 0 ? seen / all : 0;
}

/** Merge two witnesses: each ratchets, and the lesson's mark is the larger. */
export function mergeWitness(prev = {}, next = {}) {
  const p = prev || {};
  const n = next || {};
  const seen = Math.max(clamp01(p.seen), clamp01(n.seen));
  const heard = Math.max(clamp01(p.heard), clamp01(n.heard));
  return { seen, heard, reached: Math.max(seen, heard) };
}

/** "seen 40% · heard 62%" — both witnesses, only the ones that have spoken. */
export function witnessLabel({ seen = 0, heard = 0 } = {}) {
  const parts = [];
  if (seen > 0) parts.push(`seen ${percentRead(seen)}%`);
  if (heard > 0) parts.push(`heard ${percentRead(heard)}%`);
  return parts.join(' · ');
}

// ---------------------------------------------------------------------------
// The reader's measured pace
// ---------------------------------------------------------------------------

/** Below these, the pace is not yet measured and no minutes are claimed. */
export const PACE_MIN_WORDS = 30;
export const PACE_MIN_MS = 8000;
/** A gap this long between two marks is a pause, not speech: the measure restarts. */
export const PACE_GAP_MS = 20000;

/**
 * A pace meter for one reading. `mark(wordsAt, now, rate)` is called as the
 * reader moves (wordsAt = words spoken so far); it returns words a minute
 * once measured, else null. A new rate, a jump backwards, or a long gap
 * restarts the measure, so the minutes always describe THIS speed.
 */
export function createPaceMeter() {
  let start = null;
  let last = null;
  return {
    mark(wordsAt, now, rate) {
      const w = Number(wordsAt) || 0;
      const t = Number(now) || 0;
      const r = Number(rate) || 1;
      const restart = !start || r !== start.rate || w < last.words || (t - last.at) > PACE_GAP_MS;
      if (restart) {
        start = { words: w, at: t, rate: r };
        last = { words: w, at: t };
        return null;
      }
      last = { words: w, at: t };
      const words = w - start.words;
      const ms = t - start.at;
      if (words < PACE_MIN_WORDS || ms < PACE_MIN_MS) return null;
      return (words / ms) * 60000;
    },
    reset() { start = null; last = null; },
  };
}

/** Minutes left at a measured pace, rounded up; null when the pace is unknown. */
export function minutesLeft(wordsLeft, wpm) {
  const w = Number(wordsLeft) || 0;
  const p = Number(wpm) || 0;
  if (p <= 0) return null;
  if (w <= 0) return 0;
  return Math.max(1, Math.ceil(w / p));
}

/** "about 6 min left at 1.5×", "under a minute left at 1.0×", or '' when unmeasured. */
export function timeLeftLabel(mins, rate) {
  if (mins == null) return '';
  const r = `${(Number(rate) || 1).toFixed(1)}×`;
  if (mins <= 1) return `under a minute left at ${r}`;
  return `about ${mins} min left at ${r}`;
}

// ---------------------------------------------------------------------------
// The reader tells the lesson (one event, so neither imports the other)
// ---------------------------------------------------------------------------

export const READER_PROGRESS_EVENT = 'poe:reader-progress';

/** The reader announces where it is in what it is reading. */
export function announceReaderProgress(detail) {
  if (typeof window === 'undefined' || !detail) return;
  try { window.dispatchEvent(new CustomEvent(READER_PROGRESS_EVENT, { detail })); } catch (_) { /* no CustomEvent */ }
}
