// @vitest-environment jsdom
// =============================================================================
// LearnersPanel — the class record says what it sees (DR-0754)
// =============================================================================
// Copy and behavior are tested together (DR-0691): where the panel promises a
// state, a test renders that state and reads the words a learner would read.
// PROVEN-TO-CATCH: before this there was no surface at all, so each of these
// fails against the shipped app; and the honest-zero cases catch the wrong
// implementation that shows an untested learner as 0% or paints a completion
// rate it cannot measure.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnersPanel from '../components/LearnersPanel.jsx';
import { rowToRecord } from '../lib/learner-records.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SON = 'b0000000-0000-4000-a000-000000000250';
const OTHER = 'c0000000-0000-4000-a000-000000000250';

let host = null;
let root = null;

function draw(props) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(createElement(LearnersPanel, props)); });
  return host.textContent || '';
}

afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null; host = null;
});

function rec(over = {}) {
  return rowToRecord({
    user_id: SON, lesson_id: 'L1', course_key: 'living-lessons',
    learner_label: 'Son', age_band: 'teen',
    completed_at: '2026-10-01T10:00:00.000Z',
    quiz_pct: 80, quiz_passed: true, quiz_attempts: 1,
    quiz_at: '2026-10-01T10:05:00.000Z', updated_at: '2026-10-01T10:05:00.000Z',
    ...over,
  });
}

describe('it never goes blank', () => {
  it('signed out: it names the account as the reason and signing in as the fix', () => {
    const t = draw({ signedIn: false });
    expect(t).toMatch(/kept with your account/i);
    expect(t).toMatch(/Sign in/i);
  });

  it('no rows: it says there is nothing to measure and names the two actions that start it', () => {
    const t = draw({ records: [], currentUserId: SON });
    expect(t).toMatch(/No lessons read yet/i);
    expect(t).toMatch(/Mark a lesson read/i);
    expect(t).toMatch(/answer its exam/i);
  });

  it('records given as null is the same honest empty, not a crash', () => {
    expect(draw({ records: null, currentUserId: SON })).toMatch(/No lessons read yet/i);
  });
});

describe('a learner reads his own record', () => {
  it('shows his real counts and his score', () => {
    const t = draw({ records: [rec(), rec({ lesson_id: 'L2', quiz_pct: 100 })], currentUserId: SON });
    expect(t).toMatch(/Your record/);
    expect(t).toMatch(/Lessons read/);
    expect(t).toMatch(/90%/);        // the average of 80 and 100, measured
    expect(t).toMatch(/Mastered/);
  });

  it('an untested learner reads "Not yet tested", never 0% — proven to catch', () => {
    const t = draw({
      records: [rec({ quiz_pct: null, quiz_passed: null, quiz_at: null, quiz_attempts: 0 })],
      currentUserId: SON,
    });
    expect(t).toMatch(/Not yet tested/);
    expect(t).not.toMatch(/\b0%/);
    expect(t).toMatch(/it is not a score of zero/i);
  });

  it('completion is a measured percentage when the course count is real', () => {
    const t = draw({
      records: [rec(), rec({ lesson_id: 'L2' }), rec({ lesson_id: 'L3' })],
      currentUserId: SON,
      courseTotals: { 'living-lessons': 12 },
    });
    expect(t).toMatch(/3 of 12/);
    expect(t).toMatch(/25%/);
  });

  it('an unknown course count shows a dash AND says why — never a painted rate', () => {
    const t = draw({ records: [rec()], currentUserId: SON });
    expect(t).toMatch(/does not yet know how many lessons/i);
    expect(t).toMatch(/no rate is shown rather than a guessed one/i);
  });

  it('the pass line printed is the one the exam itself uses', () => {
    expect(draw({ records: [rec()], currentUserId: SON })).toMatch(/The pass line is 70%/i);
  });
});

describe('the Governor sees every learner; a learner sees only himself', () => {
  const both = [rec(), rec({ user_id: OTHER, learner_label: 'Another learner', quiz_pct: 40, quiz_passed: false })];

  it('a plain learner is shown ONE record and no class totals — proven to catch', () => {
    // The read wall already decides which rows arrive; the screen must not
    // widen them. Handed someone else's row, a learner still sees only his.
    const t = draw({ records: both, currentUserId: SON, isGovernor: false });
    expect(t).toMatch(/Your record/);
    expect(t).not.toMatch(/Another learner/);
    expect(t).not.toMatch(/Class average/);
  });

  it('the Governor is shown every learner, named, with the class totals', () => {
    const t = draw({ records: both, currentUserId: SON, isGovernor: true });
    expect(t).toMatch(/Another learner/);
    expect(t).toMatch(/Learners/);
    expect(t).toMatch(/Class average/);
    expect(t).toMatch(/You can see it; you cannot change it/i);
  });

  it('the Governor with no record of his own is told why he is not in the list', () => {
    const t = draw({ records: [both[1]], currentUserId: SON, isGovernor: true });
    expect(t).toMatch(/Your own record is not here/i);
  });
});

// =============================================================================
// EVERY EXAM ATTEMPT, WITH ITS MOMENT AND ITS SCORE, AND THE TWO DOORS (DR-1264)
// =============================================================================
// Darrell 2026-10-28, on "5 exams taken · 6 attempts": "How did I take 6 test
// and no know what happened and when? I also should be able to keep 100% by
// using that test again or read it again make sense?" ... "Taking the test
// again". Before this the panel had one number for all his attempts.
describe('every exam attempt is listed, and the doors to retake and reread are his', () => {
  const ledger = [
    { at: '2026-10-28T01:00:00.000Z', pct: 60, passed: false, band: 'adult' },
    { at: '2026-10-28T01:10:00.000Z', pct: 100, passed: true, band: 'adult' },
    { at: '2026-10-28T01:20:00.000Z', pct: 40, passed: false, band: 'adult' },
  ];
  const withLedger = () => [
    rec({ lesson_id: 'L1', quiz_pct: 100, quiz_passed: true, quiz_attempts: 3, quiz_at: ledger[2].at, quiz_history: ledger }),
    rec({ lesson_id: 'L2', quiz_pct: 80, quiz_passed: true, quiz_attempts: 1, quiz_at: '2026-10-27T10:00:00.000Z', quiz_history: [{ at: '2026-10-27T10:00:00.000Z', pct: 80, passed: true }] }),
  ];
  const titleOf = (id) => ({ L1: 'A Way in the Sea', L2: 'The Manuscripts and the Names' })[id] || null;

  it('shows each tested lesson by name with its best, and under it every attempt with its moment and its own score', () => {
    const text = draw({ records: withLedger(), currentUserId: SON, titleOf });
    expect(text).toContain('Every exam attempt');
    expect(text).toContain('4 attempts on 2 lessons');
    expect(host.querySelectorAll('[data-testid="exam-lesson"]')).toHaveLength(2);
    expect(host.querySelectorAll('[data-testid="exam-attempt"]')).toHaveLength(4);
    // the lesson with the newest attempt is first, and reads its best, not its last
    const first = host.querySelector('[data-testid="exam-lesson"]');
    expect(first.getAttribute('data-lesson')).toBe('L1');
    expect(first.textContent).toContain('A Way in the Sea');
    expect(first.textContent).toContain('best 100% · passed');
    // its attempts, newest first, each with its own score and verdict
    const tries = [...first.querySelectorAll('[data-testid="exam-attempt"]')].map((li) => li.textContent);
    expect(tries[0]).toContain('40%');
    expect(tries[0]).toContain('not yet');
    expect(tries[1]).toContain('100%');
    expect(tries[1]).toContain('passed');
    expect(tries[2]).toContain('60%');
    // and the moment is printed as a date and a time, not a bare ISO string
    expect(tries[0]).toMatch(/\d/);
    expect(tries[0]).not.toContain('T01:20');
  });

  it('PROVEN TO CATCH: a lower retake did not lower the headline — the card still reads the best', () => {
    const text = draw({ records: withLedger(), currentUserId: SON, titleOf });
    // average of the two lessons' BEST scores (100, 80) = 90, never of the last attempts (40, 80)
    expect(text).toContain('90%');
    expect(text).not.toContain('60%Not');
  });

  it('his own record carries the two doors, and each names its lesson and course back', () => {
    const retook = []; const reread = [];
    draw({ records: withLedger(), currentUserId: SON, titleOf, onRetake: (c, l) => retook.push([c, l]), onReadAgain: (c, l) => reread.push([c, l]) });
    const first = host.querySelector('[data-testid="exam-lesson"]');
    act(() => { first.querySelector('[data-testid="exam-retake"]').click(); });
    act(() => { first.querySelector('[data-testid="exam-read-again"]').click(); });
    expect(retook).toEqual([['living-lessons', 'L1']]);
    expect(reread).toEqual([['living-lessons', 'L1']]);
  });

  it('the Governor sees another learner’s attempts but no doors into them (a record to read, not to act on)', () => {
    const rows = [rec({ user_id: OTHER, learner_label: 'Other', lesson_id: 'L1', quiz_pct: 100, quiz_passed: true, quiz_attempts: 3, quiz_at: ledger[2].at, quiz_history: ledger })];
    draw({ records: rows, currentUserId: SON, isGovernor: true, titleOf, onRetake: () => {}, onReadAgain: () => {} });
    expect(host.querySelectorAll('[data-testid="exam-attempt"]')).toHaveLength(3);
    expect(host.querySelectorAll('[data-testid="exam-retake"]')).toHaveLength(0);
    expect(host.querySelectorAll('[data-testid="exam-read-again"]')).toHaveLength(0);
  });

  it('a row written before the ledger still shows its last attempt and says so, never a blank', () => {
    const text = draw({ records: [rec({ lesson_id: 'L1', quiz_pct: 90, quiz_passed: true, quiz_attempts: 6, quiz_at: '2026-10-27T10:00:00.000Z' })], currentUserId: SON, titleOf });
    expect(host.querySelectorAll('[data-testid="exam-attempt"]')).toHaveLength(1);
    expect(text).toContain('this is the last of 6');
  });

  it('an untested learner has no attempts list at all (no painted history)', () => {
    draw({ records: [rec({ quiz_pct: null, quiz_passed: null, quiz_attempts: 0, quiz_at: null })], currentUserId: SON, titleOf });
    expect(host.querySelector('[data-testid="exam-history"]')).toBeNull();
  });
});
