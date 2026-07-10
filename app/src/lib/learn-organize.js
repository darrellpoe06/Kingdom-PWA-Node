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
