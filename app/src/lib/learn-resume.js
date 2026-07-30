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
//     step index, a timestamp). No PII, no content, no free text.
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
  const base = sameLesson ? prev : { stage: 0, step: 0 };
  const next = {
    courseKey: typeof patch.courseKey === 'string' && patch.courseKey ? patch.courseKey : (base.courseKey || (prev && prev.courseKey) || ''),
    lessonId: typeof patch.lessonId === 'string' && patch.lessonId ? patch.lessonId : (base.lessonId || ''),
    stage: patch.stage !== undefined ? idx(patch.stage) : idx(base.stage),
    step: patch.step !== undefined ? idx(patch.step) : idx(base.step),
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
