// @vitest-environment node
// =============================================================================
// A new Living Lesson is neither too long nor too short (DR-1353)
// =============================================================================
// Darrell, 2026-11-06, verbatim: "Don't want lessons too long or short!!!!!"
//
// MEASURED on the catalog of 280 lessons that day (the adult `lesson` field,
// words including quotations): p10 889, p25 1,347, p50 2,357, p75 3,530,
// p90 4,703, max 12,748. The lessons of the previous week ran 2,600 to 5,500,
// and ll282 came out at 4,804 — the gates had floors (full-levels) and no
// ceiling, so nothing said stop. This gate gives new lessons both: the adult
// lesson between 1,500 and 3,500 words, which brackets the catalog's own
// middle half, and the child band at most 2,000 words so the youngest reader
// is not handed the longest text. Lessons before ll284 are grandfathered as
// they stand; DR-1353 carries ll282's trim as a dated re-review.
//
// NOT a stylistic preference: a lesson a family cannot finish at the table is
// not read, and a lesson that fits on a card has not taught. The band is
// the Word's own measure of a sitting (Deuteronomy 6:7, at the table and on
// the way), fixed here so the next builder meets it at the gate, not in
// Darrell's reply.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

export const FIRST_BOUNDED = 284;
export const ADULT_MIN = 1500;
export const ADULT_MAX = 3500;
export const CHILD_MAX = 2000;

export const words = (t) =>
  String(t || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
export const lessonNumber = (id) => Number((/^ll(\d+)-/.exec(String(id)) || [])[1] || 0);

export function lengthFaults(lesson) {
  const out = [];
  const a = words(lesson.lesson);
  if (a < ADULT_MIN) out.push(`${lesson.id}: adult lesson ${a} words is under ${ADULT_MIN}`);
  if (a > ADULT_MAX) out.push(`${lesson.id}: adult lesson ${a} words is over ${ADULT_MAX}`);
  const c = words(lesson.levels?.child);
  if (c > CHILD_MAX) out.push(`${lesson.id}: child band ${c} words is over ${CHILD_MAX}`);
  return out;
}

const BOUNDED = LIVING_LESSONS_MODULES.filter((m) => lessonNumber(m.id) >= FIRST_BOUNDED);

describe('a new Living Lesson keeps a reader length', () => {
  it('covers at least the first bounded lesson, so the scan is not vacuous', () => {
    expect(BOUNDED.length).toBeGreaterThanOrEqual(1);
    expect(BOUNDED.some((m) => m.id.startsWith('ll284-'))).toBe(true);
  });

  it('every lesson from ll284 on sits inside the band', () => {
    expect(BOUNDED.flatMap(lengthFaults)).toEqual([]);
  });

  it('PROVEN TO CATCH: a lesson padded past the ceiling is named, and one cut under the floor is named', () => {
    const L = BOUNDED[0];
    const padded = { ...L, lesson: `${L.lesson} ${'and so on '.repeat(ADULT_MAX)}` };
    expect(lengthFaults(padded)).toEqual([`${L.id}: adult lesson ${words(padded.lesson)} words is over ${ADULT_MAX}`]);
    const cut = {
      ...L,
      lesson: L.lesson
        .split(/\s+/)
        .slice(0, ADULT_MIN - 1)
        .join(' '),
    };
    expect(lengthFaults(cut)).toEqual([`${L.id}: adult lesson ${ADULT_MIN - 1} words is under ${ADULT_MIN}`]);
    const heavyChild = { ...L, levels: { ...L.levels, child: `${L.levels.child} ${'and so on '.repeat(CHILD_MAX)}` } };
    expect(lengthFaults(heavyChild).some((f) => f.includes('child band'))).toBe(true);
  });

  it('the band brackets the catalog’s own middle half, so it is a measurement and not a taste', () => {
    const all = LIVING_LESSONS_MODULES.map((m) => words(m.lesson)).sort((a, b) => a - b);
    const q = (p) => all[Math.floor((all.length - 1) * p)];
    expect(ADULT_MIN).toBeLessThanOrEqual(q(0.25) + 200);
    expect(ADULT_MAX).toBeGreaterThanOrEqual(q(0.5));
  });
});
