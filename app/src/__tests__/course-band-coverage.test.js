// @vitest-environment node
// =============================================================================
// THE FOUR-BAND REQUIREMENT NEVER REACHED THE OTHER 211 LESSONS
// =============================================================================
// Darrell 2026-09-18: "Fill up the lessons and don't stop or not always do all
// of these lessons for each group asap." His words were about the lessons and
// the groups, not about one series.
//
// WHAT WAS MEASURED, and it is the reason this file exists. Three ratchets hold
// the four-band requirement — full-levels (share of the adult lesson),
// reading-level (the FK ladder) and band-differentiation (four versions rather
// than one repeated four times). ALL THREE SCAN `LIVING_LESSONS_MODULES` AND
// NOTHING ELSE. Across the whole catalog:
//
//     211  lessons outside the Living Lessons series
//       0  carrying all four authored bands
//      43  carrying adult text only
//
// A child who opens one of those 43 is handed the adult words by
// resolveForAge's fallback, silently, and no gate in the house has ever said
// so. That is L178's own subject committed by the instruments: the need is
// real, the gate reports nothing, and a defect no instrument reports reads as
// a defect that does not exist.
//
// WHAT THIS FILE DOES AND DELIBERATELY DOES NOT DO. It does NOT impose the
// Living-Lessons floors on a paced course lesson — that is a different
// artifact, and imposing them would be a decision rather than a measurement,
// and it would add 211 entries to shrink-only baselines that may never be
// added to. What it does is COUNT honestly and refuse to let the count get
// worse, which is the smallest thing that turns an invisible need into a
// visible one.
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  BANDS, bandsPresent, lessonsOfCourse, scanCourseBands, ratchetCourseBands,
} from '../../../scripts/course-band-coverage.mjs';
import baseline from '../lib/course-band-coverage-baseline.json';

const OWNED = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
const scan = scanCourseBands(LEARN_CATALOG, OWNED);

describe('the measure reads the real catalog', () => {
  it('finds lessons in every course that has any', () => {
    // If the row-shape walk breaks, this whole file silently measures nothing,
    // which is the failure mode it exists to prevent. So the count is pinned.
    expect(scan.total).toBe(baseline.total);
    expect(Object.keys(scan.courses).length).toBe(Object.keys(baseline.courses).length);
  });

  it('reads the two row shapes a course can hand back', () => {
    // Courses return either the module or a row wrapping it. Both must resolve,
    // and anything without an id or any text must not be counted as a lesson.
    const asModule = lessonsOfCourse({ buildScheduleRows: () => [{ id: 'x', lesson: 'words' }] });
    const asRow = lessonsOfCourse({ buildScheduleRows: () => [{ module: { id: 'y', lesson: 'words' } }] });
    expect(asModule.map((m) => m.id)).toEqual(['x']);
    expect(asRow.map((m) => m.id)).toEqual(['y']);
    expect(lessonsOfCourse({ buildScheduleRows: () => [{ id: 'no-text' }, null, 'junk'] })).toEqual([]);
  });

  it('reports a course whose builder throws as zero rather than crashing the scan', () => {
    // An unreadable course is a finding, not an exception: a throw here would
    // take down every other course's measurement with it.
    expect(lessonsOfCourse({ buildScheduleRows: () => { throw new Error('bad course'); } })).toEqual([]);
  });

  it('counts only bands that actually carry text', () => {
    expect(bandsPresent({ levels: { child: 'a', youth: '  ', teen: null, senior: 'b' } })).toEqual(['child', 'senior']);
    expect(bandsPresent({})).toEqual([]);
    expect(BANDS).toEqual(['child', 'youth', 'teen', 'senior']);
  });

  it('never double-counts a Living Lessons lesson, which the other ratchets own', () => {
    const withoutOwner = scanCourseBands(LEARN_CATALOG, new Set());
    expect(withoutOwner.total, 'the Living Lessons series is being counted twice').toBeGreaterThan(scan.total);
  });
});

describe('the debt, recorded as it actually is', () => {
  it('is the number measured, not a number anybody hoped for', () => {
    expect(baseline.total).toBe(211);
    expect(baseline.allFour).toBe(0);
    expect(baseline.adultOnly).toBe(43);
  });

  it('matches the live catalog exactly', () => {
    expect(scan.allFour).toBe(baseline.allFour);
    expect(scan.adultOnly).toBe(baseline.adultOnly);
  });

  it('gets no worse — a course that loses bands, or a new bare lesson, fails here', () => {
    const { worse } = ratchetCourseBands(scan, baseline);
    expect(worse, `course band coverage went backwards:\n${worse.join('\n')}`).toEqual([]);
  });

  it('records no course the catalog no longer carries', () => {
    const { stale } = ratchetCourseBands(scan, baseline);
    expect(stale, `recorded courses that no longer exist: ${stale.join(', ')}`).toEqual([]);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('sees a course that adds a bare lesson', () => {
    const worseScan = { ...scan, courses: { ...scan.courses, ai: { lessons: 9, allFour: 0, adultOnly: 9 } } };
    expect(ratchetCourseBands(worseScan, baseline).worse.join(' ')).toMatch(/ai: 9 adult-only/);
  });

  it('sees a course that LOSES an authored band', () => {
    // The direction nobody watches: bands can be deleted as easily as added.
    const padded = { ...baseline, courses: { ...baseline.courses, ai: { lessons: 8, allFour: 3, adultOnly: 8 } } };
    expect(ratchetCourseBands(scan, padded).worse.join(' ')).toMatch(/ai: 0 four-band/);
  });

  it('sees a WHOLE NEW COURSE that arrives unrecorded', () => {
    // A new course with no baseline row would otherwise slip in carrying any
    // amount of debt at all, which is how 211 lessons got here unnoticed.
    const withNew = { ...scan, courses: { ...scan.courses, 'real-estate-principle': { lessons: 4, allFour: 0, adultOnly: 4 } } };
    expect(ratchetCourseBands(withNew, baseline).worse.join(' ')).toMatch(/real-estate-principle: not recorded/);
  });

  it('sees a recorded course that has vanished from the catalog', () => {
    const ghost = { ...baseline, courses: { ...baseline.courses, 'a-course-that-was-deleted': { lessons: 1, allFour: 0, adultOnly: 1 } } };
    expect(ratchetCourseBands(scan, ghost).stale).toContain('a-course-that-was-deleted');
  });
});
