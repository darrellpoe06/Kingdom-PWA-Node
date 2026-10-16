// =============================================================================
// Edge Guard — see who is hitting poetech.us and block them, from inside the
// app (DR-1061; Darrell 2026-10-16: "Who or what bot is looking at our site
// this many times?!!!!!! Blocking users is necessary!!!!!!!!! ... Inside the
// PoeTech App" / "Build the opportunity to not allow bots!!!!" / "See and block
// them!!!!!!! Period")
// =============================================================================
// Cloudflare's own dashboard showed 930k requests and 1.9k unique visitors in
// one day on a family app with 31 accounts. The edge is the only place a bot
// can be refused before it costs anything, and Cloudflare's controls for that
// (Bot Fight Mode, AI-crawler blocking, IP / network / country access rules,
// the traffic analytics that say who is knocking) are an API behind a token
// the GitHub runners already hold. This file puts that API behind ONE
// same-origin road, /edge/*, on the poetech-roads Worker, gated the way the
// app gates its Governor: the caller's Supabase session is verified against
// the sovereign auth road and the email must be a steward's.
//
// WHAT IT NEVER DOES: it never prints the token, never takes a token from the
// caller, never lets a non-steward read or write anything (401/403 before any
// Cloudflare call), and never claims a change it did not read back from
// Cloudflare's answer. Every upstream call carries a 15-second wait and a
// structured fallback (the DoD: explicit timeouts, explicit failure paths).
//
// PERMISSIONS THE TOKEN NEEDS (zone poetech.us): Zone: Read; Analytics: Read;
// Firewall Services: Edit; Bot Management: Edit. When one is missing,
// Cloudflare answers with code 10000 / 9109 and this road says WHICH panel
// cannot work and what to grant, instead of a blank.

export const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';
export const CF_API = 'https://api.cloudflare.com/client/v4';
export const ZONE_NAME = 'poetech.us';
export const WAIT_MS = 15000;

// The stewards who may see and block at the edge: the two Governors, by every
// sign-in they use. Pinned by test to the shell's FAMILY_EMAIL_PROFILES
// (persona darrell / christina), so a new sign-in for either lands here too.
export const STEWARD_EMAILS = [
  'darrellpoe06@gmail.com',
  '15636502416@phone.poetech.us',
  'mrspoe06@gmail.com',
  'christina@tlctherapysolutions.com',
];

export const NEEDED_PERMISSIONS = 'Zone › Zone: Read · Zone › Analytics: Read · Zone › Firewall Services: Edit · Zone › Bot Management: Edit (for the zone poetech.us)';

const BLOCK_TARGETS = new Set(['ip', 'ip_range', 'asn', 'country']);

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

/** fetch with a hard wait; the caller gets a thrown AbortError, never a hang. */
export async function timedFetch(url, init = {}, waitMs = WAIT_MS) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), waitMs);
  try { return await fetch(url, { ...init, signal: c.signal }); } finally { clearTimeout(t); }
}

/** Who is calling: a steward's email, or the refusal to send. Never trusts a header. */
export async function whoIs(request, env) {
  const auth = request.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return { ok: false, status: 401, reason: 'signed-out', message: 'Sign in to the app first; Edge Guard reads your own session.' };
  if (!env.SB_ANON_KEY) return { ok: false, status: 503, reason: 'no-anon-key', message: 'The Worker has no key for the auth road yet (SB_ANON_KEY), so it cannot tell who you are.' };
  let res;
  try {
    res = await timedFetch(`${FUNNEL_ORIGIN}/sb/auth/v1/user`, { headers: { apikey: env.SB_ANON_KEY, authorization: `Bearer ${m[1]}` } });
  } catch (e) {
    return { ok: false, status: 504, reason: 'auth-road-silent', message: `The auth road did not answer within ${WAIT_MS / 1000} seconds (${String((e && e.name) || e)}).` };
  }
  if (!res.ok) return { ok: false, status: 401, reason: 'not-signed-in', message: 'Your session was not accepted by the auth road. Sign in again.' };
  let user = null;
  try { user = await res.json(); } catch { user = null; }
  const email = String((user && user.email) || '').toLowerCase();
  if (!email || !STEWARD_EMAILS.includes(email)) return { ok: false, status: 403, reason: 'not-a-steward', message: 'Edge Guard is for the stewards. Your account is signed in, but it is not one of theirs.' };
  return { ok: true, email };
}

function permissionHint(errors) {
  const codes = (errors || []).map((e) => Number(e && e.code));
  if (codes.some((c) => c === 10000 || c === 9109 || c === 9103 || c === 1000)) {
    return ` The token the Worker holds is not allowed to do this. It needs: ${NEEDED_PERMISSIONS}.`;
  }
  return '';
}

/** One Cloudflare REST call -> { ok, result } or an honest refusal. */
export async function cfCall(env, path, init = {}) {
  if (!env.CF_API_TOKEN) return { ok: false, status: 503, reason: 'no-token', message: `The Worker holds no Cloudflare token yet (CF_API_TOKEN). Nothing at the edge can be read or changed until it does. It needs: ${NEEDED_PERMISSIONS}.` };
  let res;
  try {
    res = await timedFetch(`${CF_API}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, 'content-type': 'application/json', ...(init.headers || {}) },
    });
  } catch (e) {
    return { ok: false, status: 504, reason: 'cloudflare-silent', message: `Cloudflare's API did not answer within ${WAIT_MS / 1000} seconds (${String((e && e.name) || e)}).` };
  }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!body || body.success !== true) {
    const errors = (body && body.errors) || [];
    const said = errors.map((e) => `${e.code} ${e.message}`).join('; ') || `HTTP ${res.status}`;
    return { ok: false, status: res.status >= 400 ? res.status : 502, reason: 'cloudflare', errors, message: `Cloudflare said: ${said}.${permissionHint(errors)}` };
  }
  return { ok: true, result: body.result };
}

let zoneCache = null;
export function __resetZoneCache() { zoneCache = null; }
export async function zoneId(env) {
  if (env.CF_ZONE_ID) return { ok: true, id: env.CF_ZONE_ID };
  if (zoneCache) return { ok: true, id: zoneCache };
  const r = await cfCall(env, `/zones?name=${ZONE_NAME}`);
  if (!r.ok) return r;
  const id = Array.isArray(r.result) && r.result[0] && r.result[0].id;
  if (!id) return { ok: false, status: 404, reason: 'no-zone', message: `Cloudflare lists no zone named ${ZONE_NAME} for this token. It needs Zone › Zone: Read on that zone.` };
  zoneCache = id;
  return { ok: true, id };
}

// --- bots -------------------------------------------------------------------
function botsView(r) {
  return {
    fightMode: r && r.fight_mode === true,
    aiBots: (r && r.ai_bots_protection) || 'unknown',
    crawlerProtection: (r && r.crawler_protection) || null,
  };
}
export async function getBots(env) {
  const z = await zoneId(env); if (!z.ok) return z;
  const r = await cfCall(env, `/zones/${z.id}/bot_management`);
  if (!r.ok) return r;
  return { ok: true, bots: botsView(r.result) };
}
export async function setBots(env, patch) {
  const z = await zoneId(env); if (!z.ok) return z;
  const body = {};
  if (typeof patch.fightMode === 'boolean') body.fight_mode = patch.fightMode;
  if (patch.aiBots === 'block' || patch.aiBots === 'disabled') body.ai_bots_protection = patch.aiBots;
  if (Object.keys(body).length === 0) return { ok: false, status: 400, reason: 'nothing-to-set', message: 'Nothing to change: say fightMode true/false and/or aiBots block/disabled.' };
  const r = await cfCall(env, `/zones/${z.id}/bot_management`, { method: 'PUT', body: JSON.stringify(body) });
  if (!r.ok) return r;
  return { ok: true, bots: botsView(r.result) };
}

// --- traffic ----------------------------------------------------------------
// Cloudflare's GraphQL analytics, the same numbers the dashboard draws, grouped
// by what answers "who or what": the path asked for, the user agent, the
// network (ASN, with its name) and the address, plus countries and the total.
export const TRAFFIC_QUERY = `query EdgeGuard($zone: String!, $since: Time!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    total: httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: $since }) { count }
    paths: httpRequestsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since }, orderBy: [count_DESC]) { count dimensions { clientRequestPath } }
    agents: httpRequestsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since }, orderBy: [count_DESC]) { count dimensions { userAgent } }
    networks: httpRequestsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since }, orderBy: [count_DESC]) { count dimensions { clientASN clientASNDescription } }
    addresses: httpRequestsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since }, orderBy: [count_DESC]) { count dimensions { clientIP } }
    countries: httpRequestsAdaptiveGroups(limit: 12, filter: { datetime_geq: $since }, orderBy: [count_DESC]) { count dimensions { clientCountryName } }
  } }
}`;
export function trafficView(zoneNode, since) {
  const rows = (k, pick) => ((zoneNode && zoneNode[k]) || []).map((g) => ({ ...pick(g.dimensions || {}), count: Number(g.count) || 0 }));
  return {
    since,
    total: Number(zoneNode && zoneNode.total && zoneNode.total[0] && zoneNode.total[0].count) || 0,
    paths: rows('paths', (d) => ({ path: d.clientRequestPath || '' })),
    agents: rows('agents', (d) => ({ agent: d.userAgent || '' })),
    networks: rows('networks', (d) => ({ asn: Number(d.clientASN) || 0, name: d.clientASNDescription || '' })),
    addresses: rows('addresses', (d) => ({ ip: d.clientIP || '' })),
    countries: rows('countries', (d) => ({ country: d.clientCountryName || '' })),
  };
}
export async function getTraffic(env, hours = 24) {
  const z = await zoneId(env); if (!z.ok) return z;
  const h = Math.min(72, Math.max(1, Number(hours) || 24));
  const since = new Date(Date.now() - h * 3600 * 1000).toISOString();
  if (!env.CF_API_TOKEN) return cfCall(env, '/never');
  let res;
  try {
    res = await timedFetch(`${CF_API}/graphql`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query: TRAFFIC_QUERY, variables: { zone: z.id, since } }),
    });
  } catch (e) {
    return { ok: false, status: 504, reason: 'cloudflare-silent', message: `Cloudflare's analytics did not answer within ${WAIT_MS / 1000} seconds (${String((e && e.name) || e)}).` };
  }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  const errors = (body && body.errors) || [];
  const zoneNode = body && body.data && body.data.viewer && body.data.viewer.zones && body.data.viewer.zones[0];
  if (!zoneNode) {
    const said = errors.map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    const hint = /auth|permission|not authorized|unauthorized/i.test(said) ? ` The token needs Zone › Analytics: Read. (${NEEDED_PERMISSIONS})` : '';
    return { ok: false, status: 502, reason: 'analytics', message: `Cloudflare's analytics said: ${said}.${hint}` };
  }
  return { ok: true, traffic: trafficView(zoneNode, since) };
}

// --- blocks -----------------------------------------------------------------
function blockView(r) {
  return {
    id: r.id,
    mode: r.mode,
    target: r.configuration && r.configuration.target,
    value: r.configuration && r.configuration.value,
    notes: r.notes || '',
    createdOn: r.created_on || null,
  };
}
export async function listBlocks(env) {
  const z = await zoneId(env); if (!z.ok) return z;
  const r = await cfCall(env, `/zones/${z.id}/firewall/access_rules/rules?per_page=100&mode=block`);
  if (!r.ok) return r;
  return { ok: true, blocks: (Array.isArray(r.result) ? r.result : []).map(blockView) };
}
export function validBlock({ target, value }) {
  if (!BLOCK_TARGETS.has(target)) return 'target must be ip, ip_range, asn or country';
  const v = String(value || '').trim();
  if (!v) return 'value is required';
  if (target === 'ip' && !/^[0-9a-f.:]+$/i.test(v)) return 'an ip is digits and dots (or hex and colons)';
  if (target === 'ip_range' && !/^[0-9a-f.:]+\/\d{1,3}$/i.test(v)) return 'an ip_range is address/prefix, like 203.0.113.0/24';
  if (target === 'asn' && !/^AS\d+$/i.test(v)) return 'an asn looks like AS13335';
  if (target === 'country' && !/^[A-Z]{2}$/.test(v)) return 'a country is its two-letter code, like US';
  return '';
}
export async function addBlock(env, { target, value, note }, by) {
  const why = validBlock({ target, value });
  if (why) return { ok: false, status: 400, reason: 'invalid', message: why };
  const z = await zoneId(env); if (!z.ok) return z;
  const v = target === 'asn' ? String(value).trim().toUpperCase() : String(value).trim();
  const notes = `PoeTech Edge Guard · ${by} · ${new Date().toISOString().slice(0, 10)}${note ? ` · ${String(note).slice(0, 120)}` : ''}`;
  const r = await cfCall(env, `/zones/${z.id}/firewall/access_rules/rules`, { method: 'POST', body: JSON.stringify({ mode: 'block', configuration: { target, value: v }, notes }) });
  if (!r.ok) return r;
  return { ok: true, block: blockView(r.result) };
}
export async function removeBlock(env, id) {
  if (!/^[0-9a-f]{32}$/i.test(String(id || ''))) return { ok: false, status: 400, reason: 'invalid', message: 'a block id is 32 hex characters' };
  const z = await zoneId(env); if (!z.ok) return z;
  const r = await cfCall(env, `/zones/${z.id}/firewall/access_rules/rules/${id}`, { method: 'DELETE' });
  if (!r.ok) return r;
  return { ok: true, removed: id };
}

// --- the road ---------------------------------------------------------------
async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

/** /edge/* — every answer is JSON; the gate runs before any Cloudflare call. */
export async function handleEdge(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method.toUpperCase();
  if (path === '/edge/ping') return json(200, { ok: true, road: 'edge', worker: 'poetech-roads' });

  const who = await whoIs(request, env);
  if (!who.ok) return json(who.status, { ok: false, reason: who.reason, message: who.message });

  let out;
  if (path === '/edge/whoami' && method === 'GET') out = { ok: true, email: who.email };
  else if (path === '/edge/bots' && method === 'GET') out = await getBots(env);
  else if (path === '/edge/bots' && method === 'PUT') out = await setBots(env, await readJson(request));
  else if (path === '/edge/traffic' && method === 'GET') out = await getTraffic(env, url.searchParams.get('hours'));
  else if (path === '/edge/blocks' && method === 'GET') out = await listBlocks(env);
  else if (path === '/edge/blocks' && method === 'POST') out = await addBlock(env, await readJson(request), who.email);
  else if (path.startsWith('/edge/blocks/') && method === 'DELETE') out = await removeBlock(env, path.slice('/edge/blocks/'.length));
  else out = { ok: false, status: 404, reason: 'no-such-road', message: `No edge road at ${method} ${path}.` };

  const status = out.ok ? 200 : (out.status || 502);
  const { status: _s, ...body } = out; // eslint-disable-line no-unused-vars
  return json(status, body);
}
