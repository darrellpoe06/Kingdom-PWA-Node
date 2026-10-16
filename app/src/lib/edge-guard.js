// =============================================================================
// edge-guard — the app's side of /edge/* (DR-1061): see who is hitting the
// site and block them, with the caller's own session as the key
// =============================================================================
// Pure client over the same-origin Edge Guard road carried by the poetech-roads
// Worker (infra/cf-roads-worker/edge.js). Every call: the signed-in session's
// token in Authorization, a 15-second wait, and one of three honest shapes
// back — { ok: true, ... }, { ok: false, reason, message } from the road, or
// { ok: false, reason: 'no-road' } when the answer is the SPA shell, which is
// what poetech.us serves for a path no Worker and no Function answers. The
// surface prints these words; it never paints a toggle it did not read.
import { supabase } from './supabase.js';

export const EDGE_BASE = '/edge';
export const EDGE_WAIT_MS = 15000;

async function sessionToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return (data && data.session && data.session.access_token) || '';
  } catch { return ''; }
}

export function edgeTimeout(promise, ms = EDGE_WAIT_MS, what = 'the edge road') {
  let timer;
  const timed = new Promise((resolve) => { timer = setTimeout(() => resolve({ ok: false, reason: 'timeout', message: `${what} did not answer within ${Math.round(ms / 1000)} seconds.` }), ms); });
  return Promise.race([Promise.resolve(promise).finally(() => clearTimeout(timer)), timed]);
}

export async function edgeCall(path, { method = 'GET', body } = {}, fetchImpl = globalThis.fetch) {
  const token = await sessionToken();
  if (!token) return { ok: false, reason: 'signed-out', message: 'Sign in first; Edge Guard reads your own session.' };
  const run = (async () => {
    let res;
    try {
      res = await fetchImpl(`${EDGE_BASE}${path}`, {
        method,
        headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      return { ok: false, reason: 'network', message: `The edge road could not be reached (${String((e && e.message) || e)}).` };
    }
    const ctype = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
    if (/text\/html/i.test(ctype)) {
      return { ok: false, reason: 'no-road', message: 'The Edge Guard road is not open on this site yet: the poetech-roads Worker has not been deployed, so this path answers the app shell. Dispatch cf-roads-worker.yml with deploy=yes.' };
    }
    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!data || typeof data !== 'object') return { ok: false, reason: 'bad-answer', message: `The edge road answered HTTP ${res.status} with no JSON.` };
    return data;
  })();
  return edgeTimeout(run, EDGE_WAIT_MS, 'the edge road');
}

export const whoAmI = () => edgeCall('/whoami');
export const getBots = () => edgeCall('/bots');
export const setBots = (patch) => edgeCall('/bots', { method: 'PUT', body: patch });
export const getTraffic = (hours = 24) => edgeCall(`/traffic?hours=${encodeURIComponent(hours)}`);
export const listBlocks = () => edgeCall('/blocks');
export const addBlock = (target, value, note = '') => edgeCall('/blocks', { method: 'POST', body: { target, value, note } });
export const removeBlock = (id) => edgeCall(`/blocks/${encodeURIComponent(id)}`, { method: 'DELETE' });

/** A short honest label for a count: 930310 -> "930k". */
export function compactCount(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e4) return `${Math.round(v / 1e3)}k`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(v);
}

/**
 * Is this user agent one of OUR OWN witnesses or devices, so the steward can
 * tell "our own metrics" from a stranger before blocking? Named, never guessed:
 * the GitHub runners curl with curl's UA or the Pixel UA site-health sets; the
 * app's service worker and the family's phones are browsers, which this does
 * not try to classify.
 */
export function agentKind(agent) {
  const a = String(agent || '');
  if (!a) return 'unknown';
  if (/^curl\//i.test(a)) return 'our witness (curl from a GitHub runner)';
  if (/Pixel 8\) AppleWebKit\/537\.36 \(KHTML, like Gecko\) Chrome\/126\.0 Mobile Safari/i.test(a)) return 'our witness (site-health)';
  if (/HeadlessChrome|Playwright/i.test(a)) return 'a headless browser (our probes, or a scraper)';
  if (/GPTBot|ClaudeBot|anthropic-ai|CCBot|Bytespider|PerplexityBot|Google-Extended|Applebot-Extended|cohere-ai|Amazonbot|meta-externalagent|Diffbot|PetalBot/i.test(a)) return 'an AI crawler';
  if (/Googlebot|bingbot|DuckDuckBot|YandexBot|Baiduspider|Applebot/i.test(a)) return 'a search engine';
  if (/bot|crawler|spider|scrapy|python-requests|Go-http-client|libwww|wget|okhttp|java\//i.test(a)) return 'a bot or script';
  if (/Mozilla\/5\.0/.test(a)) return 'a browser';
  return 'unknown';
}
