// =============================================================================
// lesson-review-messages — the member hears the outcome in Messages (DR-0639)
// =============================================================================
// Darrell 2026-09-24: "Connects to the users and messages systems?" Users, yes:
// every request is the sender's own row. Messages, not until this: the outcome
// only showed if the member opened Your lessons. Now the Governor's OWN client
// sends the member an end-to-end encrypted Message (direct-messages-sync.js):
//   - at each decision: approved (named or anonymous), or declined with his
//     reason and the three lessons from the Word as links;
//   - when a lesson is published: the reader tags the row `lesson-published` +
//     `lesson-id:<id>` (it cannot encrypt from its server side), and his client
//     sends that Message on his NEXT visit to the queue (member_lesson_outbox).
// Encrypted or not at all: a member with no Messages key yet gets no Message
// (never a plaintext one), the decision still stands, and the queue says so.
// A reply in that thread is an ordinary Message to Darrell.
// Pure text builders + one delivery function whose I/O is injected.
// =============================================================================
import { lessonUrl, lessonQuery } from './lesson-links.js';
import { lessonsForSituation, buildSituationIndex, defaultLessonCourses, LIVING_LESSONS_KEY } from './lessons-for-situation.js';
import { nameForLesson } from './member-lesson-review.js';

export const PUBLISHED_TAG = 'lesson-published';
export const LESSON_ID_PREFIX = 'lesson-id:';

const has = (tags, t) => Array.isArray(tags) && tags.includes(t);

/** The published lesson a row names, or null. { lessonId, number, title, href }. */
export function publishedLessonOf(tags, { courses = null } = {}) {
  if (!has(tags, PUBLISHED_TAG)) return null;
  const tag = (tags || []).find((t) => String(t).startsWith(LESSON_ID_PREFIX));
  const lessonId = tag ? String(tag).slice(LESSON_ID_PREFIX.length).trim() : '';
  if (!lessonId) return null;
  const m = /^ll(\d+)/i.exec(lessonId);
  const entry = buildSituationIndex(courses || defaultLessonCourses()).byKey.get(`${LIVING_LESSONS_KEY}/${lessonId}`);
  return {
    lessonId,
    number: m ? `L${m[1]}` : '',
    title: entry ? entry.title : '',
    href: lessonQuery({ courseKey: LIVING_LESSONS_KEY, lessonId }),
  };
}

/** The Message for a decision. */
export function decisionMessage(row, { url = (o) => lessonUrl(o) } = {}) {
  const tags = (row && row.tags) || [];
  if (has(tags, 'lesson-approved')) {
    const name = nameForLesson(row);
    return name
      ? `Your lesson request was approved. A lesson is being written from your situation, with your name as you gave it: ${name}. Other personal details are changed. Reply here if you want to add anything.`
      : 'Your lesson request was approved. A lesson is being written from your situation; your name is not used, and personal details are changed. Reply here if you want to add anything.';
  }
  if (has(tags, 'lesson-declined')) {
    const reason = String((row && row.review_reason) || '').trim() || 'no reason was given';
    const matches = lessonsForSituation((row && row.body) || '');
    const list = matches.map((m, i) => `${i + 1}. ${m.title}: ${url({ courseKey: m.courseKey, lessonId: m.lessonId })}`).join('\n');
    return list
      ? `Your lesson request was not written as a new lesson: ${reason}. These lessons from the Word already speak to it:\n${list}\nReply here if you want to talk about it.`
      : `Your lesson request was not written as a new lesson: ${reason}. Reply here if you want to talk about it.`;
  }
  return '';
}

/** The Message for a published lesson. */
export function publishedMessage(row, { url = (o) => lessonUrl(o), courses = null } = {}) {
  const p = publishedLessonOf((row && row.tags) || [], { courses });
  if (!p) return '';
  const label = [p.number, p.title].filter(Boolean).join(' ');
  return `Your lesson is published: ${label || p.lessonId}. Open it: ${url({ courseKey: LIVING_LESSONS_KEY, lessonId: p.lessonId })}`;
}

/** Which Message a row still owes: 'published', 'decision', or ''. */
export function owedMessage(row) {
  const tags = (row && row.tags) || [];
  if (has(tags, PUBLISHED_TAG) && !has(tags, 'messaged:published')) return 'published';
  if ((has(tags, 'lesson-approved') || has(tags, 'lesson-declined')) && !has(tags, 'messaged:decision') && !has(tags, 'messaged:published')) return 'decision';
  return '';
}

// The plain words the queue shows for each delivery outcome.
export const DELIVERY_LINES = Object.freeze({
  sent: 'Sent to them in Messages, encrypted.',
  'no-key': 'They’ll see it in Your lessons; no Messages key yet.',
  'no-shared-space': 'They’ll see it in Your lessons; you share no Messages space yet.',
  failed: 'They’ll see it in Your lessons; the Message did not send ({reason}).',
});

/**
 * Send the Message a row owes, from the Governor's own client, and mark it
 * sent. Never throws; a failure never touches the decision.
 * deps: { loadDmContacts, sendDirectMessage, markMessaged(id, kind) }
 * Returns { kind, status: 'sent'|'no-key'|'no-shared-space'|'failed'|'none', line, reason }.
 */
export async function deliverLessonMessage(row, deps, { kind = owedMessage(row), displayName = 'Darrell' } = {}) {
  if (!kind) return { kind: '', status: 'none', line: '', reason: '' };
  const text = kind === 'published' ? publishedMessage(row) : decisionMessage(row);
  if (!text) return { kind, status: 'none', line: '', reason: '' };
  try {
    const contacts = await deps.loadDmContacts();
    const contact = (contacts || []).find((c) => c.userId === row.created_by);
    if (!contact) return { kind, status: 'no-shared-space', line: DELIVERY_LINES['no-shared-space'], reason: '' };
    const res = await deps.sendDirectMessage(row.created_by, text, displayName, contact.instanceId, { requireEncryption: true });
    if (res && res.sent) {
      await deps.markMessaged(row.id, kind);
      // A published lesson's Message also answers the decision one.
      if (kind === 'published' && !has(row.tags, 'messaged:decision')) await deps.markMessaged(row.id, 'decision');
      return { kind, status: 'sent', line: DELIVERY_LINES.sent, reason: '' };
    }
    if (res && res.skipped === 'no-key') return { kind, status: 'no-key', line: DELIVERY_LINES['no-key'], reason: '' };
    const reason = (res && (res.skipped || res.error?.message)) || 'unknown';
    return { kind, status: 'failed', line: DELIVERY_LINES.failed.replace('{reason}', reason), reason };
  } catch (e) {
    const reason = e?.message || 'unknown';
    return { kind, status: 'failed', line: DELIVERY_LINES.failed.replace('{reason}', reason), reason };
  }
}
