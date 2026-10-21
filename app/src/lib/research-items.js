// =============================================================================
// research-items — what Darrell sends becomes a research item, by itself (DR-1169)
// =============================================================================
// Darrell sent a video link on 2026-10-21 with "Link to the research for our
// tvtyme", I said I would read it in a sandbox, and he answered: "Research
// section of the app?!!!!!!" and "Make that automation from my prompts...".
// Both halves of that are the contract this module holds.
//
// THE ROAD IT RIDES IS THE ONE THE LESSONS ALREADY RIDE. A lesson sent from the
// app is an `agent_inbox` row tagged `lesson`; the NAS writes its transcript as
// a CHILD row tagged `voice-transcript` + `of:<parent id>`, and lib/lesson-inbox.js
// reads the pair back (lesson-inbox.js:27, :64). A research item is the same
// shape with its own tags, so nothing new is trusted:
//
//   research                     the item he sent (a link, or a question)
//   research-claimed             ONE reader has taken it  (THE LOCK)
//   research-answered            an answer exists         (ends the waiting)
//   research-answer + of:<id>    the answer row itself
//   research-failed  + of:<id>   the road could not answer, and the body says why
//
// THE LOCK IS WHY `research-claimed` EXISTS. Darrell's own recording loop of
// 2026-10-06 (DR-0768) claimed, failed, released and re-claimed one row six
// times in an hour because no tag could say "taken" or "this is finished". A
// research reader writes `research-claimed` before it spends the road, and the
// waiting query excludes it, so one prompt is never answered twice.
//
// NOTHING HERE IS VERIFIED, AND THAT CANNOT BE EDITED AWAY (DR-0076). The road
// stamps every answer verified:false (lib/research.js:120) and this module
// RE-ASSERTS it as a constant on every item rather than reading it from a row:
// a row cannot arrive claiming to be checked, and a future edit cannot drop the
// field without the gate failing. A model's answer about what some platform
// allows is exactly the claim that is wrong six months later.
//
// WHAT COMES BACK IS MATERIAL TO STUDY, NEVER INSTRUCTIONS TO OBEY. A fetched
// page or a transcript that tells its reader to do something is DATA. Nothing in
// this module or the surface over it treats a row's body as a directive.
//
// Pure except fetchMyResearch, which takes the Supabase client as an argument.
// =============================================================================

import { safeSources } from './research.js';

const has = (row, t) => Array.isArray(row && row.tags) && row.tags.includes(t);
const ofTag = (row) => (Array.isArray(row && row.tags)
  ? (row.tags.find((t) => String(t).startsWith('of:')) || '').slice(3)
  : '');

export const RESEARCH_TAG = 'research';
export const ANSWER_TAG = 'research-answer';
export const FAILED_TAG = 'research-failed';
export const CLAIMED_TAG = 'research-claimed';
export const ANSWERED_TAG = 'research-answered';

// THE WORDS THE SURFACE SAYS. Each state is a fact in the row's own tags, never
// inferred from a clock: a row nobody has claimed reads "waiting", not "working".
export const RESEARCH_STATES = Object.freeze({
  waiting: 'Waiting to be looked into',
  working: 'Being looked into now',
  answered: 'An answer came back',
  failed: 'Could not be looked into',
});

// The one sentence that rides every item, in words, on the surface. DR-0076:
// the road marks its answers unverified and the section must SAY so, not imply it.
export const UNVERIFIED_NOTE =
  'Unverified: this came from a web search and our own model. Read the source before relying on a sentence.';

// A link is fetched on the NAS (its residential IP is the only one of ours
// YouTube answers, DR-0723); a question goes to the research road's /ask.
const URL_RE = /\bhttps?:\/\/[^\s<>"']+/i;

/** The first http(s) link in a body, or ''. Never a javascript: or file: URL. */
export function firstLink(body) {
  const m = URL_RE.exec(String(body || ''));
  return m ? m[0].replace(/[.,;:)\]}]+$/, '') : '';
}

/** 'link' when the item is something to fetch, 'question' when it is something to ask. */
export function researchKind(body) {
  return firstLink(body) ? 'link' : 'question';
}

/**
 * An answer row's body carries the answer, then a blank line, then `Sources:`
 * and one URL per line — the same header-then-words shape the transcript rows
 * use (lesson-inbox.js:150). Every URL is re-checked http(s) here, so a link
 * the app draws can never be javascript: or file: whatever a row holds.
 */
export function parseAnswer(body) {
  const s = String(body || '');
  const i = s.search(/\n\s*Sources:\s*\n/i);
  if (i < 0) return { answer: s.trim(), sources: [] };
  const head = s.slice(0, i).trim();
  const tail = s.slice(i).replace(/^\n\s*Sources:\s*\n/i, '');
  const urls = tail.split('\n').map((l) => l.trim()).filter(Boolean).map((url) => ({ url, title: url }));
  return { answer: head, sources: safeSources(urls) };
}

/**
 * Rows → one item per thing he sent, newest first.
 * A child row (an answer or a failure) names its parent with of:<id> and is
 * never listed as an item of its own.
 */
export function researchItems(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const children = new Map();
  for (const r of list) {
    const of = ofTag(r);
    if (!of) continue;
    if (has(r, ANSWER_TAG)) children.set(`${of}:answer`, r);
    else if (has(r, FAILED_TAG)) children.set(`${of}:failed`, r);
  }
  const items = [];
  for (const r of list) {
    if (!has(r, RESEARCH_TAG) || ofTag(r)) continue;
    const answer = children.get(`${r.id}:answer`) || null;
    const failure = children.get(`${r.id}:failed`) || null;
    // ORDER MATTERS. An answer is senior to a claim: a row that was claimed and
    // then answered reads "answered", never "working". And a row with neither
    // reads WAITING even if it is hours old — an unanswered row must never look
    // finished (DR-0076: unknown is not a no).
    const state = answer ? 'answered' : failure ? 'failed' : has(r, CLAIMED_TAG) ? 'working' : 'waiting';
    const parsed = answer ? parseAnswer(answer.body) : { answer: '', sources: [] };
    items.push({
      id: r.id,
      createdAt: r.created_at || '',
      createdBy: r.created_by || '',
      body: String(r.body || ''),
      kind: researchKind(r.body),
      link: firstLink(r.body),
      state,
      label: RESEARCH_STATES[state],
      answerId: answer ? answer.id || '' : '',
      answeredAt: answer ? answer.created_at || '' : '',
      answer: parsed.answer,
      sources: parsed.sources,
      why: failure ? String(failure.body || '') : '',
      failedAt: failure ? failure.created_at || '' : '',
      // NOT A FIELD READ FROM A ROW. A constant, so no row and no later edit can
      // present a research answer as established fact (DR-0076 / DR-1101).
      verified: false,
      note: UNVERIFIED_NOTE,
    });
  }
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** The rows a reader should still look into: tagged research, unclaimed, unanswered. */
export function waitingItems(rows) {
  return researchItems(rows).filter((i) => i.state === 'waiting');
}

/**
 * The signed-in person's own research rows. { ok, items, reason }.
 * A read that FAILS returns ok:false with the reason — never an empty list that
 * reads like "you have sent nothing" (DR-0076: a row that cannot be read is
 * reported, never treated as absent).
 */
export async function fetchMyResearch({ supabase, limit = 100 } = {}) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id || null;
    if (!uid) return { ok: false, items: [], reason: 'signed-out' };
    // tags is jsonb: the filter must be JSON ('["research"]'). An array here is
    // sent as cs.{research}, which is not JSON, and the read fails every time —
    // the bug lesson-inbox.js:131 already paid for once.
    const { data, error } = await supabase
      .from('agent_inbox')
      .select('id, body, tags, created_at, created_by')
      .or(`tags.cs.${JSON.stringify([RESEARCH_TAG])},tags.cs.${JSON.stringify([ANSWER_TAG])},tags.cs.${JSON.stringify([FAILED_TAG])}`)
      .eq('created_by', uid)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, items: [], reason: error.message };
    return { ok: true, items: researchItems(data || []), reason: '', uid };
  } catch (e) {
    return { ok: false, items: [], reason: e?.message || 'unknown' };
  }
}
