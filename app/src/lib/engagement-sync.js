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
export async function uploadTriviaAnswer({ questionId, answer, isCorrect, displayName } = {}) {
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
// Helpers
// -----------------------------------------------------------------------------

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
