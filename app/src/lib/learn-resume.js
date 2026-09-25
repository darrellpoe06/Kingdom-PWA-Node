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
//
// ONE PLACE PER LESSON, NOT ONE PER DEVICE (2026-09-24, DR-0631). Darrell,
// from the live app: "Continuing a lesson doesn't work well... it needs to be
// way better." Measured in a real browser before this change: the record was
// ONE object per device, so starting a second lesson in another course
// silently overwrote the first — the reader who went back found no way to
// continue it anywhere, and the lesson reopened at part one. The record is now
// a small map keyed by course + lesson (`poe-learn-places`), newest first,
// capped, with `last` naming the lesson most recently touched. Every existing
// caller keeps its meaning: getPlace() is still "the place" (the most recent
// one), recordPlace() still merges, and the reader's sentence write still
// lands on the lesson it is reading. The old single key is migrated on first
// read and kept as a mirror of the latest place, so an older tab of the app
// open beside this one keeps working and its writes are picked up.
// The bright line above is unchanged: keys and indexes only, this device only.
// =============================================================================

const KEY = 'poe-learn-place';          // legacy single record — migrated, then mirrored
const MAP_KEY = 'poe-learn-places';     // { v, last, mirror, byLesson: { 'course::lesson': place } }
/** How many lessons' places a device keeps; the oldest untouched fall off first. */
export const PLACES_CAP = 60;

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

/** Validate one stored place into the shape every caller reads, or null. */
function normPlace(p) {
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
    // IF IT IS OVER, IT IS OVER (see finishPlace below). Absent in every
    // place written before this shipped, which reads as false — an old
    // record keeps resuming exactly as it did.
    done: p.done === true,
    // STARTED — the reader pressed Start/Continue/Play on this lesson, or
    // moved inside it. Merely glancing at a lesson's card (a title tap) is
    // not starting it, so a browse never shows up as "in progress" beside
    // the lessons a person is actually working through.
    started: p.started === true,
    at: typeof p.at === 'number' ? p.at : 0,
  };
}

/** The map key for one lesson's place. */
export function placeKey(courseKey, lessonId) {
  return `${String(courseKey || '')}::${String(lessonId || '')}`;
}

// Read the whole map, validated, with the legacy single record folded in.
// Never writes: a read that migrates would make every render a write.
function readMap(storage) {
  const empty = { v: 1, last: '', mirror: '', byLesson: {} };
  if (!storage) return empty;
  let map = empty;
  try {
    const raw = storage.getItem(MAP_KEY);
    const m = raw ? JSON.parse(raw) : null;
    if (m && typeof m === 'object' && !Array.isArray(m) && m.byLesson && typeof m.byLesson === 'object') {
      const byLesson = {};
      for (const [k, v] of Object.entries(m.byLesson)) {
        const p = normPlace(v);
        if (p && k === placeKey(p.courseKey, p.lessonId)) byLesson[k] = p;
      }
      map = {
        v: 1,
        last: typeof m.last === 'string' && byLesson[m.last] ? m.last : '',
        mirror: typeof m.mirror === 'string' ? m.mirror : '',
        byLesson,
      };
    }
  } catch { map = empty; }
  // THE OLD RECORD STILL COUNTS. A device upgraded from the one-place record
  // has it only under the legacy key; an older tab of the app still writes
  // there. Whenever the legacy key holds something this module did not write
  // itself (it differs from the mirror we last left there), it is the newest
  // word on where the reader is, so it is folded in and becomes the latest.
  try {
    const legacyRaw = storage.getItem(KEY);
    if (legacyRaw && legacyRaw !== map.mirror) {
      const lp = normPlace(JSON.parse(legacyRaw));
      if (lp) {
        const k = placeKey(lp.courseKey, lp.lessonId);
        // A record written before `started` existed was offered as THE place,
        // so it keeps being offered.
        map = { ...map, last: k, byLesson: { ...map.byLesson, [k]: { ...lp, started: true } } };
      }
    }
  } catch { /* a malformed legacy record is simply not a place */ }
  return map;
}

// Keep the map small: the current lesson always stays; started lessons are
// kept ahead of mere browses; newest first within each.
function pruneMap(map, cap = PLACES_CAP) {
  const entries = Object.entries(map.byLesson);
  if (entries.length <= cap) return map;
  entries.sort((a, b) => {
    if (a[0] === map.last) return -1;
    if (b[0] === map.last) return 1;
    if (a[1].started !== b[1].started) return a[1].started ? -1 : 1;
    return (b[1].at || 0) - (a[1].at || 0);
  });
  return { ...map, byLesson: Object.fromEntries(entries.slice(0, cap)) };
}

function writeMap(storage, map) {
  if (!storage) return;
  const pruned = pruneMap(map);
  const latest = pruned.last ? pruned.byLesson[pruned.last] : null;
  const mirror = latest ? JSON.stringify(latest) : '';
  try {
    storage.setItem(MAP_KEY, JSON.stringify({ v: 1, last: pruned.last, mirror, byLesson: pruned.byLesson }));
    if (mirror) storage.setItem(KEY, mirror);
    else storage.removeItem(KEY);
  } catch { /* quota / private mode — ignore */ }
}

/**
 * Read the saved place — the lesson most recently touched — validated.
 * Returns `{ courseKey, lessonId, stage, step, sentence, sentenceKey, done,
 * started, at }` or null when nothing usable is stored.
 */
export function getPlace(opts = {}) {
  const storage = opts.storage || defaultStorage();
  try {
    const map = readMap(storage);
    return map.last ? { ...map.byLesson[map.last] } : null;
  } catch { return null; }
}

/**
 * The saved place for ONE lesson (the thing a lesson's own space needs), or
 * null. `courseKey` may be omitted: lesson ids name one home (DR-0448), and the
 * most recent place with that id is the reader's.
 */
export function getPlaceFor(courseKey, lessonId, opts = {}) {
  if (!lessonId) return null;
  const storage = opts.storage || defaultStorage();
  try {
    const map = readMap(storage);
    if (courseKey) {
      const hit = map.byLesson[placeKey(courseKey, lessonId)];
      return hit ? { ...hit } : null;
    }
    let best = null;
    for (const p of Object.values(map.byLesson)) {
      if (p.lessonId === lessonId && (!best || p.at > best.at)) best = p;
    }
    return best ? { ...best } : null;
  } catch { return null; }
}

/** True when a place is a lesson the reader has begun and not finished. */
export function placeInProgress(place) {
  if (!place || place.done === true) return false;
  return place.started === true || place.stage > 0 || place.step > 0 || !!place.sentenceKey;
}

/**
 * Every saved place, newest first. `courseKey` narrows to one course;
 * `inProgress` keeps only lessons begun and not finished (what a Continue
 * offer lists).
 */
export function listPlaces(opts = {}) {
  const storage = opts.storage || defaultStorage();
  try {
    const map = readMap(storage);
    return Object.values(map.byLesson)
      .filter((p) => (!opts.courseKey || p.courseKey === opts.courseKey))
      .filter((p) => (!opts.inProgress || placeInProgress(p)))
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .map((p) => ({ ...p }));
  } catch { return []; }
}

/**
 * THE END IS NOT A PLACE TO RESUME FROM.
 *
 * Darrell 2026-09-16, from his phone at part 7/7 with the reader open: "can't
 * re-listen to the lesson after the lesson is over because it's allowing the
 * lesson to keep starting at the end because it thinks it's finished because
 * it's starting where it left off at. But if it's over, it's over. So it needs
 * to be able to recognize that the lesson was over and you want to re-listen
 * to the same freaking lesson, obviously."
 *
 * He is describing a real trap in this very record, and it was airtight: the
 * place stored where the reader last was and nothing else, so a lesson heard
 * to its final sentence saved that final sentence. The next press of Read this
 * lesson resolved the saved sentence, started there, spoke it, and stopped —
 * looking for all the world like a lesson that refused to play. Same for the
 * part pager, which reopened at the last stage.
 *
 * A finished reading now records `done`. Nothing else about the place changes,
 * so every surface that wants the detail still has it — but the two places
 * that decide WHERE TO BEGIN treat a finished lesson as a lesson to begin
 * again (lib/learn-resume.js is consulted by TTSControl's savedStartIndex and
 * by ChurchLearn's savedHere).
 *
 * Marked when the LAST sentence of the piece is spoken, which is the one
 * moment that means "heard to the end" without having to tell an ended read
 * apart from a Stop pressed on the final words. Either way the listener heard
 * it all, and either way the next start belongs at the top.
 */
export function finishPlace(patch = {}, opts = {}) {
  recordPlace({ ...patch, done: true }, opts);
}

/**
 * True when the saved place is a lesson that was heard to the end — so a
 * caller about to resume should start at the beginning instead. Takes the
 * place object (or null) rather than reading storage, so a component that
 * already has the place does not pay for a second parse.
 */
export function placeIsFinished(place) {
  return !!(place && place.done === true);
}

/**
 * Record (merge) the learner's place for ONE lesson and make it the latest.
 *
 * The patch names the lesson (`lessonId`, optionally `courseKey`); a patch
 * without one lands on the latest place — which is how the reader's sentence
 * write works, and why it guards on the lesson it is reading. The lesson's
 * OWN saved place is the base the patch merges into, so going back to a
 * lesson after another picks up that lesson's stage and step instead of
 * starting it over (the defect DR-0631 closes). A lesson with no saved place
 * starts at 0 — a stale "step 5" never leaks into a freshly opened lesson.
 * @param {{courseKey?:string, lessonId?:string, stage?:number, step?:number,
 *   sentence?:number, sentenceKey?:string, done?:boolean, started?:boolean}} patch
 */
export function recordPlace(patch, opts = {}) {
  const storage = opts.storage || defaultStorage();
  if (!storage || !patch || typeof patch !== 'object') return;
  const now = typeof opts.now === 'number' ? opts.now : nowMs();
  const map = readMap(storage);
  const latest = map.last ? map.byLesson[map.last] : null;
  const named = typeof patch.lessonId === 'string' && patch.lessonId ? patch.lessonId : '';
  const lessonId = named || (latest ? latest.lessonId : '');
  if (!lessonId) return; // never store a half place
  let courseKey = named && typeof patch.courseKey === 'string' && patch.courseKey ? patch.courseKey : '';
  if (!courseKey) {
    // No course named with the lesson: the lesson's own record knows it (a
    // stage move re-uses the course key without re-passing it), else the
    // latest place does.
    const own = named ? getPlaceFor(null, lessonId, { storage }) : latest;
    courseKey = (own && own.courseKey) || (latest ? latest.courseKey : '');
  }
  if (!courseKey) return;
  const k = placeKey(courseKey, lessonId);
  // A lesson with no record starts unfinished: `done` belongs to the lesson
  // that was heard, and must never carry onto the next one.
  const base = map.byLesson[k] || { stage: 0, step: 0, sentence: 0, sentenceKey: '', done: false, started: false };
  const moves = patch.stage !== undefined || patch.step !== undefined || patch.sentence !== undefined;
  const next = {
    courseKey,
    lessonId,
    stage: patch.stage !== undefined ? idx(patch.stage) : idx(base.stage),
    step: patch.step !== undefined ? idx(patch.step) : idx(base.step),
    // A step move with no sentence named CLEARS the sentence rather than keeping
    // a stale one: the reader has left that sentence behind, and a leftover
    // fingerprint from the previous paragraph would resume in the wrong place.
    sentence: patch.sentence !== undefined ? idx(patch.sentence)
      : (patch.step !== undefined ? 0 : idx(base.sentence)),
    sentenceKey: patch.sentenceKey !== undefined ? String(patch.sentenceKey || '').slice(0, 16)
      : (patch.step !== undefined ? '' : (base.sentenceKey || '')),
    // OVER stays over until the reader is somewhere again. Any patch that
    // MOVES the place (a stage, a step, a sentence) means a reading is under
    // way, so the finished flag clears itself — one press of Read this lesson
    // starts at the top, and the sentence it then stores resumes normally.
    // A patch that only re-names the lesson (opening it again) keeps the flag,
    // which is what lets the lesson space reopen at part one.
    done: patch.done !== undefined ? patch.done === true : (moves ? false : base.done === true),
    // Started is sticky for the lesson: once begun, a lesson stays begun until
    // it is finished or forgotten. Moving inside it is beginning it.
    started: patch.started === true || moves || base.started === true,
    at: now,
  };
  writeMap(storage, { ...map, last: k, byLesson: { ...map.byLesson, [k]: next } });
}

// REFRESH FIRST (Darrell 2026-09-15: "I like making sure they start where
// they left last time... so it can be a refresher if they wanted it"). A
// returning learner — a child especially — often wants the last few steps
// again before the new one. This backs the saved place up `back` paced steps
// inside the same stage and records it, so the ordinary resume then lands on
// the refresher instead of the frontier. At the first step of a stage it
// stays at step 0 (a stage is its own unit; the learner can still step back
// by hand). Returns the place it recorded, or null when there was nothing to
// resume. DR-0418. With `lessonId` (and optionally `courseKey`) it refreshes
// THAT lesson — the Continue offer names one per lesson; without, the latest.
export const REFRESH_BACK_STEPS = 2;
export function backUpPlace(place, back = REFRESH_BACK_STEPS) {
  if (!place || typeof place !== 'object' || !place.lessonId) return null;
  const n = Number.isFinite(back) && back > 0 ? Math.floor(back) : REFRESH_BACK_STEPS;
  return { ...place, step: Math.max(0, idx(place.step) - n), sentence: 0, sentenceKey: '' };
}
export function refreshPlace(opts = {}) {
  const storage = opts.storage || defaultStorage();
  const prev = opts.lessonId ? getPlaceFor(opts.courseKey || null, opts.lessonId, { storage }) : getPlace({ storage });
  const next = backUpPlace(prev, opts.back);
  if (!next) return null;
  recordPlace({ courseKey: next.courseKey, lessonId: next.lessonId, stage: next.stage, step: next.step, sentence: 0, sentenceKey: '', started: true }, { storage, now: opts.now });
  return getPlaceFor(next.courseKey, next.lessonId, { storage });
}

/**
 * The user's control: forget ONE lesson's place on this device (the Continue
 * offer's "Start fresh"). Every other lesson's place is untouched — starting
 * one lesson over must never cost the reader their place in another. When the
 * forgotten lesson was the latest, the next most recent becomes the latest.
 * With no lesson named it forgets the latest place (the original meaning).
 */
export function clearPlace(opts = {}) {
  const storage = opts.storage || defaultStorage();
  if (!storage) return;
  try {
    const map = readMap(storage);
    let k = map.last;
    if (opts.lessonId) {
      k = opts.courseKey
        ? placeKey(opts.courseKey, opts.lessonId)
        : (Object.keys(map.byLesson).find((key) => map.byLesson[key].lessonId === opts.lessonId) || '');
    }
    if (!k || !map.byLesson[k]) {
      // Nothing of ours to forget — but a legacy record the map never folded
      // in must still go, or "Start fresh" would appear to do nothing.
      if (!opts.lessonId) storage.removeItem(KEY);
      return;
    }
    const byLesson = { ...map.byLesson };
    delete byLesson[k];
    let last = map.last;
    if (last === k) {
      last = Object.keys(byLesson).sort((x, y) => (byLesson[y].at || 0) - (byLesson[x].at || 0))[0] || '';
    }
    writeMap(storage, { ...map, last, byLesson });
  } catch { /* ignore */ }
}

/** Forget every lesson's place on this device. */
export function clearAllPlaces(opts = {}) {
  const storage = opts.storage || defaultStorage();
  try { if (storage) { storage.removeItem(MAP_KEY); storage.removeItem(KEY); } } catch { /* ignore */ }
}

/**
 * "5 min ago" / "yesterday" — how long since a place was touched, in the
 * words a person uses. Pure; `now` is injectable. An unknown time says
 * nothing rather than something false.
 */
export function placeAgo(at, now = nowMs()) {
  const t = Number(at);
  if (!Number.isFinite(t) || t <= 0) return '';
  const min = Math.floor((now - t) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.floor(hr / 24);
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

/** "part 2, step 3" — where in the lesson, in the lesson's own words. */
export function placeWhere(place) {
  if (!place) return '';
  const part = `part ${idx(place.stage) + 1}`;
  return idx(place.step) > 0 ? `${part}, step ${idx(place.step) + 1}` : part;
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
