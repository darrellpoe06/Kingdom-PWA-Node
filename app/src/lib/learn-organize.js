// =============================================================================
// learn-organize — the Learn catalog, findable (Darrell 2026-07-10: "can we
// better organize the learn lessons with sorts and dropdowns etc")
// =============================================================================
// 18 courses · 200+ lessons had ONE affordance: a wall of stacked buttons the
// reader scrolls past before any content. This module is the pure organizing
// layer under the picker: grouped for a native dropdown (one tap opens the
// phone's own picker UI) and sortable. Everything DERIVES from the mounted
// course descriptors — group membership from the course's own key family,
// lesson counts from the live schedules, never a hand-kept list (DR-0121).
//
// Pure + dependency-free — unit-tested in learn-organize.test.js.

export const COURSE_SORTS = [
  { key: 'authored', label: 'Course order' },
  { key: 'title', label: 'A to Z' },
  { key: 'lessons-desc', label: 'Most lessons' },
  { key: 'lessons-asc', label: 'Shortest first' },
];

export function courseLessonCount(course) {
  return (course && course.schedule && course.schedule.length) || 0;
}

// The Eternal-Algorithms processing family is detectable from its own keys
// (buildEternalProcessingCourses emits `eternal-…`) — a structural fact, not a
// hand-tagged list, so a new processing course joins its group automatically.
export function isDeepProcessing(course) {
  return String((course && course.key) || '').startsWith('eternal-');
}

function sortCourses(list, sortKey) {
  const c = [...list];
  switch (sortKey) {
    case 'title':
      return c.sort((a, b) => String(a.meta?.title || '').localeCompare(String(b.meta?.title || '')));
    case 'lessons-desc':
      return c.sort((a, b) => courseLessonCount(b) - courseLessonCount(a));
    case 'lessons-asc':
      return c.sort((a, b) => courseLessonCount(a) - courseLessonCount(b));
    default:
      return c; // 'authored' — the registry's own order
  }
}

// Group + sort for the picker: the authored courses first, the Deep-Processing
// family as its own labeled group. Empty groups are omitted (honest dropdown).
export function organizeCourses(courses, sortKey = 'authored') {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  const deep = list.filter(isDeepProcessing);
  const rest = list.filter((c) => !isDeepProcessing(c));
  const groups = [];
  if (rest.length) groups.push({ label: 'Courses', courses: sortCourses(rest, sortKey) });
  if (deep.length) groups.push({ label: 'The Word — Deep Processing', courses: sortCourses(deep, sortKey) });
  return groups;
}

// =============================================================================
// LESSON FINDER (Darrell 2026-08-18: "We need a better way to look up and
// review the available lessons... not obvious how to find a lesson unless you
// already know the course it is in") — the cross-course lesson index + search.
// Same law as the picker: everything DERIVES from the mounted course
// descriptors (DR-0121) — titles, anchors, counts all read live, never a
// hand-kept list. Pure + dependency-free; unit-tested beside the picker.
// =============================================================================

// Flatten every mounted course's live schedule into one searchable index.
// Each entry carries what the results list renders and what search matches:
// course identity, lesson identity, and a lowercase haystack of title +
// big idea + anchor ref/theme + tags.
export function buildLessonIndex(courses) {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  const out = [];
  for (const c of list) {
    const courseTitle = String(c.meta?.title || c.key || '');
    const unitNoun = String(c.meta?.unit || 'week');
    for (const m of (c.schedule || [])) {
      if (!m || !m.id) continue;
      const title = String(m.title || '');
      const ref = String(m.anchor?.ref || '');
      const hayBody = [
        m.bigIdea, m.anchor?.theme, Array.isArray(m.tags) ? m.tags.join(' ') : '',
      ].filter(Boolean).join(' ').toLowerCase();
      out.push({
        courseKey: c.key,
        courseTitle,
        deep: isDeepProcessing(c),
        unitLabel: `${unitNoun.charAt(0).toUpperCase()}${unitNoun.slice(1)} ${m.week ?? ''}`.trim(),
        lessonId: m.id,
        title,
        ref,
        theme: String(m.anchor?.theme || ''),
        hayTitle: title.toLowerCase(),
        hayRef: ref.toLowerCase(),
        hayBody,
      });
    }
  }
  return out;
}

// Tokenized AND search over the index: every query token must match the entry
// somewhere (title, anchor ref, or body). Ranked so what a person types is
// what they meant: all-tokens-in-title first, then anchor-ref hits (a verse
// reference FINDS its lesson — "2 corinthians 7" works), then body matches.
// Ties keep catalog order. Empty/blank queries return [] (the finder is an
// answer to a question, never a second wall of rows).
export function searchLessons(index, query, limit = 40) {
  const tokens = String(query || '').toLowerCase().split(/[^a-z0-9:]+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored = [];
  for (let i = 0; i < index.length; i++) {
    const e = index[i];
    let inTitle = 0, inRef = 0, inAny = 0;
    for (const t of tokens) {
      const hitTitle = e.hayTitle.includes(t);
      const hitRef = e.hayRef.includes(t);
      const hitBody = e.hayBody.includes(t);
      if (hitTitle) inTitle++;
      if (hitRef) inRef++;
      if (hitTitle || hitRef || hitBody) inAny++;
    }
    if (inAny < tokens.length) continue; // AND semantics: every token must land
    const rank = inTitle === tokens.length ? 3 : (inRef > 0 ? 2 : 1);
    scored.push({ rank, i, e });
  }
  scored.sort((a, b) => (b.rank - a.rank) || (a.i - b.i));
  return scored.slice(0, limit).map((s) => s.e);
}

// BROWSING NEEDS NO COURSE AND NO QUERY.
// ===========================================================================
// Christina, 2026-08-31, on the live Learn tab: "How do I get to the rest of
// the lessons?" — looking at eight weeks of one course with 401 mounted.
// Darrell, tracing it: "you must choose a course first to get to the lists
// lessons unless you type a name etc.. how can this be better?"
//
// That was the shape of the catalog, and it is exactly one line above: the
// finder answers a QUESTION, so a blank box returned nothing, and the only
// other door was a 22-option course dropdown. Both doors demand you already
// know something — a word to type, or which course holds the lesson. A reader
// who knows neither (the reader this platform is FOR) had no way in at all.
//
// So the blank state stops being a wall and becomes the shelf: every lesson in
// the app, grouped under its course, in catalog order. Typing then NARROWS what
// is already visible instead of summoning it out of nothing. Search stays
// exactly as it was — this is the state before anyone types.
//
// Grouping is derived from the index rows themselves (never a hand-kept list,
// DR-0121), and course order follows first appearance so the catalog's own
// order is what a reader sees. Pure; no DOM, no React.
//
// @param {Array} index - rows from buildLessonIndex
// @returns {Array<{courseKey, courseTitle, deep, lessons: Array}>}
export function browseLessons(index) {
  const rows = Array.isArray(index) ? index.filter((r) => r && r.lessonId) : [];
  const groups = [];
  const byKey = new Map();
  for (const r of rows) {
    let g = byKey.get(r.courseKey);
    if (!g) {
      g = { courseKey: r.courseKey, courseTitle: r.courseTitle, deep: !!r.deep, lessons: [] };
      byKey.set(r.courseKey, g);
      groups.push(g);
    }
    g.lessons.push(r);
  }
  return groups;
}

/** How many lessons a browse result holds, across every course. */
export function browseCount(groups) {
  return (Array.isArray(groups) ? groups : []).reduce((t, g) => t + ((g && g.lessons && g.lessons.length) || 0), 0);
}

// ---------------------------------------------------------------------------
// THE LAST COURSE CHOSEN ON THIS DEVICE. Darrell 2026-09-06, on the picker
// reading like a section title over one course's lessons: "have the default
// say Select a Course of 23? Then leave it on the last one?" So: a device that
// has never chosen shows the prompt, and a device that has chosen opens on
// that course. Stored per device (localStorage), like the saved place.
// ---------------------------------------------------------------------------
export const COURSE_MEMORY_KEY = 'poetech.learn.course';

const storeOrNull = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; } };

export function rememberedCourseKey(store = storeOrNull()) {
  try { return store ? (store.getItem(COURSE_MEMORY_KEY) || null) : null; } catch (_) { return null; }
}

export function rememberCourseKey(key, store = storeOrNull()) {
  try {
    if (!store) return;
    if (key) store.setItem(COURSE_MEMORY_KEY, String(key));
    else store.removeItem(COURSE_MEMORY_KEY);
  } catch (_) { /* a full or blocked store never breaks the picker */ }
}

