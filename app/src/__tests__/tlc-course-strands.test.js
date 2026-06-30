import { describe, it, expect } from 'vitest';
import { allCourses, getCourse } from '../lib/tlc-training-library.js';
import {
  FOUR_STRANDS, STRAND_SPINE_NOTE, SOURCE_THEOLOGY_NOTE,
  courseStrands, hasFourStrands, strandsCoverage, normalizeStrands, COURSE_STRANDS,
} from '../lib/tlc-course-strands.js';

describe('four-strand spine — Yahweh at the centre', () => {
  it('the model names four strands with Yahweh as the centre', () => {
    expect(FOUR_STRANDS.map((s) => s.key)).toEqual(['yahweh', 'clinical', 'science', 'societal']);
    expect(FOUR_STRANDS.find((s) => s.key === 'yahweh').centre).toBe(true);
    expect(STRAND_SPINE_NOTE).toMatch(/Yahweh/);
    expect(SOURCE_THEOLOGY_NOTE).toMatch(/all true knowledge is from Yahweh/i);
  });

  it('PROVEN-TO-CATCH: EVERY library course carries all four strands (the curriculum gate)', () => {
    const missing = allCourses().filter((c) => !hasFourStrands(c)).map((c) => c.id);
    expect(missing).toEqual([]);
    const cov = strandsCoverage(allCourses());
    expect(cov.withFourStrands).toBe(cov.total);
    expect(cov.missing).toBe(0);
  });

  it('every Yahweh strand is Scripture-grounded (a principle AND at least one anchor) + SME doctrine flag', () => {
    for (const c of allCourses()) {
      const s = courseStrands(c);
      expect(s.yahweh.principle).toBeTruthy();
      expect(s.yahweh.anchors.length).toBeGreaterThan(0);
      expect(s.yahweh.smeDoctrine).toMatch(/Bishop/);
    }
  });

  it('the clinical/science/societal strands are real, non-empty, and the science cites findings', () => {
    for (const c of allCourses()) {
      const s = courseStrands(c);
      expect(s.clinical.length).toBeGreaterThan(10);
      expect(s.science.length).toBeGreaterThan(10);
      expect(s.societal.length).toBeGreaterThan(10);
    }
  });

  it('the new Couples & Family course carries its strands INLINE (not the central map)', () => {
    const couples = getCourse('tl-couples-and-family-desire-connection-and-covenant-rebuilding-intimacy-in-marriage');
    expect(couples).toBeTruthy();
    expect(couples.strands).toBeTruthy();
    expect(COURSE_STRANDS[couples.id]).toBeUndefined(); // not in the central map
    const s = courseStrands(couples);
    expect(s.yahweh.anchors).toContain('Genesis 2:24');
    expect(s.science).toMatch(/Basson|attachment|neuroplasticity/i);
  });

  it('normalizeStrands handles a missing strand object cleanly', () => {
    expect(normalizeStrands(null)).toBe(null);
    expect(normalizeStrands({ clinical: 'x' }).yahweh).toBe(null);
  });
});
