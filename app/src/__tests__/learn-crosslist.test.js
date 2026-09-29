// =============================================================================
// A.I. understanding is gathered from the whole curriculum, credited once
// =============================================================================
// Darrell 2026-09-16: "Most people want Ai understanding built in their
// curriculum" and "can we use cross-referenced lessons that get credited
// either way." DR-0447 fixed the A.I. department's COUNT; this is the second
// half — the nine A.I. lessons the curriculum teaches elsewhere, gathered on
// the department's shelf as POINTERS, so the lesson keeps exactly one home and
// therefore exactly one credit.
//
// The checks that matter are the ones a future edit will trip: a renamed
// lesson id (the shelf would render a row that opens nothing), a lesson
// cross-listed into the department it already lives in (the same lesson
// counted twice), and the program totals moving (a copy, not a pointer).
import { describe, it, expect } from 'vitest';
import {
  CROSS_LISTINGS, crossListingsFor, crossListedDepartments, resolveCrossListed,
  missingCrossListings, selfListedCrossListings, crossListedCount,
  COURSE_CROSS_LISTINGS, HOME_ONLY, coursesWithNoShelfDeclaration,
} from '../lib/learn-crosslist.js';
import { LEARN_CATALOG, catalogCategory, buildCatalogCourseDescriptors, learnCatalogSummary } from '../lib/learn-catalog.js';
import { buildLessonIndex, courseLessonCount, learnDepartments } from '../lib/learn-organize.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';

// The whole mounted catalog, as the church door assembles it: every registered
// course (the component-wired youth course included, via the registry) plus
// the Eternal-Algorithms family.
const courses = [
  ...LEARN_CATALOG.map((e) => ({ key: e.key, meta: e.meta, schedule: e.buildScheduleRows() })),
  ...buildEternalProcessingCourses(),
];
const index = buildLessonIndex(courses);

// The school's size when the literal pins were retired (2026-09-29, DR-0677).
// A FLOOR, not a pin: a new lesson or course never edits it; only a deliberate
// retirement of lessons would, and that is a decision worth one line.
const SCHOOL_FLOOR = { courses: 49, lessons: 729 };

describe('every cross-listed lesson is a real, mounted lesson', () => {
  it('names nothing the catalog does not carry', () => {
    // A renamed or removed lesson id fails HERE, with the line to fix, instead
    // of rendering a row that opens nothing.
    expect(missingCrossListings(index)).toEqual([]);
  });

  it('resolves every declaration to its real title and home course', () => {
    const rows = resolveCrossListed('A.I. The Way', index);
    expect(rows).toHaveLength(crossListedCount('A.I. The Way'));
    for (const r of rows) {
      expect(r.title, `${r.lessonId} resolved with no title`).toBeTruthy();
      expect(r.courseTitle).toBeTruthy();
      expect(r.unitLabel).toBeTruthy();
      expect(r.why).toBeTruthy();
    }
  });

  it('reads the title from the lesson rather than a copy of it', () => {
    const tower = resolveCrossListed('A.I. The Way', index)
      .find((r) => r.lessonId.startsWith('ll34-'));
    const live = index.find((r) => r.lessonId === tower.lessonId);
    expect(tower.title).toBe(live.title);
    expect(tower.courseTitle).toBe(live.courseTitle);
  });
});

describe('a pointer, never a copy', () => {
  it('cross-lists no lesson into the department it already lives in', () => {
    expect(selfListedCrossListings((key) => catalogCategory(key) || '')).toEqual([]);
  });

  it('draws from courses outside the department, in two other departments', () => {
    const from = [...new Set(crossListingsFor('A.I. The Way').map((c) => c.courseKey))];
    expect(from.length).toBeGreaterThan(1);
    const depts = [...new Set(from.map((k) => catalogCategory(k)))];
    expect(depts).not.toContain('A.I. The Way');
    expect(depts.length).toBeGreaterThan(1);
  });

  it('leaves the program totals exactly where they were — DERIVED, never re-typed (DR-0677)', () => {
    // WHAT THIS PIN WAS, AND WHY IT IS DERIVED NOW. It read two literal numbers
    // (49 courses / 729 lessons on 2026-09-29) and every lesson PR edited them,
    // with a dated line of history each time: 19 edits to this file since
    // 2026-09-20, and the reason parallel lesson PRs kept conflicting with each
    // other (REV-0255 LP-04, PR #1840). The history lives in git (`git log -p`
    // on this file, before DR-0677); the numbers now come from the data.
    //
    // WHAT IT STILL PROTECTS, measured two independent ways:
    //   * the MOUNTED count (learn-organize's courseLessonCount over the
    //     descriptors, the path the Learn header takes) equals the REGISTRY's
    //     own count (learnCatalogSummary + the Eternal-Algorithms family) —
    //     a lesson dropped or duplicated in transit fails here;
    //   * the department shelves add up to the same number (next test);
    //   * a FLOOR: the school never silently shrinks below what it held when
    //     the pin was retired. A new lesson never touches this line.
    // A lesson that disappears outright is also caught by its own pinned test
    // (living-lessons-l<n>-verses.test.js and each course's test import it by id).
    const registry = learnCatalogSummary();
    const eternal = buildEternalProcessingCourses();
    const registryLessons = registry.lessons + eternal.reduce((t, c) => t + c.schedule.length, 0);
    const mounted = courses.reduce((t, c) => t + courseLessonCount(c), 0);
    expect(courses).toHaveLength(registry.courses + eternal.length);
    expect(mounted, 'the mounted catalog and the registry disagree on the lesson count').toBe(registryLessons);
    const depts = learnDepartments(courses);
    expect(depts.reduce((t, d) => t + d.lessons, 0)).toBe(mounted);
    expect(courses.length, 'the school lost a course').toBeGreaterThanOrEqual(SCHOOL_FLOOR.courses);
    expect(mounted, 'the school lost lessons').toBeGreaterThanOrEqual(SCHOOL_FLOOR.lessons);
  });

  it('PROVEN-TO-CATCH: a lesson dropped or doubled in transit breaks the derived total', () => {
    const registry = learnCatalogSummary();
    const eternal = buildEternalProcessingCourses();
    const registryLessons = registry.lessons + eternal.reduce((t, c) => t + c.schedule.length, 0);
    const i = courses.findIndex((c) => c.key === 'living-lessons');
    const dropped = courses.map((c, j) => (j === i ? { ...c, schedule: c.schedule.slice(1) } : c));
    const doubled = courses.map((c, j) => (j === i ? { ...c, schedule: [...c.schedule, c.schedule[0]] } : c));
    expect(dropped.reduce((t, c) => t + courseLessonCount(c), 0)).not.toBe(registryLessons);
    expect(doubled.reduce((t, c) => t + courseLessonCount(c), 0)).not.toBe(registryLessons);
  });

  it('and the totals move ONLY for a real course — a cross-listing adds nothing', () => {
    // Proven rather than asserted: sum the department shelves WITH every
    // cross-listing in force, and it must equal the plain catalog total. This
    // is the property the pin above is protecting, measured directly, so the
    // protection survives any future re-pinning.
    const catalogLessons = courses.reduce((t, c) => t + courseLessonCount(c), 0);
    const shelfLessons = learnDepartments(courses).reduce((t, d) => t + d.lessons, 0);
    expect(shelfLessons, 'a cross-listing has duplicated a lesson into the totals').toBe(catalogLessons);
    expect(CROSS_LISTINGS.length, 'there should be cross-listings in force for this to mean anything').toBeGreaterThan(0);
  });

  it('every declared department is a real department of the catalog', () => {
    const labels = new Set(learnDepartments(courses).map((d) => d.label));
    for (const d of crossListedDepartments()) expect(labels.has(d)).toBe(true);
  });

  it('declares no lesson twice', () => {
    const keys = CROSS_LISTINGS.map((c) => `${c.department}::${c.courseKey}::${c.lessonId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every declaration carries its reason', () => {
    for (const c of CROSS_LISTINGS) {
      expect(c.why, `${c.lessonId} has no stated reason`).toBeTruthy();
      expect(c.why.length).toBeGreaterThan(20);
    }
  });
});

describe('the shelf answers a real question', () => {
  it('gathers more A.I. lessons than the department teaches in one course', () => {
    const rows = resolveCrossListed('A.I. The Way', index);
    expect(rows.length).toBeGreaterThanOrEqual(9);
  });

  it('is empty for a department that declares none, and never throws', () => {
    expect(crossListingsFor('Mathematics')).toEqual([]);
    expect(resolveCrossListed('Mathematics', index)).toEqual([]);
    expect(resolveCrossListed('', index)).toEqual([]);
    expect(resolveCrossListed(null, null)).toEqual([]);
  });

  it('every cross-listed lesson is reachable in its home course', () => {
    // The pointer must land: the home course is mounted and holds that lesson.
    const mounted = new Map(courses.map((c) => [c.key, c]));
    for (const c of CROSS_LISTINGS) {
      const home = mounted.get(c.courseKey);
      expect(home, `${c.courseKey} is not mounted`).toBeTruthy();
      expect(home.schedule.some((m) => m && m.id === c.lessonId),
        `${c.lessonId} is not in ${c.courseKey}`).toBe(true);
    }
  });

  it('the harness the render gate uses carries them too', () => {
    // buildCatalogCourseDescriptors is what the catalog render gate clicks
    // through; a cross-listed lesson must exist there as well, or the gate and
    // the shelf disagree about what is mounted.
    const harness = buildLessonIndex(buildCatalogCourseDescriptors().map((c) => ({ ...c, key: c.meta.key })));
    const ids = new Set(harness.map((r) => r.lessonId));
    for (const c of CROSS_LISTINGS) {
      if (c.courseKey === 'ai') continue; // component-wired; absent from this harness by design
      expect(ids.has(c.lessonId), `${c.lessonId} missing from the render harness`).toBe(true);
    }
  });
});

describe('the History shelf gathers what the curriculum already taught (DR-0575)', () => {
  // Darrell 2026-09-23, the evening the department opened: "History section
  // doesn't have any of the historical events we currently have... why not?!"
  // The department held its one course; the curriculum had been teaching dated
  // history for months in five other courses. Reproduced here as the shape of
  // the shelf: it must draw from OUTSIDE the department, from several courses,
  // and every row must be a real, mounted lesson with a measured reason.
  const rows = resolveCrossListed('History', index);

  it('gathers the historical events the curriculum already teaches — seventeen, measured', () => {
    expect(rows.length).toBeGreaterThanOrEqual(17);
    expect(rows).toHaveLength(crossListedCount('History'));
  });

  it('draws them from at least five courses in two other departments (the Word’s, and Stewardship)', () => {
    const from = [...new Set(rows.map((r) => r.courseKey))];
    expect(from.length).toBeGreaterThanOrEqual(5);
    expect(from).not.toContain('history-truth');
    const depts = [...new Set(from.map((k) => catalogCategory(k)))];
    expect(depts).not.toContain('History');
    expect(depts).toEqual(expect.arrayContaining(['The Word & The Way', 'Kingdom Life & Stewardship']));
  });

  it('the events he named are on the shelf: the porters, Greenwood, the 1965 Act, Evanston, the engineered barriers', () => {
    const ids = rows.map((r) => r.lessonId);
    expect(ids.some((id) => id.startsWith('ll135-'))).toBe(true);
    expect(ids).toContain('econ7-build-institutions');
    expect(ids).toContain('wi-tuition-and-the-1965-act');
    expect(ids).toContain('wi-evanston-reparations-and-equal-protection');
    expect(ids).toContain('econ5-the-real-barriers');
  });

  it('every reason states what was measured, so the shelf is data, not taste', () => {
    for (const c of crossListingsFor('History')) {
      expect(c.why, `${c.lessonId} does not say what was measured`).toMatch(/\(measured: /);
    }
  });

  it('the department line says how many more lessons it gathers', () => {
    const dept = learnDepartments(courses).find((d) => d.label === 'History');
    expect(dept).toBeTruthy();
    expect(crossListedCount(dept.label)).toBe(rows.length);
  });
});

describe('every course says SOMETHING about its shelves — the gap Darrell found', () => {
  // Darrell, 2026-09-19, opening the Business picker: "We need to review the
  // Ways we update our systems and don't when we have features added!!!!!!!!!
  // Why isn't Banking in this list already?!!!!!"
  //
  // It was not, because COURSE_CROSS_LISTINGS is hand-kept and Banking shipped
  // after the list was written. Measured that day: 22 of 36 mounted courses had
  // no entry at all. Five of them plainly belonged in Business and were added;
  // the rest declare that home is their only shelf. This gate is the half that
  // stops it recurring -- a course must be in ONE of the two lists, so the
  // decision happens when the course is added rather than being discovered in
  // a dropdown months later.
  it('no mounted course is silent about where it belongs', () => {
    const keys = LEARN_CATALOG.map((c) => c.key);
    expect(keys.length, 'no courses mounted — this check would prove nothing').toBeGreaterThan(30);
    expect(
      coursesWithNoShelfDeclaration(keys),
      'these courses mounted with no cross-listing and no home-only declaration — '
      + 'decide which shelf each belongs on rather than leaving it silent',
    ).toEqual([]);
  });

  it('PROVEN-TO-CATCH: an undeclared course is reported', () => {
    // The control. If a fabricated key does not come back, the check above is
    // passing for the wrong reason.
    expect(coursesWithNoShelfDeclaration(['a-course-nobody-declared'])).toEqual(['a-course-nobody-declared']);
  });

  it('a course is never in BOTH lists — home-only and cross-listed are exclusive', () => {
    const crossed = new Set(COURSE_CROSS_LISTINGS.map((c) => c.courseKey));
    const both = HOME_ONLY.filter((k) => crossed.has(k));
    expect(both, 'a course cannot be home-only and cross-listed at once').toEqual([]);
  });

  it('Banking specifically serves Business now, with a reason a reader can read', () => {
    const row = COURSE_CROSS_LISTINGS.find((c) => c.courseKey === 'banking' && c.department === 'Business');
    expect(row, 'Banking is still missing from Business').toBeTruthy();
    expect(row.why.length, 'a cross-listing must say WHY it serves that department').toBeGreaterThan(30);
  });
});
