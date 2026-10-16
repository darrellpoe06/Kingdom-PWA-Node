// =============================================================================
// The same-origin roads have a second door that does not depend on Pages
// Functions (DR-1060; #2057): the zone Worker carries every proxied Pages
// route, exactly, and nothing else.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker, { ROADS, FUNNEL_ORIGIN, roadFor, targetFor } from '../../../infra/cf-roads-worker/worker.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// Every Pages route built on makeFunnelProxy: [routePrefix, upstreamPrefix].
function pagesProxyRoutes() {
  const out = [];
  const walk = (dir, rel) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { if (f !== '_lib') walk(p, `${rel}/${f}`); continue; }
      if (!f.endsWith('.js')) continue;
      const src = readFileSync(p, 'utf8');
      const m = /makeFunnelProxy\(\{\s*upstreamPrefix:\s*'([^']*)'/.exec(src);
      if (!m) continue;
      const route = `${rel}/${f}`.replace(/\/\[\[path\]\]\.js$/, '').replace(/\.js$/, '');
      out.push([route, m[1]]);
    }
  };
  walk(join(ROOT, 'app', 'functions'), '');
  return out;
}

describe('every proxied Pages route is a road on the Worker, with the same upstream', () => {
  const pages = pagesProxyRoutes();
  it('finds the Pages proxy routes at all (the parity below is not vacuous)', () => {
    expect(pages.length).toBeGreaterThanOrEqual(18);
    expect(pages.map(([r]) => r)).toContain('/sb');
  });
  it.each(pages)('%s -> Funnel %s', (route, upstream) => {
    const road = ROADS.find(([prefix]) => prefix === route);
    expect(road, `ROADS has no row for ${route}`).toBeTruthy();
    expect(road[1]).toBe(upstream);
  });
  it('carries no road the Pages tree does not have (the Worker never invents a path)', () => {
    const known = new Set(pages.map(([r]) => r));
    for (const [prefix] of ROADS) expect(known.has(prefix), `${prefix} has no Pages route`).toBe(true);
  });
});

describe('the mapping is exact', () => {
  it('forwards a records call, a nested taxes path and the single-path roads the way Pages did', () => {
    expect(targetFor('https://poetech.us/sb/rest/v1/rpc/church_member_record_read?x=1')).toBe(`${FUNNEL_ORIGIN}/sb/rest/v1/rpc/church_member_record_read?x=1`);
    expect(targetFor('https://poetech.us/poetech-app/taxes/upload')).toBe(`${FUNNEL_ORIGIN}/taxes/upload`);
    expect(targetFor('https://poetech.us/automation-status')).toBe(`${FUNNEL_ORIGIN}/automation-status`);
    expect(targetFor('https://www.poetech.us/voice-lite/say')).toBe(`${FUNNEL_ORIGIN}/voice-lite/say`);
  });
  it('a longer prefix wins over the one it begins with', () => {
    expect(roadFor('/voice-lite/say')[2]).toBe('voice-lite');
    expect(roadFor('/voice/say')[2]).toBe('voice');
    expect(roadFor('/wake-orchestrator-control')[2]).toBe('wake-orchestrator-control');
    expect(roadFor('/wake-orchestrator')[2]).toBe('wake-orchestrator');
  });
  it('a path that merely starts with a road word is not the road, and the app itself is never ours', () => {
    expect(roadFor('/sbx/thing')).toBeNull();
    expect(roadFor('/poetech-app/')).toBeNull();
    expect(roadFor('/poetech-app/assets/x.js')).toBeNull();
    expect(roadFor('/api/checkout')).toBeNull();
    expect(targetFor('https://poetech.us/')).toBeNull();
  });
});

describe('the Worker hands unknown paths to the origin untouched', () => {
  it('calls fetch with the original request and returns its answer', async () => {
    const seen = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (input) => { seen.push(input); return new Response('origin', { status: 200 }); };
    try {
      const req = new Request('https://poetech.us/poetech-app/assets/app.js');
      const res = await worker.fetch(req);
      expect(seen).toHaveLength(1);
      expect(seen[0]).toBe(req);
      expect(await res.text()).toBe('origin');
    } finally { globalThis.fetch = original; }
  });
  it('a road is forwarded to the Funnel with Host dropped and the Worker named on the way back', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }); };
    try {
      const res = await worker.fetch(new Request('https://poetech.us/sb/auth/v1/health', { headers: { host: 'poetech.us', apikey: 'k' } }));
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${FUNNEL_ORIGIN}/sb/auth/v1/health`);
      expect(calls[0].init.headers.get('host')).toBeNull();
      expect(calls[0].init.headers.get('apikey')).toBe('k');
      expect(res.headers.get('x-poetech-road')).toBe('worker');
      expect(res.status).toBe(200);
    } finally { globalThis.fetch = original; }
  });
  it('an HTML 5xx from the edge becomes one JSON 502, as the Pages proxy does', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response('<html><title>Origin DNS error | poetech</title></html>', { status: 530, headers: { 'content-type': 'text/html' } });
    try {
      const res = await worker.fetch(new Request('https://poetech.us/sb/auth/v1/health'));
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.code).toBe('upstream-unreachable');
      expect(body.detail).toBe('Origin DNS error');
    } finally { globalThis.fetch = original; }
  });
});

describe('wrangler.toml binds every road on the apex and on www, and nothing wider', () => {
  const toml = read('infra/cf-roads-worker/wrangler.toml');
  const patterns = [...toml.matchAll(/pattern\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  it.each(ROADS.map(([prefix]) => [prefix]))('%s is routed on both hosts', (prefix) => {
    const single = /^\/(interest|automation-status|property-history|review-action|review-feed|wake-orchestrator-control|wake-orchestrator)$/.test(prefix);
    const want = single ? prefix : `${prefix}/*`;
    expect(patterns).toContain(`poetech.us${want}`);
    expect(patterns).toContain(`www.poetech.us${want}`);
  });
  it('has exactly two patterns per road and no catch-all', () => {
    expect(patterns).toHaveLength(ROADS.length * 2);
    expect(patterns.some((p) => /\/\*$/.test(p) && /^(www\.)?poetech\.us\/\*$/.test(p))).toBe(false);
    expect(toml).toMatch(/zone_name = "poetech\.us"/);
    expect(toml).toMatch(/name = "poetech-roads"/);
  });
});

describe('the workflow is dispatch-only and reads the domain back before it claims anything', () => {
  const wf = read('.github/workflows/cf-roads-worker.yml');
  it('has no schedule and no push trigger; the deploy is behind an explicit input', () => {
    expect(wf).not.toMatch(/^\s*schedule:/m);
    expect(wf).not.toMatch(/^\s*push:/m);
    expect(wf).toMatch(/workflow_dispatch:/);
    expect(wf).toMatch(/if: \$\{\{ inputs\.deploy == 'yes' \}\}/);
  });
  it('probes the records road with the browser\'s own Origin, in a burst, and deploys from the Worker folder', () => {
    expect(wf).toMatch(/\/sb\/rest\/v1\/rpc\/user_role_in_instance/);
    expect(wf).toMatch(/Origin: \$APP_ORIGIN/);
    expect(wf).toMatch(/xargs -P 8/);
    expect(wf).toMatch(/working-directory: infra\/cf-roads-worker/);
    expect(wf).toMatch(/check "https:\/\/poetech\.us\/sb\/auth\/v1\/health"/);
    expect(wf).toMatch(/exit \$fail/);
  });
});
