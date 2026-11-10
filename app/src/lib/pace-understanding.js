// =============================================================================
// pace-understanding — your paces, and whether speed helps or hurts understanding (DR-1386)
// =============================================================================
// Darrell, 2026-11-10: "Give the reader their reader vs reading paces... if
// they are measuring accurately... and users want that", then "Can we see if we
// improve or reduce our comprehension based on the speed of the data being
// consumed?"
//
// TWO PACES, EACH MEASURED, NEVER ASSUMED (DR-0076 §4).
//   EYES   the words credited as seen over the time spent seeing them. Each
//          rise of the seen witness adds its words and the time since the last
//          rise, a gap counted to at most PAUSE_MS (time to think is reading
//          time; a tab left open is not). Shown only once ACCURATE: at least
//          MIN_WORDS over MIN_MS. A reading held at the grace ceiling
//          (test-integrity GRACE_WPM) is marked "beyond grace", because its
//          true pace is faster than the measure can see.
//   EARS   the read-aloud's own measured words a minute at its speed
//          (lib/reading-progress.js), kept as last measured for the lesson.
//
// PACE AND UNDERSTANDING. Each exam attempt is kept with the pace the lesson
// was taken in at that moment. FIRST tries only are compared (a retake has
// seen the answers), grouped into pace bands; a band speaks only with
// BAND_MIN first tries in it, and a finding needs two such bands. Until then
// the view says how many more it needs. Nothing is painted.
//
// WHOSE IT IS. Kept on this device only, shown only when the learner turns it
// on (SHOW_KEY). Never a ranking, never a streak; a reader's own mirror.
// =============================================================================

const STORE_KEY = 'poe:reading-pace:v1';
const SHOW_KEY = 'poe:show-paces:v1';
export const PAUSE_MS = 60000;
export const MIN_WORDS = 150;
export const MIN_MS = 30000;
export const BAND_MIN = 3;
const MAX_ATTEMPTS = 300;

/** The pace bands, in words a minute. Slow to fast. */
export const PACE_BANDS = [
  { id: 'unhurried', label: 'under 150 words a minute', lo: 0, hi: 150 },
  { id: 'steady', label: '150 to 250 words a minute', lo: 150, hi: 250 },
  { id: 'brisk', label: '250 to 400 words a minute', lo: 250, hi: 400 },
  { id: 'fast', label: '400 words a minute or more', lo: 400, hi: Infinity },
];

function storage(opts) {
  if (opts && opts.storage) return opts.storage;
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch (_) {
    return null;
  }
}

function read(opts) {
  const s = storage(opts);
  if (!s) return { byLesson: {}, attempts: [] };
  try {
    const v = JSON.parse(s.getItem(STORE_KEY) || 'null');
    if (!v || typeof v !== 'object') return { byLesson: {}, attempts: [] };
    return { byLesson: v.byLesson && typeof v.byLesson === 'object' ? v.byLesson : {}, attempts: Array.isArray(v.attempts) ? v.attempts : [] };
  } catch (_) {
    return { byLesson: {}, attempts: [] };
  }
}

function write(v, opts) {
  const s = storage(opts);
  if (!s) return;
  try {
    s.setItem(STORE_KEY, JSON.stringify(v));
  } catch (_) {
    /* full or blocked: the mirror is optional */
  }
}

const num = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/** One rise of the seen witness: `words` newly credited at time `at`; `capped` when held at the grace ceiling. */
export function noteSeenRise(lessonId, { words = 0, at = Date.now(), capped = false } = {}, opts = {}) {
  if (!lessonId || !(num(words) > 0)) return;
  const v = read(opts);
  const e = v.byLesson[lessonId] || {};
  const gap = Number.isFinite(e.lastAt) ? Math.min(PAUSE_MS, Math.max(0, at - e.lastAt)) : 0;
  v.byLesson[lessonId] = {
    ...e,
    // The first rise starts the clock; its words have no time behind them yet.
    words: num(e.words) + (Number.isFinite(e.lastAt) ? num(words) : 0),
    ms: num(e.ms) + gap,
    lastAt: at,
    capped: !!(e.capped || capped),
  };
  write(v, opts);
}

/** The read-aloud's measured pace for the lesson (words a minute at `rate`). */
export function noteEarsPace(lessonId, wpm, rate = 1, opts = {}) {
  if (!lessonId || !(num(wpm) > 0)) return;
  const v = read(opts);
  const e = v.byLesson[lessonId] || {};
  const r = Math.round(num(wpm));
  if (e.earsWpm === r && e.rate === num(rate)) return;
  v.byLesson[lessonId] = { ...e, earsWpm: r, rate: num(rate) || 1 };
  write(v, opts);
}

/** The eyes' pace for one lesson: { wpm, words, ms, accurate, beyondGrace }. */
export function eyesPace(lessonId, opts = {}) {
  const e = read(opts).byLesson[lessonId] || {};
  const words = num(e.words);
  const ms = num(e.ms);
  const accurate = words >= MIN_WORDS && ms >= MIN_MS;
  return { wpm: accurate ? Math.round((words / ms) * 60000) : null, words: Math.round(words), ms, accurate, beyondGrace: !!e.capped };
}

/** The read-aloud's last measured pace for one lesson: { wpm, rate } or null. */
export function earsPace(lessonId, opts = {}) {
  const e = read(opts).byLesson[lessonId] || {};
  return num(e.earsWpm) > 0 ? { wpm: num(e.earsWpm), rate: num(e.rate) || 1 } : null;
}

/** Keep one exam attempt with the pace the lesson was taken in. Returns the kept attempt. */
export function recordPacedAttempt({ lessonId, at, pct, passed } = {}, opts = {}) {
  if (!lessonId) return null;
  const v = read(opts);
  const eyes = eyesPace(lessonId, opts);
  const ears = earsPace(lessonId, opts);
  const kept = {
    lessonId,
    at: at || new Date().toISOString(),
    pct: num(pct),
    passed: !!passed,
    firstTry: !v.attempts.some((a) => a && a.lessonId === lessonId),
    eyesWpm: eyes.accurate && !eyes.beyondGrace ? eyes.wpm : null,
    earsWpm: ears ? ears.wpm : null,
  };
  write({ ...v, attempts: [...v.attempts, kept].slice(-MAX_ATTEMPTS) }, opts);
  return kept;
}

export function pacedAttempts(opts = {}) {
  return read(opts).attempts;
}

/** The pace an attempt's lesson was taken in: the eyes when measured, else the ears. */
export function attemptPace(a) {
  if (!a) return null;
  if (num(a.eyesWpm) > 0) return { wpm: num(a.eyesWpm), by: 'reading' };
  if (num(a.earsWpm) > 0) return { wpm: num(a.earsWpm), by: 'listening' };
  return null;
}

/**
 * First-try understanding by pace band, and a finding only when the data
 * holds one: { bands: [{id,label,n,meanPct,passed}], measured, finding }.
 * `finding` is null until two bands each hold BAND_MIN first tries; then it
 * names the band with the higher mean and the one with the lower.
 */
export function paceVsUnderstanding(attempts = []) {
  const firsts = (Array.isArray(attempts) ? attempts : []).filter((a) => a && a.firstTry && attemptPace(a));
  const bands = PACE_BANDS.map((b) => {
    const inB = firsts.filter((a) => {
      const w = attemptPace(a).wpm;
      return w >= b.lo && w < b.hi;
    });
    const n = inB.length;
    return {
      id: b.id,
      label: b.label,
      n,
      meanPct: n ? Math.round(inB.reduce((t, a) => t + num(a.pct), 0) / n) : null,
      passed: inB.filter((a) => a.passed).length,
    };
  });
  const ready = bands.filter((b) => b.n >= BAND_MIN);
  let finding = null;
  if (ready.length >= 2) {
    const sorted = [...ready].sort((a, b) => b.meanPct - a.meanPct);
    const hi = sorted[0];
    const lo = sorted[sorted.length - 1];
    finding = hi.meanPct === lo.meanPct ? { same: true, hi, lo } : { same: false, hi, lo };
  }
  return { bands, measured: firsts.length, finding };
}

/** The sentence the view shows: what the data says, or what it still needs. */
export function paceFindingLine(r) {
  if (!r) return '';
  if (!r.finding) {
    const ready = r.bands.filter((b) => b.n >= BAND_MIN).length;
    return `Not enough yet to say: ${r.measured} first ${r.measured === 1 ? 'try' : 'tries'} with a measured pace. It speaks once two paces each hold ${BAND_MIN} first tries (${ready} of 2 so far).`;
  }
  const { hi, lo, same } = r.finding;
  if (same) return `So far your first tries score the same, ${hi.meanPct}%, at ${hi.label} and at ${lo.label}.`;
  return `So far your first tries score higher at ${hi.label} (${hi.meanPct}% across ${hi.n}) than at ${lo.label} (${lo.meanPct}% across ${lo.n}).`;
}

/** Does this learner want to see their paces? Off until they turn it on. */
export function getShowPaces(opts = {}) {
  const s = storage(opts);
  try {
    return !!(s && s.getItem(SHOW_KEY) === '1');
  } catch (_) {
    return false;
  }
}

export function setShowPaces(on, opts = {}) {
  const s = storage(opts);
  try {
    if (s) {
      if (on) s.setItem(SHOW_KEY, '1');
      else s.removeItem(SHOW_KEY);
    }
  } catch (_) {
    /* blocked: stays off */
  }
}
