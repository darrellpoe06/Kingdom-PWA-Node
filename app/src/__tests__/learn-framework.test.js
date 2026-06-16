// @vitest-environment node
//
// learn-framework — the SHARED scaffolding both Learn courses consume. These prove
// the reusable behavior is real (DR-0076): skill-level branching falls back
// cleanly, media is normalized honestly (clips pending, diagrams ready), quizzes
// grade from real answers, and the graduate → helper path only opens on a genuinely
// complete course (all weeks done + every quiz passed).
import { describe, it, expect } from 'vitest';
import {
  LEARN_LEVELS, DEFAULT_LEVEL, resolveLevel, normalizeMedia, hasReadyMedia,
  gradeQuiz, moduleQuizPassed, courseAssessment, helperInterestText, QUIZ_PASS_RATIO,
} from '../lib/learn-framework.js';

describe('skill-level branching', () => {
  const m = { lesson: 'base', levels: { teen: 'teen text', senior: 'senior text' } };
  it('returns the requested level when it exists', () => {
    expect(resolveLevel(m, 'senior')).toEqual({ text: 'senior text', levelId: 'senior', branched: true });
  });
  it('falls back to base lesson when the module has no levels', () => {
    const r = resolveLevel({ lesson: 'only base' }, 'teen');
    expect(r.text).toBe('only base');
    expect(r.branched).toBe(false);
  });
  it('falls back to standard, then base, for an unknown level', () => {
    expect(resolveLevel({ lesson: 'b', levels: { standard: 's' } }, 'teen').text).toBe('s');
    expect(resolveLevel({ lesson: 'b' }, 'nonsense').text).toBe('b');
  });
  it('exposes the level set and a default', () => {
    expect(LEARN_LEVELS.length).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_LEVEL).toBe('standard');
  });
});

describe('multi-modal media normalization (honest, never fake)', () => {
  it('marks diagrams ready, clips without media as pending-capture, videos as pending', () => {
    const items = normalizeMedia({ media: [
      { type: 'diagram', key: 'x' },
      { type: 'clip', sopId: 's1' },
      { type: 'video' },
      { type: 'video', src: 'real.mp4' },
    ] });
    expect(items[0].status).toBe('ready');
    expect(items[1].status).toBe('pending-capture');
    expect(items[2].status).toBe('pending');
    expect(items[3].status).toBe('ready');
  });
  it('hasReadyMedia is true only when something is actually ready', () => {
    expect(hasReadyMedia({ media: [{ type: 'clip' }] })).toBe(false);
    expect(hasReadyMedia({ media: [{ type: 'diagram', key: 'x' }] })).toBe(true);
    expect(hasReadyMedia({})).toBe(false);
  });
});

describe('quiz grading + assessment', () => {
  const quiz = { questions: [
    { q: 'a', options: ['1', '2'], answer: 1 },
    { q: 'b', options: ['1', '2'], answer: 0 },
    { q: 'c', options: ['1', '2'], answer: 1 },
  ] };
  it('grades correct/total/pct and pass threshold', () => {
    const all = gradeQuiz(quiz, { 0: 1, 1: 0, 2: 1 });
    expect(all).toMatchObject({ total: 3, correct: 3, pct: 100, passed: true });
    const partial = gradeQuiz(quiz, { 0: 1, 1: 1, 2: 1 }); // 2/3
    expect(partial.correct).toBe(2);
    expect(partial.passed).toBe(2 / 3 >= QUIZ_PASS_RATIO);
  });
  it('an empty quiz is a no-op (not a gate)', () => {
    expect(gradeQuiz(null).total).toBe(0);
    expect(gradeQuiz({ questions: [] }).passed).toBe(false);
  });
  it('moduleQuizPassed: no quiz => true; with quiz uses the saved record', () => {
    expect(moduleQuizPassed({ id: 'x' }, {})).toBe(true); // no quiz, no gate
    expect(moduleQuizPassed({ id: 'x', quiz }, { x: { passed: true } })).toBe(true);
    expect(moduleQuizPassed({ id: 'x', quiz }, { x: { passed: false } })).toBe(false);
    expect(moduleQuizPassed({ id: 'x', quiz }, {})).toBe(false); // unattempted
  });
});

describe('graduate → next-cohort helper path', () => {
  const modules = [
    { id: 'a', quiz: { questions: [{ q: '?', options: ['x', 'y'], answer: 0 }] } },
    { id: 'b' }, // no quiz
  ];
  it('is NOT complete until every week is done AND every quiz is passed', () => {
    expect(courseAssessment(modules, {}, {}).complete).toBe(false);
    expect(courseAssessment(modules, { a: 1, b: 1 }, {}).complete).toBe(false); // quiz a not passed
    const done = courseAssessment(modules, { a: 1, b: 1 }, { a: { passed: true } });
    expect(done.complete).toBe(true);
    expect(done.eligibleToHelp).toBe(true);
    expect(done.progressPct).toBe(100);
  });
  it('the helper note carries the tag, name, and course title', () => {
    const t = helperInterestText('The Broadcast: How It All Works', 'Bradley', '[Broadcast class helper]');
    expect(t).toContain('[Broadcast class helper]');
    expect(t).toContain('Bradley');
    expect(t).toContain('The Broadcast: How It All Works');
  });
});
