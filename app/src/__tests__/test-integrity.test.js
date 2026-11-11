// =============================================================================
// Credit where it is due: the pure rules (DR-1386)
// =============================================================================
// READ on evidence (seen or heard to the floor, seen at a reading pace with
// grace); an exam's TAKING (before / partly / after reading, quick or not) kept
// apart from its GRADING; UNDERSTOOD (read in full and the exam at 100%, DR-1417)
// as the main goal; and every line an evaluation, never a condemnation.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  isMastery,
  READ_FLOOR,
  GRACE_WPM,
  readingReached,
  hasReadEvidence,
  pacedSeen,
  attemptIntegrity,
  attemptIntegrityLine,
  testIntegrityKpis,
} from '../lib/test-integrity.js';

const at = (min) => new Date(Date.UTC(2026, 10, 10, 9, 0, 0) + min * 60000).toISOString();

describe('READ is credited on evidence', () => {
  it('either witness to the floor is a reading; less is not', () => {
    expect(hasReadEvidence({ seen: READ_FLOOR })).toBe(true);
    expect(hasReadEvidence({ heard: 0.95 })).toBe(true);
    expect(hasReadEvidence({ seen: 0.5, heard: 0.6 })).toBe(false);
    expect(hasReadEvidence(null)).toBe(false);
    expect(readingReached({ seen: 2, heard: -1 }), 'clamped').toBe(1);
  });

  it('seen is credited no faster than a reader reads, with grace; a slow reader is never held back', () => {
    // 1000 words all on screen at once: nothing is credited before there was time to read them.
    expect(pacedSeen({ raw: 1, words: 1000, ms: 0 })).toBe(0);
    // After one minute, GRACE_WPM words are credited.
    expect(pacedSeen({ raw: 1, words: 1000, ms: 60000 })).toBeCloseTo(GRACE_WPM / 1000);
    // A slow reader (200 words in a minute on screen) gets all 200.
    expect(pacedSeen({ raw: 0.2, words: 1000, ms: 60000 })).toBe(0.2);
    // A reading resumed keeps what was already credited and adds from there.
    expect(pacedSeen({ raw: 1, from: 0.5, words: 1000, ms: 30000 })).toBeCloseTo(0.5 + GRACE_WPM / 2 / 1000);
    expect(pacedSeen({ raw: 0.3, from: 0.5, words: 1000, ms: 0 }), 'never more than what is on screen now').toBe(0.3);
  });
});

describe('how an exam was taken, kept apart from what it scored', () => {
  it('names the reading before it and the pace of it', () => {
    expect(attemptIntegrity({ reached: 0.95, ms: 120000, questions: 8 })).toEqual({ reading: 'after', readPct: 95, secsPerQuestion: 15, rushed: false });
    expect(attemptIntegrity({ reached: 0.4 }).reading).toBe('partly');
    expect(attemptIntegrity({ reached: 0 }).reading).toBe('before');
    expect(attemptIntegrity({ reached: 1, ms: 8000, questions: 8 }).rushed, 'a second a question is quicker than the questions can be read').toBe(true);
    expect(attemptIntegrity({ reached: 1, ms: null, questions: 8 }).rushed, 'unmeasured is never called quick').toBe(false);
  });

  it('every line is an evaluation, never a condemnation: the score is kept and nothing scolds', () => {
    const lines = [
      attemptIntegrityLine(attemptIntegrity({ reached: 1, ms: 120000, questions: 8 })),
      attemptIntegrityLine(attemptIntegrity({ reached: 0.4, ms: 4000, questions: 8 })),
      attemptIntegrityLine(attemptIntegrity({ reached: 0, ms: 4000, questions: 8 })),
    ];
    expect(lines[0]).toBe('Taken after reading (100% of the lesson seen or heard).');
    expect(lines[1]).toMatch(/Your score is kept/);
    expect(lines[2]).toMatch(/^Taken before reading the lesson \(0% seen or heard\)\. Your score is kept/);
    expect(lines[2]).toMatch(/no limit on tries/);
    for (const l of lines) expect(l).not.toMatch(/cheat|fail|wrong|lazy|rolled|guess|should have|not counted|rushed/i);
    expect(attemptIntegrityLine(null)).toBe('');
  });
});

describe('the KPIs that notice how a test was taken', () => {
  const records = [
    // Read at 9:10; passed at 9:20 on the first try: understood.
    { lessonId: 'a', completedAt: at(10), quizHistory: [{ at: at(20), pct: 100, passed: true }] },
    // Never read; failed, retaken 30 s later and passed (quick retake, passed before reading).
    {
      lessonId: 'b',
      completedAt: null,
      quizHistory: [
        { at: at(0), pct: 50, passed: false, integrity: { rushed: true } },
        { at: at(0.5), pct: 88, passed: true },
      ],
    },
    // Passed at 9:00, read at 9:30: the pass came before the reading.
    { lessonId: 'c', completedAt: at(30), quizHistory: [{ at: at(0), pct: 90, passed: true }] },
    { lessonId: 'd', quizHistory: [] },
  ];

  it('counts taking and grading apart, and understood as the main goal', () => {
    expect(testIntegrityKpis(records)).toEqual({
      taken: 4,
      passed: 3,
      rushed: 1,
      afterReading: 1,
      beforeReading: 3,
      passedBeforeReading: 2,
      quickRetakes: 1,
      triesToFirstPass: 1.3,
      understood: 1,
      readAndPassed: 1,
      lessonsTested: 3,
    });
    expect(testIntegrityKpis([])).toEqual({
      taken: 0,
      passed: 0,
      rushed: 0,
      afterReading: 0,
      beforeReading: 0,
      passedBeforeReading: 0,
      quickRetakes: 0,
      triesToFirstPass: null,
      understood: 0,
      readAndPassed: 0,
      lessonsTested: 0,
    });
  });

  it('PROVEN TO CATCH: a pass before the reading is never counted as understood, and a slow retake is not quick', () => {
    const k = testIntegrityKpis([records[2]]);
    expect(k.understood).toBe(0);
    expect(k.passedBeforeReading).toBe(1);
    const slow = testIntegrityKpis([
      {
        lessonId: 'e',
        quizHistory: [
          { at: at(0), pct: 50, passed: false },
          { at: at(5), pct: 100, passed: true },
        ],
      },
    ]);
    expect(slow.quickRetakes).toBe(0);
    expect(slow.triesToFirstPass).toBe(2);
  });
});

describe('understood is mastery: the lesson read in full AND the exam at 100% (DR-1417)', () => {
  const day = (m) => new Date(Date.UTC(2026, 10, 10, 9, m)).toISOString();
  const one = (pct, taken, completedAt = day(0)) => ({ lessonId: `l-${pct}-${JSON.stringify(taken)}`, completedAt, quizHistory: [{ at: day(20), pct, passed: pct >= 70, ...(taken ? { taken } : {}) }] });

  it('both in full is understood', () => {
    expect(isMastery({ pct: 100, readPct: 100 })).toBe(true);
    expect(testIntegrityKpis([one(100, { reading: 'after', readPct: 100 })])).toMatchObject({ understood: 1, readAndPassed: 1, lessonsTested: 1 });
  });
  it('PROVEN TO CATCH: a pass short of 100% is read and passed, never understood', () => {
    for (const pct of [70, 88, 99]) {
      expect(isMastery({ pct, readPct: 100 })).toBe(false);
      expect(testIntegrityKpis([one(pct, { reading: 'after', readPct: 100 })])).toMatchObject({ understood: 0, readAndPassed: 1 });
    }
  });
  it('PROVEN TO CATCH: 100% on the exam with the lesson 90% read is read and passed, never understood', () => {
    for (const readPct of [90, 95, 99]) {
      expect(isMastery({ pct: 100, readPct })).toBe(false);
      expect(testIntegrityKpis([one(100, { reading: 'after', readPct })])).toMatchObject({ understood: 0, readAndPassed: 1 });
    }
  });
  it('100% before the lesson was read is not understood, and the score is still kept as a pass', () => {
    expect(testIntegrityKpis([one(100, { reading: 'before', readPct: 0 })])).toMatchObject({ understood: 0, readAndPassed: 0, passed: 1, passedBeforeReading: 1 });
  });
  it('an attempt from before the reading was measured: 100% with the lesson on the record first is the most the record can say', () => {
    expect(isMastery({ pct: 100, readBefore: true })).toBe(true);
    expect(isMastery({ pct: 100, readBefore: false })).toBe(false);
    expect(testIntegrityKpis([one(100, null)]).understood).toBe(1);
    expect(testIntegrityKpis([one(100, null, day(40))]).understood).toBe(0);
    expect(testIntegrityKpis([one(90, null)]).understood).toBe(0);
  });
  it('a later attempt finishes it: 80% then 100% with the lesson read in full is one lesson understood', () => {
    const r = { lessonId: 'x', completedAt: day(0), quizHistory: [{ at: day(10), pct: 80, passed: true, taken: { reading: 'after', readPct: 92 } }, { at: day(30), pct: 100, passed: true, taken: { reading: 'after', readPct: 100 } }] };
    expect(testIntegrityKpis([r])).toMatchObject({ understood: 1, readAndPassed: 1, lessonsTested: 1, taken: 2 });
  });
  it('PROVEN TO CATCH: 100% reached by a retake within a minute, or answered faster than the questions can be read, is not understood', () => {
    const quick = { lessonId: 'q', completedAt: day(0), quizHistory: [{ at: day(20), pct: 60, passed: false, taken: { reading: 'after', readPct: 100 } }, { at: new Date(Date.parse(day(20)) + 30000).toISOString(), pct: 100, passed: true, taken: { reading: 'after', readPct: 100 } }] };
    expect(testIntegrityKpis([quick])).toMatchObject({ understood: 0, readAndPassed: 1, quickRetakes: 1, passed: 1 });
    const slow = { ...quick, quizHistory: [quick.quizHistory[0], { ...quick.quizHistory[1], at: day(30) }] };
    expect(testIntegrityKpis([slow]).understood).toBe(1);
    expect(testIntegrityKpis([one(100, { reading: 'after', readPct: 100, rushed: true })])).toMatchObject({ understood: 0, readAndPassed: 1, rushed: 1 });
    expect(isMastery({ pct: 100, readPct: 100, rushed: true })).toBe(false);
    expect(isMastery({ pct: 100, readPct: 100, quickRetake: true })).toBe(false);
    const line = attemptIntegrityLine(attemptIntegrity({ reached: 1, ms: 8000, questions: 8 }), 100);
    expect(line).toMatch(/this try was answered very quickly, so take it once more at your own pace/);
    expect(line).not.toMatch(/Understood: the lesson read in full and every answer right/);
  });

  it('the line under the score says where understanding stands, and never scolds', () => {
    const full = attemptIntegrityLine(attemptIntegrity({ reached: 1, ms: 120000, questions: 8 }), 100);
    expect(full).toBe('Taken after reading (100% of the lesson seen or heard). Understood: the lesson read in full and every answer right.');
    const short = attemptIntegrityLine(attemptIntegrity({ reached: 0.93, ms: 120000, questions: 8 }), 88);
    expect(short).toMatch(/Understood is the lesson read in full and its exam at 100%: the lesson is 93% read and the exam is at 88%\. Both are yours to finish/);
    expect(attemptIntegrityLine(attemptIntegrity({ reached: 1, ms: 120000, questions: 8 }), 88)).toMatch(/: the exam is at 88%\./);
    for (const l of [full, short]) expect(l).not.toMatch(/cheat|fail|wrong|lazy|rolled|guess|should have|not counted|rushed/i);
    expect(attemptIntegrityLine(attemptIntegrity({ reached: 1, ms: 120000, questions: 8 }))).toBe('Taken after reading (100% of the lesson seen or heard).');
  });
});
