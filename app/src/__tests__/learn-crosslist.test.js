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
} from '../lib/learn-crosslist.js';
import { LEARN_CATALOG, catalogCategory, buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
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

  it('leaves the program totals exactly where they were', () => {
    // The department shelf grows; the catalog does not. 25 courses / 487
    // lessons, measured 2026-09-16 (486 + Sovereign A.I. week 22),
    // unchanged by any cross-listing.
    expect(courses).toHaveLength(25);
    expect(courses.reduce((t, c) => t + courseLessonCount(c), 0)).toBe(487);
    const depts = learnDepartments(courses);
    expect(depts.reduce((t, d) => t + d.lessons, 0)).toBe(487);
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
