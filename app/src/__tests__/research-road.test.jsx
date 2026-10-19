// =============================================================================
// research-road — the app's side of the research road (DR-1101)
// =============================================================================
// The NAS end (research_forwarder.py) proves its own door in its --selftest.
// This pins the app end: the caps it mirrors, that a link it draws is only
// ever http(s), that the road's state comes from its own /health and never a
// painted status, that a question without the family key is not sent, and
// that the whole road is wired: Pages Function, Worker road, route include,
// transport row, watchdog mount, manifest entry, pinned compose and witness.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  queryProblem, safeSources, classifyHealth, askResearch, researchHealth, MAX_QUERY_CHARS, askUrl, healthUrl,
} from '../lib/research.js';

vi.mock('../lib/supabase.js', () => ({ supabase: { rpc: vi.fn(async () => ({ data: null, error: null })) } }));
vi.mock('../lib/nas-photos.js', () => ({ bridgeToken: () => 'family-key', hasBridgeToken: () => true, setBridgeToken: () => {} }));
const { default: ResearchTry } = await import('../components/ResearchTry.jsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (status, body) => ({ status, json: async () => body });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host = null;
let root = null;
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(el); });
  await flush();
  return host;
}
async function flush() { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); }
async function type(el, value) {
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  await act(async () => { set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
}
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  if (host) host.remove();
  root = null; host = null;
});

describe('the question and its sources', () => {
  it('mirrors the forwarder’s length cap and refuses an empty question', () => {
    expect(queryProblem('  ')).toMatch(/Type a question/);
    expect(queryProblem('x'.repeat(MAX_QUERY_CHARS))).toBe(null);
    expect(queryProblem('x'.repeat(MAX_QUERY_CHARS + 1))).toMatch(/under 500/);
    const fwd = read('infra/nas-research/research_forwarder.py');
    expect(fwd).toMatch(new RegExp(`^MAX_QUERY_CHARS = ${MAX_QUERY_CHARS}$`, 'm'));
  });
  it('draws only http(s) links, once each (proven-to-catch: javascript:, file:, data:)', () => {
    const out = safeSources([
      { title: 'One', url: 'https://example.org/1' },
      { title: 'Again', url: 'https://example.org/1' },
      { title: 'Bad', url: 'javascript:alert(1)' },
      { title: 'File', url: 'file:///etc/passwd' },
      { title: 'Data', url: 'data:text/html,hi' },
      { title: 'Two', url: 'http://example.org/2' },
    ]);
    expect(out.map((s) => s.url)).toEqual(['https://example.org/1', 'http://example.org/2']);
  });
});

describe('the road’s state comes from its own /health', () => {
  it('reads live, dark with the NAS’s own reason, or unreachable', () => {
    expect(classifyHealth(200, { ok: true, chat: 'qwen2.5:14b' })).toEqual({ state: 'live', chat: 'qwen2.5:14b', embedding: null });
    expect(classifyHealth(503, { ok: false, reason: 'no provider' })).toEqual({ state: 'dark', reason: 'no provider' });
    expect(classifyHealth(0, null).state).toBe('unreachable');
    expect(classifyHealth(502, { error: 'html 5xx' }).state).toBe('unreachable');
  });
  it('a 200 without ok:true is never read as live (proven-to-catch)', () => {
    expect(classifyHealth(200, { ok: false, reason: 'x' }).state).toBe('dark');
    expect(classifyHealth(200, null).state).toBe('unreachable');
  });
  it('asks /research/health without a key, and survives a thrown fetch', async () => {
    const f = vi.fn(async () => json(200, { ok: true, chat: 'qwen' }));
    expect((await researchHealth({ fetchImpl: f })).state).toBe('live');
    expect(f.mock.calls[0][0]).toBe(healthUrl());
    expect(f.mock.calls[0][1].headers).toBeUndefined();
    expect((await researchHealth({ fetchImpl: async () => { throw new Error('down'); } })).state).toBe('unreachable');
  });
});

describe('asking', () => {
  it('sends nothing without the family key', async () => {
    const f = vi.fn();
    const r = await askResearch('What is Vane?', { token: '', fetchImpl: f });
    expect(r.ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  it('posts the question with the key, web only, and returns safe sources marked unverified', async () => {
    const f = vi.fn(async () => json(200, { answer: 'An answer engine.', sources: [{ title: 'S', url: 'https://s.example' }, { title: 'X', url: 'javascript:x' }], model: 'qwen2.5:14b', verified: false, note: 'not checked' }));
    const r = await askResearch(' What is Vane? ', { token: 'k', fetchImpl: f });
    const [url, opts] = f.mock.calls[0];
    expect(url).toBe(askUrl());
    expect(opts.headers.Authorization).toBe('Bearer k');
    expect(JSON.parse(opts.body)).toEqual({ query: 'What is Vane?', mode: 'speed', sources: ['web'] });
    expect(r).toMatchObject({ ok: true, answer: 'An answer engine.', verified: false, model: 'qwen2.5:14b' });
    expect(r.sources.map((s) => s.url)).toEqual(['https://s.example']);
  });
  it('turns the road’s refusals into plain words', async () => {
    for (const [code, re] of [[401, /family key/], [503, /busy/], [504, /three minutes/], [413, /under 500/]]) {
      const r = await askResearch('q', { token: 'k', fetchImpl: async () => json(code, { error: 'x' }) });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(re);
    }
  });
});

describe('the panel', () => {
  const client = { rpc: async () => ({}) };
  it('says the road is not running when /health is dark, and will not ask', async () => {
    const f = vi.fn(async () => json(503, { ok: false, reason: 'no reachable Ollama' }));
    const el = await mount(createElement(ResearchTry, { fetchImpl: f, client }));
    expect(el.textContent).toMatch(/Not ready: no reachable Ollama/);
    await type(el.querySelector('#research-q'), 'Where?');
    expect(el.querySelector('button[type=submit]').disabled).toBe(true);
  });
  it('asks a live road and shows the answer as text, its sources as links, and says it is unchecked', async () => {
    const f = vi.fn(async (url) => (url === healthUrl()
      ? json(200, { ok: true, chat: 'qwen2.5:14b-instruct-q4_K_M' })
      : json(200, { answer: 'Qumran, from 1947. <b>x</b>', sources: [{ title: 'Scrolls', url: 'https://example.org/scrolls' }], model: 'qwen', note: 'Sources are what the search returned; the answer’s [n] marks are the model’s, not checked.' })));
    const el = await mount(createElement(ResearchTry, { fetchImpl: f, client }));
    expect(el.textContent).toMatch(/Live on the NAS · answering with qwen2\.5:14b/);
    await type(el.querySelector('#research-q'), 'Where were the scrolls found?');
    const btn = el.querySelector('button[type=submit]');
    expect(btn.disabled).toBe(false);
    await act(async () => { btn.click(); });
    await flush();
    expect(el.textContent).toContain('Qumran, from 1947. <b>x</b>');
    expect(el.querySelector('b')).toBe(null);
    const link = el.querySelector('a[href="https://example.org/scrolls"]');
    expect(link && link.textContent).toBe('Scrolls');
    expect(link.getAttribute('rel')).toMatch(/noopener/);
    expect(el.textContent).toMatch(/not checked/);
    expect(f.mock.calls.find(([u]) => u === askUrl())[1].headers.Authorization).toBe('Bearer family-key');
  });
});

describe('the road is wired end to end', () => {
  it('has its Pages Function, Worker road, route include and transport row', () => {
    expect(read('app/functions/research/[[path]].js')).toMatch(/upstreamPrefix: '\/research'/);
    expect(read('infra/cf-roads-worker/worker.js')).toContain("['/research', '/research', 'research']");
    expect(JSON.parse(read('app/public/_routes.json')).include).toContain('/research/*');
    expect(read('infra/nas-transport/RECORDED-STATE.md')).toMatch(/^\| `\/research` \| `http:\/\/127\.0\.0\.1:8797`/m);
    expect(read('infra/nas-loops/loops/funnel_watchdog.py')).toContain('("/research", "http://127.0.0.1:8797")');
  });
  it('is in the self-deploy manifest, last, with a witness that exists', () => {
    const svcs = JSON.parse(read('infra/nas-loops/services.json')).services;
    const r = svcs.find((s) => s.name === 'research');
    expect(r).toMatchObject({ install: 'infra/nas-research/install.sh', enabled: true });
    expect(svcs[svcs.length - 1].name).toBe('research');
    expect(r.description).toMatch(/Witness: research-health\.yml/);
    expect(existsSync(join(ROOT, '.github/workflows/research-health.yml'))).toBe(true);
  });
  it('pins both images by digest, keeps them on loopback, and never ships the single image', () => {
    const c = read('infra/nas-research/docker-compose.yml');
    const images = [...c.matchAll(/^\s*image:\s*(\S+)/gm)].map((m) => m[1]);
    expect(images).toHaveLength(2);
    for (const i of images) expect(i).toMatch(/:[\w.-]+@sha256:[0-9a-f]{64}$/);
    expect(c).toContain('vane:slim-v1.12.2@');
    expect(c).toContain('"127.0.0.1:8798:8080"');
    expect(c).toMatch(/HOSTNAME: "127\.0\.0\.1"/);
    expect(c).not.toMatch(/0\.0\.0\.0/);
  });
  it('the installer mounts only after proving the road, and cites the transport baseline', () => {
    const s = read('infra/nas-research/install.sh');
    expect(s).toContain('RECORDED-STATE');
    expect(s.indexOf('/healthz')).toBeLessThan(s.indexOf('funnel --bg --set-path /research'));
    expect(s.indexOf('/api/providers')).toBeLessThan(s.indexOf('funnel --bg --set-path /research'));
    expect(s.indexOf('"$HCODE" != "200"')).toBeLessThan(s.indexOf('funnel --bg --set-path /research'));
    expect(s).toMatch(/TOKEN_FILE[\s\S]*refuses to start an unlocked door/);
  });
  it('with no GPU tower, the installer still restarts the forwarder onto the new code before it stops', () => {
    // 2026-10-19, measured: the restart sat after the tower check, so "no tower"
    // exited first and the OLD forwarder kept hanging 180 s on every question.
    const s = read('infra/nas-research/install.sh');
    const noTower = s.indexOf('if [ -z "$OLLAMA" ]; then');
    const exitAfter = s.indexOf('exit 0', noTower);
    expect(noTower).toBeGreaterThan(0);
    expect(s.slice(noTower, exitAfter)).toContain('forwarder_follows_code');
    expect(s.indexOf('forwarder_follows_code() {')).toBeLessThan(noTower);
    expect(s.slice(s.indexOf('forwarder_follows_code() {'), noTower)).toMatch(/CODE_SHA[\s\S]*systemctl restart poetech-research/);
  });
  it('CI runs the forwarder’s selftest', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/working-directory: infra\/nas-research\n\s+run: python3 research_forwarder\.py --selftest/);
  });
});
