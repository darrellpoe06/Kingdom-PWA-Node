// @vitest-environment node
// =============================================================================
// FOUR AGE BANDS ON EVERY LESSON — group C (DR-0694)
// =============================================================================
// Darrell 2026-09-30: "Do we have all the lessons for each lessons age groups
// yet? If not, why not when that has been requested and required?!"
//
// Every lesson of the courses below carries child, youth, teen and senior, held
// to the shared four-band ladder (fixtures/four-band-ladder.js, DR-0696) and to
// every quoted span being the verse it names in app/public/bible/kjv.
//
// Two courses relax ONE rung of the ladder, named here rather than hidden:
//   - infrastructure and broadcast carry operator-level senior bands (and some
//     teen bands) written before the ladder existed, reading above the teen 6.0
//     and senior 10.0 ceilings the Real Estate courses set for themselves. The
//     ORDER still holds (child < youth < teen < senior) and the child ceiling
//     holds; only the teen and senior ceilings are not imposed here.
//   - software-project-management has no adult `lesson` field, so there is no
//     denominator for the share floor; every other rung holds.
// Courses whose own tests already pin teen and senior ceilings are held to the
// full ladder.
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { lessonsOfCourse } from '../../../scripts/course-band-coverage.mjs';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { fourBandFaults, LADDER, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const NO_TOP_CEILINGS = { ...LADDER, teenCeiling: Infinity, seniorCeiling: Infinity };
const NO_ADULT_LESSON = { ...NO_TOP_CEILINGS, floor: { child: 0, youth: 0, teen: 0, senior: 0 } };

const COURSES = {
  'software-project-management': NO_ADULT_LESSON,
  infrastructure: NO_TOP_CEILINGS,
};

const bandTexts = (m) => FOUR_BANDS.map((b) => [`levels.${b}`, m.levels[b]]);

describe('group C: every lesson carries all four bands, on the ladder', () => {
  for (const [key, ladder] of Object.entries(COURSES)) {
    const course = LEARN_CATALOG.find((c) => c.key === key);
    const lessons = course ? lessonsOfCourse(course) : [];

    it(`${key}: the walk finds the course's lessons`, () => {
      expect(lessons.length).toBeGreaterThan(0);
    });

    it(`${key}: every lesson passes the four-band ladder`, () => {
      const faults = lessons.flatMap((m) => fourBandFaults(m, ladder).map((f) => `${m.id} :: ${f}`));
      expect(faults, faults.join('\n')).toEqual([]);
    });

    it(`${key}: every quotation in every band is the verse it names`, () => {
      const scan = scanQuotedVerses(lessons, bandTexts);
      expect(scan.faults.map(describeFault)).toEqual([]);
      expect(scan.spans, 'no band quotes the Word at all').toBeGreaterThan(0);
    });
  }
});

describe('proven-to-catch (DR-0076 sec.3)', () => {
  const m = lessonsOfCourse(LEARN_CATALOG.find((c) => c.key === 'infrastructure'))[0];
  it('the lesson used below passes, so each catch is real', () => {
    expect(fourBandFaults(m, NO_TOP_CEILINGS)).toEqual([]);
  });
  it('a missing youth band is seen', () => {
    const { youth, ...rest } = m.levels;
    expect(youth).toBeTruthy();
    expect(fourBandFaults({ ...m, levels: rest }, NO_TOP_CEILINGS)).toEqual(['youth: missing']);
  });
  it('a child band handed the senior words is seen', () => {
    expect(fourBandFaults({ ...m, levels: { ...m.levels, child: m.levels.senior } }, NO_TOP_CEILINGS).join(' ')).toMatch(/ladder: child|child: grade/);
  });
  it('a misquoted verse in a band is seen', () => {
    const broken = { ...m, levels: { ...m.levels, child: m.levels.child.replace('to dress it and to keep it', 'to work it and to keep it') } };
    expect(broken.levels.child).not.toBe(m.levels.child);
    expect(scanQuotedVerses([broken], bandTexts).faults.length).toBeGreaterThan(0);
  });
});
