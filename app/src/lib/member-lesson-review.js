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

import { lessonNameOf } from './one-voice-surfaces.js';

export const APPROVED_TAG = 'lesson-approved';
// DR-0639: the Governor approved, but kept it anonymous though a name was offered.
export const ANONYMOUS_TAG = 'lesson-anonymous';
export const DECLINED_TAG = 'lesson-declined';

// Said to the member, word for word (Darrell 2026-09-24, through the
// coordinator: "Approved: a lesson is being written from your situation; your
// name is not used.").
export const OUTCOME_LINES = Object.freeze({
  pending: 'Waiting for review. A lesson written from your situation is reviewed before it is published.',
  approved: 'Approved: a lesson is being written from your situation; your name is not used.',
  approvedNamed: 'Approved: a lesson is being written from your situation, with your name as you gave it.',
  declined: 'Not written as a new lesson: {reason}. These lessons from the Word already speak to it.',
});

const hasTag = (row, t) => Array.isArray(row && row.tags) && row.tags.includes(t);

/** The review outcome of one of the member's own lesson rows. */
export function memberOutcome(row) {
  if (hasTag(row, APPROVED_TAG)) {
    const named = !!nameForLesson(row);
    return { state: 'approved', line: named ? OUTCOME_LINES.approvedNamed : OUTCOME_LINES.approved, reason: '', named };
  }
  if (hasTag(row, DECLINED_TAG)) {
    const reason = String((row && row.review_reason) || '').trim() || 'no reason was given';
    return { state: 'declined', line: OUTCOME_LINES.declined.replace('{reason}', reason), reason };
  }
  return { state: 'pending', line: OUTCOME_LINES.pending, reason: '' };
}

/** A decision the client may send. A decline without a reason never leaves the page. */
export function validateDecision(decision, reason) {
  if (decision !== 'approve' && decision !== 'approve-anonymous' && decision !== 'decline') return { ok: false, reason: 'unknown decision' };
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

/** Rows that still owe the member a Message (DR-0639). Governor-only. */
export async function fetchMemberLessonOutbox({ supabase }) {
  try {
    const { data, error } = await supabase.rpc('member_lesson_outbox');
    if (error) return { ok: false, rows: [], reason: error.message };
    return { ok: true, rows: Array.isArray(data) ? data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e?.message || 'unknown' };
  }
}

/** Mark a lesson Message sent ('decision' or 'published'). */
export async function markMemberLessonMessaged({ supabase, id, kind }) {
  const { error } = await supabase.rpc('mark_member_lesson_messaged', { p_row: id, p_kind: kind });
  if (error) throw new Error(error.message);
  return true;
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
    return { ok: true, reason: '', tag: (data && data.tag) || (decision === 'decline' ? DECLINED_TAG : APPROVED_TAG), anonymous: decision === 'approve-anonymous' };
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
  'Without "lesson-name-ok" (or with "lesson-anonymous"): never use the member’s name, or any name, anywhere in the lesson, its grounds, its commit, or its report.',
  'With "lesson-name-ok" and no "lesson-anonymous": use ONLY the name the member gave in the "lesson-name:" tag, exactly as they gave it, and no other name; every other identifying detail is still changed.',
  'Change every identifying detail: people, places, employers, dates, ages, numbers, and anything that would let someone who knows them tell it was them.',
  'Keep the situation general: teach the Word to the kind of situation, not to the person’s particulars.',
  'Word first, every verse verbatim and pinned, exactly as for the Governor’s own lessons; mark the row "lesson-captured" only after the push.',
  'When the lesson is published, also tag the row "lesson-published" and "lesson-id:<the lesson\u2019s id>", so the member sees it in Your lessons and is sent a Message (DR-0639).',
];

/** The name the reader may use for this row, or '' (anonymous). DR-0639. */
export function nameForLesson(row) {
  const tags = (row && row.tags) || [];
  if (tags.includes(ANONYMOUS_TAG)) return '';
  return lessonNameOf(tags);
}

/** What the Governor's queue shows for the member's choice. */
export function nameChoiceLabel(row) {
  const n = lessonNameOf((row && row.tags) || []);
  return n ? `Named: ${n}` : 'Anonymous';
}

/** Whether the lesson reader may capture this row (the protocol, as code). */
export function readerMayCapture(row, { governorIds = [] } = {}) {
  if (!hasTag(row, 'lesson') || hasTag(row, 'lesson-captured')) return false;
  if (governorIds.includes(row && row.created_by)) return true;
  return hasTag(row, APPROVED_TAG);
}
