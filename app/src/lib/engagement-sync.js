// =============================================================================
// engagement-sync - Supabase-backed Trivia answers + two-way message thread
// =============================================================================
// Mirrors feedback-sync.js (uploadFeedback / subscribeFeedback) and reuses the
// SAME pattern: tenant membership via ensureTenantMembership() before any
// INSERT (so RLS passes), and a postgres_changes realtime stream on INSERT.
//
// Backed by the trivia_answers + messages tables from
// infra/supabase/schema-v2.11-engagement.sql, whose RLS copies the feedback
// table verbatim (member-of-instance read + own-row insert).
//
// Contract:
//
//   await uploadTriviaAnswer({ questionId, answer, isCorrect, displayName })
//     Writes one trivia_answers row. Best-effort: no-ops if signed out.
//     Returns { uploaded:true } | { skipped:'...' , error? }.
//
//   await sendMessage(body, { thread, displayName })
//     Writes one messages row. Best-effort: no-ops if signed out.
//     Returns { uploaded:true } | { skipped:'...' , error? }.
//
//   subscribeMessages(onMessages, { thread })
//     Fetches existing messages for the thread + listens for new ones in
//     realtime. onMessages(items) fires with the full ordered array each
//     time it changes. Returns an unsubscribe function. No-op if signed out.
//     Items are returned newest-last (chat order), each as:
//       { id, userId, displayName, body, thread, createdAt, mine }
// =============================================================================

import supabase from './supabase.js';
import { ensureTenantMembership } from './feedback-sync.js';

const DEFAULT_THREAD = 'general';

/** Get the current Supabase session, or null. */
async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/** Friendly display name from an explicit value, else the email local part. */
function resolveDisplayName(session, explicit) {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return session.user.email?.split('@')[0] || 'Member';
}

/**
 * Uploads one trivia answer. Best-effort: returns silently if signed out, or
 * if the upload fails (we log but don't throw).
 *
 * @param {object} a
 * @param {string} a.questionId   stable app-side question id
 * @param {string} a.answer       what the member typed
 * @param {boolean} a.isCorrect   computed by the caller (grading is app-side)
 * @param {string} [a.displayName]
 */
export async function uploadTriviaAnswer({ questionId, questionUuid, answer, isCorrect, displayName } = {}) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };

  // Must be a tenant member for the INSERT to pass RLS.
  let instanceId;
  try {
    instanceId = await ensureTenantMembership(displayName);
  } catch (e) {
    console.warn('[engagement-sync] tenant membership setup failed:', e);
    return { skipped: 'no-tenant', error: e };
  }

  const row = {
    instance_id: instanceId,
    user_id: session.user.id,
    display_name: resolveDisplayName(session, displayName),
    question_id: questionId,
    answer: answer ?? '',
    is_correct: !!isCorrect,
    // Only include question_uuid when the caller has a stored question id.
    // Omitting it preserves the v2.11 insert shape, so the shipped demo trivia
    // keeps working even before schema-v2.12 adds the column.
    ...(questionUuid ? { question_uuid: questionUuid } : {}),
  };

  const { error } = await supabase.from('trivia_answers').insert(row);
  if (error) {
    console.warn('[engagement-sync] trivia upload failed:', error);
    return { skipped: 'insert-error', error };
  }
  return { uploaded: true };
}

/**
 * Sends one message into a thread. Best-effort: no-ops if signed out.
 *
 * @param {string} body
 * @param {object} [meta]
 * @param {string} [meta.thread]
 * @param {string} [meta.displayName]
 */
export async function sendMessage(body, meta = {}) {
  const text = (body || '').trim();
  if (!text) return { skipped: 'empty' };

  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };

  let instanceId;
  try {
    instanceId = await ensureTenantMembership(meta.displayName);
  } catch (e) {
    console.warn('[engagement-sync] tenant membership setup failed:', e);
    return { skipped: 'no-tenant', error: e };
  }

  const row = {
    instance_id: instanceId,
    user_id: session.user.id,
    display_name: resolveDisplayName(session, meta.displayName),
    body: text,
    thread: meta.thread || DEFAULT_THREAD,
  };

  const { error } = await supabase.from('messages').insert(row);
  if (error) {
    console.warn('[engagement-sync] message send failed:', error);
    return { skipped: 'insert-error', error };
  }
  return { uploaded: true };
}

/**
 * Subscribes to a message thread. onMessages(items) fires once initially with
 * the fetched list (newest-last), and again each time a new row is inserted.
 * Returns an unsubscribe function. No-op if signed out.
 *
 * @param {(items: Array) => void} onMessages
 * @param {object} [opts]
 * @param {string} [opts.thread]
 */
export function subscribeMessages(onMessages, opts = {}) {
  const thread = opts.thread || DEFAULT_THREAD;
  let channel = null;
  let cancelled = false;

  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;

    const fetchThread = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread', thread)
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('[engagement-sync] message fetch failed:', error);
        return null;
      }
      return (data || []).map((row) => toMessageShape(row, myUserId));
    };

    const initial = await fetchThread();
    if (initial && !cancelled) onMessages(initial);

    // Realtime: re-fetch the thread on any INSERT so ordering + dedup stay
    // trivial. Family-scale traffic is single-digit messages at a time.
    channel = supabase
      .channel(`messages-${thread}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread=eq.${thread}` },
        () => {
          fetchThread().then((refreshed) => {
            if (refreshed && !cancelled) onMessages(refreshed);
          });
        }
      )
      .subscribe();
  })();

  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// -----------------------------------------------------------------------------
// Trivia QUESTIONS (schema-v2.12) — generated-from-a-message, reviewed content.
// These are DORMANT until the v2.12 migration is applied and the UI calls them;
// they do not touch the shipped demo-trivia path above.
// -----------------------------------------------------------------------------

/**
 * Fetch the current LIVE question (status='active') for the signed-in user's
 * instance, newest active_date first. Returns the question shape or null
 * (signed out, none active, or the table not present yet).
 */
export async function getActiveQuestion() {
  const session = await currentSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('trivia_questions')
    .select('*')
    .eq('status', 'active')
    .order('active_date', { ascending: false })
    .limit(1);
  if (error) {
    console.warn('[engagement-sync] active question fetch failed:', error);
    return null;
  }
  return data && data[0] ? toQuestionShape(data[0]) : null;
}

/**
 * Reviewer-only: fetch questions awaiting review (status='draft'), oldest
 * first. RLS returns rows only to owner/admin members; everyone else gets [].
 */
export async function getReviewQuestions() {
  const session = await currentSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('trivia_questions')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('[engagement-sync] review fetch failed:', error);
    return [];
  }
  return (data || []).map(toQuestionShape);
}

/**
 * Reviewer-only: approve a draft and make it the live question — sets
 * status='active', active_date=today, approved_by + approved_at. RLS enforces
 * owner/admin. Returns { ok:true } | { error }.
 */
export async function approveQuestion(questionId, { activeDate } = {}) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };

  const today = activeDate || new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from('trivia_questions')
    .update({
      status: 'active',
      active_date: today,
      approved_by: session.user.id,
      approved_at: new Date().toISOString(),
      updated_by: session.user.id,
    })
    .eq('id', questionId);
  if (error) {
    console.warn('[engagement-sync] approve failed:', error);
    return { error };
  }
  return { ok: true };
}

/** Reviewer-only: reject a draft (status='rejected'). */
export async function rejectQuestion(questionId) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };

  const { error } = await supabase
    .from('trivia_questions')
    .update({ status: 'rejected', updated_by: session.user.id })
    .eq('id', questionId);
  if (error) {
    console.warn('[engagement-sync] reject failed:', error);
    return { error };
  }
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Map a trivia_questions row into the shape the UI renders. */
function toQuestionShape(row) {
  return {
    id: row.id,
    prompt: row.prompt,
    choices: Array.isArray(row.choices) ? row.choices : [],
    correctChoice: row.correct_choice,
    scriptureRef: row.scripture_ref,
    note: row.note,
    source: row.source,
    sourceRef: row.source_ref,
    messageDate: row.message_date,
    status: row.status,
    activeDate: row.active_date,
  };
}

function toMessageShape(row, myUserId) {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    body: row.body,
    thread: row.thread,
    createdAt: row.created_at,
    mine: row.user_id === myUserId,
  };
}
