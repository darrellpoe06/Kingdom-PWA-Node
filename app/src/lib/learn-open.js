// =============================================================================
// learn-open — "take me to that lesson, at that sentence", from anywhere
// =============================================================================
// The Continue landing (DR-0631) lives inside the Learn tab: it opens a
// lesson's space at the saved part and step, scrolls the saved sentence under
// the pinned chrome, and marks it. The read-aloud mini-bar needs the same thing
// from any tab ("Show the text"), and must not fork it. This is the one door:
//
//   requestOpenLesson({ lessonId, sentence, sentenceKey, courseKey? })
//
// It writes the sentence into that lesson's OWN place record (learn-resume.js,
// the record the reader already writes), then posts a short-lived request.
// Learn takes it when it mounts, or at once if it is already on screen, and
// runs its own Continue path. It never switches the app's view (the shell owns
// that) and never touches audio — it only opens, scrolls and marks.
// =============================================================================
import { recordPlace, getPlaceFor } from './learn-resume.js';

/** How long a request waits for the Learn tab to mount before it lapses. */
export const OPEN_LESSON_MAX_AGE_MS = 15000;

let pending = null;
const subscribers = new Set();

function nowMs() { try { return Date.now(); } catch { return 0; } }

/**
 * Ask the Learn tab to open a lesson at a sentence. Returns false (and does
 * nothing) without a lesson id. `courseKey` may be omitted when the lesson
 * already has a place on this device; Learn resolves the course from its
 * mounted catalog otherwise.
 */
export function requestOpenLesson({ lessonId, sentence, sentenceKey, courseKey = null } = {}, opts = {}) {
  if (typeof lessonId !== 'string' || !lessonId) return false;
  const now = typeof opts.now === 'number' ? opts.now : nowMs();
  const own = getPlaceFor(courseKey, lessonId, opts);
  const course = courseKey || (own && own.courseKey) || null;
  if (course && (sentenceKey !== undefined || sentence !== undefined)) {
    recordPlace({
      courseKey: course,
      lessonId,
      ...(sentence !== undefined ? { sentence } : {}),
      ...(sentenceKey !== undefined ? { sentenceKey } : {}),
      started: true,
    }, { ...opts, now });
  }
  pending = { lessonId, courseKey: course, at: now };
  for (const fn of subscribers) { try { fn(pending); } catch { /* a listener's problem */ } }
  return true;
}

/** Take the waiting request, if it is still fresh; it is consumed either way. */
export function takeOpenLessonRequest(now = nowMs()) {
  const p = pending;
  pending = null;
  if (!p || now - p.at > OPEN_LESSON_MAX_AGE_MS) return null;
  return p;
}

/** Hear requests as they are made. Returns the unsubscribe. */
export function subscribeOpenLesson(fn) {
  if (typeof fn !== 'function') return () => {};
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}
