// =============================================================================
// tlc-course-approval — Christina (LCSW) is the SME approver. Per-course gate.
// =============================================================================
// Declared by Darrell 2026-06-29 (deliverable #5): every course arrives DONE; Christina
// reviews it with an explicit AGREE / DISAGREE (approve / reject). HER CLINICAL
// JUDGMENT IS THE GATE — a course is not "published" to learners until she approves
// it. Courses are pre-built so she REVIEWS, not authors.
//
// This is the PURE state model behind that gate. Approval state is a map keyed by
// course id; the surface persists it (localStorage today; a practice_training table
// is the named next step). Decisions are explicit and three-valued:
//   * 'approved' — AGREE. Christina signs off; the course is publishable to learners.
//   * 'rejected' — DISAGREE. She withholds it; it stays in review, NOT shown to a
//                  learner. A reason can ride along (note).
//   * null / 'pending' — not yet reviewed (the honest default for a fresh course).
//
// VERIFICATION (DR-0076): a course's `validated` flag in the library is the AUTHORED
// default (false). The LIVE gate is this approval state — `isCoursePublishable`
// requires an explicit 'approved'. The model NEVER auto-approves; only a recorded
// decision flips it. Pure + deterministic (caller passes `at`/`by`).
// =============================================================================

export const DECISIONS = Object.freeze({ APPROVED: 'approved', REJECTED: 'rejected', PENDING: 'pending' });
const VALID = new Set([DECISIONS.APPROVED, DECISIONS.REJECTED, DECISIONS.PENDING]);

// One approval record. Pure factory.
export function makeApproval(partial = {}) {
  const p = partial || {};
  const decision = VALID.has(p.decision) ? p.decision : DECISIONS.PENDING;
  return {
    decision,
    by: p.by || '',          // who decided (e.g. Christina's email/name)
    at: p.at || null,        // ISO timestamp of the decision
    note: p.note || '',      // optional reason, esp. on a DISAGREE
  };
}

// Read the current decision for a course from the approval-state map. Unknown →
// PENDING (honest default — un-reviewed, not approved).
export function courseApprovalStatus(approvalState = {}, courseId) {
  const rec = approvalState && approvalState[courseId];
  if (!rec) return DECISIONS.PENDING;
  return VALID.has(rec.decision) ? rec.decision : DECISIONS.PENDING;
}

export function courseApproval(approvalState = {}, courseId) {
  const rec = approvalState && approvalState[courseId];
  return rec ? makeApproval(rec) : makeApproval({});
}

// Apply a decision immutably. Returns a NEW approval-state map (does not mutate).
// `decision` must be approved | rejected | pending; anything else is ignored and
// the prior state is returned unchanged (fail-safe — no accidental approval).
export function applyApproval(approvalState = {}, courseId, { decision, by = '', at = null, note = '' } = {}) {
  if (!courseId || !VALID.has(decision)) return { ...(approvalState || {}) };
  return { ...(approvalState || {}), [courseId]: makeApproval({ decision, by, at, note }) };
}

// THE LIVE GATE. A course is publishable to learners ONLY on an explicit 'approved'.
// validated:false in the library + no approval = NOT publishable. No auto-approve.
export function isCoursePublishable(course, approvalState = {}) {
  if (!course) return false;
  return courseApprovalStatus(approvalState, course.id) === DECISIONS.APPROVED;
}

// The subset of a course list a LEARNER may see (approved only). Staff/Christina see
// everything (the review queue); learners see only what passed her gate.
export function publishableCourses(courses = [], approvalState = {}) {
  return (courses || []).filter((c) => isCoursePublishable(c, approvalState));
}

// Roll up the review state for a set of courses — the review queue's header numbers.
export function approvalSummary(courses = [], approvalState = {}) {
  const list = courses || [];
  const tally = { total: list.length, approved: 0, rejected: 0, pending: 0 };
  for (const c of list) {
    const d = courseApprovalStatus(approvalState, c.id);
    if (d === DECISIONS.APPROVED) tally.approved += 1;
    else if (d === DECISIONS.REJECTED) tally.rejected += 1;
    else tally.pending += 1;
  }
  return tally;
}
