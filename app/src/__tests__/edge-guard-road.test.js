// =============================================================================
// The Edge Guard road (DR-1067): /edge/* on the poetech-roads Worker lets a
// steward see who is hitting poetech.us and block them — and lets NO ONE else.
// Every Cloudflare call is stubbed; what is pinned is the gate, the mapping in
// both directions, the validation, and the words said when a token cannot.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker, { roadFor } from '../../../infra/cf-roads-worker/worker.js';
import {
  handleEdge, whoIs, cfCall, getBots, setBots, getTraffic, trafficView, listBlocks, addBlock, removeBlock, validBlock,
  STEWARD_EMAILS, NEEDED_PERMISSIONS, FUNNEL_ORIGIN, CF_API, __resetZoneCache,
} from '../../../infra/cf-roads-worker/edge.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const ENV = { CF_API_TOKEN: 'cf-token', SB_ANON_KEY: 'anon', CF_ZONE_ID: 'zone1' };
const STEWARD = 'darrellpoe06@gmail.com';

let calls;
let original;
/** fetch stub: answer(url, init) -> Response; records every call. */
function stub(answer) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return answer(String(url), init);
  };
}
const jsonRes = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const authOk = (email = STEWARD) => (url) => (url.startsWith(`${FUNNEL_ORIGIN}/sb/auth/v1/user`) ? jsonRes({ email }) : null);
const asSteward = (path, init = {}) => new Request(`https://poetech.us${path}`, { ...init, headers: { authorization: 'Bearer sess', ...(init.headers || {}) } });

beforeEach(() => { original = globalThis.fetch; __resetZoneCache(); });
afterEach(() => { globalThis.fetch = original; });

describe('the gate runs before any Cloudflare call', () => {
  it('/edge/ping needs no session and names the Worker', async () => {
    stub(() => { throw new Error('must not be called'); });
    const res = await handleEdge(new Request('https://poetech.us/edge/ping'), ENV);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, road: 'edge', worker: 'poetech-roads' });
    expect(calls).toHaveLength(0);
  });
  it('no bearer -> 401 signed-out, and nothing is fetched', async () => {
    stub(() => { throw new Error('must not be called'); });
    const res = await handleEdge(new Request('https://poetech.us/edge/bots'), ENV);
    expect(res.status).toBe(401);
    expect((await res.json()).reason).toBe('signed-out');
    expect(calls).toHaveLength(0);
  });
  it('no SB_ANON_KEY on the Worker -> 503 that says so, before the auth road is asked', async () => {
    stub(() => { throw new Error('must not be called'); });
    const res = await handleEdge(asSteward('/edge/bots'), { CF_API_TOKEN: 'x' });
    expect(res.status).toBe(503);
    expect((await res.json()).message).toMatch(/SB_ANON_KEY/);
  });
  it('the auth road rejects the session -> 401, and Cloudflare is never asked', async () => {
    stub((url) => (url.includes('/sb/auth/v1/user') ? new Response('{}', { status: 401 }) : jsonRes({ success: true, result: {} })));
    const res = await handleEdge(asSteward('/edge/bots'), ENV);
    expect(res.status).toBe(401);
    expect((await res.json()).reason).toBe('not-signed-in');
    expect(calls.filter((c) => c.url.startsWith(CF_API))).toHaveLength(0);
  });
  it('a signed-in account that is not a steward -> 403, and Cloudflare is never asked', async () => {
    stub((url) => (url.includes('/sb/auth/v1/user') ? jsonRes({ email: 'someone@example.com' }) : jsonRes({ success: true, result: {} })));
    const res = await handleEdge(asSteward('/edge/traffic'), ENV);
    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe('not-a-steward');
    expect(calls.filter((c) => c.url.startsWith(CF_API))).toHaveLength(0);
  });
  it('asks the auth road with the anon key and the CALLER\'s bearer, never the Cloudflare token', async () => {
    stub(authOk());
    const who = await whoIs(asSteward('/edge/whoami'), ENV);
    expect(who).toEqual({ ok: true, email: STEWARD });
    expect(calls[0].url).toBe(`${FUNNEL_ORIGIN}/sb/auth/v1/user`);
    expect(calls[0].init.headers.apikey).toBe('anon');
    expect(calls[0].init.headers.authorization).toBe('Bearer sess');
    expect(JSON.stringify(calls[0].init.headers)).not.toContain('cf-token');
  });
  it('a steward email is matched case-insensitively', async () => {
    stub(authOk('DarrellPoe06@Gmail.com'));
    expect((await whoIs(asSteward('/edge/whoami'), ENV)).ok).toBe(true);
  });
  it('/edge/whoami answers the email the auth road gave', async () => {
    stub(authOk());
    const res = await handleEdge(asSteward('/edge/whoami'), ENV);
    expect(await res.json()).toEqual({ ok: true, email: STEWARD });
  });
  it('an unknown edge path is a 404 in JSON, not the SPA shell', async () => {
    stub(authOk());
    const res = await handleEdge(asSteward('/edge/nope'), ENV);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/json/);
  });
});

describe('the stewards are the shell\'s two Governors, by every sign-in they use', () => {
  it('STEWARD_EMAILS equals the darrell + christina personas of FAMILY_EMAIL_PROFILES', () => {
    const shell = read('app/src/poe-financial-mvp-v28.jsx');
    const m = /const FAMILY_EMAIL_PROFILES = \{([\s\S]*?)\n\};/.exec(shell);
    expect(m, 'FAMILY_EMAIL_PROFILES not found in the shell').toBeTruthy();
    const governors = [...m[1].matchAll(/'([^']+)':\s*'(darrell|christina)'/g)].map((x) => x[1]);
    expect(governors.length).toBeGreaterThanOrEqual(4);
    expect([...STEWARD_EMAILS].sort()).toEqual([...governors].sort());
  });
});

describe('bots: Bot Fight Mode and AI-crawler blocking, read and set', () => {
  it('GET maps Cloudflare\'s bot_management to fightMode / aiBots', async () => {
    stub((url) => authOk()(url) || jsonRes({ success: true, result: { fight_mode: true, ai_bots_protection: 'block', crawler_protection: 'enabled' } }));
    const res = await handleEdge(asSteward('/edge/bots'), ENV);
    expect(await res.json()).toEqual({ ok: true, bots: { fightMode: true, aiBots: 'block', crawlerProtection: 'enabled' } });
    expect(calls[1].url).toBe(`${CF_API}/zones/zone1/bot_management`);
    expect(calls[1].init.headers.authorization).toBe('Bearer cf-token');
  });
  it('PUT sends only the fields asked for and answers what Cloudflare read back', async () => {
    stub((url, init) => authOk()(url) || jsonRes({ success: true, result: { ...JSON.parse(init.body), ai_bots_protection: JSON.parse(init.body).ai_bots_protection || 'disabled' } }));
    const res = await handleEdge(asSteward('/edge/bots', { method: 'PUT', body: JSON.stringify({ fightMode: true }) }), ENV);
    expect(calls[1].init.method).toBe('PUT');
    expect(JSON.parse(calls[1].init.body)).toEqual({ fight_mode: true });
    expect((await res.json()).bots.fightMode).toBe(true);
  });
  it('PUT with nothing to set is a 400 in words, and Cloudflare is not called', async () => {
    stub(authOk());
    const r = await setBots(ENV, { aiBots: 'maybe' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(calls.filter((c) => c.url.startsWith(CF_API))).toHaveLength(0);
  });
  it('a token without the permission is named, with what to grant', async () => {
    stub(() => jsonRes({ success: false, errors: [{ code: 10000, message: 'Authentication error' }] }, 403));
    const r = await getBots(ENV);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(403);
    expect(r.message).toContain('10000 Authentication error');
    expect(r.message).toContain(NEEDED_PERMISSIONS);
  });
  it('no token on the Worker -> 503 that names the secret and the permissions', async () => {
    stub(() => { throw new Error('must not be called'); });
    const r = await cfCall({}, '/zones');
    expect(r).toMatchObject({ ok: false, status: 503, reason: 'no-token' });
    expect(r.message).toContain('CF_API_TOKEN');
    expect(calls).toHaveLength(0);
  });
  it('a silent Cloudflare is a 504 in words, never a hang', async () => {
    stub(() => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; });
    const r = await cfCall(ENV, '/zones');
    expect(r).toMatchObject({ ok: false, status: 504, reason: 'cloudflare-silent' });
    expect(r.message).toMatch(/15 seconds/);
  });
});

describe('traffic: who or what, from Cloudflare\'s own logs', () => {
  const zoneNode = {
    total: [{ count: 930310 }],
    paths: [{ count: 500000, dimensions: { clientRequestPath: '/sb/rest/v1/rpc/x' } }],
    agents: [{ count: 400000, dimensions: { userAgent: 'curl/8.5.0' } }, { count: 9, dimensions: {} }],
    networks: [{ count: 300000, dimensions: { clientASN: 13335, clientASNDescription: 'CLOUDFLARENET' } }],
    addresses: [{ count: 1000, dimensions: { clientIP: '203.0.113.9' } }],
    countries: [{ count: 700000, dimensions: { clientCountryName: 'United States' } }],
  };
  it('trafficView shapes every group and the total, with empty dimensions kept honest', () => {
    const v = trafficView(zoneNode, '2026-10-15T00:00:00.000Z');
    expect(v.total).toBe(930310);
    expect(v.paths).toEqual([{ path: '/sb/rest/v1/rpc/x', count: 500000 }]);
    expect(v.agents[1]).toEqual({ agent: '', count: 9 });
    expect(v.networks).toEqual([{ asn: 13335, name: 'CLOUDFLARENET', count: 300000 }]);
    expect(v.addresses).toEqual([{ ip: '203.0.113.9', count: 1000 }]);
    expect(v.countries).toEqual([{ country: 'United States', count: 700000 }]);
  });
  it('GET /edge/traffic posts the GraphQL query for the zone, hours clamped to 1..72', async () => {
    stub((url) => authOk()(url) || jsonRes({ data: { viewer: { zones: [zoneNode] } } }));
    const res = await handleEdge(asSteward('/edge/traffic?hours=500'), ENV);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.traffic.total).toBe(930310);
    const gql = calls.find((c) => c.url === `${CF_API}/graphql`);
    const sent = JSON.parse(gql.init.body);
    expect(sent.variables.zone).toBe('zone1');
    expect(sent.query).toContain('httpRequestsAdaptiveGroups');
    expect(sent.query).toContain('userAgent');
    expect(sent.query).toContain('clientASNDescription');
    const ageH = (Date.now() - Date.parse(sent.variables.since)) / 3600e3;
    expect(ageH).toBeGreaterThan(71.9);
    expect(ageH).toBeLessThan(72.1);
  });
  it('an analytics refusal names the permission', async () => {
    stub(() => jsonRes({ errors: [{ message: 'not authorized for analytics' }] }));
    const r = await getTraffic(ENV);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('Analytics: Read');
  });
});

describe('blocks: ip, ip_range, asn, country — validated before Cloudflare hears of them', () => {
  it('validBlock refuses the shapes Cloudflare would refuse, in words', () => {
    expect(validBlock({ target: 'user', value: 'x' })).toMatch(/target must be/);
    expect(validBlock({ target: 'ip', value: '' })).toMatch(/required/);
    expect(validBlock({ target: 'ip', value: 'not an ip' })).toMatch(/an ip is/);
    expect(validBlock({ target: 'ip_range', value: '203.0.113.9' })).toMatch(/prefix/);
    expect(validBlock({ target: 'asn', value: '13335' })).toMatch(/AS13335/);
    expect(validBlock({ target: 'country', value: 'usa' })).toMatch(/two-letter/);
    expect(validBlock({ target: 'ip', value: '203.0.113.9' })).toBe('');
    expect(validBlock({ target: 'ip_range', value: '203.0.113.0/24' })).toBe('');
    expect(validBlock({ target: 'asn', value: 'as13335' })).toBe('');
    expect(validBlock({ target: 'country', value: 'RU' })).toBe('');
  });
  it('GET lists only block-mode access rules, mapped', async () => {
    stub((url) => authOk()(url) || jsonRes({ success: true, result: [{ id: 'a'.repeat(32), mode: 'block', configuration: { target: 'asn', value: 'AS1' }, notes: 'why', created_on: '2026-10-16T00:00:00Z' }] }));
    const res = await handleEdge(asSteward('/edge/blocks'), ENV);
    const body = await res.json();
    expect(calls[1].url).toContain('/firewall/access_rules/rules?per_page=100&mode=block');
    expect(body.blocks).toEqual([{ id: 'a'.repeat(32), mode: 'block', target: 'asn', value: 'AS1', notes: 'why', createdOn: '2026-10-16T00:00:00Z' }]);
  });
  it('POST makes a block rule signed with the steward\'s email and the date; asn is upper-cased', async () => {
    stub((url, init) => authOk()(url) || jsonRes({ success: true, result: { id: 'b'.repeat(32), mode: 'block', ...JSON.parse(init.body) } }));
    const res = await handleEdge(asSteward('/edge/blocks', { method: 'POST', body: JSON.stringify({ target: 'asn', value: 'as13335', note: 'scraper' }) }), ENV);
    const sent = JSON.parse(calls[1].init.body);
    expect(calls[1].init.method).toBe('POST');
    expect(sent.mode).toBe('block');
    expect(sent.configuration).toEqual({ target: 'asn', value: 'AS13335' });
    expect(sent.notes).toMatch(new RegExp(`^PoeTech Edge Guard · ${STEWARD} · \\d{4}-\\d{2}-\\d{2} · scraper$`));
    expect((await res.json()).block.value).toBe('AS13335');
  });
  it('POST with a bad value is a 400 and never reaches Cloudflare', async () => {
    stub(authOk());
    const res = await handleEdge(asSteward('/edge/blocks', { method: 'POST', body: JSON.stringify({ target: 'ip', value: 'everyone' }) }), ENV);
    expect(res.status).toBe(400);
    expect(calls.filter((c) => c.url.startsWith(CF_API))).toHaveLength(0);
  });
  it('DELETE removes by id, and an id that is not 32 hex is refused first', async () => {
    stub((url) => authOk()(url) || jsonRes({ success: true, result: { id: 'c'.repeat(32) } }));
    const res = await handleEdge(asSteward(`/edge/blocks/${'c'.repeat(32)}`, { method: 'DELETE' }), ENV);
    expect(calls[1].init.method).toBe('DELETE');
    expect(calls[1].url).toBe(`${CF_API}/zones/zone1/firewall/access_rules/rules/${'c'.repeat(32)}`);
    expect(await res.json()).toEqual({ ok: true, removed: 'c'.repeat(32) });
    const bad = await removeBlock(ENV, '../zones');
    expect(bad).toMatchObject({ ok: false, status: 400 });
    expect(await addBlock(ENV, { target: 'asn', value: 'nope' }, STEWARD)).toMatchObject({ ok: false, status: 400 });
    expect((await listBlocks(ENV)).ok).toBe(true);
  });
});

describe('the Worker carries the road and the deploy arms its two keys', () => {
  it('worker.fetch hands /edge/* to the Edge Guard, and the road table never proxies it', async () => {
    stub(() => { throw new Error('must not be called'); });
    const res = await worker.fetch(new Request('https://poetech.us/edge/ping'), ENV);
    expect(await res.json()).toMatchObject({ ok: true, road: 'edge' });
    expect(roadFor('/edge/ping')).toBeNull();
    expect(roadFor('/edge')).toBeNull();
  });
  it('wrangler.toml routes /edge/* on both hosts; the workflow puts CF_API_TOKEN and SB_ANON_KEY and reads /edge/ping back', () => {
    const toml = read('infra/cf-roads-worker/wrangler.toml');
    expect(toml).toContain('pattern = "poetech.us/edge/*"');
    expect(toml).toContain('pattern = "www.poetech.us/edge/*"');
    const wf = read('.github/workflows/cf-roads-worker.yml');
    expect(wf).toMatch(/wrangler@3 secret put CF_API_TOKEN/);
    expect(wf).toMatch(/wrangler@3 secret put SB_ANON_KEY/);
    expect(wf).toMatch(/tailscale\/github-action@v3/);
    expect(wf).toMatch(/add-mask::\$KEY/);
    expect(wf).toMatch(/check "https:\/\/poetech\.us\/edge\/ping"/);
    // The secrets are put only inside the deploy job (behind the explicit input).
    const deployAt = wf.indexOf('  deploy:\n');
    expect(deployAt).toBeGreaterThan(0);
    expect(wf.indexOf('secret put CF_API_TOKEN')).toBeGreaterThan(deployAt);
  });
  it('the Worker never reads a Cloudflare token from the request', () => {
    const src = read('infra/cf-roads-worker/edge.js');
    expect(src).not.toMatch(/headers\.get\(['"]x-cf|headers\.get\(['"]cf-token|searchParams\.get\(['"]token/i);
    expect(src).not.toMatch(/console\.log/);
  });
});
