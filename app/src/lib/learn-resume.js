// =============================================================================
// learn-resume — the device-local "your place" record for the Learn space
// =============================================================================
// Darrell 2026-07-30 (from the live app, mid-lesson): "It's too easy to lose
// your place inside of the Learn space after starting one self-paced lesson."
// He was on step 2 of 6 of a paced Teach stage — and every layer of that place
// (active course, open lesson, arc stage, paced step) lived only in React
// state, so a reload, a tab away, or a course switch dropped him back at the
// top of the default course.
//
// This is the fix's spine: ONE small place record, written as the learner
// moves, read back to offer "Pick up where you left off" at the top of Learn.
//
// PRIVACY-FIRST, BY CONSTRUCTION (DATA-AS-EMPOWERMENT — same bright line as
// ux-signals.js, the sibling this is patterned on):
//   • Lives ONLY in this device's localStorage. Never sent to a server, never
//     aggregated, never joined to an account.
//   • Stores opaque KEYS + indexes only (course key, lesson id, stage index,
//     step index, sentence index, a timestamp). No PII, no content, no free text.
//   • THE SENTENCE IS STORED AS A HASH, NOT AS TEXT (2026-09-14). Darrell:
//     "Also need the lessons to begin exactly where they left off at least the
//     sentence." A sentence INDEX alone cannot do that safely: lessons re-pace
//     by age band and by time-fit, so index 14 of one rendering is a DIFFERENT
//     sentence in another, and resuming there would land in the wrong place
//     SILENTLY -- the worst kind of wrong for a place-keeper. So a short,
//     non-reversible fingerprint of the sentence rides along: resume matches
//     the FINGERPRINT (falling back to the index, then to the step), which
//     survives re-pacing. A hash is not content and cannot be read back into
//     the sentence, so the bright line above holds exactly as written.
//   • The user owns it: clearPlace() wipes it (the banner's "start fresh").
//   • Fail-soft: no window / blocked storage / bad JSON → readers return null
//     and writers no-op. It can never break a render.
//
// Pure over an injected `storage` + `now`, so the logic is unit-tested without
// a browser (DR-0076).
// =============================================================================

const KEY = 'poe-learn-place';

function defaultStorage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
}

function nowMs() {
  try { return Date.now(); } catch { return 0; }
}

// Clamp an index to a small non-negative integer; anything else reads as 0.
function idx(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 999) : 0;
}

// =============================================================================
// THE SENTENCE — a fingerprint, and how a saved one is found again
// =============================================================================
// Darrell 2026-09-14: "Also need the lessons to begin exactly where they left
// off at least the sentence."
//
// `step` (a paragraph) was as fine as this record went, so reopening a lesson
// restarted the paragraph you were in the middle of -- and on a long teaching
// paragraph, read aloud, that is most of a minute of hearing what you already
// heard. The sentence closes that.

/** Normalise a sentence so trivial rendering differences do not change its key. */
export function sentenceKeyOf(text) {
  const t = String(text == null ? '' : text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!t) return '';
  // FNV-1a, 32-bit, rendered base36. Short, stable across sessions, and NOT
  // reversible -- which is what lets a sentence be remembered without storing
  // any of its words (see the privacy bright line at the top of this file).
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i += 1) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * Find the saved sentence in a rendering of the lesson, most-trustworthy first.
 *
 * @param {string[]} sentences  the current rendering's sentences, in order.
 * @param {{sentence?:number, sentenceKey?:string}} place
 * @returns {{index:number, how:string}} `index` is -1 when nothing matched, and
 *   the caller must then fall back to the step rather than guess.
 *
 * Order matters and each step is a real guarantee:
 *   1. the index still holds the SAME sentence  -> exact, nothing moved;
 *   2. the fingerprint is found elsewhere       -> the lesson re-paced, and we
 *      follow the sentence rather than the number;
 *   3. no match                                 -> say so. A place-keeper that
 *      guesses is worse than one that admits it lost the thread, because the
 *      reader cannot tell a wrong resume from a right one.
 */
export function findSentence(sentences, place) {
  const list = Array.isArray(sentences) ? sentences : [];
  const want = place && typeof place.sentenceKey === 'string' ? place.sentenceKey : '';
  const at = place && Number.isFinite(Number(place.sentence)) ? Math.floor(Number(place.sentence)) : -1;

  if (!list.length) return { index: -1, how: 'no-sentences' };

  if (want && at >= 0 && at < list.length && sentenceKeyOf(list[at]) === want) {
    return { index: at, how: 'exact' };
  }
  if (want) {
    for (let i = 0; i < list.length; i += 1) {
      if (sentenceKeyOf(list[i]) === want) return { index: i, how: 'moved' };
    }
    return { index: -1, how: 'gone' };
  }
  // No fingerprint stored (a place written before this shipped). An index alone
  // is only trusted when it is in range; it is never extrapolated.
  if (at >= 0 && at < list.length) return { index: at, how: 'index-only' };
  return { index: -1, how: 'unknown' };
}

/**
 * Read the saved place, validated. Returns
 * `{ courseKey, lessonId, stage, step, at }` or null when nothing usable is
 * stored (missing, malformed, or not carrying both keys).
 */
export function getPlace(opts = {}) {
  const storage = opts.storage || defaultStorage();
  try {
    const raw = storage && storage.getItem(KEY);
    const p = raw ? JSON.parse(raw) : null;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    if (typeof p.courseKey !== 'string' || !p.courseKey) return null;
    if (typeof p.lessonId !== 'string' || !p.lessonId) return null;
    return {
      courseKey: p.courseKey,
      lessonId: p.lessonId,
      stage: idx(p.stage),
      step: idx(p.step),
      sentence: idx(p.sentence),
      sentenceKey: typeof p.sentenceKey === 'string' ? p.sentenceKey.slice(0, 16) : '',
      at: typeof p.at === 'number' ? p.at : 0,
    };
  } catch { return null; }
}

/**
 * Record (merge) the learner's place. A patch that names a DIFFERENT lesson
 * than the saved one resets stage/step to 0 unless the patch sets them —
 * a stale "step 5" must never leak into a freshly opened lesson.
 * @param {{courseKey?:string, lessonId?:string, stage?:number, step?:number}} patch
 */
export function recordPlace(patch, opts = {}) {
  const storage = opts.storage || defaultStorage();
  if (!storage || !patch || typeof patch !== 'object') return;
  const now = typeof opts.now === 'number' ? opts.now : nowMs();
  const prev = getPlace({ storage });
  const sameLesson = prev && (!patch.lessonId || patch.lessonId === prev.lessonId);
  const base = sameLesson ? prev : { stage: 0, step: 0, sentence: 0, sentenceKey: '' };
  const next = {
    courseKey: typeof patch.courseKey === 'string' && patch.courseKey ? patch.courseKey : (base.courseKey || (prev && prev.courseKey) || ''),
    lessonId: typeof patch.lessonId === 'string' && patch.lessonId ? patch.lessonId : (base.lessonId || ''),
    stage: patch.stage !== undefined ? idx(patch.stage) : idx(base.stage),
    step: patch.step !== undefined ? idx(patch.step) : idx(base.step),
    // A step move with no sentence named CLEARS the sentence rather than keeping
    // a stale one: the reader has left that sentence behind, and a leftover
    // fingerprint from the previous paragraph would resume in the wrong place.
    sentence: patch.sentence !== undefined ? idx(patch.sentence)
      : (patch.step !== undefined ? 0 : idx(base.sentence)),
    sentenceKey: patch.sentenceKey !== undefined ? String(patch.sentenceKey || '').slice(0, 16)
      : (patch.step !== undefined ? '' : (base.sentenceKey || '')),
    at: now,
  };
  if (!next.courseKey || !next.lessonId) return; // never store a half place
  try { storage.setItem(KEY, JSON.stringify(next)); } catch { /* quota / private mode — ignore */ }
}

/** The user's control: forget the saved place on this device. */
export function clearPlace(opts = {}) {
  const storage = opts.storage || defaultStorage();
  try { if (storage) storage.removeItem(KEY); } catch { /* ignore */ }
}

// =============================================================================
// TIME-FIT — how much time this person actually has
// =============================================================================
// Darrell 2026-08-10: "capable of being scaled down to the most minimal times
// and full lesson for those that have time all in the Ways!!!"
//
// DR-0215 already decided the curriculum ADJUSTS to the allotted time by PACING
// rather than cutting, and `reflowArcMinutes` has always been able to reflow the
// arc to any target. The gap was reach, not capability: the control sat inside
// the facilitator's run-of-show behind `isGovernor && showFacilitator`, so the
// learner with five minutes before work — the person the rule is FOR — could
// never touch it.
//
// This is the learner's own choice, remembered on their device with the same
// bright line as the place record above: an integer number of minutes, nothing
// else. No PII, never sent anywhere, fail-soft in every direction.
const TIME_KEY = 'poe-learn-timefit';

// The bounds the arc engine can honestly honour. 5 minutes is the shortest slot
// that can still carry all five arc stages as real (if brief) moments; 240 is
// reflowArcMinutes' own practical ceiling. Anything outside reads as "unset",
// which means the course's own session length — the behaviour before this
// existed, so an absent or corrupt value can never change a lesson.
export const TIME_FIT_MIN = 5;
export const TIME_FIT_MAX = 240;

/** The saved minutes for this device, or null when unset/unusable. */
export function getTimeFit(opts = {}) {
  const storage = opts.storage || defaultStorage();
  try {
    const raw = storage && storage.getItem(TIME_KEY);
    if (raw == null || raw === '') return null;
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < TIME_FIT_MIN || n > TIME_FIT_MAX) return null;
    return n;
  } catch { return null; }
}

/**
 * Remember how much time they have. Passing null / an out-of-range value CLEARS
 * it, which returns the lesson to the course's authored session length rather
 * than pinning it to a clamped number the person never chose.
 */
export function recordTimeFit(minutes, opts = {}) {
  const storage = opts.storage || defaultStorage();
  if (!storage) return;
  const n = Math.round(Number(minutes));
  try {
    if (!Number.isFinite(n) || n < TIME_FIT_MIN || n > TIME_FIT_MAX) storage.removeItem(TIME_KEY);
    else storage.setItem(TIME_KEY, String(n));
  } catch { /* quota / private mode — ignore */ }
}
