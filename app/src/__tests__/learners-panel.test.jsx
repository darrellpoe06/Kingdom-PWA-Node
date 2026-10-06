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
