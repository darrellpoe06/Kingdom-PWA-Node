// @vitest-environment jsdom
// =============================================================================
// The Edge Guard surface (DR-1067): Admin → Users and usage → Bots & blocks.
// The client speaks to /edge with the caller's own session and says, in words,
// when the road is not there; the surface paints nothing it did not read, and
// every block is a two-step on the page, never a browser dialog.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const S = vi.hoisted(() => ({ session: { access_token: 'sess' } }));
vi.mock('../lib/supabase.js', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: S.session } }) } },
}));

const { edgeCall, edgeTimeout, compactCount, agentKind, EDGE_WAIT_MS } = await import('../lib/edge-guard.js');

describe('edge-guard client', () => {
  beforeEach(() => { S.session = { access_token: 'sess' }; });

  it('sends the session bearer to the same-origin /edge road and returns its JSON', async () => {
    const seen = [];
    const fetchImpl = async (url, init) => { seen.push({ url, init }); return new Response('{"ok":true,"email":"x"}', { headers: { 'content-type': 'application/json' } }); };
    const r = await edgeCall('/whoami', {}, fetchImpl);
    expect(r).toEqual({ ok: true, email: 'x' });
    expect(seen[0].url).toBe('/edge/whoami');
    expect(seen[0].init.headers.authorization).toBe('Bearer sess');
  });
  it('signed out -> says so without touching the network', async () => {
    S.session = null;
    let touched = false;
    const r = await edgeCall('/bots', {}, async () => { touched = true; return new Response('{}'); });
    expect(r).toMatchObject({ ok: false, reason: 'signed-out' });
    expect(touched).toBe(false);
  });
  it('the SPA shell (text/html) means the road is not open yet, and says which workflow opens it', async () => {
    const r = await edgeCall('/bots', {}, async () => new Response('<!doctype html><html></html>', { headers: { 'content-type': 'text/html' } }));
    expect(r).toMatchObject({ ok: false, reason: 'no-road' });
    expect(r.message).toContain('cf-roads-worker.yml');
  });
  it('a network failure and a non-JSON answer are named, never thrown', async () => {
    expect(await edgeCall('/bots', {}, async () => { throw new Error('offline'); })).toMatchObject({ ok: false, reason: 'network' });
    expect(await edgeCall('/bots', {}, async () => new Response('nope', { status: 500, headers: { 'content-type': 'text/plain' } }))).toMatchObject({ ok: false, reason: 'bad-answer' });
  });
  it('a PUT carries a JSON body and content-type', async () => {
    const seen = [];
    await edgeCall('/bots', { method: 'PUT', body: { fightMode: true } }, async (url, init) => { seen.push(init); return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } }); });
    expect(seen[0].method).toBe('PUT');
    expect(seen[0].headers['content-type']).toBe('application/json');
    expect(JSON.parse(seen[0].body)).toEqual({ fightMode: true });
  });
  it('edgeTimeout resolves to a timeout refusal after the wait, and the wait is 15 seconds', async () => {
    vi.useFakeTimers();
    try {
      const p = edgeTimeout(new Promise(() => {}), 1000, 'the edge road');
      await vi.advanceTimersByTimeAsync(1001);
      expect(await p).toMatchObject({ ok: false, reason: 'timeout' });
      expect(EDGE_WAIT_MS).toBe(15000);
    } finally { vi.useRealTimers(); }
  });
  it('compactCount reads like the dashboard; agentKind names our own witnesses before strangers', () => {
    expect(compactCount(930310)).toBe('930k');
    expect(compactCount(1900)).toBe('1.9k');
    expect(compactCount(2500000)).toBe('2.5M');
    expect(compactCount(31)).toBe('31');
    expect(agentKind('curl/8.5.0')).toMatch(/our witness/);
    expect(agentKind('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36')).toBe('our witness (site-health)');
    expect(agentKind('Mozilla/5.0 (compatible; GPTBot/1.0)')).toBe('an AI crawler');
    expect(agentKind('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe('a search engine');
    expect(agentKind('python-requests/2.31')).toBe('a bot or script');
    expect(agentKind('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1')).toBe('a browser');
    expect(agentKind('')).toBe('unknown');
  });
});

// --- the surface --------------------------------------------------------------
const lib = vi.hoisted(() => ({
  getBots: vi.fn(), setBots: vi.fn(), getTraffic: vi.fn(), listBlocks: vi.fn(), addBlock: vi.fn(), removeBlock: vi.fn(),
}));
vi.mock('../lib/edge-guard.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, ...lib };
});
const EdgeGuard = (await import('../components/EdgeGuard.jsx')).default;

const BOTS = { ok: true, bots: { fightMode: false, aiBots: 'disabled', crawlerProtection: null } };
const TRAFFIC = { ok: true, traffic: { since: 'x', total: 930310,
  paths: [{ path: '/sb/rest/v1/rpc/x', count: 500000 }],
  agents: [{ agent: 'curl/8.5.0', count: 400000 }, { agent: 'Mozilla/5.0 (compatible; GPTBot/1.0)', count: 90000 }],
  networks: [{ asn: 13335, name: 'CLOUDFLARENET', count: 300000 }],
  addresses: [{ ip: '203.0.113.9', count: 1000 }],
  countries: [{ country: 'United States', count: 700000 }] } };
const BLOCKS = { ok: true, blocks: [{ id: 'a'.repeat(32), mode: 'block', target: 'asn', value: 'AS1', notes: 'PoeTech Edge Guard · d · 2026-10-16 · scraper', createdOn: null }] };

let container; let root;
const q = (sel) => container.querySelector(sel);
const byId = (id) => q(`[data-testid="${id}"]`);
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(EdgeGuard)); });
  await act(async () => {});
}
beforeEach(() => {
  for (const f of Object.values(lib)) f.mockReset();
  lib.getBots.mockResolvedValue(BOTS);
  lib.getTraffic.mockResolvedValue(TRAFFIC);
  lib.listBlocks.mockResolvedValue(BLOCKS);
});
afterEach(() => {
  try { act(() => root.unmount()); } catch { /* noop */ }
  container?.remove();
});

describe('EdgeGuard surface', () => {
  it('reads all three cards on mount and shows the total, our witness named, and the block list', async () => {
    await mount();
    expect(lib.getBots).toHaveBeenCalledTimes(1);
    expect(lib.getTraffic).toHaveBeenCalledWith(24);
    expect(lib.listBlocks).toHaveBeenCalledTimes(1);
    expect(byId('edge-total').textContent).toBe('930k requests');
    expect(byId('edge-agents').textContent).toContain('our witness');
    expect(byId('edge-agents').textContent).toContain('an AI crawler');
    expect(byId('edge-networks').textContent).toContain('CLOUDFLARENET');
    expect(byId(`edge-block-row-${'a'.repeat(32)}`).textContent).toContain('asn AS1');
    expect(byId('edge-fight-mode').getAttribute('aria-pressed')).toBe('false');
  });
  it('when the road is not open, each card says why instead of painting a toggle', async () => {
    const noRoad = { ok: false, reason: 'no-road', message: 'The Edge Guard road is not open on this site yet.' };
    lib.getBots.mockResolvedValue(noRoad); lib.getTraffic.mockResolvedValue(noRoad); lib.listBlocks.mockResolvedValue(noRoad);
    await mount();
    expect(byId('edge-refusal-bots').textContent).toContain('not open');
    expect(byId('edge-refusal-traffic').textContent).toContain('not open');
    expect(byId('edge-refusal-blocks').textContent).toContain('not open');
    expect(byId('edge-fight-mode')).toBeNull();
    expect(byId('edge-total')).toBeNull();
    expect(byId('edge-add-block')).toBeNull();
  });
  it('the bot toggles send the patch and show what Cloudflare read back', async () => {
    lib.setBots.mockResolvedValue({ ok: true, bots: { fightMode: true, aiBots: 'disabled', crawlerProtection: null } });
    await mount();
    await click(byId('edge-fight-mode'));
    expect(lib.setBots).toHaveBeenCalledWith({ fightMode: true });
    expect(byId('edge-fight-mode').getAttribute('aria-pressed')).toBe('true');
    expect(byId('edge-said').textContent).toContain('Bot Fight Mode on');
    lib.setBots.mockResolvedValue({ ok: true, bots: { fightMode: true, aiBots: 'block', crawlerProtection: null } });
    await click(byId('edge-ai-bots'));
    expect(lib.setBots).toHaveBeenLastCalledWith({ aiBots: 'block' });
    expect(byId('edge-said').textContent).toContain('AI crawlers blocked');
  });
  it('a refused toggle shows Cloudflare\'s words and leaves the state as read', async () => {
    lib.setBots.mockResolvedValue({ ok: false, reason: 'cloudflare', message: 'Cloudflare said: 10000 Authentication error. The token needs Bot Management: Edit.' });
    await mount();
    await click(byId('edge-fight-mode'));
    expect(byId('edge-said').textContent).toContain('Bot Management: Edit');
    expect(byId('edge-fight-mode').getAttribute('aria-pressed')).toBe('false');
  });
  it('blocking a network is a two-step on the page: Block, then confirm — Keep backs out', async () => {
    lib.addBlock.mockResolvedValue({ ok: true, block: {} });
    await mount();
    await click(byId('edge-block-asn-13335'));
    expect(lib.addBlock).not.toHaveBeenCalled();
    await click(byId('edge-block-asn-13335-keep'));
    expect(byId('edge-block-asn-13335')).not.toBeNull();
    expect(lib.addBlock).not.toHaveBeenCalled();
    await click(byId('edge-block-asn-13335'));
    await click(byId('edge-block-asn-13335-confirm'));
    expect(lib.addBlock).toHaveBeenCalledWith('asn', 'AS13335', 'CLOUDFLARENET');
    expect(lib.listBlocks).toHaveBeenCalledTimes(2);
    expect(byId('edge-said').textContent).toContain('Blocked asn AS13335');
  });
  it('blocking an address and unblocking a rule go the same two-step way', async () => {
    lib.addBlock.mockResolvedValue({ ok: true, block: {} });
    lib.removeBlock.mockResolvedValue({ ok: true, removed: 'a'.repeat(32) });
    await mount();
    await click(byId('edge-block-ip-203.0.113.9'));
    await click(byId('edge-block-ip-203.0.113.9-confirm'));
    expect(lib.addBlock).toHaveBeenCalledWith('ip', '203.0.113.9', '');
    await click(byId(`edge-unblock-${'a'.repeat(32)}`));
    expect(lib.removeBlock).not.toHaveBeenCalled();
    await click(byId(`edge-unblock-${'a'.repeat(32)}-confirm`));
    expect(lib.removeBlock).toHaveBeenCalledWith('a'.repeat(32));
    expect(byId('edge-said').textContent).toContain('Unblocked');
  });
  it('the add form sends kind, value and why, and clears', async () => {
    lib.addBlock.mockResolvedValue({ ok: true, block: {} });
    await mount();
    const form = byId('edge-add-block');
    const select = form.querySelector('select');
    const [value, note] = form.querySelectorAll('input');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'country');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const setInput = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    await act(async () => { setInput(value, 'RU'); setInput(note, 'no family there'); });
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(lib.addBlock).toHaveBeenCalledWith('country', 'RU', 'no family there');
    expect(value.value).toBe('');
  });
  it('a failed block says why', async () => {
    lib.addBlock.mockResolvedValue({ ok: false, reason: 'invalid', message: 'an asn looks like AS13335' });
    await mount();
    await click(byId('edge-block-asn-13335'));
    await click(byId('edge-block-asn-13335-confirm'));
    expect(byId('edge-said').textContent).toContain('an asn looks like AS13335');
  });
  it('Refresh reads all three again', async () => {
    await mount();
    await click(byId('edge-refresh'));
    expect(lib.getBots).toHaveBeenCalledTimes(2);
    expect(lib.getTraffic).toHaveBeenCalledTimes(2);
    expect(lib.listBlocks).toHaveBeenCalledTimes(2);
  });
});

describe('the surface is wired where the stewards look, and uses no browser dialog', () => {
  it('AccessUsageMetrics carries the Bots & blocks sub-tab rendering EdgeGuard', () => {
    const src = read('app/src/components/AccessUsageMetrics.jsx');
    expect(src).toMatch(/import EdgeGuard from '\.\/EdgeGuard\.jsx'/);
    expect(src).toMatch(/id: 'edge',\s*label: 'Bots & blocks',\s*render: \(\) => <EdgeGuard \/>/);
  });
  it('EdgeGuard.jsx has no window.confirm / alert / prompt, and every button carries the focus ring', () => {
    const src = read('app/src/components/EdgeGuard.jsx');
    expect(src).not.toMatch(/window\.(confirm|alert|prompt)|\bconfirm\(/);
    expect(src).toMatch(/focus:outline-\[#B85838\]/);
  });
});
