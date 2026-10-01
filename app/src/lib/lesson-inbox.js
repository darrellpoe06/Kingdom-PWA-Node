// =============================================================================
// lesson-inbox — the speaker's own receipt for every lesson they sent
// (DR-0622: every workflow's output seeds the next; the sender sees it close)
// =============================================================================
// A lesson sent from the app (typed, or spoken and written down by Whisper on
// our own machines, DR-0611) lands in agent_inbox. The NAS job transcribes the
// spoken ones and carries every lesson row to where the cloud lesson reader
// can see it, tagging the original `mirrored` (DR-0614). Until this module,
// nothing in the app read those rows back: the speaker was told "Sent" and
// then saw nothing, not even the words Whisper wrote. This reads them back.
//
// The states, each one a fact in the row's own tags (never inferred):
//   waiting  — a spoken lesson Whisper has not written down yet
//   written  — its transcript row exists (tags voice-transcript + of:<id>)
//   failed   — the transcriber gave up and said why (voice-failed + of:<id>)
//   sent     — a typed lesson, filed
//   reader   — the row (or its transcript) was carried to the lesson reader
//              (tag `mirrored`)
// Pure except fetchMyLessons, which takes the Supabase client as an argument.
// =============================================================================

import { memberOutcome } from './member-lesson-review.js';
import { isLessonDoorOwner } from './one-voice-surfaces.js';
import { publishedLessonOf } from './lesson-review-messages.js';

const has = (row, t) => Array.isArray(row && row.tags) && row.tags.includes(t);
const ofTag = (row) => (Array.isArray(row && row.tags) ? (row.tags.find((t) => String(t).startsWith('of:')) || '').slice(3) : '');

export const LESSON_STATES = Object.freeze({
  waiting: 'Waiting for Whisper to write it down',
  written: 'Written down by Whisper',
  failed: 'Could not be written down',
  sent: 'Received',
});

// The rung a transcript names (whisper:<key>), in words.
const RUNG_NAMES = Object.freeze({ 'nas-cpu': 'the NAS CPU', tlcmediadpt: 'the 4070 tower' });

// DR-0672, THE TENANCY GUARD. Darrell sends from two sign-ins that are both his
// (lesson_governor_emails() in migration 0237 lists their doors; these are the
// two accounts behind them). The database is the real gate: my_lesson_rows()
// (0241) gives a member only their own rows and the Governor only his two
// doors'. This is the second lock, on the client: whatever a read returns,
// Your lessons shows a member only rows they wrote, and the Governor only rows
// his own two accounts wrote. Never another member's.
export const GOVERNOR_LESSON_ACCOUNTS = Object.freeze([
  'f13843f2-742b-4f8a-82af-7ecfbdc536ec',
  'c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc',
]);

/** The rows this person may see in Your lessons. */
export function ownLessonRows(rows, { uid, owner = false } = {}) {
  if (!uid) return [];
  const allowed = new Set([uid, ...(owner && GOVERNOR_LESSON_ACCOUNTS.includes(uid) ? GOVERNOR_LESSON_ACCOUNTS : [])]);
  return (Array.isArray(rows) ? rows : []).filter((r) => r && allowed.has(r.created_by));
}

/** Rows → one item per lesson the person sent, newest first. */
export function lessonItems(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const children = new Map();
  for (const r of list) {
    const of = ofTag(r);
    if (of && (has(r, 'voice-transcript') || has(r, 'voice-failed'))) children.set(`${of}:${has(r, 'voice-failed') ? 'failed' : 'transcript'}`, r);
  }
  const items = [];
  for (const r of list) {
    // A child row (a transcript or a failure report) names its parent with
    // of:<id>. The PARENT can carry `voice-failed` too — the rider tags the
    // original when it gives up — so the tag must not hide it: Darrell's own
    // spoken lesson of 2026-09-24 was invisible for exactly that (DR-0636).
    if (!has(r, 'lesson') || ofTag(r)) continue;
    const spoken = has(r, 'voice');
    const transcript = children.get(`${r.id}:transcript`) || null;
    const failure = children.get(`${r.id}:failed`) || null;
    const state = !spoken ? 'sent' : transcript ? 'written' : failure ? 'failed' : 'waiting';
    const carried = has(r, 'mirrored') || has(transcript, 'mirrored') || has(failure, 'mirrored');
    // DR-0672: the builder's progress may sit on the parent or on the
    // transcript it built from; the road reads both.
    const progressTags = [...new Set([...(r.tags || []), ...((transcript && transcript.tags) || []), ...((failure && failure.tags) || [])])];
    const rungTag = transcript ? (transcript.tags || []).find((t) => String(t).startsWith('whisper:')) : '';
    items.push({
      id: r.id,
      createdAt: r.created_at || '',
      createdBy: r.created_by || '',
      transcriptId: transcript ? transcript.id || '' : '',
      transcriptAt: transcript ? transcript.created_at || '' : '',
      failedAt: failure ? failure.created_at || '' : '',
      rung: rungTag ? RUNG_NAMES[String(rungTag).slice(8)] || String(rungTag).slice(8) : '',
      progressTags,
      spoken,
      state,
      label: LESSON_STATES[state],
      body: String(r.body || ''),
      words: transcript ? String(transcript.body || '') : '',
      why: failure ? String(failure.body || '') : '',
      withReader: carried,
      // DR-0635: the Governor's review of a member's lesson, read from the row
      // that carries the words (the transcript, for a spoken one).
      review: memberOutcome(spoken ? (transcript || {}) : r),
      // DR-0639: the reader tags the row `lesson-published` + `lesson-id:<id>`.
      published: publishedLessonOf((spoken ? (transcript || {}) : r).tags || []),
    });
  }
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** The signed-in person's own lesson rows. { ok, items, reason }. */
export async function fetchMyLessons({ supabase, limit = 100 } = {}) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id || null;
    if (!uid) return { ok: false, items: [], reason: 'signed-out' };
    const email = sess?.session?.user?.email || '';
    const owner = isLessonDoorOwner(email);
    // DR-0672: my_lesson_rows() (migration 0241) — own rows, and for the
    // Governor both of his doors. A database that has not taken 0241 yet reads
    // the table directly (own rows under 0237's policy), as before.
    const rpc = typeof supabase.rpc === 'function' ? await supabase.rpc('my_lesson_rows', { p_limit: limit }) : { error: { message: 'no rpc' } };
    if (!rpc.error && Array.isArray(rpc.data)) {
      return { ok: true, items: lessonItems(ownLessonRows(rpc.data, { uid, owner })), reason: '', owner, uid, email };
    }
    const read = (cols) => supabase
      .from('agent_inbox')
      .select(cols)
      // tags is jsonb: the filter must be JSON ('["lesson"]'). An array here
      // is sent as cs.{lesson}, which is not JSON, and the read fails every time.
      .contains('tags', JSON.stringify(['lesson']))
      .eq('created_by', uid)
      .order('created_at', { ascending: false })
      .limit(limit);
    let { data, error } = await read('id, body, tags, created_at, created_by, review_reason');
    // A database that has not yet taken 0237 has no review_reason column: the
    // lessons still read, and a decline shows without its reason until it does.
    if (error && /review_reason/.test(String(error.message || ''))) ({ data, error } = await read('id, body, tags, created_at, created_by'));
    if (error) return { ok: false, items: [], reason: error.message };
    return { ok: true, items: lessonItems(ownLessonRows(data || [], { uid, owner })), reason: '', owner, uid, email };
  } catch (e) {
    return { ok: false, items: [], reason: e?.message || 'unknown' };
  }
}

// The transcript row's body starts with a header line naming the rung and the
// model; the words follow it. Show the words, not the header, when present.
export function transcriptWords(body) {
  const s = String(body || '');
  const i = s.indexOf('\n\n');
  return i >= 0 ? s.slice(i + 2).trim() : s.trim();
}
// WHO SPOKE (DR-0712). A transcript the NAS marked by voice carries a
// "Speakers:" header above the blank line and one "LABEL: words" line per
// turn (infra/nas-lesson-voice/speaker_turns.py). DP = Darrell Poe, BG =
// Bishop Gwin, S1, S2 = voices not yet named, ? = no voice placed.
export const SPEAKER_LINE = /^(DP|BG|[A-Z]{2,3}|S\d+|\?): (.+)$/;
export function speakerLines(words) {
  const lines = String(words || '').split('\n').filter((l) => l.trim());
  if (!lines.length) return null;
  const out = [];
  for (const l of lines) {
    const m = SPEAKER_LINE.exec(l);
    if (!m) return null; // not a marked transcript: shown as words, never half-parsed
    out.push({ who: m[1], text: m[2] });
  }
  return out;
}
// The Speakers header lines (between the first line and the blank line), or ''.
export function transcriptSpeakers(body) {
  const s = String(body || '');
  const i = s.indexOf('\n\n');
  const head = i >= 0 ? s.slice(0, i) : '';
  return head.split('\n').filter((l) => /^(Speakers:|S\d+ = )/.test(l)).join(' ');
}
// "voice-transcript" is the tag the NAS job writes on a transcript row.
export const TRANSCRIPT_TAG = 'voice-transcript';
