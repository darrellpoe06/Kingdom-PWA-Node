// =============================================================================
// A door that breaks reports itself — nobody has to be kind
// =============================================================================
// DR-0377, closing the half of DR-0374 that 0216 left open. 0216 gave the
// customer a voice. It did nothing about the fact that NOTHING TELLS ANYONE on
// its own: Sterling Moore's order was refused on every attempt for the whole
// life of the door, and the client's entire response was
//
//     console.warn('[crm-sync] capture failed:', error)   (crm-sync.js:140)
//
// printed on his own phone, seen by nobody, kept by nothing. A form still waits
// on a customer choosing to speak up, and most people who hit a dead form just
// leave. A system that only finds out when someone is kind is not instrumented;
// it is lucky.
//
// Proven-to-catch: removing the fault report from the capture failure path, and
// removing the fold that makes a storm one row, each fail this suite.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const calls = [];
const captureResult = { skipped: 'capture-error', error: { message: 'unknown pipeline: moore-orders' } };

vi.mock('../lib/showcase.js', () => ({
  fetchShowcase: async () => ({ ok: true, pieces: [] }),
  showcaseImageUrl: (p) => `https://cdn.example/${p}`,
  sortPieces: (p) => [...(p || [])],
}));
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    rpc: async (fn, args) => { calls.push([fn, args]); return { data: 'row-1', error: null }; },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
  readPersistedSession: () => null,
  signOut: async () => ({}),
}));
vi.mock('../lib/public-rpc.js', () => ({ publicRpc: async () => ({ data: [], error: null }) }));
vi.mock('../lib/business-messages.js', () => ({
  fetchMessages: async () => ({ ok: true, rows: [] }),
  sendMessage: async () => ({ ok: true }),
}));
vi.mock('../lib/crm-sync.js', () => ({ captureLead: async () => captureResult }));

import MooreDoor from '../components/MooreDoor.jsx';
import { reportDoorFault, faultSentence, openFaults } from '../lib/door-feedback-sync.js';

let container, root;
beforeEach(() => {
  calls.length = 0;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  vi.restoreAllMocks();
});

async function mountAndFailAnOrder() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(MooreDoor)); });
  await act(async () => { await Promise.resolve(); });
  const name = container.querySelector('input[aria-label="Your name"]');
  const contact = container.querySelector('input[aria-label="Your email or handle"]');
  const setVal = (el, v) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  await act(async () => { setVal(name, 'Sterling'); });
  await act(async () => { setVal(contact, 'ster@example.com'); });
  await act(async () => { name.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await Promise.resolve(); });
}

describe('a failed order files its own report, with no customer involved', () => {
  it('calls door_fault_report when the capture is refused', async () => {
    await mountAndFailAnOrder();
    const fault = calls.find(([fn]) => fn === 'door_fault_report');
    expect(fault, 'the door stayed silent about its own failure').toBeTruthy();
    expect(fault[1].p_instance_slug).toBe('moore-divahs');
    expect(fault[1].p_payload.area).toBe('order');
  });

  it('the customer typed nothing — this is not the feedback form firing', async () => {
    await mountAndFailAnOrder();
    expect(calls.find(([fn]) => fn === 'door_feedback_submit')).toBeFalsy();
  });

  it('still shows the customer the honest failure — the report is not instead of that', async () => {
    await mountAndFailAnOrder();
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.textContent).toMatch(/has not received it/i);
  });
});

describe('what the office is told', () => {
  it('reads as a sentence about the door, not a Postgres error', () => {
    const s = faultSentence('The order form', 'unknown pipeline: moore-orders');
    expect(s).toMatch(/^The order form is failing for customers\./);
    expect(s).toMatch(/unknown pipeline/);
  });

  it('survives a missing detail without printing "undefined"', () => {
    expect(faultSentence('The order form', undefined)).toBe('The order form is failing for customers.');
    expect(faultSentence('The order form', null)).not.toMatch(/undefined|null/);
  });

  it('caps the machine detail so one huge error cannot flood the board', () => {
    const s = faultSentence('X', 'e'.repeat(5000));
    expect(s.length).toBeLessThan(400);
  });
});

describe('a fault report never makes things worse for the customer', () => {
  it('returns a failure rather than throwing when the RPC itself dies', async () => {
    const mod = await import('../lib/supabase.js');
    mod.default.rpc = async () => { throw new Error('offline'); };
    await expect(reportDoorFault('d', 'i', { area: 'order', body: 'x' })).resolves.toMatchObject({ ok: false });
  });

  it('refuses to file an empty or incomplete fault', async () => {
    await expect(reportDoorFault('d', 'i', { body: '  ' })).resolves.toMatchObject({ ok: false });
    await expect(reportDoorFault('', 'i', { body: 'x' })).resolves.toMatchObject({ ok: false });
  });
});

describe('the office board separates a machine from a person', () => {
  it('openFaults returns only unhandled SYSTEM rows', () => {
    const rows = [
      { id: 'a', source: 'system',   status: 'new',      last_seen_at: '2026-01-02', occurrences: 3 },
      { id: 'b', source: 'customer', status: 'new',      last_seen_at: '2026-01-03' },
      { id: 'c', source: 'system',   status: 'closed',   last_seen_at: '2026-01-04' },
      { id: 'd', source: 'system',   status: 'reading',  last_seen_at: '2026-01-05', occurrences: 1 },
    ];
    expect(openFaults(rows).map((r) => r.id)).toEqual(['d', 'a']);
  });

  it('ties on recency break by how often it happened', () => {
    const rows = [
      { id: 'few',  source: 'system', status: 'new', last_seen_at: '2026-01-05', occurrences: 2 },
      { id: 'many', source: 'system', status: 'new', last_seen_at: '2026-01-05', occurrences: 40 },
    ];
    expect(openFaults(rows).map((r) => r.id)).toEqual(['many', 'few']);
  });
});

describe('the migration keeps its promises', () => {
  const sql = readFileSync(
    path.resolve(__dirname, '../../../infra/supabase/migrations-auto/0217-a-door-that-breaks-reports-itself.sql'),
    'utf8',
  );
  const code = sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');

  it('FOLDS a repeat into one row instead of adding another — the storm is one line', () => {
    expect(code).toMatch(/UPDATE door_feedback/);
    expect(code).toMatch(/occurrences\s*=\s*occurrences \+ 1/);
    expect(code).toMatch(/last_seen_at\s*=\s*now\(\)/);
  });

  it('never folds into a row the office already handled', () => {
    expect(code).toMatch(/status\s+IN \('new','reading'\)/);
  });

  it('forces source to system — a fault is never filed as a customer', () => {
    expect(code).toMatch(/'system'/);
    expect(code).not.toMatch(/p_payload ->> 'source'/);
  });

  it('leaves the VERIFIED customer path untouched — a separate function, not a flag', () => {
    expect(code).toMatch(/CREATE OR REPLACE FUNCTION public\.door_fault_report/);
    expect(code).not.toMatch(/CREATE OR REPLACE FUNCTION public\.door_feedback_submit/);
  });

  it('pins the tenant by a real row and allowlists no doors or areas (the 0215 lesson)', () => {
    expect(code).toMatch(/SELECT id INTO v_instance FROM instances WHERE slug = p_instance_slug/);
    expect(code).not.toContain("'moore-divahs'");
    expect(code).not.toContain("'classes'");
  });

  it('carries the same flood brake, and re-runs the standing overlays', () => {
    expect(code).toMatch(/interval '1 minute'/);
    expect(code).toMatch(/apply_viewer_readonly_overlay\(\)/);
    expect(code).toMatch(/apply_assistant_scope_overlay\(\)/);
  });

  it('files no contact on a machine-written row', () => {
    expect(code).toMatch(/contact[\s\S]{0,400}NULL/);
  });
});
