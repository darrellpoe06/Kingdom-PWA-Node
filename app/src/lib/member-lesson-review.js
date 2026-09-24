// =============================================================================
// member-lesson-review — the Governor's queue for members' lessons (DR-0635)
// =============================================================================
// Darrell 2026-09-24: "Que for me to review..." A member's own situation, sent
// under the Lesson chip, becomes a new lesson only after he reviews it. This
// is the door DR-0312 kept shut, widened by his word and no further.
//
// The live rows only (migration 0237): the queue is member_lesson_queue(), a
// Governor-only function; a decision is review_member_lesson(), which appends
// `lesson-approved`, or `lesson-declined` with the reason he gives. The member
// reads the outcome on their own row (lesson-inbox.js), and the reader Routine
// captures a member's row ONLY when it carries `lesson-approved`.
//
// Pure except the three calls, which take the Supabase client as an argument.
// =============================================================================

export const APPROVED_TAG = 'lesson-approved';
export const DECLINED_TAG = 'lesson-declined';

// Said to the member, word for word (Darrell 2026-09-24, through the
// coordinator: "Approved: a lesson is being written from your situation; your
// name is not used.").
export const OUTCOME_LINES = Object.freeze({
  pending: 'Waiting for review. A lesson written from your situation is reviewed before it is published.',
  approved: 'Approved: a lesson is being written from your situation; your name is not used.',
  declined: 'Not written as a new lesson: {reason}. These lessons from the Word already speak to it.',
});

const hasTag = (row, t) => Array.isArray(row && row.tags) && row.tags.includes(t);

/** The review outcome of one of the member's own lesson rows. */
export function memberOutcome(row) {
  if (hasTag(row, APPROVED_TAG)) return { state: 'approved', line: OUTCOME_LINES.approved, reason: '' };
  if (hasTag(row, DECLINED_TAG)) {
    const reason = String((row && row.review_reason) || '').trim() || 'no reason was given';
    return { state: 'declined', line: OUTCOME_LINES.declined.replace('{reason}', reason), reason };
  }
  return { state: 'pending', line: OUTCOME_LINES.pending, reason: '' };
}

/** A decision the client may send. A decline without a reason never leaves the page. */
export function validateDecision(decision, reason) {
  if (decision !== 'approve' && decision !== 'decline') return { ok: false, reason: 'unknown decision' };
  if (decision === 'decline' && !String(reason || '').trim()) return { ok: false, reason: 'a decline needs a reason the member will read' };
  return { ok: true, reason: '' };
}

/** The Governor's queue: undecided member lesson rows, oldest first. */
export async function fetchMemberLessonQueue({ supabase }) {
  try {
    const { data, error } = await supabase.rpc('member_lesson_queue');
    if (error) return { ok: false, rows: [], reason: error.message };
    return { ok: true, rows: Array.isArray(data) ? data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e?.message || 'unknown' };
  }
}

/** Approve or decline one row. { ok, reason, tag }. */
export async function reviewMemberLesson({ supabase, id, decision, reason = '' }) {
  const v = validateDecision(decision, reason);
  if (!v.ok) return { ok: false, reason: v.reason, tag: '' };
  try {
    const { data, error } = await supabase.rpc('review_member_lesson', {
      p_row: id,
      p_decision: decision,
      p_reason: decision === 'decline' ? String(reason).trim() : null,
    });
    if (error) return { ok: false, reason: error.message, tag: '' };
    return { ok: true, reason: '', tag: (data && data.tag) || (decision === 'approve' ? APPROVED_TAG : DECLINED_TAG) };
  } catch (e) {
    return { ok: false, reason: e?.message || 'unknown', tag: '' };
  }
}

// THE READER'S PROTOCOL FOR A MEMBER'S ROW (DR-0635), kept here so the Routine
// prompt and the notice the member read before sending cannot drift apart
// (LESSON_NOTICE in one-voice-surfaces.js). The same text is in the DR and is
// what the in-app lesson Routine carries.
export const READER_PROTOCOL_FOR_MEMBER_ROWS = [
  'A lesson row whose created_by is not the Governor is captured ONLY when its tags include "lesson-approved". A member row without it (undecided, or tagged "lesson-declined") is counted and reported, never captured.',
  'Never use the member’s name, or any name, anywhere in the lesson, its grounds, its commit, or its report.',
  'Change every identifying detail: people, places, employers, dates, ages, numbers, and anything that would let someone who knows them tell it was them.',
  'Keep the situation general: teach the Word to the kind of situation, not to the person’s particulars.',
  'Word first, every verse verbatim and pinned, exactly as for the Governor’s own lessons; mark the row "lesson-captured" only after the push.',
];

/** Whether the lesson reader may capture this row (the protocol, as code). */
export function readerMayCapture(row, { governorIds = [] } = {}) {
  if (!hasTag(row, 'lesson') || hasTag(row, 'lesson-captured')) return false;
  if (governorIds.includes(row && row.created_by)) return true;
  return hasTag(row, APPROVED_TAG);
}
