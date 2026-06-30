import { describe, it, expect } from 'vitest';
import {
  DECISIONS, makeApproval, applyApproval, courseApprovalStatus, courseApproval,
  isCoursePublishable, publishableCourses, approvalSummary,
} from '../lib/tlc-course-approval.js';

const courses = [
  { id: 'c1', title: 'A' },
  { id: 'c2', title: 'B' },
  { id: 'c3', title: 'C' },
];

describe('Christina SME approval gate', () => {
  it('a fresh course is PENDING (honest default — not auto-approved)', () => {
    expect(courseApprovalStatus({}, 'c1')).toBe(DECISIONS.PENDING);
    expect(isCoursePublishable(courses[0], {})).toBe(false);
  });

  it('PROVEN-TO-CATCH: a course is publishable ONLY after an explicit Agree (approve)', () => {
    let state = {};
    expect(isCoursePublishable(courses[0], state)).toBe(false);
    state = applyApproval(state, 'c1', { decision: DECISIONS.APPROVED, by: 'christina@x.com', at: 'NOW' });
    expect(isCoursePublishable(courses[0], state)).toBe(true);
  });

  it('Disagree (reject) keeps a course OUT of the learner view', () => {
    const state = applyApproval({}, 'c2', { decision: DECISIONS.REJECTED, by: 'christina@x.com', at: 'NOW', note: 'fix the framing' });
    expect(isCoursePublishable(courses[1], state)).toBe(false);
    expect(courseApproval(state, 'c2').note).toBe('fix the framing');
  });

  it('applyApproval is immutable and ignores an invalid decision (fail-safe, no accidental approve)', () => {
    const before = applyApproval({}, 'c1', { decision: DECISIONS.APPROVED });
    const after = applyApproval(before, 'c1', { decision: 'nonsense' });
    expect(after).not.toBe(before);              // new object
    expect(courseApprovalStatus(after, 'c1')).toBe(DECISIONS.APPROVED); // unchanged
    const empty = applyApproval({}, 'c1', { decision: 'nonsense' });
    expect(courseApprovalStatus(empty, 'c1')).toBe(DECISIONS.PENDING);  // never approved
  });

  it('publishableCourses returns only the approved subset', () => {
    let state = {};
    state = applyApproval(state, 'c1', { decision: DECISIONS.APPROVED });
    state = applyApproval(state, 'c3', { decision: DECISIONS.APPROVED });
    expect(publishableCourses(courses, state).map((c) => c.id)).toEqual(['c1', 'c3']);
  });

  it('approvalSummary tallies the review queue', () => {
    let state = {};
    state = applyApproval(state, 'c1', { decision: DECISIONS.APPROVED });
    state = applyApproval(state, 'c2', { decision: DECISIONS.REJECTED });
    expect(approvalSummary(courses, state)).toEqual({ total: 3, approved: 1, rejected: 1, pending: 1 });
  });

  it('makeApproval normalizes an unknown decision to pending', () => {
    expect(makeApproval({ decision: 'weird' }).decision).toBe(DECISIONS.PENDING);
  });
});
