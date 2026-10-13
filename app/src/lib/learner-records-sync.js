// =============================================================================
// learner-records-sync — a learner's record crosses devices and reaches the
// Governor (DR-0754)
// =============================================================================
// Darrell 2026-10-05: his son is reading the lessons on his own phone, and
// Darrell wants his completion rates and his exam scores. The device-local
// `data.classProgress` / `data.classQuiz` maps never left that phone, so this
// module carries the same two facts to public.learner_lesson_records (0250),
// whose walls let a learner write only his own rows and let the Governor read
// every learner's and write none.
//
// Contract (every call is best-effort and never throws into a read):
//
//   await saveLearnerRecord({ lessonId, courseKey, completedAt, quiz, ... })
//     Upserts ONE row on (user_id, lesson_id). Returns
//     { saved:true, record } | { skipped:'signed-out' | 'demo' | 'no-lesson' }
//     | { error }.
//
//   await fetchLearnerRecords({ governor })
//     Reads the rows this account is allowed to read — his own, or every
//     learner's when he is the Governor. Returns { records } | { error }.
//
//   subscribeLearnerRecords(onRecords)
//     Fetches once, then re-fetches when the table changes in realtime
//     (0250 adds the table to supabase_realtime). Returns an unsubscribe
//     function. No-op when signed out.
//
// The client is injectable so every path is testable without a network, and
// the default is the app's own Supabase client.
// =============================================================================

import defaultClient from './supabase.js';
import { rowToRecord, recordToRow } from './learner-records.js';

const TABLE = 'learner_lesson_records';

async function sessionOf(client) {
  try {
    const { data } = await client.auth.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}

/**
 * Keep one lesson's record for the signed-in learner.
 *
 * @param {object} rec
 * @param {string} rec.lessonId      the module id, as the course names it
 * @param {string} [rec.courseKey]   which course it belongs to
 * @param {string} [rec.learnerLabel] what the learner calls himself
 * @param {string} [rec.ageBand]     the band he is reading at
 * @param {string|Date|null} [rec.completedAt] when he marked it read
 * @param {object} [rec.quiz]        { pct, passed, at, attempts } from gradeQuiz
 * @param {object} [opts]
 * @param {object} [opts.client]     an injected Supabase client (tests)
 * @param {boolean} [opts.demo]      demo mode writes nothing, ever
 */
export async function saveLearnerRecord(rec = {}, { client = defaultClient, demo = false } = {}) {
  if (demo) return { skipped: 'demo' };
  if (!rec.lessonId) return { skipped: 'no-lesson' };
  const session = await sessionOf(client);
  if (!session) return { skipped: 'signed-out' };

  const quiz = rec.quiz || {};
  const payload = recordToRow({
    lessonId: rec.lessonId,
    courseKey: rec.courseKey ?? null,
    learnerLabel: rec.learnerLabel ?? null,
    ageBand: rec.ageBand ?? null,
    completedAt: rec.completedAt ?? null,
    quizPct: quiz.pct ?? rec.quizPct ?? null,
    quizPassed: quiz.passed ?? rec.quizPassed ?? null,
    quizAt: quiz.at ?? rec.quizAt ?? null,
    quizAttempts: quiz.attempts ?? rec.quizAttempts ?? 0,
  });

  try {
    const { error } = await client
      .from(TABLE)
      .upsert(payload, { onConflict: 'user_id,lesson_id' });
    if (error) return { error };
    return { saved: true, record: rowToRecord({ ...payload, user_id: session.user?.id || null }) };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Read the learner records this account may read. The read wall (0250) decides
 * the scope: a learner gets his own rows, the Governor gets every learner's.
 * `governor` is not a permission here — it only widens the ORDER/limit for a
 * screen that shows many learners.
 */
export async function fetchLearnerRecords({ client = defaultClient, limit = 2000 } = {}) {
  const session = await sessionOf(client);
  if (!session) return { records: [], skipped: 'signed-out' };
  try {
    const { data, error } = await client
      .from(TABLE)
      .select('user_id, lesson_id, course_key, learner_label, age_band, completed_at, quiz_pct, quiz_passed, quiz_attempts, quiz_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) return { records: [], error };
    const records = (data || []).map(rowToRecord).filter((r) => r.lessonId);
    return { records };
  } catch (err) {
    return { records: [], error: err };
  }
}

/**
 * Fetch once, then re-fetch whenever a record changes. Returns an unsubscribe.
 * A client without realtime still gets the first fetch, so the screen is never
 * empty just because the socket is missing.
 */
export function subscribeLearnerRecords(onRecords, { client = defaultClient, limit = 2000 } = {}) {
  let live = true;
  const push = async () => {
    const { records } = await fetchLearnerRecords({ client, limit });
    if (live && typeof onRecords === 'function') onRecords(records);
  };
  push();

  let channel = null;
  try {
    if (typeof client.channel === 'function') {
      channel = client
        .channel(`learner-records-${Math.random().toString(36).slice(2, 10)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => { push(); })
        .subscribe();
    }
  } catch {
    channel = null;
  }

  return () => {
    live = false;
    try {
      if (channel && typeof client.removeChannel === 'function') client.removeChannel(channel);
    } catch { /* a socket already gone costs nothing */ }
  };
}
