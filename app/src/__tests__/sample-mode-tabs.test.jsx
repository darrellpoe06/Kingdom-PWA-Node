// sample-mode-tabs.test.jsx — in sample mode the four self-fetching Money tabs
// (Owed, Plan, Taxes, 1099s) make NO read with the session and show the sample notice.
// Measured 2026-10-28: they fetched the family's real rows inside the "sample".
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const calls = { obligations: 0, post: 0, plan: 0, archive: 0, provision: 0, feedback: 0 };
vi.mock('../lib/obligations-sync.js', () => ({ listObligations: async () => { calls.obligations += 1; return { ok: true, rows: [] }; } }));
vi.mock('../lib/days-post-sync.js', () => ({ listPost: async () => { calls.post += 1; return { ok: true, rows: [] }; }, sortDocument: async () => ({ ok: true, document: {} }), releaseForSorting: async () => ({ ok: true, document: {} }) }));
vi.mock('../lib/supabase.js', () => ({
  default: { from: () => { calls.plan += 1; return { select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }), order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }; }, rpc: async () => ({ data: null, error: null }) },
  supabase: { rpc: async () => { calls.provision += 1; return { data: null, error: null }; } },
  onAuthChange: (cb) => { cb({ user: { email: 'member@example.com' } }); return () => {}; },
}));
vi.mock('../lib/instance-role.js', () => ({ useInstanceRole: () => ({ instanceId: 'inst-1', role: 'owner' }) }));
vi.mock('../lib/tax-archive.js', async (orig) => { const m = await orig(); return { ...m, fetchTaxArchive: async () => { calls.archive += 1; return { documents: [], served_at: null, source: 'nas', reason: null }; } }; });
vi.mock('../lib/bridge-provision.js', () => ({ provisionBridgeToken: async () => { calls.provision += 1; return 'none'; } }));
vi.mock('../lib/nas-photos.js', () => ({ hasBridgeToken: () => false, setBridgeToken: () => {} }));
vi.mock('../lib/bridge-auth.js', () => ({ resolveBridgeBearer: () => null }));
vi.mock('../lib/feedback-sync.js', () => ({ uploadFeedback: async () => ({ uploaded: false }), subscribeFeedback: () => { calls.feedback += 1; return () => {}; } }));

import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Obligations from '../components/Obligations.jsx';
import FamilyPlan from '../components/FamilyPlan.jsx';
import BooksTaxes from '../components/BooksTaxes.jsx';
import { Contractors1099 } from '../components/Contractors1099.jsx';

let host; let root;
async function mount(el) {
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => { root.render(el); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  return host;
}
beforeEach(() => { for (const k of Object.keys(calls)) calls[k] = 0; });
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });

describe('sample mode: no read with the session, the notice instead', () => {
  it('Owed', async () => {
    const el = await mount(createElement(Obligations, { demo: true }));
    expect(el.querySelector('[data-testid="sample-mode-owed"]')).toBeTruthy();
    expect(calls.obligations).toBe(0); expect(calls.post).toBe(0);
  });
  it('Plan', async () => {
    const el = await mount(createElement(FamilyPlan, { demo: true }));
    expect(el.querySelector('[data-testid="sample-mode-plan"]')).toBeTruthy();
    expect(calls.plan).toBe(0);
  });
  it('Taxes', async () => {
    const el = await mount(createElement(BooksTaxes, { entities: [], demo: true }));
    expect(el.querySelector('[data-testid="sample-mode-taxes"]')).toBeTruthy();
    expect(calls.archive).toBe(0); expect(calls.provision).toBe(0);
  });
  it('1099s (the worker-voice stream)', async () => {
    const el = await mount(createElement(Contractors1099, { contractors: [], entities: [], incidents: [], transactions: [], demo: true, currentDate: new Date(2026, 9, 28) }));
    expect(el).toBeTruthy();
    expect(calls.feedback).toBe(0);
  });
});

describe('the real app (not sample) still reads — proven-to-catch', () => {
  it('Owed reads the ledger when demo is false', async () => {
    await mount(createElement(Obligations, { demo: false }));
    expect(calls.obligations).toBe(1);
  });
  it('Plan queries when demo is false', async () => {
    await mount(createElement(FamilyPlan, { demo: false }));
    expect(calls.plan).toBe(1);
  });
});
