// =============================================================================
// tlc-lesson-links — a link that serves ONE TLC lesson outside the app
// =============================================================================
// Darrell 2026-09-10: "how do we assign or share outside the app? Like a link
// to serve the lessons like the Love Corner App does... so people can taste
// and see what type of therapy and training TLC Therapy Solutions App has to
// offer."
//
// The Love Corner already does this (lib/lesson-links.js): a canonical URL for
// the exact lesson, read once on open, handed to the device's own share sheet.
// This is the SAME mechanism for TLC, on TLC's own door: the link carries the
// door marker (`tlc=1`), the course (a library course id or a lesson track
// key) and the lesson (a module id). The door reads it once at first render
// and SERVES that lesson to whoever opens it — signed in or not — as a taste
// of the therapy and training on offer; everything else (the office, hours,
// the SME gate, assignments) stays behind sign-in exactly as before.
//
// Pure and injectable: no window, no DOM — the links are built and asserted in
// a plain test, and a lesson that no longer exists resolves to null (the door
// then opens normally, never a dead screen).
// =============================================================================
import { CANONICAL_APP_ORIGIN } from './app-share.js';
import { TLC_APP_PATH } from './tlc-onboarding.js';
import { allTracks } from './tlc-lessons.js';
import { allCourses } from './tlc-training-library.js';
import { TLC_BRAND } from './tlc-practice.js';

// `word=1` rides along when the sharer had the Word open (Darrell 2026-09-10,
// sharing from his phone: "The link should be with or without the Word
// depending on if the Word is open"): the recipient's lesson opens the same
// way the sharer was reading it — the fold open, or plain. It opens ONE
// lesson's fold; it never flips the recipient's own page-wide switch.
export const TLC_LINK_PARAMS = Object.freeze({ door: 'tlc', course: 'course', lesson: 'lesson', word: 'word' });

/** The query string for one lesson (or a whole course / track when `lessonId` is omitted). */
export function tlcLessonQuery({ courseId, lessonId, word = false } = {}) {
  const c = String(courseId || '').trim();
  if (!c) return '';
  const parts = [`${TLC_LINK_PARAMS.door}=1`, `${TLC_LINK_PARAMS.course}=${encodeURIComponent(c)}`];
  const l = String(lessonId || '').trim();
  if (l) parts.push(`${TLC_LINK_PARAMS.lesson}=${encodeURIComponent(l)}`);
  if (l && word) parts.push(`${TLC_LINK_PARAMS.word}=1`);
  return `?${parts.join('&')}`;
}

/**
 * The full shareable URL, on the canonical origin and TLC's own installable
 * entry (`poetech.us/tlc/app/?tlc=1`, the same path the onboarding link uses,
 * DR-0344), injectable so a test builds it with no browser.
 */
export function tlcLessonUrl({ courseId, lessonId, word = false, origin = CANONICAL_APP_ORIGIN, path = TLC_APP_PATH } = {}) {
  const q = tlcLessonQuery({ courseId, lessonId, word });
  if (!q) return '';
  return `${origin || ''}${path || '/'}${q}`;
}

/** Read a lesson link back out of a query string. Tolerant; never throws. */
export function parseTlcLessonLink(search) {
  const out = { courseId: null, lessonId: null, word: false };
  try {
    const sp = new URLSearchParams(search || '');
    const c = (sp.get(TLC_LINK_PARAMS.course) || '').trim();
    const l = (sp.get(TLC_LINK_PARAMS.lesson) || '').trim();
    const w = sp.get(TLC_LINK_PARAMS.word);
    if (c) out.courseId = c;
    if (l) out.lessonId = l;
    out.word = !!l && w !== null && w !== '' && w !== '0';
  } catch (_) { /* malformed query -> nothing linked */ }
  return out;
}

// Which Learn audience serves a lesson track: the client and whole-situation
// tracks are the open (client) audience; the clinician track is the therapist
// audience; a library course is Training & Hours.
const AUDIENCE_FOR_SIDE = { client: 'client', whole: 'client', therapist: 'therapist' };

/**
 * Resolve a link against the MOUNTED curriculum. Returns
 *   { kind: 'track',   audience, track,  module|null, title }  for a lesson track, or
 *   { kind: 'library', audience, course, module|null, title }  for a library course,
 * or null when nothing matches — a stale link opens the door normally.
 * A lesson id alone (no course) is found by searching every track and course.
 */
export function resolveTlcLesson({ courseId, lessonId, word = false } = {}, { tracks = allTracks(), courses = allCourses() } = {}) {
  const c = String(courseId || '').trim();
  const l = String(lessonId || '').trim();
  const withWord = (r) => (r && r.module ? { ...r, word: !!word } : r);
  const byModule = (list) => (l ? list.find((m) => m.id === l) || null : null);
  const track = tracks.find((t) => t.key === c) || (l ? tracks.find((t) => (t.modules || []).some((m) => m.id === l)) : null);
  if (track) {
    const module = byModule(track.modules || []);
    if (l && !module) return null;
    return withWord({ kind: 'track', audience: AUDIENCE_FOR_SIDE[track.sideKey] || 'client', track, module, title: track.title, word: false });
  }
  const course = courses.find((x) => x.id === c) || (l ? courses.find((x) => (x.modules || []).some((m) => m.id === l)) : null);
  if (course) {
    const module = byModule(course.modules || []);
    if (l && !module) return null;
    return withWord({ kind: 'library', audience: 'training', course, module, title: course.title, word: false });
  }
  return null;
}

/** Every lesson id across the tracks and the library — a link must be unambiguous. */
export function everyTlcLessonId({ tracks = allTracks(), courses = allCourses() } = {}) {
  const ids = [];
  for (const t of tracks) for (const m of t.modules || []) ids.push(m.id);
  for (const c of courses) for (const m of c.modules || []) ids.push(m.id);
  return ids;
}

const line = (s) => String(s == null ? '' : s).trim();

/** What the share sheet gets for one lesson: short on purpose (a card, not a body). */
export function tlcLessonSharePayload(module, { url = '', courseTitle = '' } = {}) {
  const m = module || {};
  const title = line(m.title) || line(courseTitle) || 'A lesson from TLC Therapy Solutions';
  const idea = line(m.bigIdea);
  const from = line(courseTitle);
  const text = [idea, `— ${from ? `${from}, ` : ''}${TLC_BRAND.name}`].filter(Boolean).join('\n');
  return { title, text, url: String(url || '') };
}

/** What the share sheet gets for a whole course or track (the series, not one sitting). */
export function tlcCourseSharePayload(course, { url = '', lessonCount = 0 } = {}) {
  const c = course || {};
  const title = line(c.title) || 'A course from TLC Therapy Solutions';
  const blurb = line(c.description || c.purpose || c.blurb);
  const n = Number(lessonCount) || 0;
  const size = n > 0 ? `${n} lesson${n === 1 ? '' : 's'}, free to read` : 'Free to read';
  const text = [blurb, `${size} — ${TLC_BRAND.name}`].filter(Boolean).join('\n');
  return { title, text, url: String(url || '') };
}

/** The note a visitor reads above a lesson served by link. */
export const TLC_TASTE_NOTE = 'Shared with you from the TLC Therapy Solutions app: one lesson, free to read, so you can taste and see the kind of therapy and training we offer. Educational support only, not treatment or diagnosis.';
