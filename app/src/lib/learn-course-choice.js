// =============================================================================
// learn-course-choice — ONE list of the courses, in whatever order is chosen
// =============================================================================
// Darrell, 2026-10-21, with two screenshots of Learn:
//
//   "It's like a title page saying your inside living lessons... we need one
//    list when choosing a course... with all options to sort that one list...
//    make sense.... only have that sortable list when it is chosen!!!!!!!!!!!!
//    Obviously.... make sense?!!!!!!!!"
//
// WHAT WAS MEASURED, and the code said it about itself before he did.
// `ChurchLearn.jsx`'s own comment at the `activeKey` state:
//
//   "`active` below still falls back to the A.I. course for the CONTENT, so
//    nothing under the picker is ever empty; only the select tells the truth
//    about whether a choice was made."
//
// That is the defect in the file's own words. `chosenCourse` is null until
// somebody picks, and `active` falls back to Living Lessons — so Learn opened
// with Living Lessons' title in the <h2>, its catalog line, its plain words,
// its Share and Download buttons, its name in the sticky bar, its Word-first
// lead and its entire lesson schedule, with nothing on the screen saying no
// choice had been made. A title page for a course nobody opened.
//
// THE OTHER HALF: the picker's order was `organizeCourses`, which groups by
// department and sorts WITHIN each group. So "Title A-Z" sorted nineteen
// courses inside eleven departments and produced eleven little lists, never
// one. "All options to sort that one list" means the order applies to the
// WHOLE list, which is `sortCourses` on the flat catalog — the same orders,
// one list.
//
// Pure and dependency-free beyond the library it already belongs to, so the
// order and the words are tested without a browser.
import { sortCourses, courseLessonCount, courseStanding, learnDepartments, courseAddedSpan } from './learn-organize.js';
import { plainWordLine } from './learn-plain-words.js';

const str = (v) => String(v === null || v === undefined ? '' : v);

/**
 * THE ONE LIST. Every course offered, in the chosen order, each row carrying
 * only what it can prove: its catalog code and department (derived by
 * `learnDepartments`, never typed), its real lesson count, its level where the
 * course declares one, its plain words where it declares them, and this
 * device's standing in it.
 *
 * `catalog` is the WHOLE mounted catalog and decides the codes, so a code does
 * not change when a department tab narrows `courses` to its own.
 */
export function courseChoiceRows({ courses = [], catalog = null, sortKey = 'authored', ctx = {} } = {}) {
  const list = (Array.isArray(courses) ? courses : []).filter(Boolean);
  const whole = (Array.isArray(catalog) ? catalog : list).filter(Boolean);
  const coded = new Map();
  for (const d of learnDepartments(whole)) {
    for (const c of (d.courses || [])) coded.set(c.key, { code: str(c.code), department: str(c.department || d.label) });
  }
  // ONE sort over the WHOLE list, not a sort inside each department.
  return sortCourses(list, sortKey, ctx).map((c) => {
    const mark = coded.get(c.key) || { code: '', department: '' };
    const standing = courseStanding(c, ctx);
    const words = (() => { try { return plainWordLine(c.key) || ''; } catch (_) { return ''; } })();
    return {
      key: c.key,
      code: mark.code,
      department: mark.department,
      title: str(c.meta && c.meta.title) || str(c.key),
      lessons: courseLessonCount(c),
      // Only when the course declares one. Never invented for a course that did not.
      level: str(c.meta && c.meta.programLevel),
      plainWords: words,
      state: standing.state,
      done: standing.done,
      begun: standing.begun,
      lastOpened: standing.lastOpened,
      newestAt: courseAddedSpan(c).newest || null,
    };
  });
}

/**
 * Where this device stands in a course, in words, measured from the row and
 * never painted. A course nobody has opened says so plainly — that is a real
 * answer, not a blank.
 */
export function standingWords(row) {
  const r = row || {};
  const n = Number(r.lessons) || 0;
  const done = Number(r.done) || 0;
  if (r.state === 'completed' && n) return `finished · ${done} of ${n} read`;
  if (r.state === 'in-progress') return n ? `in progress · ${done} of ${n} read` : 'in progress';
  return 'not started';
}

/**
 * What the list SAYS above itself: how many courses are in it, which order it
 * is in, and that picking one opens it. An empty list says it is empty rather
 * than rendering nothing, so a catalog that failed to mount cannot read as a
 * tab with no courses in it (DR-0076 §8).
 */
export function choiceWords(rows, { sortLabel = '', departmentLabel = '' } = {}) {
  const n = (Array.isArray(rows) ? rows : []).length;
  const where = departmentLabel ? ` in ${departmentLabel}` : '';
  if (!n) return `No courses are mounted${where} yet.`;
  const lessons = rows.reduce((t, r) => t + (Number(r.lessons) || 0), 0);
  const order = sortLabel ? `, ordered by ${sortLabel.toLowerCase()}` : '';
  return `${n} course${n === 1 ? '' : 's'}${where} · ${lessons} lessons · one list${order}. Pick one to open it.`;
}
