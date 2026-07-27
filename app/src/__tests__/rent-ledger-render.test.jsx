// @vitest-environment jsdom
// =============================================================================
// RentLedger — live render proof (rentals build step b UI)
// =============================================================================
// Observe the REAL surface (DR-0076): the paid-vs-due entry + history mounts,
// derives the 0→100% bar from real amounts, shows honest states (signed-out,
// no-cloud-lease-yet), and records through the ledger lib. Proven-to-catch:
// each assertion fails against a door with no ledger UI.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const h = vi.hoisted(() => ({ user: { id: 'u1' }, leaseMap: {}, rows: [], recorded: [] }));
vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getUser: async () => ({ data: { user: h.user } }) } },
}));
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: async () => 'inst-1' }));
vi.mock('../lib/lease-sync.js', () => ({ loadLeasesByRental: async () => h.leaseMap }));
vi.mock('../lib/rent-payments.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    loadRentPayments: async () => h.rows,
    recordRentPayment: async (c, args) => { h.recorded.push(args); return { ok: true, action: 'insert', status: 'partial', percent: 63 }; },
  };
});

import RentLedger, { PaidBar } from '../components/RentLedger.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => { h.leaseMap = {}; h.rows = []; h.recorded = []; h.user = { id: 'u1' }; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
// React tracks controlled inputs via a native value setter; assigning .value
// directly is ignored on the next render. Use the prototype setter so onChange fires.
function setInput(el, value) {
  const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('PaidBar — the 0→100% indicator is derived, labelled, clamped', () => {
  it('renders the percent and an accessible label from real amounts', () => {
    act(() => root.render(createElement(PaidBar, { received: 600, expected: 950 })));
    expect(container.textContent).toContain('63%');
    expect(container.querySelector('[aria-label="63% of rent paid this month"]')).toBeTruthy();
  });
  it('caps at 100% when overpaid and reads 0% with no due amount', () => {
    act(() => root.render(createElement(PaidBar, { received: 2000, expected: 950 })));
    expect(container.textContent).toContain('100%');
    act(() => root.render(createElement(PaidBar, { received: 500, expected: 0 })));
    expect(container.textContent).toContain('0%');
  });
});

describe('RentLedger — honest states', () => {
  it('shows the no-cloud-lease guidance when the door has no synced lease', async () => {
    act(() => root.render(createElement(RentLedger, { rental: { id: 'r1', remoteUuid: null } })));
    await flush();
    expect(container.textContent).toMatch(/No cloud lease for this door yet/i);
  });
  it('prompts sign-in when signed out', async () => {
    h.user = null;
    act(() => root.render(createElement(RentLedger, { rental: { id: 'r1', remoteUuid: 'd1' } })));
    await flush();
    expect(container.textContent).toMatch(/Sign in to record/i);
  });
});

describe('RentLedger — the real ledger surface', () => {
  beforeEach(() => {
    h.leaseMap = { d1: { leaseId: 'L1', monthlyRent: 950 } };
    h.rows = [{ id: 'P1', month: '2026-07', expected: 950, received: 600, percent: 63, status: 'partial', method: 'zelle', receivedAt: '2026-07-10', events: [{ amount: 600, method: 'zelle', location: 'office', at: '2026-07-10T00:00:00Z' }], notes: '' }];
  });

  it('renders the entry form (amount vs due) and the history with its receipt events', async () => {
    act(() => root.render(createElement(RentLedger, { rental: { id: 'r1', remoteUuid: 'd1', rent: 950 } })));
    await flush();
    expect(container.querySelector(`#rp-amt-r1`)).toBeTruthy();       // amount-paid input
    expect(container.textContent).toContain('$950/mo due');            // the DUE, from the lease
    expect(container.textContent).toContain('2026-07');                // the month row
    expect(container.textContent).toContain('63%');                    // derived percent
    expect(container.textContent).toMatch(/\$600.*zelle.*office/s);    // the receipt event
  });

  it('records a payment through the ledger lib with amount, method, and where paid', async () => {
    act(() => root.render(createElement(RentLedger, { rental: { id: 'r1', remoteUuid: 'd1', rent: 950 } })));
    await flush();
    act(() => { setInput(container.querySelector('#rp-amt-r1'), '350'); });
    act(() => { setInput(container.querySelector('#rp-loc-r1'), 'in person'); });
    const btn = Array.from(container.querySelectorAll('button')).find((b) => /Record payment/i.test(b.textContent));
    await act(async () => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await flush(); await flush(); // submit awaits getUser → getInstanceId → record → reload
    expect(h.recorded).toHaveLength(1);
    expect(h.recorded[0]).toMatchObject({ leaseId: 'L1', month: '2026-07', expectedAmount: 950, amount: '350', location: 'in person' });
  });
});
