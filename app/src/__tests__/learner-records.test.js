// @vitest-environment node
// =============================================================================
// learner-records — a learner's real record, and what it adds up to (DR-0754)
// =============================================================================
// Darrell 2026-10-05: "my son is reading the lessons testing the app and seeing
// how it flows for him... we want to keep analytics on what he's completion
// rates are and competency scores based on the exams in the lessons.. make
// sense?"
//
// PROVEN-TO-CATCH. Every assertion here fails against the shipped behavior
// before this: there was no record that left the device, so there was nothing
// to roll up, no completion rate and no competency score. The honest-zero
// assertions also catch the obvious wrong implementation — one that counts an
// untested learner as 0% or invents a completion rate from the rows it happens
// to hold.
import { describe, it, expect } from 'vitest';
import {
  rowToRecord, recordToRow, mergeRecordsIntoState,
  aggregateLearnerRecords, competencyBand, COMPETENCY_BANDS,
} from '../lib/learner-records.js';
import { QUIZ_PASS_RATIO } from '../lib/learn-framework.js';

const SON = 'b0000000-0000-4000-a000-000000000250';
const OTHER = 'c0000000-0000-4000-a000-000000000250';

function row(over = {}) {
  return {
    user_id: SON,
    lesson_id: 'L1',
    course_key: 'living-lessons',
    learner_label: 'Son',
    age_band: 'teen',
    completed_at: '2026-10-01T10:00:00.000Z',
    quiz_pct: 80,
    quiz_passed: true,
    quiz_attempts: 1,
    quiz_at: '2026-10-01T10:05:00.000Z',
    updated_at: '2026-10-01T10:05:00.000Z',
    ...over,
  };
}

describe('a row and a record are the same two facts', () => {
  it('a database row becomes the record the app reads', () => {
    const rec = rowToRecord(row());
    expect(rec).toMatchObject({
      userId: SON, lessonId: 'L1', courseKey: 'living-lessons',
      learnerLabel: 'Son', ageBand: 'teen', quizPct: 80, quizPassed: true, quizAttempts: 1,
    });
    expect(rec.completedAt).toBe('2026-10-01T10:00:00.000Z');
  });

  it('a record never names its owner — the column defaults to auth.uid() and the wall refuses any other (DR-0060)', () => {
    const payload = recordToRow({ lessonId: 'L1', userId: OTHER, quizPct: 90 });
    expect(payload.user_id).toBeUndefined();
    expect(payload.lesson_id).toBe('L1');
    expect(payload.quiz_pct).toBe(90);
  });

  it('a score that is not a number stays null, so no exam is invented', () => {
    expect(recordToRow({ lessonId: 'L1', quizPct: '' }).quiz_pct).toBeNull();
    expect(recordToRow({ lessonId: 'L1' }).quiz_pct).toBeNull();
    expect(rowToRecord(row({ quiz_pct: null })).quizPct).toBeNull();
  });

  it('an unreadable date is dropped rather than carried as a bad value', () => {
    expect(rowToRecord(row({ completed_at: 'not a date' })).completedAt).toBeNull();
  });
});

describe('the band the Governor reads at a glance', () => {
  it('uses the framework’s own pass line, so one number governs the gate and the band', () => {
    expect(COMPETENCY_BANDS.find((b) => b.key === 'passing').min).toBe(Math.round(QUIZ_PASS_RATIO * 100));
  });

  it('names each band from a real score', () => {
    expect(competencyBand(100).key).toBe('mastered');
    expect(competencyBand(90).key).toBe('mastered');
    expect(competencyBand(85).key).toBe('strong');
    expect(competencyBand(70).key).toBe('passing');
    expect(competencyBand(42).key).toBe('working');
  });

  it('NO exam is "Not yet tested", never a failing zero — proven to catch', () => {
    expect(competencyBand(null).key).toBe('not-yet');
    expect(competencyBand(undefined).key).toBe('not-yet');
    // The wrong implementation treats a missing score as 0 and brands an
    // untested learner as failing; these two must not agree.
    expect(competencyBand(null).key).not.toBe(competencyBand(1).key);
    expect(competencyBand(1).key).toBe('working');
  });
});

describe('a record read on one device shows up on the next', () => {
  it('fills in what this device never saw', () => {
    const merged = mergeRecordsIntoState([rowToRecord(row({ lesson_id: 'L7' }))], { progress: {}, quizState: {} });
    expect(merged.progress.L7).toBe('2026-10-01T10:00:00.000Z');
    expect(merged.quizState.L7).toMatchObject({ passed: true, pct: 80 });
  });

  it('the device copy WINS on a module it already knows — it is what he is looking at', () => {
    const merged = mergeRecordsIntoState([rowToRecord(row())], {
      progress: { L1: '2026-09-01T00:00:00.000Z' },
      quizState: { L1: { passed: false, pct: 10, at: '2026-09-01T00:00:00.000Z' } },
    });
    expect(merged.progress.L1).toBe('2026-09-01T00:00:00.000Z');
    expect(merged.quizState.L1.pct).toBe(10);
  });

  it('a record with no lesson id is not a record', () => {
    const merged = mergeRecordsIntoState([{ completedAt: 'x' }], { progress: {}, quizState: {} });
    expect(Object.keys(merged.progress)).toEqual([]);
  });
});

describe('what the record adds up to', () => {
  const rows = [
    row({ lesson_id: 'L1', quiz_pct: 80, quiz_passed: true, quiz_attempts: 1 }),
    row({ lesson_id: 'L2', quiz_pct: 100, quiz_passed: true, quiz_attempts: 2 }),
    row({ lesson_id: 'L3', quiz_pct: null, quiz_passed: null, quiz_at: null, quiz_attempts: 0 }),
    row({ user_id: OTHER, learner_label: 'Another', lesson_id: 'L1', quiz_pct: 40, quiz_passed: false, quiz_attempts: 1 }),
  ];

  it('rolls up per learner, on real counts', () => {
    const { learners, totals } = aggregateLearnerRecords(rows);
    expect(totals.learners).toBe(2);
    const son = learners.find((l) => l.userId === SON);
    expect(son.lessonsRead).toBe(3);
    expect(son.examsTaken).toBe(2);
    expect(son.examsPassed).toBe(2);
    expect(son.quizAttempts).toBe(3);
    expect(son.avgQuizPct).toBe(90);
    expect(son.bestQuizPct).toBe(100);
    expect(son.competency.key).toBe('mastered');
  });

  it('a learner’s average counts only the exams he answered — proven to catch', () => {
    // L3 has no exam. Counting it as a zero would put the average at 60 and
    // drop him two bands; the wrong implementation does exactly that.
    const { learners } = aggregateLearnerRecords(rows);
    const son = learners.find((l) => l.userId === SON);
    expect(son.avgQuizPct).toBe(90);
    expect(son.avgQuizPct).not.toBe(60);
  });

  it('completion is measured against the course, and stays a dash when the count is unknown', () => {
    const withTotals = aggregateLearnerRecords(rows, { courseTotals: { 'living-lessons': 12 } });
    const son = withTotals.learners.find((l) => l.userId === SON);
    const course = son.courses.find((c) => c.courseKey === 'living-lessons');
    expect(course.courseLessons).toBe(12);
    expect(course.completionPct).toBe(25); // 3 of 12 — measured, not painted

    const without = aggregateLearnerRecords(rows);
    const blind = without.learners.find((l) => l.userId === SON).courses[0];
    expect(blind.courseLessons).toBeNull();
    expect(blind.completionPct).toBeNull(); // P15: no number beats a painted one
  });

  it('a learner who never took an exam reads as untested, with honest zeros', () => {
    const { learners, totals } = aggregateLearnerRecords([
      row({ quiz_pct: null, quiz_passed: null, quiz_at: null, quiz_attempts: 0 }),
    ]);
    const only = learners[0];
    expect(only.examsTaken).toBe(0);
    expect(only.avgQuizPct).toBeNull();
    expect(only.competency.key).toBe('not-yet');
    expect(totals.lessonsRead).toBe(1);
  });

  it('no rows is an honest empty, not a crash and not a guess', () => {
    const { learners, totals } = aggregateLearnerRecords([]);
    expect(learners).toEqual([]);
    expect(totals).toMatchObject({ learners: 0, lessonsRead: 0, examsTaken: 0, avgQuizPct: null });
    expect(totals.competency.key).toBe('not-yet');
  });

  it('a label is used only when the learner’s own record carries one — never invented', () => {
    const { learners } = aggregateLearnerRecords([row({ learner_label: null })]);
    expect(learners[0].label).toBeNull();
  });

  it('a lesson in no course is said to be unplaced rather than filed under a guess', () => {
    const { learners } = aggregateLearnerRecords([row({ course_key: null })]);
    expect(learners[0].courses[0].courseKey).toBe('unplaced');
  });

  it('takes raw database rows OR already-mapped records', () => {
    const fromRows = aggregateLearnerRecords([row()]);
    const fromRecords = aggregateLearnerRecords([rowToRecord(row())]);
    expect(fromRecords.totals.lessonsRead).toBe(fromRows.totals.lessonsRead);
    expect(fromRecords.learners[0].avgQuizPct).toBe(fromRows.learners[0].avgQuizPct);
  });
});
