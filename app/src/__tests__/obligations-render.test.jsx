// @vitest-environment jsdom
//
// Obligations (Books → Owed) — the surface DR-0358 and DR-0359 both recorded as
// owed. Mounts the REAL component with the sync seam mocked, in the states it
// can actually be in. DR-0061: observe the surface, don't assume it.
//
// The state that matters MOST today is the empty one: there are zero
// obligations in the live database and 11 of the 12 doors carry no numbers, so
// "nothing entered" is the common path, not the edge — and it must never render
// as a zero (DR-0076).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const armed = { ok: true, rows: [], message: null };
vi.mock('../lib/obligations-sync.js', () => ({
  listObligations: () => Promise.resolve(
    armed.ok ? { ok: true, rows: armed.rows } : { ok: false, reason: 'rpc-error', message: armed.message, rows: [] },
  ),
}));

const post = { ok: true, rows: [], message: null };
vi.mock('../lib/days-post-sync.js', () => ({
  listPost: () => Promise.resolve(post.ok ? { ok: true, rows: post.rows } : { ok: false, message: post.message, rows: [] }),
  sortDocument: () => Promise.resolve({ ok: true, document: {} }),
  releaseForSorting: () => Promise.resolve({ ok: true, document: {} }),
}));

import Obligations from '../components/Obligations.jsx';

const TODAY = new Date().toISOString().slice(0, 10);
const thisMonth = `${TODAY.slice(0, 7)}-01`;
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const MORTGAGE = {
  id: 'o-mort', direction: 'payable', counterparty: 'The lender', description: 'Mortgage',
  amountCents: 135512, terms: 'custom', dueDate: thisMonth, issuedOn: thisMonth,
  lifecycle: 'open', place: '1 Test Street', rentalId: 'door-1', periodMonth: thisMonth,
  settlements: [], documents: [],
  lines: [
    { id: 'l1', kind: 'principal-interest', amountCents: 94212 },
    { id: 'l2', kind: 'taxes', amountCents: 31500 },
    { id: 'l3', kind: 'insurance', amountCents: 9800 },
  ],
};
const RENT = {
  id: 'o-rent', direction: 'receivable', counterparty: 'The tenant', description: 'Rent',
  amountCents: 160000, terms: 'custom', dueDate: thisMonth, issuedOn: thisMonth,
  lifecycle: 'open', place: '1 Test Street', rentalId: 'door-1', periodMonth: thisMonth,
  settlements: [{ id: 's1', amountCents: 120000, paidOn: TODAY }], documents: [], lines: [],
};
const LATE_BILL = {
  id: 'o-late', direction: 'payable', counterparty: 'Ameren', description: 'Electric',
  amountCents: 12500, terms: 'custom', dueDate: daysAgo(40), issuedOn: daysAgo(70),
  lifecycle: 'open', settlements: [], documents: [], lines: [],
};

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(Obligations)); });
  return container;
}
function openTab(label) {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => b.textContent.trim() === label);
  if (!tab) throw new Error(`no tab "${label}" — tabs: ${[...container.querySelectorAll('[role="tab"]')].map((b) => b.textContent.trim()).join(', ')}`);
  return act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  container = root = null;
  armed.ok = true; armed.rows = []; armed.message = null;
  post.ok = true; post.rows = []; post.message = null;
});

describe('Obligations (Books → Owed)', () => {
  it('an empty ledger says what is missing — it never draws a zero', async () => {
    const c = await mount();
    expect(c.textContent).toContain('Nothing is recorded as owed');
    // The lie this guards against: "$0.00" would read as a fact about the money.
    expect(c.textContent).not.toContain('$0.00');
    await openTab('Each door');
    expect(c.textContent).toContain('No door has anything recorded');
    expect(c.textContent).toContain("would read as 'this door costs nothing'");
  });

  it('shows both halves of the net position, never one number', async () => {
    armed.rows = [MORTGAGE, RENT, LATE_BILL];
    const c = await mount();
    expect(c.textContent).toContain('We owe');
    expect(c.textContent).toContain('Owed to us');
    expect(c.textContent).toContain('Net');
    // payables outstanding = 1355.12 + 125.00 = 1480.12
    expect(c.textContent).toContain('$1,480.12');
    // receivable outstanding = 1600.00 - 1200.00 settled = 400.00
    expect(c.textContent).toContain('$400.00');
  });

  it('ages a 40-day-late bill into the 31-60 bucket, not "current"', async () => {
    armed.rows = [LATE_BILL];
    const c = await mount();
    await openTab('Aging');
    const rows = [...c.querySelectorAll('tr')];
    const bucket = rows.find((r) => /31.60 days/.test(r.textContent));
    expect(bucket.textContent).toContain('$125.00');
    const current = rows.find((r) => /Current/.test(r.textContent) && /Not due yet/.test(r.textContent));
    expect(current.textContent).not.toContain('$125.00');
  });

  it("measures a door's gap against money that ARRIVED, and shows the payment's parts", async () => {
    armed.rows = [MORTGAGE, RENT];
    const c = await mount();
    await openTab('Each door');
    expect(c.textContent).toContain('1 Test Street');
    expect(c.textContent).toContain('$1,355.12');          // cost
    expect(c.textContent).toContain('$1,200.00');          // collected
    expect(c.textContent).toContain('-$155.12');           // gap against real money
    expect(c.textContent).toContain('The costs were $155.12 more than what came in');
    // The mortgage broken into the parts a statement names.
    expect(c.textContent).toContain('Principal & interest');
    expect(c.textContent).toContain('$942.12');
    expect(c.textContent).toContain('Property taxes');
    expect(c.textContent).toContain('$315.00');
  });

  it('teaches every word three ways — business, household, and the child', async () => {
    const c = await mount();
    await openTab('The words');
    expect(c.textContent).toContain('Accounts payable');
    expect(c.textContent).toContain('In business:');
    expect(c.textContent).toContain('Here:');
    expect(c.textContent).toContain('A child is told:');
  });

  // The day's post (DR-0360). Unsorted is a real state: nothing files itself,
  // so "later" has to be a choice the pile supports.
  it("the day's post separates what needs a decision from what is filed", async () => {
    post.rows = [
      { id: 'p1', label: 'Ameren envelope', arrivedOn: '2026-09-11', means: null, product: null, place: '', releasedForSorting: false },
      { id: 'p2', label: 'Paid receipt', arrivedOn: '2026-09-10', means: 'proof-of-payment', product: 'poetech', place: 'the house', releasedForSorting: false },
    ];
    const c = await mount();
    await openTab("The day's post");
    expect(c.textContent).toContain('Sorting the post');
    expect(c.textContent).toContain('Still to sort · 1');
    expect(c.textContent).toContain('Filed · 1');
    expect(c.textContent).toContain('Ameren envelope');
    // The rule this surface exists to hold.
    expect(c.textContent).toContain('Unsorted is a real state');
  });

  it("tells a child what the chore is AND what stays the grown-ups'", async () => {
    const c = await mount();
    await openTab("The day's post");
    expect(c.textContent).toContain('first step of how money is handled here');
    expect(c.textContent).toContain('You will not see amounts or the books');
  });

  it('a refused read says these are the books — it does not render blank', async () => {
    armed.ok = false; armed.message = 'permission denied for table obligations';
    const c = await mount();
    expect(c.textContent).toContain('could not be read');
    expect(c.textContent).toContain('permission denied');
    expect(c.textContent).toContain('These are the books');
  });
});
