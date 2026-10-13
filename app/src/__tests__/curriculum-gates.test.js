// =============================================================================
// The gates move with the content: the NAS copy is judged by the repo's own
// lesson gates, and a publish write that fails them is refused (DR-0677)
// =============================================================================
// scripts/curriculum-gates.mjs imports the very gate modules the repo's pinned
// tests import (verse, quotation, full levels, reading level, band
// differentiation, course band coverage) and adds the structure / id-collision
// rule. Here it is proven three ways:
//   * the real curriculum PASSES it (so it agrees with CI on the code as it is);
//   * a publish write that alters one word of one quotation is REFUSED, naming
//     the lesson; so is a new lesson claiming a number already taken, and a
//     course lesson that gains a verse fault its recorded debt does not carry;
//   * the same lesson republished unchanged is ALLOWED (no false refusals).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { loadRepoCurriculum } from '../../../scripts/curriculum-snapshot.mjs';
import {
  gateCorpus, gateLessonForPublish, checkStructure, loadVerseBaseline, VERSE_ZERO_COURSES,
} from '../../../scripts/curriculum-gates.mjs';

const { courses } = await loadRepoCurriculum();
const ll = courses['living-lessons'];

// A Living Lesson with a quotation, and the quotation to break.
const QUOTE = /"([^"]{20,})"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)\)/;
const target = ll.find((m) => QUOTE.test(m.lesson || ''));

describe('the curriculum gates agree with CI on the code as it is', () => {
  const verdict = gateCorpus(courses);

  it('passes, having measured the real school', () => {
    expect(verdict.fresh, verdict.fresh.join('\n')).toEqual([]);
    expect(verdict.passed).toBe(true);
    expect(verdict.evidence.lessons).toBeGreaterThanOrEqual(729);
    expect(verdict.evidence.spans).toBeGreaterThan(40000);
  });

  it('the zero-fault courses record no verse debt at all', () => {
    const recorded = Object.keys(loadVerseBaseline().faults);
    for (const key of VERSE_ZERO_COURSES) {
      const ids = new Set(courses[key].map((m) => m.id));
      expect(recorded.filter((id) => ids.has(id)), key).toEqual([]);
    }
  });
});

describe('a publish write is gated before it is written', () => {
  it('PROVEN-TO-CATCH: one altered word inside a quotation is refused, by lesson', () => {
    const [, quoted] = QUOTE.exec(target.lesson);
    const words = quoted.split(' ');
    words[1] = `${words[1]}eth`;
    const drifted = { ...target, lesson: target.lesson.replace(quoted, words.join(' ')) };
    const v = gateLessonForPublish(courses, 'living-lessons', drifted);
    expect(v.passed).toBe(false);
    expect(v.fresh.some((f) => f.startsWith('verse ::') && f.includes(target.id))).toBe(true);
  });

  it('PROVEN-TO-CATCH: a new lesson claiming a number already taken is refused', () => {
    const n = /^ll(\d+)-/.exec(target.id)[1];
    const twin = { ...target, id: `ll${n}-a-second-lesson-with-the-same-number` };
    expect(checkStructure({ ...courses, 'living-lessons': [...ll, twin] }).join('\n')).toContain(`L${n}:`);
    expect(gateLessonForPublish(courses, 'living-lessons', twin).passed).toBe(false);
  });

  it('PROVEN-TO-CATCH: a lesson id claimed by two courses is refused', () => {
    const other = { ...courses.stocks[0], title: 'same id, other course' };
    expect(checkStructure({ ...courses, banking: [...courses.banking, other] }).join('\n')).toContain('claimed by');
  });

  it('PROVEN-TO-CATCH: a course lesson gaining a verse fault its debt does not record is refused', () => {
    const lesson = courses.banking.find((m) => typeof m.lesson === 'string');
    const bad = { ...lesson, lesson: `${lesson.lesson} "Jesus wept loudly." (John 11:35)` };
    const v = gateLessonForPublish(courses, 'banking', bad);
    expect(v.passed).toBe(false);
    expect(v.fresh.join('\n')).toContain(lesson.id);
  });

  it('PROVEN-TO-CATCH: a NEW course lesson published without a youth band is refused (DR-0692)', () => {
    const lesson = courses['who-he-is'][0];
    const fresh = { ...lesson, id: 'whohe99-published-without-youth', levels: { ...lesson.levels, youth: '' } };
    const v = gateLessonForPublish(courses, 'who-he-is', fresh);
    expect(v.passed).toBe(false);
    expect(v.fresh.join('\n')).toMatch(/four-bands :: who-he-is\/whohe99-published-without-youth: missing youth/);
  });

  it('the same lesson republished unchanged is allowed', () => {
    expect(gateLessonForPublish(courses, 'living-lessons', target).passed).toBe(true);
  });
});
