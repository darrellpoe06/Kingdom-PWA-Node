// =============================================================================
// church-access — a read that could not be made is NOT a no (DR-1053)
// =============================================================================
// Darrell, 2026-10-15, two screenshots an hour apart from his phone at The Love
// Corner. First the Choir tab: "This is the choir's space. Ask the choir
// director to add you to the roster." Then the My Record tab: "Your record
// could not be opened. opening your record timed out after 15000 ms."
//
// THOSE ARE THE SAME FAILURE WEARING TWO FACES, and the second one tells you
// what the first one really was.
//
// TRACED, before anything was written:
//
//   My Record   ChurchMemberSpace -> readMyChurchRecord -> rpc(
//               'church_member_record_read') wrapped in ONE 15 s timeout, no
//               retry, no try-again. The RPC itself (0212) RAISES on every
//               named failure -- 'sign in first', 'no church to read', 'that is
//               not your church' -- and a RAISE comes back as a PostgREST error
//               in milliseconds. So a 15 s timeout is NOT any of those. It is
//               the request never completing at all: one attempt, on a phone,
//               on a mobile link, all or nothing.
//
//   Choir       Choir.jsx -> getChoirAccess -> and here is the part that
//               matters:
//
//                 const [{ data: role }, { data: inChoir }] = await
//                   Promise.all([ supabase.rpc('user_role_in_instance', ...),
//                                 supabase.rpc('user_in_choir', ...) ]);
//
//               THE `error` IS DESTRUCTURED AWAY. When the same stall that hit
//               My Record hits these two, `role` and `inChoir` are undefined,
//               deriveAccess(undefined, undefined) returns canSee:false, and
//               the surface tells a deacon of thirty years to ask the director
//               to add him to the roster.
//
//               churchInstanceId does it too, one layer down, for all 23 of its
//               callers: `if (error) { console.warn(...); return null; }` -- and
//               every caller reads null as "this person has no church."
//
// So one surface reported the failure honestly and dead-ended; the other turned
// it into a STATEMENT ABOUT HIS STANDING IN THE CHURCH that was not true. That
// second one is the real defect. It is DR-0076's "unknown is never up", turned
// inside out: UNKNOWN IS NEVER A NO. An answer we could not get is not an
// answer of no, and a surface may never print one as the other.
//
// WHAT THIS MODULE IS. Three things, and deliberately nothing else:
//
//   1. ask()                 -- one question, asked up to three times, with a
//                               per-attempt timeout, so a single stalled fetch
//                               on a phone is not the whole answer.
//   2. The THREE-VALUED answer { ok:true, value } | { ok:false, reason }, where
//      reason distinguishes THE SERVER ANSWERED (never retried -- 'no church to
//      read' is a real answer and asking twice only doubles the wait) from
//      NOTHING CAME BACK (retried -- that is the curable one).
//   3. knownOrUnavailable()  -- the combinator that short-circuits to
//                               `unavailable` when any answer is missing, and
//                               OTHERWISE CALLS THE SURFACE'S OWN deriveAccess,
//                               unchanged, with the same arguments it always
//                               got.
//
// THAT THIRD POINT IS THE WHOLE SAFETY ARGUMENT. Nothing in this file decides
// who may see what. Every surface keeps its own deriveAccess verbatim, and this
// only decides whether we KNOW. So no person gains access and no person loses
// access from this change -- the only new outcome is a third one that did not
// exist before, for the case where the question never got an answer.
//
// THE BUDGET, chosen so the patience a person already waits is not increased:
//   3 attempts x 5000 ms + 300 ms + 900 ms backoff = 16.2 s worst case, against
//   today's 15 s single shot. Same wait, three chances instead of one.
// =============================================================================
import supabase from './supabase.js';

/** Per-attempt ceiling. A stalled fetch is abandoned and asked again. */
export const ASK_ATTEMPT_MS = 5000;
/** How many times one question is asked before we admit we do not know. */
export const ASK_TRIES = 3;
/** Pause between attempts, indexed by attempt. Last value repeats. */
export const ASK_BACKOFF_MS = [300, 900];

/** The reason an answer is missing. */
export const NO_ANSWER = 'no-answer';   // nothing came back -- curable, retried
export const REFUSED = 'refused';       // the server answered, and said no

const sleepReal = (ms) => new Promise((r) => { setTimeout(r, ms); });

export function messageOf(e) {
  const raw = String((e && (e.message || e.msg)) || e || '').trim();
  return raw || 'no reason given';
}

function withTimeout(promise, ms) {
  let t;
  const timer = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(`no answer in ${ms} ms`)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

/**
 * Pure. Is this failure worth asking again?
 *
 * The distinction is not "was it an error" -- it is WHO SPOKE. A PostgREST
 * error means the server answered us; 'no church to read' is a true answer and
 * asking it twice only doubles the wait. A timeout or a thrown fetch means
 * nothing came back at all, and that is the one a second attempt can cure.
 */
export const isTransient = (answer) => !!answer && answer.ok === false && answer.reason === NO_ANSWER;

/** One attempt at one question. Never throws. */
export async function askOnce(call, { attemptMs = ASK_ATTEMPT_MS } = {}) {
  try {
    const res = await withTimeout(Promise.resolve().then(call), attemptMs);
    if (res && res.error) return { ok: false, reason: REFUSED, message: messageOf(res.error) };
    return { ok: true, value: res ? res.data ?? null : null };
  } catch (e) {
    return { ok: false, reason: NO_ANSWER, message: messageOf(e) };
  }
}

/**
 * One question, asked up to `tries` times. Returns the three-valued answer and
 * how many attempts it took, so a surface can say "we tried three times".
 */
export async function ask(call, opts = {}) {
  const tries = Number.isFinite(opts.tries) ? opts.tries : ASK_TRIES;
  const backoff = Array.isArray(opts.backoff) ? opts.backoff : ASK_BACKOFF_MS;
  const sleep = opts.sleep || sleepReal;
  let last = { ok: false, reason: NO_ANSWER, message: 'nothing was asked' };
  for (let i = 0; i < Math.max(1, tries); i += 1) {
    last = await askOnce(call, opts);
    if (last.ok || !isTransient(last)) return { ...last, attempts: i + 1 };
    if (i < tries - 1) await sleep(backoff[Math.min(i, backoff.length - 1)] || 0);
  }
  return { ...last, attempts: Math.max(1, tries) };
}

/** The caller's role in an instance, as a three-valued answer. */
export const askRole = (tenantId, opts) =>
  ask(() => supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }), opts);

/** Any boolean membership predicate (user_in_choir, user_in_ministry, ...). */
export const askPredicate = (name, args, opts) =>
  ask(() => supabase.rpc(name, args), opts);

/** Pure. Why we do not know, in a word a surface can switch on. */
export function reasonOf(answer) {
  if (!answer || answer.ok === true) return 'answered';
  return answer.reason === REFUSED ? 'refused' : 'unreachable';
}

/** Pure. The plain sentence for a person, never a stack trace. */
export function sentenceFor(verdict) {
  if (!verdict || verdict.unavailable !== true) return '';
  return verdict.reason === 'refused'
    ? 'The church server answered, but it would not say. Nothing here is a statement about you — try again, and tell the office if it keeps happening.'
    : 'We could not reach the church records just now, so this is NOT a statement about whether you are on this team — we simply could not ask. Try again in a moment.';
}

/**
 * Pure. THE COMBINATOR, and the reason this change cannot alter who sees what.
 *
 * `answers` are the three-valued answers a surface needed. `derive` is THAT
 * SURFACE'S OWN deriveAccess, untouched. When every answer arrived, derive is
 * called with exactly the values it has always been called with, and its
 * verdict is returned verbatim. When any answer is missing, nobody's access is
 * decided at all -- the verdict is `unavailable`, which is a third state, not a
 * no.
 */
export function knownOrUnavailable(answers, derive) {
  const list = Array.isArray(answers) ? answers : [];
  const missing = list.find((a) => !a || a.ok !== true);
  if (missing) {
    return {
      canSee: false,
      canEdit: false,
      unavailable: true,
      reason: reasonOf(missing),
      message: missing.message || '',
    };
  }
  const verdict = derive(...list.map((a) => a.value)) || {};
  return { ...verdict, unavailable: false, reason: 'answered', message: '' };
}
