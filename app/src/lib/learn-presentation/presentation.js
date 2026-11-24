// =============================================================================
// learn-presentation/presentation — the doorway in front of a lesson, never
// the lesson (Learn redesign, Phase 2)
// =============================================================================
// A presentation record sits BESIDE a lesson, keyed by its existing id:
//   { lessonId, courseKey, originalTitleAtApproval, displayTitle,
//     thumbHeadline, promoDescription, visual:{prompt,alt}, image, status,
//     featured }
// Rules this module enforces in code:
//   • Nothing here writes to a lesson. Every function reads; the lesson rows
//     can be deep-frozen and every call still works (tested).
//   • The ORIGINAL title is always the lesson's own `title`, read live. The
//     record's copy (`originalTitleAtApproval`) is only a drift check: if the
//     author retitles a lesson after a display title was approved, the record
//     is STALE and the lesson shows its original title until re-reviewed.
//   • A lesson with no usable record presents as it always has (its own
//     title). Missing presentation never hides a lesson.
//   • Popularity is never invented: there is no view, like or rating field,
//     and "Trending" is not offered without real engagement data.
// =============================================================================

import seed from './presentation-seed.json';
import { courseDepartment, departmentCode, lessonVersions } from '../learn-organize.js';
import { placeReached } from '../learn-resume.js';
import { lessonDuration, spokenMinutes, formatDuration } from '../course-duration.js';

/** The flag: off unless this device opted in (?learnStudio=1 / =0, remembered). */
export const STUDIO_FLAG_KEY = 'poe-learn-studio';
export function isLearnStudioOn({ search = null, storage = null } = {}) {
  let store = storage;
  try { if (!store && typeof window !== 'undefined') store = window.localStorage; } catch { store = null; }
  try {
    const q = search != null ? search : (typeof window !== 'undefined' && window.location ? window.location.search : '');
    const v = new URLSearchParams(q || '').get('learnStudio');
    if (v === '1' || v === '0') { try { store && store.setItem(STUDIO_FLAG_KEY, v); } catch { /* no storage */ } return v === '1'; }
  } catch { /* no URL */ }
  try { return !!store && store.getItem(STUDIO_FLAG_KEY) === '1'; } catch { return false; }
}

/** Statuses a learner may see. Draft and review stay in the admin dashboard. */
export const VISIBLE_STATUSES = Object.freeze(['approved', 'published']);

export function presentationIndex(records = seed.records) {
  const map = new Map();
  for (const r of Array.isArray(records) ? records : []) if (r && r.lessonId) map.set(r.lessonId, r);
  return map;
}

/**
 * How one lesson is presented. `preview` lets the prototype (and the admin
 * review screen) show records still in review; a learner build passes false.
 */
export function presentLesson(lesson, course, index, { preview = false } = {}) {
  if (!lesson || !lesson.id) return null;
  const original = typeof lesson.title === 'string' ? lesson.title : '';
  const rec = index && index.get(lesson.id);
  const visible = !!rec && (preview || VISIBLE_STATUSES.includes(rec.status));
  const stale = !!rec && rec.originalTitleAtApproval !== original;
  const usable = visible && !stale && typeof rec.displayTitle === 'string' && rec.displayTitle.trim();
  const courseKey = (course && (course.key || (course.meta && course.meta.key))) || null;
  return {
    lessonId: lesson.id,
    courseKey,
    courseTitle: (course && course.meta && course.meta.title) || courseKey || '',
    department: course ? courseDepartment(course) : '',
    originalTitle: original,
    displayTitle: usable ? rec.displayTitle : original,
    thumbHeadline: usable ? rec.thumbHeadline || '' : '',
    promoDescription: usable ? rec.promoDescription || '' : '',
    image: usable && rec.image && rec.image.src ? rec.image : null,
    imageAlt: usable && rec.visual ? rec.visual.alt || '' : '',
    hasPresentation: !!usable,
    stale,
    status: rec ? rec.status : null,
    featured: !!(usable && rec.featured),
    featuredOrder: usable && rec.featured ? Number(rec.featuredOrder) || 99 : null,
    code: course ? `${departmentCode(courseDepartment(course))}${lessonNumber(lesson, course) ?? ''}` : '',
    number: lessonNumber(lesson, course),
    duration: listenDuration(lesson),
    versions: lessonVersions(lesson),
    hasVideo: hasRealVideo(lesson),
  };
}

/** The lesson number a reader knows: the number in its id (ll338 → 338), else its place in the course. */
export function lessonNumber(lesson, course) {
  const m = /^[a-z]+(\d+)-/i.exec(String((lesson && lesson.id) || ''));
  if (m) return Number(m[1]);
  const list = (course && course.schedule) || [];
  const i = list.findIndex((x) => x && x.id === lesson.id);
  return i >= 0 ? i + 1 : null;
}

/** Spoken length at 1×, from the words the reader actually hears. Null when unknown. */
export function listenDuration(lesson) {
  try {
    const words = lessonDuration(lesson).spokenWords;
    return words > 0 ? formatDuration(spokenMinutes(words, 1)) : null;
  } catch { return null; }
}

/** A lesson is labeled as video only when it carries a playable video source. */
export function hasRealVideo(lesson) {
  const media = Array.isArray(lesson && lesson.media) ? lesson.media : [];
  return media.some((m) => m && /^(video|youtube)$/i.test(String(m.type || '')) && (m.src || m.url || m.youtubeId));
}

/** Every mounted lesson with its course, in authored order. */
export function allLessons(courses) {
  const out = [];
  for (const c of Array.isArray(courses) ? courses : []) for (const l of c.schedule || []) if (l && l.id) out.push({ lesson: l, course: c });
  return out;
}

// Discovery shelves group DEPARTMENTS; they never reorganize courses (spec §7).
// A department not listed here still appears in Explore by Topic.
export const SHELVES = Object.freeze([
  { id: 'faith', label: 'Grow Your Faith', departments: ['Living Lessons', 'The Word & The Way', 'The Eternal Algorithms'] },
  { id: 'wealth', label: 'Finance & Wealth', departments: ['Stock Market', 'Kingdom Life & Stewardship'] },
  { id: 'real-estate', label: 'Real Estate', departments: ['Real Estate'] },
  { id: 'business', label: 'Business & Leadership', departments: ['Business', 'Project Management'] },
  { id: 'tech', label: 'A.I. & Technology', departments: ['A.I. The Way', 'Development', 'Serve the House'] },
  { id: 'discover', label: 'History & Mathematics', departments: ['History', 'Mathematics'] },
]);

/** The home page, derived from the mounted catalog, the device's places and the record index. */
export function studioHome(courses, index, { places = [], progress = {}, preview = false } = {}) {
  const lessons = allLessons(courses).map(({ lesson, course }) => ({ lesson, course, p: presentLesson(lesson, course, index, { preview }) }));
  const presented = lessons.filter((x) => x.p.hasPresentation);
  const byId = new Map(lessons.map((x) => [`${x.p.courseKey}::${x.p.lessonId}`, x]));
  const featuredAll = presented.filter((x) => x.p.featured).sort((a, b) => a.p.featuredOrder - b.p.featuredOrder);
  const featured = featuredAll[0] || null;
  const continueLearning = (Array.isArray(places) ? places : [])
    .map((pl) => { const x = byId.get(`${pl.courseKey}::${pl.lessonId}`); return x ? { ...x, reached: placeReached(pl) } : null; })
    .filter(Boolean)
    .slice(0, 12);
  const recentlyAdded = presented
    .filter((x) => typeof x.lesson.added === 'string')
    .sort((a, b) => (b.lesson.added > a.lesson.added ? 1 : b.lesson.added < a.lesson.added ? -1 : 0))
    .slice(0, 12);
  const shelves = SHELVES.map((s) => ({ ...s, items: presented.filter((x) => s.departments.includes(x.p.department)) })).filter((s) => s.items.length);
  const deptMap = new Map();
  for (const x of lessons) {
    const d = x.p.department;
    if (!deptMap.has(d)) deptMap.set(d, { label: d, courses: new Set(), lessons: 0 });
    const e = deptMap.get(d);
    e.courses.add(x.p.courseKey);
    e.lessons += 1;
  }
  const topics = [...deptMap.values()].map((d) => ({ label: d.label, courses: d.courses.size, lessons: d.lessons })).sort((a, b) => b.lessons - a.lessons);
  const completed = Object.keys(progress || {}).filter((k) => progress[k]).length;
  return {
    featured,
    featuredAll,
    continueLearning,
    // No engagement data is mounted in Learn, so no "Trending" row is offered
    // (spec §7: never fabricate popularity). This row is labeled for what it is.
    discover: presented.filter((x) => !x.p.featured).slice(0, 12),
    recentlyAdded,
    shelves,
    topics,
    totals: { lessons: lessons.length, presented: presented.length, completed },
  };
}

/** Lessons whose display title, headline, description or original title match. Original titles always match. */
export function searchPresented(courses, index, query, { preview = false } = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  return allLessons(courses)
    .map(({ lesson, course }) => ({ lesson, course, p: presentLesson(lesson, course, index, { preview }) }))
    .filter(({ p }) => [p.originalTitle, p.displayTitle, p.thumbHeadline, p.promoDescription, p.courseTitle, p.department, p.number != null ? String(p.number) : ''].some((s) => String(s || '').toLowerCase().includes(q)));
}
