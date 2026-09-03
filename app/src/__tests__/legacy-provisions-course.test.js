// legacy-provisions-course.test.js — "Secure the Legacy: The Provisions That
// Hold". Pins the course structure, valid quizzes, the teaching Darrell spoke on
// 2026-09-02, the honest not-legal-advice boundary, and — the point of the test —
// that every KJV fragment quoted in the lesson prose stays VERBATIM (DR-0076: a
// verse must never drift from the public-domain source, and this test CATCHES a
// drift).
import { describe, it, expect } from 'vitest';
import {
  LEGACY_PROVISIONS_META,
  LEGACY_PROVISIONS_MODULES,
  LEGACY_PROVISIONS_SESSION_FLOW,
  LEGACY_PROVISIONS_SESSION_MINUTES,
  LEGACY_PROVISIONS_CARE_NOTE,
  buildLegacyProvisionsSchedule,
  legacyProvisionsProgressSummary,
  exportLegacyProvisionsCurriculumMarkdown,
  legacyProvisionsRefs,
  LEGACY_PROVISIONS_TUTOR_META,
} from '../lib/legacy-provisions-course.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { gradeQuiz } from '../lib/learn-framework.js';

// The whole authored corpus flattened to one string — so a verse check hits the
// lesson, both level texts, the big idea and the declared Word-first frame.
const corpus = [
  LEGACY_PROVISIONS_META.wordFirst?.frame,
  ...LEGACY_PROVISIONS_MODULES.map((m) =>
    [m.bigIdea, m.lesson, m.levels?.child, m.levels?.senior].filter(Boolean).join('\n')),
].filter(Boolean).join('\n\n');

describe('legacy provisions course: structure', () => {
  it('has a keyed meta and seven real lessons', () => {
    expect(LEGACY_PROVISIONS_META.key).toBe('legacy-provisions');
    expect(LEGACY_PROVISIONS_MODULES.length).toBe(7);
    expect(LEGACY_PROVISIONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0))
      .toBe(LEGACY_PROVISIONS_SESSION_MINUTES);
  });

  it('every lesson carries title, bigIdea, an anchor with a ref, both age levels, and a lesson', () => {
    for (const m of LEGACY_PROVISIONS_MODULES) {
      expect(m.id, 'module id').toBeTruthy();
      expect(m.title, `${m.id} title`).toBeTruthy();
      expect(m.bigIdea, `${m.id} bigIdea`).toBeTruthy();
      expect(m.anchor?.ref, `${m.id} anchor.ref`).toBeTruthy();
      expect(m.anchor?.theme, `${m.id} anchor.theme`).toBeTruthy();
      expect(m.levels?.child, `${m.id} child level`).toBeTruthy();
      expect(m.levels?.senior, `${m.id} senior level`).toBeTruthy();
      expect(m.lesson, `${m.id} lesson`).toBeTruthy();
      expect(m.inApp, `${m.id} inApp`).toBeTruthy();
    }
  });

  it('every quiz question has a valid answer index and grades a perfect score', () => {
    for (const m of LEGACY_PROVISIONS_MODULES) {
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

  it('declares its own Word-first lead rather than borrowing the first lesson anchor', () => {
    expect(LEGACY_PROVISIONS_META.wordFirst?.ref).toBeTruthy();
    expect(String(LEGACY_PROVISIONS_META.wordFirst?.frame || '').trim().length).toBeGreaterThan(80);
  });
});

describe('legacy provisions course: the three provisions Darrell spoke are all taught', () => {
  const ids = LEGACY_PROVISIONS_MODULES.map((m) => m.id);

  it('teaches the family constitution reference', () => {
    expect(ids).toContain('legacy2-constitution');
    expect(corpus.toLowerCase()).toContain('family constitution');
    expect(corpus).toMatch(/values, (our )?mission/i);
  });

  it('teaches the spendthrift provision, including WHY it protects (ownership)', () => {
    expect(ids).toContain('legacy3-spendthrift');
    expect(corpus.toLowerCase()).toContain('spendthrift');
    expect(corpus).toMatch(/owned by the trust/i);
    expect(corpus).toMatch(/creditor/i);
    expect(corpus).toMatch(/divorce/i);
  });

  it('teaches forced income production — produce, build, invest, contribute back', () => {
    expect(ids).toContain('legacy4-forced-production');
    expect(corpus).toMatch(/produce/i);
    expect(corpus).toMatch(/contribute value back|contribute .{0,20}back into the trust/i);
  });

  it('carries the second-or-third-generation reason he gave for all three', () => {
    expect(corpus).toMatch(/third generation|children’s children|grandchildren/i);
  });
});

describe('legacy provisions course: honest boundaries (DR-0076)', () => {
  it('says plainly that it is not legal advice, on the meta so every surface renders it', () => {
    expect(LEGACY_PROVISIONS_META.care).toBe(LEGACY_PROVISIONS_CARE_NOTE);
    expect(LEGACY_PROVISIONS_CARE_NOTE).toMatch(/not legal advice/i);
    expect(LEGACY_PROVISIONS_CARE_NOTE).toMatch(/attorney/i);
  });

  it('states the real LIMITS of a spendthrift clause rather than overselling it', () => {
    const spendthrift = LEGACY_PROVISIONS_MODULES.find((m) => m.id === 'legacy3-spendthrift');
    const text = `${spendthrift.lesson}\n${spendthrift.levels.senior}`;
    expect(text).toMatch(/child support/i);
    expect(text).toMatch(/fund(ed)? (it )?for yourself|self-settled/i);
  });

  it('does not promise the app gives legal advice in the tutor posture', () => {
    expect(LEGACY_PROVISIONS_TUTOR_META.posture).toMatch(/never give legal advice/i);
  });
});

describe('legacy provisions course: Scripture is verbatim KJV (DR-0076, proven-to-catch)', () => {
  // Each fragment was fetched verbatim from app/public/bible/kjv/*.json. If an
  // edit paraphrases a verse, this test fails — that is the safeguard.
  const VERBATIM = [
    'A good man leaveth an inheritance to his children’s children',                                        // Proverbs 13:22
    'riches kept for the owners thereof to their hurt',                                                     // Ecclesiastes 5:13
    'he begetteth a son, and there is nothing in his hand',                                                 // Ecclesiastes 5:14
    'An inheritance may be gotten hastily at the beginning; but the end thereof shall not be blessed',      // Proverbs 20:21
    'took his journey into a far country, and there wasted his substance with riotous living',              // Luke 15:13
    'thou shalt teach them diligently unto thy children',                                                   // Deuteronomy 6:7
    'thou shalt write them upon the posts of thy house, and on thy gates',                                  // Deuteronomy 6:9
    'but as for me and my house, we will serve the LORD',                                                   // Joshua 24:15
    'Write the vision, and make it plain upon tables, that he may run that readeth it',                     // Habakkuk 2:2
    'The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me', // Leviticus 25:23
    'So shall not the inheritance of the children of Israel remove from tribe to tribe',                    // Numbers 36:7
    'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished',       // Proverbs 22:3
    'Thou oughtest therefore to have put my money to the exchangers',                                       // Matthew 25:27
    'Occupy till I come',                                                                                   // Luke 19:13
    'the LORD God took the man, and put him into the garden of Eden to dress it and to keep it',            // Genesis 2:15
    'if any would not work, neither should he eat',                                                         // 2 Thessalonians 3:10
    'the heir, as long as he is a child, differeth nothing from a servant, though he be lord of all',       // Galatians 4:1
    'But is under tutors and governors until the time appointed of the father',                             // Galatians 4:2
    'He that is faithful in that which is least is faithful also in much',                                  // Luke 16:10
    'who should arise and declare them to their children',                                                  // Psalms 78:6
    'the same commit thou to faithful men, who shall be able to teach others also',                         // 2 Timothy 2:2
    'ye shall return every man unto his possession, and ye shall return every man unto his family',          // Leviticus 25:10
    'if any of his kin come to redeem it, then shall he redeem that which his brother sold',                 // Leviticus 25:25
    'the right of redemption is thine to buy it',                                                            // Jeremiah 32:7
    'there is no new thing under the sun',                                                                   // Ecclesiastes 1:9
  ];
  for (const frag of VERBATIM) {
    it(`quotes verbatim: "${frag.slice(0, 40)}…"`, () => {
      expect(corpus).toContain(frag);
    });
  }

  it('every cited reference is a real, parseable reference', () => {
    const refs = legacyProvisionsRefs();
    expect(refs.length).toBeGreaterThan(10);
    for (const r of refs) expect(r).toMatch(/^[1-3]?\s?[A-Za-z]+\s+\d+:\d+(-\d+)?$/);
  });
});

describe('legacy provisions course: shared-framework wrappers + catalog wiring', () => {
  it('builds a schedule of one row per lesson, undated because it is self-paced', () => {
    const sched = buildLegacyProvisionsSchedule(null);
    expect(sched.length).toBe(LEGACY_PROVISIONS_MODULES.length);
    // Self-paced: no cohort start means NO fabricated calendar date (DR-0076).
    for (const row of sched) expect(row.date).toBeNull();
  });

  it('summarizes progress and exports a markdown curriculum naming the course', () => {
    const summary = legacyProvisionsProgressSummary({ [LEGACY_PROVISIONS_MODULES[0].id]: true });
    expect(summary.total).toBe(LEGACY_PROVISIONS_MODULES.length);
    expect(summary.done).toBe(1);
    const md = exportLegacyProvisionsCurriculumMarkdown();
    expect(md).toContain('Secure the Legacy');
  });

  it('is REGISTERED in the Learn catalog — a course nobody can reach is not shipped', () => {
    const entry = LEARN_CATALOG.find((c) => c.key === 'legacy-provisions');
    expect(entry, 'legacy-provisions must be in LEARN_CATALOG').toBeTruthy();
    expect(entry.meta.title).toBe(LEGACY_PROVISIONS_META.title);
    expect(entry.buildScheduleRows().length).toBe(LEGACY_PROVISIONS_MODULES.length);
    expect(typeof entry.exportMarkdown()).toBe('string');
  });
});
