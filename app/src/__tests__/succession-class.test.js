// succession-class.test.js — the "Handed Forward" succession course. Pins the
// course structure, valid quizzes, and — the point of the test — that every KJV
// fragment quoted in the lesson prose stays VERBATIM (DR-0076: a verse must never
// drift from the public-domain source, and this test CATCHES a drift).
import { describe, it, expect } from 'vitest';
import {
  SUCCESSION_META,
  SUCCESSION_MODULES,
  SUCCESSION_SESSION_FLOW,
  SUCCESSION_SESSION_MINUTES,
  buildSuccessionSchedule,
  successionProgressSummary,
  exportSuccessionCurriculumMarkdown,
  SUCCESSION_TUTOR_META,
} from '../lib/succession-class.js';
import { gradeQuiz } from '../lib/learn-framework.js';

// The whole authored corpus flattened to one string — so a verse check hits the
// lesson, both level texts, and the big idea at once.
const corpus = SUCCESSION_MODULES.map((m) =>
  [m.bigIdea, m.lesson, m.levels?.child, m.levels?.senior].filter(Boolean).join('\n'),
).join('\n\n');

describe('succession course: structure', () => {
  it('has a keyed meta and five real modules', () => {
    expect(SUCCESSION_META.key).toBe('handed-forward');
    expect(SUCCESSION_MODULES.length).toBe(5);
    expect(SUCCESSION_SESSION_MINUTES).toBe(75);
    expect(SUCCESSION_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0)).toBe(SUCCESSION_SESSION_MINUTES);
  });

  it('every module carries title, bigIdea, an anchor with a ref, both age levels, and a lesson', () => {
    for (const m of SUCCESSION_MODULES) {
      expect(m.id, 'module id').toBeTruthy();
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(m.bigIdea, `${m.id} bigIdea`).toBeTruthy();
      expect(m.anchor?.ref, `${m.id} anchor.ref`).toBeTruthy();
      expect(m.levels?.child, `${m.id} child level`).toBeTruthy();
      expect(m.levels?.senior, `${m.id} senior level`).toBeTruthy();
      expect(m.lesson, `${m.id} lesson`).toBeTruthy();
    }
  });

  it('every quiz question has a valid answer index and grades a perfect score', () => {
    for (const m of SUCCESSION_MODULES) {
      const quiz = m.quiz;
      if (!quiz?.questions?.length) continue;
      for (const q of quiz.questions) {
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
      const perfect = Object.fromEntries(quiz.questions.map((q, i) => [i, q.answer]));
      expect(gradeQuiz(quiz, perfect).passed).toBe(true);
    }
  });
});

describe("succession course: the teaching Darrell declared is present", () => {
  it("carries the mission-not-map / new-issues spine", () => {
    // Darrell 2026-07-06: heirs won't learn how we did; new issues for the young.
    expect(corpus).toMatch(/new (issues|problems)/i);
    expect(corpus.toLowerCase()).toContain('mission');
    expect(corpus).toMatch(/commission/i);
  });
});

describe('succession course: Scripture is verbatim KJV (DR-0076, proven-to-catch)', () => {
  // Each fragment was fetched verbatim from app/public/bible/kjv/*.json. If an
  // edit paraphrases a verse, this test fails — that is the safeguard.
  const VERBATIM = [
    'I should leave it unto the man that shall be after me',                              // Ecclesiastes 2:18
    'who knoweth whether he shall be a wise man or a fool',                                // Ecclesiastes 2:19
    'Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding', // Proverbs 4:7
    'know thou the God of thy father, and serve him with a perfect heart and with a willing mind',      // 1 Chronicles 28:9
    'the LORD hath chosen thee to build an house for the sanctuary: be strong, and do it',              // 1 Chronicles 28:10
    'is yet young and tender, and the work is great',                                     // 1 Chronicles 29:1
    'he will not fail thee, neither forsake thee: fear not, neither be dismayed',          // Deuteronomy 31:8
    'Moses my servant is dead; now therefore arise, go over this Jordan',                  // Joshua 1:2
    'the LORD thy God is with thee whithersoever thou goest',                              // Joshua 1:9
    'let a double portion of thy spirit be upon me',                                       // 2 Kings 2:9
    'the same commit thou to faithful men, who shall be able to teach others also',        // 2 Timothy 2:2
    'man leaveth an inheritance to his children',                                          // Proverbs 13:22 (quoted mid-sentence)
    'even as thy soul prospereth',                                                         // 3 John 1:2
  ];
  for (const frag of VERBATIM) {
    it(`quotes verbatim: "${frag.slice(0, 40)}…"`, () => {
      expect(corpus).toContain(frag);
    });
  }
});

describe('succession course: shared-framework wrappers work', () => {
  it('builds a schedule of one entry per module', () => {
    const sched = buildSuccessionSchedule('2026-08-01');
    expect(Array.isArray(sched)).toBe(true);
    expect(sched.length).toBe(SUCCESSION_MODULES.length);
  });

  it('summarizes progress and exports a markdown curriculum naming the course', () => {
    const summary = successionProgressSummary({ [SUCCESSION_MODULES[0].id]: true });
    expect(summary.total).toBe(SUCCESSION_MODULES.length);
    const md = exportSuccessionCurriculumMarkdown('2026-08-01');
    expect(typeof md).toBe('string');
    expect(md).toContain('Handed Forward');
  });

  it('exposes a tutor meta grounded in the course', () => {
    expect(SUCCESSION_TUTOR_META.title).toBe(SUCCESSION_META.title);
    expect(SUCCESSION_TUTOR_META.posture).toMatch(/commission|clone/i);
  });
});
