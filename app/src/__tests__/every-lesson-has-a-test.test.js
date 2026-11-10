// @vitest-environment node
// =============================================================================
// every-lesson-has-a-test — no lesson ships without a test the reader can take
// (DR-1404)
// =============================================================================
// Darrell, 2026-11-10, with a screenshot of an Eternal Algorithms pattern:
// "Lessons with no tests?!!!!!!" Measured that day across every course the
// Learn space mounts: 171 lessons had no quiz the reader could see —
//   * all 156 Eternal Algorithms patterns (five courses mounted by ChurchLearn
//     beside the catalog, so a catalog-only check never saw them);
//   * all 12 Healthy Living lessons;
//   * 3 World Issues lessons, one of which HAD a test written as a bare array
//     with `choices`, a shape the quiz screen never reads, so it never showed.
//
// The rule: every lesson in every mounted course carries a well-formed test —
// at least one question with text, at least two options and an answer that
// points at one of them — read on the real catalog AND the Eternal Algorithms
// courses ChurchLearn mounts beside it, and proven to catch both shapes that
// shipped: no quiz, and a misshaped one.
//
// THE RATCHET, MEASURED THE SAME DAY. Beyond the 171 with no test at all, 145
// older lessons carry a thin test (one or two questions) and 15 carry a
// question with no explanation. Those are real tests the reader can take, so
// they are counted, not failed: both counts may only fall, and every lesson
// built from today on carries three or more (the generators here do).
// re-review: 2026-11-24 — strengthen the thin tests course by course.
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { buildEternalProcessingCourses, quizFromAlgorithm } from '../lib/eternal-algorithms-course.js';
import { GODHEAD_ALGORITHMS } from '../lib/godhead-study.js';
import { buildHealthyLivingSchedule } from '../lib/healthy-living-course.js';

const MIN_QUESTIONS = 1;
const THIN_BELOW = 3;
const THIN_CEILING = 145; // measured 2026-11-10; may only fall
const NO_EXPLAIN_CEILING = 15; // measured 2026-11-10; may only fall

/** Why a lesson's test is not one the reader can take, or null when it is. */
export function testFault(lesson) {
  const quiz = lesson && lesson.quiz;
  if (!quiz) return 'no quiz';
  if (Array.isArray(quiz)) return 'quiz is a bare array; the quiz screen reads quiz.questions';
  const qs = quiz.questions;
  if (!Array.isArray(qs)) return 'quiz has no questions list';
  if (qs.length < MIN_QUESTIONS) return `only ${qs.length} question(s)`;
  for (const [i, q] of qs.entries()) {
    if (!q || !String(q.q || '').trim()) return `question ${i + 1} has no text`;
    if (!Array.isArray(q.options) || q.options.length < 2) return `question ${i + 1} has fewer than two options`;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) return `question ${i + 1} answer is out of range`;
  }
  return null;
}

/** A test that works but is thin, or carries a question with no explanation. */
export function testWeakness(lesson) {
  const qs = (lesson && lesson.quiz && lesson.quiz.questions) || [];
  if (qs.length < THIN_BELOW) return 'thin';
  if (qs.some((q) => !String((q && q.explain) || '').trim())) return 'no-explain';
  return null;
}

/** Every mounted lesson, by course: the catalog's rows and the Eternal Algorithms courses ChurchLearn mounts beside it. */
function everyMountedLesson() {
  const out = [];
  for (const c of LEARN_CATALOG) for (const m of c.buildScheduleRows()) out.push({ course: c.key, lesson: m });
  for (const c of buildEternalProcessingCourses()) for (const m of c.schedule) out.push({ course: c.key, lesson: m });
  return out;
}

describe('every lesson in every mounted course has a test the reader can take', () => {
  const all = everyMountedLesson();

  it('walks the whole Learn space, the catalog and the Eternal Algorithms courses both', () => {
    expect(all.length).toBeGreaterThanOrEqual(900);
    expect(all.filter((x) => x.course.startsWith('eternal-')).length).toBeGreaterThanOrEqual(150);
  });

  it('no lesson is without a well-formed test', () => {
    const faults = all.map((x) => ({ at: `${x.course} / ${x.lesson.id}`, why: testFault(x.lesson) })).filter((x) => x.why);
    expect(faults).toEqual([]);
  });

  it('PROVEN TO CATCH: a lesson with no quiz, and a quiz in the shape that never showed, are both named', () => {
    expect(testFault({ id: 'x' })).toBe('no quiz');
    expect(testFault({ id: 'x', quiz: [{ q: 'a', choices: ['b', 'c'], answer: 0 }] })).toMatch(/bare array/);
    expect(testFault({ id: 'x', quiz: { questions: [] } })).toMatch(/only 0/);
    expect(testFault({ id: 'x', quiz: { questions: [{ q: 'a', options: ['b'], answer: 0 }] } })).toMatch(/fewer than two options/);
    expect(testFault({ quiz: { questions: [{ q: 'a', options: ['b', 'c'], answer: 2 }] } })).toMatch(/out of range/);
  });

  it('the thin and unexplained tests may only fall, from the counts measured on 2026-11-10', () => {
    const thin = all.filter((x) => testWeakness(x.lesson) === 'thin').length;
    const noExplain = all.filter((x) => testWeakness(x.lesson) === 'no-explain').length;
    expect(thin).toBeLessThanOrEqual(THIN_CEILING);
    expect(noExplain).toBeLessThanOrEqual(NO_EXPLAIN_CEILING);
  });

  it('the lessons that had no test now carry three or more questions', () => {
    const fixed = all.filter(
      (x) =>
        x.course.startsWith('eternal-') ||
        x.course === 'healthy-living' ||
        ['wi-beauty-supply-boycott', 'wi-game-changers-diet', 'wi-historical-trauma-two-aftermaths'].includes(x.lesson.id)
    );
    expect(fixed.length).toBe(171);
    for (const x of fixed) expect(x.lesson.quiz.questions.length, x.lesson.id).toBeGreaterThanOrEqual(3);
  });
});

describe('the generated tests are built from the lesson’s own words, never invented', () => {
  it('an Eternal Algorithms pattern’s right answers are its own IF, THEN, anchor and outcome', () => {
    const alg = GODHEAD_ALGORITHMS.find((a) => a.id === 'gh-door-sup');
    const { questions } = quizFromAlgorithm(alg);
    expect(questions.length).toBeGreaterThanOrEqual(3);
    const right = questions.map((q) => q.options[q.answer]);
    expect(right).toContain(alg.condition);
    expect(right).toContain(alg.consequence);
    expect(right).toContain(alg.refs.join(' · '));
    for (const q of questions) {
      const wrong = q.options.filter((_, i) => i !== q.answer);
      for (const w of wrong) expect(w).not.toBe(q.options[q.answer]);
    }
  });

  it('the same pattern always meets the same test, and the right answer is not always first', () => {
    const alg = GODHEAD_ALGORITHMS.find((a) => a.id === 'gh-door-sup');
    expect(quizFromAlgorithm(alg)).toEqual(quizFromAlgorithm(alg));
    const positions = new Set(buildEternalProcessingCourses().flatMap((c) => c.schedule.flatMap((m) => m.quiz.questions.map((q) => q.answer))));
    expect([...positions].sort()).toEqual([0, 1, 2]);
  });

  it('a Healthy Living test pairs each finding with the passage the lesson itself sets beside it, and keeps double quotes for the Word', () => {
    const rows = buildHealthyLivingSchedule();
    expect(rows.length).toBe(12);
    for (const r of rows) {
      for (const q of r.quiz.questions) {
        expect(q.q).not.toMatch(/"/);
        expect(q.explain).not.toMatch(/"/);
      }
    }
    const first = rows[0].quiz.questions[0];
    expect(first.options[first.answer]).toBe('Proverbs 13:12');
  });
});
