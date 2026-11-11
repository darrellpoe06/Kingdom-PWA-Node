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
    versionsRead: rec.versionsRead,
    readEvidenceAt: rec.readEvidenceAt,
    quizTaken: quiz.taken ?? rec.quizTaken,
  });
  // ONLY WHAT WAS SAID IS WRITTEN (DR-1255, measured in this file): the row
  // is one per lesson and the upsert merges by column, so a mark-read that
  // carried `quiz_pct: null` erased the exam the learner had passed, and an
  // exam that carried `completed_at: null` erased the read. A fact not named
  // in the call is left as the row has it.
  const saidQuiz = rec.quiz !== undefined || rec.quizPct !== undefined || rec.quizPassed !== undefined
    || rec.quizAt !== undefined || rec.quizAttempts !== undefined;
  if (!saidQuiz) { delete payload.quiz_pct; delete payload.quiz_passed; delete payload.quiz_attempts; delete payload.quiz_at; }
  if (rec.completedAt === undefined) delete payload.completed_at;
  if (rec.learnerLabel === undefined) delete payload.learner_label;
  if (rec.ageBand === undefined) delete payload.age_band;
  if (rec.courseKey === undefined) delete payload.course_key;

  try {
    let { error } = await client
      .from(TABLE)
      .upsert(payload, { onConflict: 'user_id,lesson_id' });
    // NEVER LOSE A WRITE TO THE ORDER OF A DEPLOY (DR-1396). The evidence
    // columns arrive with migration 0316; if the app reaches a database that
    // does not have them yet, the same write is sent again without them, so
    // the reading and the score are still kept.
    if (error && (payload.quiz_taken !== undefined || payload.read_evidence_at !== undefined)
      && (error.code === 'PGRST204' || isMissingColumn(error, 'quiz_taken') || isMissingColumn(error, 'read_evidence_at'))) {
      delete payload.quiz_taken;
      delete payload.read_evidence_at;
      ({ error } = await client.from(TABLE).upsert(payload, { onConflict: 'user_id,lesson_id' }));
    }
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
// The columns a record is read with. `quiz_history` arrived with 0313; a
// backend the migration has not reached yet (the deploy and the migration
// walk the same tailnet road, and a build can land before the column does)
// refuses the whole select with PostgreSQL's 42703. The read then asks again
// without that one column, so the record never goes dark for a column it
// can live without — the ledger simply reads as empty until 0313 lands.
// `read_evidence_at` and `quiz_taken` arrived with 0316 (DR-1396) and fall back
// the same way: a backend without them reads the record without them.
const READ_COLUMNS = 'user_id, lesson_id, course_key, learner_label, age_band, completed_at, quiz_pct, quiz_passed, quiz_attempts, quiz_at, versions_read, quiz_history, read_evidence_at, quiz_taken, updated_at';
const READ_COLUMNS_BEFORE_0316 = READ_COLUMNS.replace(', read_evidence_at, quiz_taken', '');
const READ_COLUMNS_BEFORE_0313 = READ_COLUMNS_BEFORE_0316.replace(', quiz_history', '');

export function isMissingColumn(error, column) {
  if (!error) return false;
  const text = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
  return (error.code === '42703' || /does not exist|column/i.test(text)) && text.includes(column);
}

export async function fetchLearnerRecords({ client = defaultClient, limit = 2000 } = {}) {
  const session = await sessionOf(client);
  if (!session) return { records: [], skipped: 'signed-out' };
  const read = (columns) => client
    .from(TABLE)
    .select(columns)
    .order('updated_at', { ascending: false })
    .limit(limit);
  try {
    let { data, error } = await read(READ_COLUMNS);
    if (error && (isMissingColumn(error, 'read_evidence_at') || isMissingColumn(error, 'quiz_taken'))) ({ data, error } = await read(READ_COLUMNS_BEFORE_0316));
    if (error && isMissingColumn(error, 'quiz_history')) ({ data, error } = await read(READ_COLUMNS_BEFORE_0313));
    if (error) return { records: [], error };
    const records = (data || []).map(rowToRecord).filter((r) => r.lessonId);
    return { records };
  } catch (err) {
    return { records: [], error: err };
  }
}

// ── THE LATEST NUMBERS, EVERY TIME THE RECORD IS OPENED (DR-1417) ────────────
// Darrell, 2026-11-10: "Are the latest numbers always available when clicked
// on record? If not fix it... latest numbers always... Synced with latest
// reading data... make sure... each time... triggers for whatever."
//
// MEASURED BEFORE THIS: the record was read ONCE at sign-in and again only
// when a realtime change arrived. Nothing re-read it when the Record was
// opened, when the app came back to the front, when the network returned, or
// after this device's own save. So with the socket down (it is not proven on
// the sovereign road) the figures were as old as the sign-in. And a read that
// FAILED handed the screen an empty list, which drew a learner with no record.
//
// NOW the record is re-read on every one of those moments, each a real event
// and none a timer: REFRESH_EVENT (the Record opening, the Refresh button,
// this device's own save landing), the page becoming visible, the window
// taking focus, the network returning, and the realtime change as before.
// Reads are coalesced (one in flight, one queued) and spaced MIN_REFRESH_MS
// apart so a burst of events is one read. A failed read keeps what is on the
// screen and says so; freshness (when it was last read, and whether the last
// try reached it) is published for the panel to show.
export const REFRESH_EVENT = 'poe:learner-records-refresh';
export const MIN_REFRESH_MS = 1500;

let freshness = { at: null, ok: null, reading: false };
const freshnessListeners = new Set();
function setFreshness(patch) {
  freshness = { ...freshness, ...patch };
  for (const fn of freshnessListeners) fn();
}
export function getRecordsFreshness() {
  return freshness;
}
export function subscribeRecordsFreshness(fn) {
  freshnessListeners.add(fn);
  return () => freshnessListeners.delete(fn);
}
/** Ask for the record to be read again now. Safe anywhere; a no-op with no window. */
export function requestLearnerRecordsRefresh() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event(REFRESH_EVENT));
}

/**
 * Fetch once, then re-fetch whenever a record changes or the record is asked
 * for again (see above). Returns an unsubscribe.
 */
export function subscribeLearnerRecords(onRecords, { client = defaultClient, limit = 2000, now = () => Date.now(), minGapMs = MIN_REFRESH_MS } = {}) {
  let live = true;
  let reading = false;
  let queued = false;
  let lastStart = -Infinity;
  let timer = null;

  const read = async () => {
    reading = true;
    lastStart = now();
    setFreshness({ reading: true });
    const res = await fetchLearnerRecords({ client, limit });
    reading = false;
    if (!live) return;
    if (res.error) {
      // What is on the screen stays; the panel says the last try did not reach the record.
      setFreshness({ reading: false, ok: false });
    } else {
      setFreshness({ reading: false, ok: true, at: new Date(now()).toISOString() });
      if (typeof onRecords === 'function') onRecords(res.records);
    }
    if (queued) {
      queued = false;
      push();
    }
  };
  // One read in flight, at most one waiting, never closer together than minGapMs.
  function push() {
    if (!live) return;
    if (reading) {
      queued = true;
      return;
    }
    const wait = lastStart + minGapMs - now();
    if (wait > 0) {
      if (timer === null) {
        timer = setTimeout(() => {
          timer = null;
          push();
        }, wait);
      }
      return;
    }
    read();
  }
  read();

  let channel = null;
  try {
    if (typeof client.channel === 'function') {
      channel = client
        .channel(`learner-records-${Math.random().toString(36).slice(2, 10)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
          push();
        })
        .subscribe();
    }
  } catch {
    channel = null;
  }

  const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  const onVisible = () => {
    if (typeof document === 'undefined' || document.visibilityState !== 'hidden') push();
  };
  if (hasWindow) {
    window.addEventListener(REFRESH_EVENT, push);
    window.addEventListener('focus', push);
    window.addEventListener('online', push);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
  }

  return () => {
    live = false;
    if (timer !== null) clearTimeout(timer);
    if (hasWindow) {
      window.removeEventListener(REFRESH_EVENT, push);
      window.removeEventListener('focus', push);
      window.removeEventListener('online', push);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    }
    try {
      if (channel && typeof client.removeChannel === 'function') client.removeChannel(channel);
    } catch {
      /* a socket already gone costs nothing */
    }
  };
}
