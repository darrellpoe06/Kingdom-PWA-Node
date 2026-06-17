// @vitest-environment node
//
// learn-integration — the "break it in test" hardening gate (Verification Doctrine
// DR-0076). These tests are adversarial: they try to BREAK the two-course Learn
// system the way production would, and FAIL the build on the real traps:
//   • cross-course module-id collision (progress + quiz are ONE shared map keyed by
//     id — a collision silently corrupts a learner's record across courses)
//   • an unanswerable quiz (a typo'd/missing answer index = a learner can never
//     pass = can never graduate)
//   • a broken clip → SOP link, or a diagram key with no renderer (silent dead media)
//   • interest/helper roster tags cross-contaminating between courses
//   • quiz grading abused with garbage answers (must not crash or falsely pass)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MODULES, extractClassRoster, CLASS_INTEREST_TAG } from '../lib/church-classes.js';
import {
  BROADCAST_MODULES, BROADCAST_INTEREST_TAG, BROADCAST_HELPER_TAG, BROADCAST_TUTOR_META,
} from '../lib/broadcast-class.js';
import { INFRA_MODULES, INFRA_INTEREST_TAG } from '../lib/infrastructure-class.js';
import { SOP_SEQUENCES } from '../lib/broadcast-sops.js';
import { INFRA_SOP_SEQUENCES } from '../lib/infrastructure-sops.js';
import { gradeQuiz, courseAssessment, resolveLevel, normalizeMedia } from '../lib/learn-framework.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';

// All three courses share ONE progress + quiz map, ONE diagram registry, and the
// cross-tenant feedback pipe — so the integrity checks run across the whole set.
const ALL = [...MODULES, ...BROADCAST_MODULES, ...INFRA_MODULES];

describe('cross-course data integrity (one shared progress + quiz map)', () => {
  it('NO module-id collides across the two courses', () => {
    const ids = ALL.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length); // a dup id would corrupt shared records
  });
  it('every module id is non-empty and unique within its own course', () => {
    for (const course of [MODULES, BROADCAST_MODULES, INFRA_MODULES]) {
      const ids = course.map((m) => m.id);
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('every quiz is actually passable (no typo can strand a learner)', () => {
  it('each question has >=2 options and an integer answer index in range', () => {
    for (const m of ALL) {
      if (!m.quiz) continue;
      expect(m.quiz.questions.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
  it('answering every question with its real answer scores 100% and passes', () => {
    for (const m of ALL) {
      if (!m.quiz) continue;
      const perfect = {};
      m.quiz.questions.forEach((q, i) => { perfect[i] = q.answer; });
      const r = gradeQuiz(m.quiz, perfect);
      expect(r.pct).toBe(100);
      expect(r.passed).toBe(true);
    }
  });
});

describe('media links are not dead (clip → SOP, diagram → renderer)', () => {
  // Union of every course's SOP library — a clip may link into either.
  const sopIds = new Set([...SOP_SEQUENCES, ...INFRA_SOP_SEQUENCES].map((s) => s.id));
  it('every clip that names a sopId resolves to a real SOP sequence', () => {
    for (const m of [...BROADCAST_MODULES, ...INFRA_MODULES]) {
      for (const it of normalizeMedia(m)) {
        if (it.type === 'clip' && it.sopId) expect(sopIds.has(it.sopId)).toBe(true);
      }
    }
  });
  it('every diagram key used in any module has a renderer in ChurchLearn (no silent dead diagram)', () => {
    const src = readFileSync(fileURLToPath(new URL('../components/ChurchLearn.jsx', import.meta.url)), 'utf8');
    // Slice the WHOLE DIAGRAMS object (it ends just before MediaList) so newly
    // added course diagrams are covered, not just the first few.
    const start = src.indexOf('const DIAGRAMS');
    const end = src.indexOf('function MediaList', start);
    const diagramBlock = src.slice(start, end > start ? end : start + 12000);
    const usedKeys = ALL.flatMap((m) => normalizeMedia(m)).filter((x) => x.type === 'diagram').map((x) => x.key);
    expect(usedKeys.length).toBeGreaterThan(0);
    for (const key of usedKeys) expect(diagramBlock).toContain(`'${key}'`);
  });
});

describe('roster tags do not cross-contaminate between courses', () => {
  const feed = [
    { id: '1', text: `${CLASS_INTEREST_TAG} Jayden wants to join the youth A.I. class.` },
    { id: '2', text: `${BROADCAST_INTEREST_TAG} Bradley wants to join the broadcast/media-team course.` },
    { id: '3', text: `${BROADCAST_HELPER_TAG} Chris completed the course and wants to help.` },
    { id: '4', text: `${INFRA_INTEREST_TAG} Christian wants to join the infrastructure course.` },
    { id: '5', text: 'The buttons are too small' },
  ];
  it('the youth roster sees ONLY youth interest', () => {
    const r = extractClassRoster(feed, CLASS_INTEREST_TAG);
    expect(r.map((x) => x.who)).toEqual(['Jayden']);
  });
  it('the broadcast roster sees ONLY broadcast interest — not the helper note, not youth, not infra', () => {
    const r = extractClassRoster(feed, BROADCAST_INTEREST_TAG);
    expect(r.map((x) => x.who)).toEqual(['Bradley']);
  });
  it('the infrastructure roster sees ONLY infrastructure interest', () => {
    const r = extractClassRoster(feed, INFRA_INTEREST_TAG);
    expect(r.map((x) => x.who)).toEqual(['Christian']);
  });
});

describe('quiz grading is abuse-resistant (garbage in must not crash or falsely pass)', () => {
  const quiz = { questions: [
    { q: 'a', options: ['x', 'y'], answer: 0 },
    { q: 'b', options: ['x', 'y'], answer: 1 },
  ] };
  it('out-of-range / undefined / wrong-type answers never count as correct', () => {
    expect(gradeQuiz(quiz, { 0: 99, 1: -1 }).correct).toBe(0);
    expect(gradeQuiz(quiz, { 0: undefined, 1: null }).correct).toBe(0);
    expect(gradeQuiz(quiz, {}).passed).toBe(false);
    expect(() => gradeQuiz(quiz, { 0: 'x', 1: {} })).not.toThrow();
  });
  it('a course never reports complete while a quiz is unattempted or failed', () => {
    const modules = [{ id: 'a', quiz }, { id: 'b' }];
    expect(courseAssessment(modules, { a: 1, b: 1 }, {}).complete).toBe(false);
    expect(courseAssessment(modules, { a: 1, b: 1 }, { a: { passed: false } }).complete).toBe(false);
    expect(courseAssessment(modules, { a: 1, b: 1 }, { a: { passed: true } }).complete).toBe(true);
  });
});

describe('defensive inputs do not throw (production robustness)', () => {
  it('resolveLevel / normalizeMedia / gradeQuiz tolerate null & junk', () => {
    expect(() => resolveLevel(null, 'teen')).not.toThrow();
    expect(resolveLevel(null).text).toBe('');
    expect(normalizeMedia(null)).toEqual([]);
    expect(normalizeMedia({ media: 'not-an-array' })).toEqual([]);
    expect(gradeQuiz(undefined).total).toBe(0);
  });
  it('the broadcast tutor prompt is broadcast-flavored AND keeps the verify discipline', () => {
    const sys = tutorSystemPrompt(BROADCAST_MODULES[4], BROADCAST_TUTOR_META);
    expect(sys).toContain('The Broadcast');
    expect(sys.toLowerCase()).toContain('verify');
    expect(sys.toLowerCase()).toContain('tutor');
    expect(sys).toContain(BROADCAST_MODULES[4].title);
  });
});
