// =============================================================================
// research — the app's side of the research road (DR-1101)
// =============================================================================
// Darrell 2026-10-18 asked when the repos he sent would be "operational and
// test ready for me to use them and see their capabilities". Vane is the first
// (DR-1099): a question goes to the NAS, which searches the web through our
// own SearxNG, answers on our own model, and returns the sources. This module
// is the whole contract the app holds with that road:
//   GET  /research/health  open; 200 only when Vane answers with real models
//   POST /research/ask     the family key; {query, mode, sources}
// infra/nas-research/research_forwarder.py is the other end, and its selftest
// pins the same caps this file mirrors.
//
// NOT VERIFIED (DR-0076). The road marks every answer verified:false and the
// sources are re-checked here as http(s) only, so a link the app draws can
// never be javascript: or file:. The answer is shown as plain text, never HTML.
// =============================================================================

export const RESEARCH_BASE = '/research';
export const MAX_QUERY_CHARS = 500;          // the forwarder's own cap
export const HEALTH_TIMEOUT_MS = 12000;
export const ASK_TIMEOUT_MS = 200000;        // the forwarder gives Vane 180 s
export const MODES = Object.freeze(['speed', 'balanced', 'quality']);

export function healthUrl() { return `${RESEARCH_BASE}/health`; }
export function askUrl() { return `${RESEARCH_BASE}/ask`; }

/** Why a question cannot be asked yet, or null when it can. */
export function queryProblem(query) {
  const q = String(query ?? '').trim();
  if (!q) return 'Type a question first.';
  if (q.length > MAX_QUERY_CHARS) return `Keep the question under ${MAX_QUERY_CHARS} characters (it is ${q.length}).`;
  return null;
}

/** Only http(s) links, de-duplicated, title kept as text. */
export function safeSources(list) {
  const out = [];
  const seen = new Set();
  for (const s of Array.isArray(list) ? list : []) {
    const url = String(s?.url ?? '').trim();
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ title: String(s?.title || url), url });
  }
  return out;
}

/**
 * The road's state from its /health answer.
 * live: Vane answered with models; dark: the NAS answered but the road is not
 * ready (the reason is the NAS's own words); unreachable: nothing answered.
 */
export function classifyHealth(status, body) {
  if (status === 200 && body && body.ok === true) {
    return { state: 'live', chat: body.chat || null, embedding: body.embedding || null };
  }
  if (typeof status === 'number' && status > 0 && body && typeof body === 'object' && 'ok' in body) {
    return { state: 'dark', reason: String(body.reason || `the road answered ${status}`) };
  }
  return { state: 'unreachable', reason: 'The research road is not answering yet. It starts on the NAS once the right tower’s models are reachable.' };
}

async function timed(fetchImpl, url, opts, ms) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch { /* already done */ } }, ms);
  try {
    return await fetchImpl(url, ctrl ? { ...opts, signal: ctrl.signal } : opts);
  } finally {
    clearTimeout(timer);
  }
}

export async function researchHealth({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') return classifyHealth(0, null);
  try {
    const res = await timed(fetchImpl, healthUrl(), { method: 'GET', cache: 'no-store' }, HEALTH_TIMEOUT_MS);
    let body;
    try { body = await res.json(); } catch { body = null; }
    return classifyHealth(res.status, body);
  } catch {
    return classifyHealth(0, null);
  }
}

const ASK_ERRORS = {
  401: 'This device does not have the family key yet. Open the Cameras tab once while signed in, then try again.',
  413: `Keep the question under ${MAX_QUERY_CHARS} characters.`,
  503: 'The road is busy with another question, or the model is not reachable. Try again in a minute.',
  504: 'No answer came back within three minutes.',
};

/** Ask one question. Never throws; returns {ok, answer, sources, model, note} or {ok:false, error}. */
export async function askResearch(query, { token, mode = 'speed', fetchImpl = globalThis.fetch } = {}) {
  const problem = queryProblem(query);
  if (problem) return { ok: false, error: problem };
  if (!MODES.includes(mode)) return { ok: false, error: 'Unknown answer mode.' };
  if (!token) return { ok: false, error: ASK_ERRORS[401] };
  if (typeof fetchImpl !== 'function') return { ok: false, error: 'This browser cannot reach the road.' };
  let res;
  try {
    res = await timed(fetchImpl, askUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: String(query).trim(), mode, sources: ['web'] }),
    }, ASK_TIMEOUT_MS);
  } catch {
    return { ok: false, error: 'The research road did not answer.' };
  }
  let body;
  try { body = await res.json(); } catch { body = null; }
  if (res.status !== 200 || !body) {
    return { ok: false, error: ASK_ERRORS[res.status] || String(body?.error || `The road answered ${res.status}.`) };
  }
  return {
    ok: true,
    answer: String(body.answer || ''),
    sources: safeSources(body.sources),
    model: body.model || null,
    verified: false,
    note: String(body.note || 'Unverified: read the source before relying on a sentence.'),
  };
}
