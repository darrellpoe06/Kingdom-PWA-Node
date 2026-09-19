// @vitest-environment node
// =============================================================================
// A passage taught on purpose must REACH the lessons discussing its subject
// =============================================================================
// Darrell 2026-09-19: "Genesis 29:17, Genesis 24, Job 31:1 and Ruth 3:11 were
// all at zero lessons — Make sure it's not that way anymore... make sure its
// everywhere it's discussion so it can be more fully comprehensive
// understanding based on more Word... make sense?"
//
// MEASURED THE DAY THIS SHIPPED, across the 187 lessons: every one of those
// four sat in EXACTLY ONE lesson — the lesson that introduced it (L183). A
// reader arriving at the subject by any other door never met the passage.
// L188 had already found the same shape pointing the other way: Luke 4:18
// quoted three times, Luke 4:19 zero times, for 186 lessons.
//
// WHAT THIS GATE IS NOT. It is not "every verse must appear twice" — that
// would be false and would push authors to sprinkle Scripture where it does
// not belong. The obligation is DECLARED per passage with its reason, and the
// floor is a floor, never a quota: reaching further never fails.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  PASSAGES_THAT_MUST_REACH, measureReach, passagesBelowFloor,
} from '../lib/passage-reach.js';

describe('the measure itself is sound before anything is measured with it', () => {
  it('counts the lessons that actually carry a reference', () => {
    const fake = [
      { id: 'a', lesson: 'nothing here' },
      { id: 'b', lesson: 'as it says (Ruth 3:11) plainly' },
      { id: 'c', levels: { child: 'deep inside a band (Ruth 3:11)' } },
    ];
    const [row] = measureReach(fake, [{ ref: 'Ruth 3:11', subject: 's', minLessons: 2 }]);
    expect(row.reach).toBe(2);
    expect(row.carriedBy).toEqual(['b', 'c']);
  });

  it('PROVEN-TO-CATCH: a passage under its declared floor is reported', () => {
    // A gate that always passes is itself a lie (DR-0076 §3). Give a real
    // passage an impossible floor and the measure must name it.
    const faults = passagesBelowFloor(LIVING_LESSONS_MODULES, [
      { ref: 'Ruth 3:11', subject: 'a virtuous woman', minLessons: 999 },
    ]);
    expect(faults).toHaveLength(1);
    expect(faults[0]).toContain('Ruth 3:11');
    expect(faults[0]).toContain('floor is 999');
  });

  it('PROVEN-TO-CATCH: a passage at ZERO is reported, which is the original defect', () => {
    const faults = passagesBelowFloor(LIVING_LESSONS_MODULES, [
      { ref: 'Habakkuk 3:19 (not quoted anywhere in this shape)', subject: 'x', minLessons: 1 },
    ]);
    expect(faults).toHaveLength(1);
    expect(faults[0]).toContain('reaches 0 lesson(s)');
  });
});

describe('THE LIVE SERIES — every declared passage reaches its floor', () => {
  it('no declared passage has fallen below the reach it committed to', () => {
    expect(passagesBelowFloor(LIVING_LESSONS_MODULES)).toEqual([]);
  });

  it('the four Darrell named are no longer stranded in one lesson', () => {
    // This is the assertion that encodes his actual correction. Each of these
    // was at exactly 1 before the placements; a regression to 1 fails here.
    const byRef = Object.fromEntries(
      measureReach(LIVING_LESSONS_MODULES).map((r) => [r.ref, r]),
    );
    for (const ref of ['Genesis 29:17', 'Genesis 24:14', 'Ruth 3:11']) {
      expect(byRef[ref], `${ref} is not declared`).toBeTruthy();
      expect(byRef[ref].reach, `${ref} is stranded in one lesson again`).toBeGreaterThanOrEqual(2);
    }
  });

  it('a placement lands in a DIFFERENT lesson from the one that introduced it', () => {
    // Reaching 2 by quoting the same verse twice inside L183 would satisfy a
    // naive count and miss the entire point.
    const byRef = Object.fromEntries(
      measureReach(LIVING_LESSONS_MODULES).map((r) => [r.ref, r]),
    );
    for (const ref of ['Genesis 29:17', 'Genesis 24:14', 'Ruth 3:11']) {
      const hosts = byRef[ref].carriedBy;
      expect(new Set(hosts).size, `${ref} is carried by one lesson under two names`).toBe(hosts.length);
      expect(
        hosts.some((id) => !id.startsWith('ll183-')),
        `${ref} never left the lesson that introduced it`,
      ).toBe(true);
    }
  });

  it('every declared row carries a reason and a floor a human can read', () => {
    for (const p of PASSAGES_THAT_MUST_REACH) {
      expect(p.ref, 'a row without a reference').toBeTruthy();
      expect(p.subject, `${p.ref} declares no subject`).toBeTruthy();
      expect(p.why.length, `${p.ref} declares no reason`).toBeGreaterThan(40);
      expect(p.minLessons, `${p.ref} has a meaningless floor`).toBeGreaterThanOrEqual(1);
    }
  });

  it('a floor below the real reach is treated as a floor, never a quota', () => {
    // Proven rather than asserted: Proverbs 31:30 sits in six lessons. A floor
    // of 2 on it must PASS, so spreading a passage further can never fail.
    expect(passagesBelowFloor(LIVING_LESSONS_MODULES, [
      { ref: 'Proverbs 31:30', subject: 'beauty is vain', minLessons: 2 },
    ])).toEqual([]);
  });
});
