// @vitest-environment node
// =============================================================================
// PARTS — a lesson too long for one sitting becomes Part 1, Part 2, Part 3
// =============================================================================
// Darrell, 2026-09-12: "we have children in our church that will need to be able
// to read these lessons at the length of the time and words that make sense to
// them." Then, correcting the first attempt at it: "part 2's for the ones that
// need it... per the Ways and documentation."
//
// THE PREMISE THAT WAS WRONG, KEPT ON THE RECORD. The first instrument read the
// child band's `segmentMinutes: 5` as a budget for the WHOLE lesson — 500 words at
// 100 wpm — and reported nine lessons "over budget". segmentMinutes is the time
// for ONE on-screen segment (45 words for a child), not for the lesson. There was
// no whole-lesson budget to be over, so the nine were not offenders and the gate
// built on it was measuring nothing real. Recorded rather than silently replaced,
// because a wrong measurement that shipped once will be re-derived by the next
// session unless the correction is written down (DR-0076 §8).
//
// WHAT IS ACTUALLY TRUE. By the framework's own plan the median child lesson is a
// 20-minute session of four segments; 28 of 141 run past one 30-minute sitting,
// the worst at 125 minutes. The fix is not to cut the Word down — it is parts.
//
// The sitting ceiling is a DECLARED ASSUMPTION (AGE_BANDS.sessionMinutes), not a
// measurement, and it is set only for the bands whose own spec asks for short
// bursts. Teen, adult and senior are null on purpose: their specs say "can hold a
// longer thread", "the full lesson at once", "unhurried" — so they are not split
// and nothing about how they read today changes. That non-change is asserted here
// so a later edit cannot quietly start chopping up an adult lesson.
import { describe, it, expect } from 'vitest';
import {
  lessonPartsForAge, lessonPlanForAge, sessionCeilingFor, chunkLessonForAge,
  partForSegment, resolveForAge, AGE_BANDS,
} from '../lib/learn-framework.js';
import { partsOverCeiling, partsAreLossless } from '../../../scripts/child-lesson-length.mjs';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const CHILD_CEILING_MIN = sessionCeilingFor('child');

describe('the sitting ceiling is declared, per band, and only where the spec asks for it', () => {
  it('children and youth have a ceiling; teen, adult and senior do not', () => {
    expect(sessionCeilingFor('child')).toBe(30);
    expect(sessionCeilingFor('youth')).toBe(40);
    expect(sessionCeilingFor('teen')).toBeNull();
    expect(sessionCeilingFor('adult')).toBeNull();
    expect(sessionCeilingFor('senior')).toBeNull();
  });

  it('the ceiling lives on the band spec, beside segmentMinutes — not in a component', () => {
    const child = AGE_BANDS.find((b) => b.id === 'child');
    expect(child.sessionMinutes).toBe(30);
    expect(child.segmentMinutes).toBe(5);
  });
});

describe('splitting never edits the lesson', () => {
  it('the parts reassemble the segments exactly, for every lesson at every band', () => {
    for (const band of AGE_BANDS) {
      for (const m of LIVING_LESSONS_MODULES) {
        const segments = chunkLessonForAge(resolveForAge(m, band.id, null).text, band.id);
        const parts = lessonPartsForAge(m, band.id);
        expect(partsAreLossless(parts, segments), `${m.id} at ${band.id} lost or reordered content`).toBe(true);
      }
    }
  });

  it('no part ever runs past its band ceiling', () => {
    for (const band of AGE_BANDS) {
      const ceiling = sessionCeilingFor(band.id);
      if (!ceiling) continue;
      for (const m of LIVING_LESSONS_MODULES) {
        expect(partsOverCeiling(lessonPartsForAge(m, band.id), ceiling), `${m.id} at ${band.id}`).toEqual([]);
      }
    }
  });

  it('PROVEN-TO-CATCH: a lossy or reordered split is rejected', () => {
    const segs = ['a', 'b', 'c'];
    expect(partsAreLossless([{ segments: ['a', 'b'] }], segs)).toBe(false);        // dropped
    expect(partsAreLossless([{ segments: ['a', 'c', 'b'] }], segs)).toBe(false);   // reordered
    expect(partsAreLossless([{ segments: ['a'] }, { segments: ['b', 'c'] }], segs)).toBe(true);
  });

  it('PROVEN-TO-CATCH: an over-long part is reported', () => {
    expect(partsOverCeiling([{ minutes: 35 }, { minutes: 10 }], 30).length).toBe(1);
    expect(partsOverCeiling([{ minutes: 30 }], 30)).toEqual([]);
  });
});

describe('a lesson that fits one sitting is left completely alone', () => {
  it('single-part lessons carry NO part label — no invented structure', () => {
    const one = lessonPartsForAge(LIVING_LESSONS_MODULES[0], 'adult');
    expect(one).toHaveLength(1);
    expect(one[0].label).toBeNull();
    expect(partForSegment(one, 0)).toBeNull();
  });

  it('every adult and senior lesson is still exactly one part (nothing changed for them)', () => {
    for (const band of ['teen', 'adult', 'senior']) {
      const split = LIVING_LESSONS_MODULES.filter((m) => lessonPartsForAge(m, band).length > 1);
      expect(split.map((m) => m.id), `${band} lessons must not be split`).toEqual([]);
    }
  });

  it('most child lessons still fit one sitting — parts are the exception, not the rule', () => {
    const multi = LIVING_LESSONS_MODULES.filter((m) => lessonPartsForAge(m, 'child').length > 1);
    expect(multi.length).toBeGreaterThan(0);
    expect(multi.length).toBeLessThan(LIVING_LESSONS_MODULES.length / 2);
  });
});

describe('the reader can tell a child where they are and when to stop', () => {
  const long = LIVING_LESSONS_MODULES.find((m) => lessonPartsForAge(m, 'child').length > 2);
  const parts = lessonPartsForAge(long, 'child');

  it('the longest child lesson really is split into named sittings', () => {
    expect(parts.length).toBeGreaterThan(2);
    expect(parts[0].label).toBe(`Part 1 of ${parts.length}`);
    expect(parts[0].minutes).toBeLessThanOrEqual(CHILD_CEILING_MIN);
  });

  it('partForSegment locates any step inside its sitting', () => {
    const first = partForSegment(parts, 0);
    expect(first).toMatchObject({ part: 1, of: parts.length, stepInPart: 1 });
    const lastOfFirst = partForSegment(parts, parts[0].segments.length - 1);
    expect(lastOfFirst.endsPart, 'the last step of Part 1 is a stopping point').toBe(true);
    const firstOfSecond = partForSegment(parts, parts[0].segments.length);
    expect(firstOfSecond).toMatchObject({ part: 2, stepInPart: 1 });
    expect(firstOfSecond.endsPart).toBe(false);
  });

  it('the FINAL step of the FINAL part is not a stopping point — it is the end', () => {
    const total = parts.reduce((t, p) => t + p.segments.length, 0);
    expect(partForSegment(parts, total - 1).endsPart).toBe(false);
  });

  it('the plan the reader renders carries the parts with it', () => {
    const plan = lessonPlanForAge(long, 'child');
    expect(plan.totalParts).toBe(parts.length);
    expect(plan.sessionMinutes).toBe(CHILD_CEILING_MIN);
    expect(plan.parts.flatMap((p) => p.segments)).toEqual(plan.segments);
  });
});
