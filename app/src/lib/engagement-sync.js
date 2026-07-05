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
import { churchInstanceId } from './church-instance.js';

// Church module: Engagement/Trivia is CHURCH content (BG's message), so it now
// scopes to the church instance — the same tenant Choir uses — not the family
// (Darrell 2026-06-14, "unify Church surfaces on the church instance"). Every
// read filters by the resolved church instance_id so a multi-instance user
// (family + church) never sees the other instance's rows (the 2026-06-12
// cross-instance-bleed lesson: filter reads, don't rely on RLS alone).
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

  // Church-scoped: resolve the church instance for the INSERT to pass RLS.
  const instanceId = await churchInstanceId(displayName);
  if (!instanceId) return { skipped: 'no-church' };

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

  const instanceId = await churchInstanceId(meta.displayName);
  if (!instanceId) return { skipped: 'no-church' };

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
    const instanceId = await churchInstanceId();
    if (!instanceId || cancelled) { if (!cancelled) onMessages([]); return; }

    const fetchThread = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('instance_id', instanceId)
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
// Trivia QUESTIONS (schema-v2.12 + migration 0044) — Bishop Gwin's OWN questions
// from his Wednesday messages, surfaced LIVE BY DEFAULT.
//
// These are the pastor's real authored questions (like a sermon), NOT
// AI-generated content — so there is NO human-approval gate. An extracted
// question goes live the moment it lands; nothing parks on Darrell, Christina,
// or any reviewer (binding rule: no hold on a non-technical person; validation =
// ship + feedback returns in-app). Any concern about whether the EXTRACTION is
// faithful is handled as a verifiable, deterministic check (checkQuestionFidelity)
// — the gate is on the DATA, never on a person. Correction is post-hoc and
// reversible (retractQuestion): ship-then-fix, not pre-publish review.
// -----------------------------------------------------------------------------

/**
 * Fetch the current LIVE question for the signed-in user's instance — the newest
 * question that has not been retracted. Live by default: a freshly-extracted
 * question shows without waiting on an approval step. Returns the question shape
 * or null (signed out, none yet, or the table not present yet).
 */
export async function getActiveQuestion() {
  const session = await currentSession();
  if (!session) return null;
  const instanceId = await churchInstanceId();
  if (!instanceId) return null;

  const { data, error } = await supabase
    .from('trivia_questions')
    .select('*')
    .eq('instance_id', instanceId)
    .neq('status', 'rejected')
    .order('active_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) {
    console.warn('[engagement-sync] active question fetch failed:', error);
    return null;
  }
  return data && data[0] ? toQuestionShape(data[0]) : null;
}

/**
 * Fetch recent LIVE questions (newest first) for a member-facing history.
 * Live by default; retracted questions are excluded.
 */
export async function getRecentQuestions(limit = 20) {
  const session = await currentSession();
  if (!session) return [];
  const instanceId = await churchInstanceId();
  if (!instanceId) return [];

  const { data, error } = await supabase
    .from('trivia_questions')
    .select('*')
    .eq('instance_id', instanceId)
    .neq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[engagement-sync] recent questions fetch failed:', error);
    return [];
  }
  return (data || []).map(toQuestionShape);
}

/**
 * Verifiable EXTRACTION-FIDELITY check (pure; no I/O) — the quality gate that
 * REPLACES human approval. A question pulled from BG's message must be
 * well-formed to publish honestly: a real prompt, at least two distinct labeled
 * choices, a correct_choice that matches one of those choice keys, and a known
 * provenance source. Returns { ok, issues: string[] }. A failing question is a
 * broken EXTRACTION to re-run or auto-retract, never content held on a person —
 * the gate is on the DATA, not on Darrell.
 */
export function checkQuestionFidelity(question = {}) {
  const issues = [];
  const prompt = String(question.prompt ?? '').trim();
  if (prompt.length < 6) issues.push('prompt-missing-or-too-short');

  const choices = Array.isArray(question.choices) ? question.choices : [];
  const keys = choices
    .map((c) => (c && typeof c === 'object' ? c.key : undefined))
    .filter((k) => k !== undefined && k !== null && String(k).trim() !== '');
  const labels = choices
    .map((c) => (c && typeof c === 'object' ? String(c.label ?? '').trim() : ''))
    .filter((l) => l !== '');
  if (keys.length < 2) issues.push('fewer-than-two-choices');
  if (new Set(keys.map(String)).size !== keys.length) issues.push('duplicate-choice-keys');
  if (labels.length !== keys.length) issues.push('choice-missing-label');

  const correct = question.correctChoice ?? question.correct_choice;
  if (correct === undefined || correct === null || String(correct).trim() === '') {
    issues.push('correct-choice-missing');
  } else if (!keys.map(String).includes(String(correct))) {
    issues.push('correct-choice-not-in-choices');
  }

  const source = question.source ?? 'standard';
  if (!['bg-email', 'youtube', 'standard'].includes(source)) issues.push('unknown-source');

  return { ok: issues.length === 0, issues };
}

/**
 * Decide which trivia source the card renders (pure; no I/O). LIVE wins only
 * when a real trivia_questions row exists AND passes the extraction-fidelity
 * gate above — a malformed row falls back to the authored anchor set rather
 * than painting a broken card as live content. The anchor fallback keeps its
 * own honest dating; this helper never dresses the fallback up as fresh
 * (DR-0076: the gate is on the DATA, and the fallback stays labeled as what
 * it is). Returns { mode:'live', question } | { mode:'anchor', reason, issues? }.
 */
export function chooseTriviaSource(liveQuestion) {
  if (!liveQuestion) return { mode: 'anchor', reason: 'no-live-question' };
  // Defense-in-depth: getActiveQuestion already excludes retracted rows, but a
  // caller handing us one directly must never see it rendered as live.
  if (liveQuestion.status === 'rejected') return { mode: 'anchor', reason: 'retracted' };
  const fidelity = checkQuestionFidelity(liveQuestion);
  if (!fidelity.ok) return { mode: 'anchor', reason: 'failed-fidelity', issues: fidelity.issues };
  return { mode: 'live', question: liveQuestion };
}

/**
 * Retract a live question (status='rejected') — POST-HOC correction for a bad
 * extraction, NOT a pre-publish gate. Reversible. RLS scopes this to owner/admin
 * (editing live church content), but it never holds a healthy question from
 * appearing: questions are live the moment they land.
 */
export async function retractQuestion(questionId) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };

  const { error } = await supabase
    .from('trivia_questions')
    .update({ status: 'rejected', updated_by: session.user.id })
    .eq('id', questionId);
  if (error) {
    console.warn('[engagement-sync] retract failed:', error);
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
