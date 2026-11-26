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
import { closestToFinished } from '../lesson-progress.js';
import { lessonDuration, spokenMinutes, formatDuration } from '../course-duration.js';

/**
 * The flag: an explicit ?learnStudio=1/0 always wins and is remembered,
 * on any device, forever (web or native). With no explicit choice ever
 * made, `defaultOn` decides -- ChurchLearn passes the SAME isGovernor
 * signal that already gates every other owner-only panel in this file,
 * so the owner sees the preview on first open with no URL at all (the
 * native app shell has no address bar to type one into), while every
 * other member defaults off until the owner explicitly turns it on.
 */
export const STUDIO_FLAG_KEY = 'poe-learn-studio';
export function isLearnStudioOn({ search = null, storage = null, defaultOn = false } = {}) {
  let store = storage;
  try {
    if (!store && typeof window !== 'undefined') store = window.localStorage;
  } catch {
    store = null;
  }
  try {
    const q = search != null ? search : typeof window !== 'undefined' && window.location ? window.location.search : '';
    const v = new URLSearchParams(q || '').get('learnStudio');
    if (v === '1' || v === '0') {
      try {
        store && store.setItem(STUDIO_FLAG_KEY, v);
      } catch {
        /* no storage */
      }
      return v === '1';
    }
  } catch {
    /* no URL */
  }
  try {
    const remembered = store && store.getItem(STUDIO_FLAG_KEY);
    if (remembered === '1' || remembered === '0') return remembered === '1';
  } catch {
    /* no storage */
  }
  return defaultOn;
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
export function presentLesson(lesson, course, index, { preview = false, lite = false } = {}) {
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
    // `lite` skips the costly reads (spoken length, age-version measurement) for
    // lessons that are only counted or filtered, never drawn: measured 2026-11-24
    // at ~600ms per home render / per search keystroke over 994 lessons without it.
    duration: lite ? null : measured(lesson, 'duration', listenDuration),
    versions: lite ? [] : measured(lesson, 'versions', lessonVersions),
    hasVideo: lite ? false : measured(lesson, 'hasVideo', hasRealVideo),
  };
}

/**
 * A catalog SNAPSHOT (catalogSnapshot below) carries the three measurements the
 * doorway draws, taken by these same functions on the real lesson; a live lesson
 * is measured live. Same numbers either way, never invented.
 */
function measured(lesson, key, measure) {
  const m = lesson && lesson.presentedMeasure;
  return m && Object.prototype.hasOwnProperty.call(m, key) ? m[key] : measure(lesson);
}

/**
 * The catalog as the doorway needs it: every course and lesson id, title and date,
 * with the measurements pre-taken, and no lesson text (a 994-lesson catalog is ~40 MB
 * of text; this is what a page that only SHOWS the doorway has to carry).
 */
export function catalogSnapshot(courses) {
  return (Array.isArray(courses) ? courses : []).map((c) => ({
    key: c.key,
    meta: c.meta,
    schedule: (c.schedule || []).map((l) => ({
      id: l.id,
      title: l.title,
      ...(typeof l.added === 'string' ? { added: l.added } : {}),
      presentedMeasure: { duration: listenDuration(l), versions: lessonVersions(l), hasVideo: hasRealVideo(l) },
    })),
  }));
}

/** Upgrade a lite row to the full presentation (only for what is drawn). */
const full = (x, index, preview) => ({ ...x, p: presentLesson(x.lesson, x.course, index, { preview }) });

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
  } catch {
    return null;
  }
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

/**
 * Find and present ONE lesson anywhere in the full catalog, by id -- not only
 * among a home screen's curated picks (discover/featured/shelves), which a
 * link or an "open lesson X" request must not be limited to. Returns the same
 * { lesson, course, p } shape studioHome's lists use, or null.
 */
export function findPresentedLesson(courses, index, lessonId, { preview = false } = {}) {
  if (!lessonId) return null;
  const hit = allLessons(courses).find((x) => x.lesson.id === lessonId);
  if (!hit) return null;
  const p = presentLesson(hit.lesson, hit.course, index, { preview });
  if (!p) return null;
  return { ...hit, p };
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

/**
 * RELATIONSHIPS, IN ONE PLACE (Darrell 2026-11-26: "We need the relationships lessons in one
 * place... my wife says ladies will want those most"). Lessons carry no topic tags and
 * relationship teaching runs across courses, so this shelf is a hand-picked list of real lesson
 * ids, each read for marriage, love and hard conversations, family, or friendship (a lesson that
 * only mentions a wife or a marriage in passing is not on it). A test fails the build if any id
 * stops resolving to a mounted lesson. In reading order: marriage, love, family, friendship.
 */
export const RELATIONSHIP_LESSONS = Object.freeze([
  'll230-competence-before-submission-the-study-skills-and-doing-skills-of-a-wife-and-a-husband-with-the-word-answering-first',
  'll231-does-yahweh-rank-a-wife-over-a-woman-covenant-the-proverbs-31-woman-and-the-order-with-the-word-answering-first',
  'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works',
  'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover',
  'll121-know-your-own-post-her-provision-her-guard-and-the-beam-in-the-pointing-eye',
  'll115-meek-and-quiet-strength-the-ornament-of-great-price-and-why-jael-is-not-the-blueprint',
  'll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it',
  'll319-what-the-trust-could-not-keep',
  'll157-what-is-love-in-depth-and-in-range-action-based-word-first',
  'll167-be-a-g-about-it-execute-the-fourteen-love-verbs-high-or-low-because-it-is-not-about-how-you-feel',
  'll16-rule-your-spirit-repair-the-bond',
  'll291-fruits-meet-for-repentance',
  'll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it',
  'll46-ye-fathers-provoke-to-good-works',
  'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same',
  'll313-children-are-a-heritage-when-the-school-closes-the-house',
  'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools',
  'll205-talk-about-it-together-parents-children-friends-until-we-see-yahweh-has-been-right',
  'ea-gh-truth-love',
]);

/** The Relationships shelf: each listed lesson from the mounted catalog, in the list's order. Pure. */
export function relationshipShelf(courses, index, { preview = false } = {}) {
  const at = new Map(allLessons(courses).map((x) => [x.lesson.id, x]));
  return RELATIONSHIP_LESSONS.map((id) => at.get(id))
    .filter(Boolean)
    .map((x) => full(x, index, preview))
    .filter((x) => x.p);
}

/** The Explore-by-Topic shelf a department belongs to (its approved cover art). */
export function shelfForDepartment(department) {
  const s = SHELVES.find((x) => x.departments.includes(department));
  return s ? s.id : null;
}

/**
 * The headline on a TEMPORARY cover (a lesson still waiting for its own picture):
 * the record's own headline when it has one; else the title's main clause when it
 * is short; else the course title; else the first four words. Never invented copy.
 */
export function interimHeadline(p) {
  if (!p) return '';
  if (p.thumbHeadline) return p.thumbHeadline;
  const words = (t) =>
    String(t || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const main = words(String(p.displayTitle || p.originalTitle || '').split(/\s[—–-]\s|[:—–(]/)[0]);
  if (main.length && main.length <= 6) return main.join(' ');
  const course = words(p.courseTitle);
  if (course.length && course.length <= 5) return course.join(' ');
  return main.slice(0, 4).join(' ');
}

/** The home page, derived from the mounted catalog, the device's places and the record index. */
export function studioHome(courses, index, { places = [], allPlaces = null, progress = {}, preview = false } = {}) {
  const lessons = allLessons(courses).map(({ lesson, course }) => ({ lesson, course, p: presentLesson(lesson, course, index, { preview, lite: true }) }));
  const presented = lessons.filter((x) => x.p.hasPresentation).map((x) => full(x, index, preview));
  const byId = new Map(lessons.map((x) => [`${x.p.courseKey}::${x.p.lessonId}`, x]));
  const featuredAll = presented.filter((x) => x.p.featured).sort((a, b) => a.p.featuredOrder - b.p.featuredOrder);
  const featured = featuredAll[0] || null;
  const continueLearning = (Array.isArray(places) ? places : [])
    .map((pl) => {
      const x = byId.get(`${pl.courseKey}::${pl.lessonId}`);
      return x ? { ...full(x, index, preview), reached: placeReached(pl) } : null;
    })
    .filter(Boolean)
    .slice(0, 12);
  // CLOSEST TO FINISHED (DR-1684): every lesson begun and measured, short of
  // the end, furthest along first -- from every saved place, not only the
  // ones with a step to continue, so a lesson read in the Experience counts.
  const closest = closestToFinished(Array.isArray(allPlaces) ? allPlaces : places)
    .map(({ place, progress: pr }) => {
      const x = byId.get(`${place.courseKey}::${place.lessonId}`);
      return x ? { ...full(x, index, preview), reached: pr.fraction } : null;
    })
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
    closestToFinished: closest,
    // No engagement data is mounted in Learn, so no "Trending" row is offered
    // (spec §7: never fabricate popularity). This row is labeled for what it is.
    discover: presented.filter((x) => !x.p.featured).slice(0, 12),
    recentlyAdded,
    shelves,
    relationships: relationshipShelf(courses, index, { preview }),
    topics,
    totals: { lessons: lessons.length, presented: presented.length, completed },
  };
}

/** Lessons whose display title, headline, description or original title match. Original titles always match. */
export function searchPresented(courses, index, query, { preview = false } = {}) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return [];
  return allLessons(courses)
    .map(({ lesson, course }) => ({ lesson, course, p: presentLesson(lesson, course, index, { preview, lite: true }) }))
    .filter(({ p }) =>
      [p.originalTitle, p.displayTitle, p.thumbHeadline, p.promoDescription, p.courseTitle, p.department, p.number != null ? String(p.number) : ''].some((s) =>
        String(s || '')
          .toLowerCase()
          .includes(q)
      )
    )
    .slice(0, 200)
    .map((x) => full(x, index, preview));
}
