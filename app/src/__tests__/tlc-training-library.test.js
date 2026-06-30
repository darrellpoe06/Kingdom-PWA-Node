import { describe, it, expect } from 'vitest';
import {
  TRAINING_FIELDS, allCourses, getCourse, coursesByField, libraryByField,
  fieldCoverage, libraryTotals, courseModuleAssessment, courseComplete,
  gradeCourseTest, growthDelta, courseHourEntry, courseTrainingHours, makeCourse,
} from '../lib/tlc-training-library.js';
import { CLINICAL_COMPETENCIES } from '../lib/practice-academy.js';
import { isEngineRenderable } from '../lib/tlc-lessons.js';

describe('training library — coverage of the ten fields', () => {
  it('the fields ARE the ten clinical competencies (one source of truth)', () => {
    expect(TRAINING_FIELDS).toEqual([...CLINICAL_COMPETENCIES]);
    expect(TRAINING_FIELDS.length).toBe(10);
  });

  it('PROVEN-TO-CATCH: every one of the ten fields has at least one real course', () => {
    for (const field of TRAINING_FIELDS) {
      expect(coursesByField(field).length).toBeGreaterThan(0);
    }
    expect(libraryTotals().fieldsCovered).toBe(10);
  });

  it('the library supplies a meaningful number of real training hours', () => {
    const t = libraryTotals();
    expect(t.courseCount).toBeGreaterThanOrEqual(20);
    expect(t.totalHours).toBeGreaterThan(40);
  });

  it('libraryByField always returns all ten fields, in canonical order', () => {
    const groups = libraryByField();
    expect(groups.map((g) => g.field)).toEqual([...TRAINING_FIELDS]);
  });

  it('fieldCoverage rolls up hours + counts per field', () => {
    const cov = fieldCoverage();
    expect(cov.length).toBe(10);
    for (const c of cov) expect(c.hours).toBeGreaterThan(0);
  });
});

describe('every course is real + engine-shaped + honest', () => {
  it('each module renders through the shared engine (has levels.standard)', () => {
    for (const course of allCourses()) {
      for (const m of course.modules) {
        expect(isEngineRenderable(m)).toBe(true);
      }
    }
  });

  it('every authored course ships validated:false (awaits Christina) with a positive hours value', () => {
    for (const course of allCourses()) {
      expect(course.validated).toBe(false);
      expect(courseTrainingHours(course)).toBeGreaterThan(0);
      expect(course.field).toBeTruthy();
    }
  });

  it('NO course carries a CEU / accreditation / fraud caveat in its summary (no moralizing)', () => {
    for (const course of allCourses()) {
      expect(course.summary).not.toMatch(/CEU|accredit|fraud|not legal/i);
    }
  });

  it('course ids are unique and namespaced (no collision with tlc-lessons module ids)', () => {
    const ids = allCourses().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const moduleIds = allCourses().flatMap((c) => c.modules.map((m) => m.id));
    expect(new Set(moduleIds).size).toBe(moduleIds.length);
    for (const id of moduleIds) expect(id.startsWith('tl-')).toBe(true);
  });
});

describe('completion + growth — real, from the learner record', () => {
  const course = getCourse('tl-individual-therapy-the-therapeutic-alliance-the-engine-of-change')
    || allCourses().find((c) => c.postTest && c.modules.length >= 2);

  it('a fresh learner has not completed the course', () => {
    expect(courseComplete(course, {}, {}, {})).toBe(false);
  });

  it('completing modules + passing the post-test completes the course', () => {
    const progress = {};
    const quiz = {};
    for (const m of course.modules) { progress[m.id] = true; if (m.quiz?.questions?.length) quiz[m.id] = { passed: true }; }
    // modules done but post-test not yet passed → still incomplete
    expect(courseComplete(course, progress, quiz, {})).toBe(false);
    const tests = { [course.id]: { post: { passed: true, pct: 100 } } };
    expect(courseComplete(course, progress, quiz, tests)).toBe(true);
  });

  it('gradeCourseTest grades the post-test at the course pass threshold', () => {
    const answers = {};
    course.postTest.questions.forEach((q, i) => { answers[i] = q.answer; });
    const res = gradeCourseTest(course, 'post', answers);
    expect(res.passed).toBe(true);
    expect(res.pct).toBe(100);
  });

  it('growthDelta returns pre→post only when both are present', () => {
    expect(growthDelta({}, course.id)).toBe(null);
    const g = growthDelta({ [course.id]: { pre: { pct: 40 }, post: { pct: 90 } } }, course.id);
    expect(g).toEqual({ pre: 40, post: 90, delta: 50 });
  });

  it('courseModuleAssessment counts modules done from the real record', () => {
    const a = courseModuleAssessment(course, {}, {});
    expect(a.total).toBe(course.modules.length);
    expect(a.done).toBe(0);
  });
});

describe('hours are logged honestly as TRAINING activity tagged by field', () => {
  it('courseHourEntry yields a training entry with the course field as competency', () => {
    const course = allCourses()[0];
    const entry = courseHourEntry(course, { learnerEmail: 's@x.com', date: '2026-06-29' });
    expect(entry.activity).toBe('training');
    expect(entry.competency).toBe(course.field);
    expect(entry.hours).toBe(courseTrainingHours(course));
    expect(entry.learnerEmail).toBe('s@x.com');
  });
});

describe('makeCourse normalization', () => {
  it('defaults are honest (validated false, authored origin, threshold set)', () => {
    const c = makeCourse({ field: 'Documentation', title: 'X', trainingHours: 2 });
    expect(c.validated).toBe(false);
    expect(c.origin).toBe('authored');
    expect(c.passThreshold).toBeGreaterThan(0);
    expect(c.id).toContain('documentation');
  });
});
