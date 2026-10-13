// @vitest-environment node
// =============================================================================
// A COURSE HAS ONE HOME AND MANY SHELVES — the question, one level up
// =============================================================================
// Darrell 2026-09-18, reading the live picker: "Why are the business courses
// that have business content and foundational insights and strategies and
// situational analysis Word first in Business however we only show one business
// course... each one could be considered a business course as well as another
// because it is integration of it throughout how do we need to differentiate
// between the following?"
//
// MEASURED, not argued about. 31 self-paced courses sit across 9 departments,
// and Business holds exactly ONE while fourteen others are business content by
// any honest reading. The cause is structural: `meta.category` is a single
// string, so a course lives on one shelf, and a curriculum whose whole design
// is integration cannot be described by a single string.
//
// DR-0447 hit the identical wall for LESSONS and answered it with a pointer,
// which is what made "credited either way" true by construction. This gate
// holds that same invariant at course scale: one home, one credit, many
// shelves, and the program's own totals do not move.
import { describe, it, expect } from 'vitest';
import {
  COURSE_CROSS_LISTINGS, courseCrossListingsFor, courseCrossListedDepartments,
  resolveCourseCrossListed, missingCourseCrossListings, selfListedCourseCrossListings,
  courseCrossListedCount,
} from '../lib/learn-crosslist.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { courseDepartment, learnDepartments } from '../lib/learn-organize.js';

/** The catalog as the picker has it: key, meta, and a live schedule. */
const COURSES = LEARN_CATALOG
  .filter((c) => typeof c.buildScheduleRows === 'function')
  .map((c) => {
    let schedule;
    try { schedule = c.buildScheduleRows() || []; } catch (_) { schedule = []; }
    return { key: c.key, meta: c.meta, unitCap: c.unitCap, schedule };
  });
const departmentOf = (key) => {
  const c = COURSES.find((x) => x.key === key);
  return c ? courseDepartment(c) : '';
};

describe('the declarations are honest about the live catalog', () => {
  it('the walk covers a real catalog — it is not measuring nothing', () => {
    expect(COURSES.length).toBeGreaterThan(25);
    expect(COURSE_CROSS_LISTINGS.length).toBeGreaterThan(10);
  });

  it('every declaration names a course the catalog actually carries', () => {
    const missing = missingCourseCrossListings(COURSES);
    expect(missing, `declared but not mounted: ${missing.join(', ')}`).toEqual([]);
  });

  it('no course is cross-listed into the department that is already its HOME', () => {
    // The one mistake this file exists to prevent: the same course on one shelf
    // twice, under two different counts.
    const self = selfListedCourseCrossListings(departmentOf);
    expect(self, `already lives there: ${self.join(', ')}`).toEqual([]);
  });

  it('every declaration carries a reason, because which discipline it serves is a judgement', () => {
    for (const c of COURSE_CROSS_LISTINGS) {
      expect(c.department, 'a declaration with no department').toBeTruthy();
      expect(c.courseKey, 'a declaration with no course').toBeTruthy();
      expect(String(c.why || '').split(/\s+/).filter(Boolean).length, `${c.courseKey} has a thin reason`).toBeGreaterThan(8);
    }
  });

  it('declares no duplicate course on the same shelf', () => {
    const seen = new Set();
    const dupes = [];
    for (const c of COURSE_CROSS_LISTINGS) {
      const k = `${c.department}::${c.courseKey}`;
      if (seen.has(k)) dupes.push(k);
      seen.add(k);
    }
    expect(dupes, `declared twice: ${dupes.join(', ')}`).toEqual([]);
  });
});

describe('Business is the department the report was about', () => {
  it('gathers the courses that genuinely serve it, from elsewhere', () => {
    const rows = resolveCourseCrossListed('Business', COURSES);
    expect(rows.length, 'Business gathers nothing — the report is unaddressed').toBeGreaterThanOrEqual(12);
    // the whole Real Estate department serves it, which was the visible gap
    const keys = rows.map((r) => r.courseKey);
    for (const k of ['property-principle', 'buying-terms', 'leasing-tenants', 'maintenance-trades',
      'partnerships', 'financing-debt', 'taxes-records', 'management-stewardship']) {
      expect(keys, `${k} does not reach the Business shelf`).toContain(k);
    }
    expect(keys, 'the economics under every venture').toContain('kingdom-economics');
    expect(keys, 'how a holding is structured to outlast its builder').toContain('legacy-provisions');
  });

  it('each gathered row is read from the LIVE course, never retyped', () => {
    for (const r of resolveCourseCrossListed('Business', COURSES)) {
      const live = COURSES.find((c) => c.key === r.courseKey);
      expect(r.courseTitle, `${r.courseKey} title drifted`).toBe(live.meta.title);
      expect(r.lessons, `${r.courseKey} lesson count drifted`).toBe(live.schedule.length);
      expect(r.homeDepartment, `${r.courseKey} home drifted`).toBe(live.meta.category);
      expect(r.homeDepartment, 'a gathered row must name a home that is NOT this shelf').not.toBe('Business');
    }
  });

  it('names the home department on every row, so the reader sees where it lives', () => {
    // This is what keeps the shelf honest: Business shows the course AND says
    // it is taught in Real Estate, rather than implying a second identity.
    const homes = new Set(resolveCourseCrossListed('Business', COURSES).map((r) => r.homeDepartment));
    expect(homes.has('Real Estate')).toBe(true);
    expect(homes.has('Kingdom Life & Stewardship')).toBe(true);
    expect(homes.size).toBeGreaterThan(2);
  });
});

describe('a pointer never forks the count — the invariant that makes it safe', () => {
  it('no gathered course is counted by the shelf that gathers it', () => {
    // THE INVARIANT, asserted as a property rather than as a pinned number.
    // My first draft pinned 37 / 603 here, copied from the learn-crosslist
    // test, and it failed: that test counts the catalog through a different
    // filter and this one sees 31 self-paced rows. A magic number carried in
    // from somewhere else is not a measurement, so the check now states the
    // thing that actually matters and cannot drift with a count.
    // learnDepartments sums `course.schedule`, so it must be given MOUNTED
    // rows the way the app gives them; passing the raw registry reports every
    // department at zero lessons, which is how the first draft of this check
    // failed and what it now avoids.
    const depts = learnDepartments(COURSES);
    for (const d of courseCrossListedDepartments()) {
      const shelf = depts.find((x) => x.label === d);
      expect(shelf, `${d} is gathered into but is not a department`).toBeTruthy();
      const ownKeys = new Set((shelf.courses || []).map((c) => c.key));
      for (const row of resolveCourseCrossListed(d, COURSES)) {
        expect(ownKeys.has(row.courseKey),
          `${row.courseKey} is BOTH gathered into ${d} and counted by it`).toBe(false);
      }
      // and the shelf's own lesson total is the sum of its OWN courses only
      const ownLessons = (shelf.courses || []).reduce((t, c) => {
        const live = COURSES.find((x) => x.key === c.key);
        return t + ((live && live.schedule.length) || 0);
      }, 0);
      expect(shelf.lessons, `${d} lesson count includes something it only points at`).toBe(ownLessons);
    }
  });

  it('a cross-listed course keeps exactly ONE home in the registry', () => {
    for (const c of COURSE_CROSS_LISTINGS) {
      const live = COURSES.find((x) => x.key === c.courseKey);
      expect(typeof live.meta.category, `${c.courseKey} home is not a single string`).toBe('string');
      expect(live.meta.category).not.toBe(c.department);
    }
  });

  it('the department list itself is unchanged by a cross-listing', () => {
    // A gathered course must never open a department, or the shelf would be
    // reporting a discipline nobody authored.
    const labels = learnDepartments(LEARN_CATALOG).map((d) => d.label);
    for (const d of courseCrossListedDepartments()) {
      expect(labels, `${d} is gathered into but does not exist as a department`).toContain(d);
    }
  });
});

describe('the helpers behave', () => {
  it('filters by department and counts', () => {
    expect(courseCrossListingsFor('Business').length).toBe(courseCrossListedCount('Business'));
    expect(courseCrossListingsFor('')).toEqual([]);
    expect(courseCrossListingsFor('Nowhere At All')).toEqual([]);
    expect(courseCrossListedCount('Nowhere At All')).toBe(0);
  });

  it('resolves nothing from a bad index rather than throwing', () => {
    expect(resolveCourseCrossListed('Business', null)).toEqual([]);
    expect(resolveCourseCrossListed('Business', [])).toEqual([]);
  });
});

describe('the gate can actually fail', () => {
  it('PROVEN-TO-CATCH: a declaration for a course that is not mounted', () => {
    const shortCatalog = COURSES.filter((c) => c.key !== 'financing-debt');
    const missing = missingCourseCrossListings(shortCatalog);
    expect(missing, 'an unmounted course passed the gate').toContain('financing-debt');
  });

  it('PROVEN-TO-CATCH: a course cross-listed into its own home department', () => {
    // Pretend every course lives in Business. Every declaration that TARGETS
    // Business is then a self-listing and must be reported.
    //
    // This assertion used to read `.toBe(COURSE_CROSS_LISTINGS.length)`, which
    // was only ever true while every declaration pointed at Business. DR-0540
    // added shelves in Kingdom Life & Stewardship, Mathematics and Development
    // -- Darrell 2026-09-19: "All courses need to be listed in their respective
    // courses and also cross the other spaces it is discussed" -- so 21 of the
    // 27 target Business and the old literal started reporting a fault in
    // correct data. The count is DERIVED now, so it cannot go stale again.
    const business = COURSE_CROSS_LISTINGS.filter((c) => c.department === 'Business');
    expect(business.length, 'Business should still be a shelf').toBeGreaterThan(0);
    const self = selfListedCourseCrossListings(() => 'Business');
    expect(self.length, 'self-listing went unreported').toBe(business.length);
  });

  it('PROVEN-TO-CATCH: every declaration self-lists when its own shelf is its home', () => {
    // The stronger form of the check above, and the one that actually covers
    // EVERY declaration rather than the Business subset. Give each course a
    // home equal to one of its own declared shelves; every course must then be
    // reported, including the four that serve two shelves.
    const home = new Map();
    for (const c of COURSE_CROSS_LISTINGS) if (!home.has(c.courseKey)) home.set(c.courseKey, c.department);
    const self = new Set(selfListedCourseCrossListings((k) => home.get(k) || ''));
    const every = new Set(COURSE_CROSS_LISTINGS.map((c) => c.courseKey));
    expect([...every].filter((k) => !self.has(k)), 'a course never self-listed').toEqual([]);
  });

  it('PROVEN-TO-CATCH: a row whose title was retyped instead of read', () => {
    const faked = COURSES.map((c) => (c.key === 'financing-debt'
      ? { ...c, meta: { ...c.meta, title: 'Something Else Entirely' } } : c));
    const row = resolveCourseCrossListed('Business', faked).find((r) => r.courseKey === 'financing-debt');
    expect(row.courseTitle, 'the resolver is not reading the live course').toBe('Something Else Entirely');
  });
});
