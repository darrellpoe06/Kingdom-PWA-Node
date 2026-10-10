// =============================================================================
// "I'm paying": the record first, then the hand-off; full or part; every
// change to the instant (DR-0899, 0262)
// =============================================================================
// Darrell, 2026-10-10: "The tenants can say they paying right not take them to
// cashapp or zelle and other options... even cash... put it in Chase bank",
// "Full rent or percentage of rent... the notes for the following remaining
// amount and when it will be paid... keeping the historical events", "Date and
// timestamps for everything possible... so we can recreate a situation".
//
// Pure: the links, the instructions, what is due, the part-payment rules, the
// history's change lines. Mounted: the tenant pays part by Cash App (recorded
// BEFORE Cash App opens, with the promise), pays by Zelle (the landlord's own
// words shown), cannot send a part payment without a date; the family writes
// how it is paid. The database walls: infra/supabase/tests/0262-rent-and-clock-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { payLink, payInstruction, methodsOffered, rentDue, buildRentReport, rentLine, isSquareLink } from '../modules/properties/rent-pay.js';
import { buildHistory, changeSummary } from '../modules/properties/model.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PAYEE = { cashtag: '$PoeProperties', zelle_to: '(555) 010-0100', deposit_note: 'Deposit at any Chase branch to Poe Properties LLC', cash_note: 'Hand it to Darrell and get a receipt', venmo: null, check_payable_to: null };
const H = vi.hoisted(() => ({ payee: null, saved: [], order: [] }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadPayeeForTenancy: async () => ({ ok: true, payee: H.payee }),
  loadRentPayee: async () => ({ ok: true, payee: H.payee }),
  saveRentPayee: async (id, f) => { H.saved.push([id, f]); return { ok: true }; },
}));
import { PayRent, PayeeCard } from '../modules/properties/RentPay.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, { payee: null, saved: [], order: [] });
});
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
const text = () => container.textContent || '';
async function click(re) {
  const b = [...container.querySelectorAll('button')].find((x) => re.test((x.textContent || '').trim()));
  if (!b) throw new Error(`no button ${re}; saw ${[...container.querySelectorAll('button')].map((x) => x.textContent).join(' | ')}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
async function setValue(label, value) {
  const el = container.querySelector(`input[aria-label="${label}"]`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
}
const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const later = () => { const d = new Date(Date.now() + 10 * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

describe('the hand-off and the record (pure)', () => {
  it('Cash App and Venmo open with the amount; Zelle, deposit and cash are the landlord\'s own words', () => {
    expect(payLink('cashapp', PAYEE, 300)).toBe('https://cash.app/$PoeProperties/300.00');
    expect(payLink('venmo', { venmo: '@poe-props' }, 680, 'Rent 2026-10')).toBe('https://venmo.com/?txn=pay&recipients=poe-props&amount=680.00&note=Rent+2026-10');
    expect(payLink('zelle', PAYEE, 300)).toBeNull();
    expect(payInstruction('zelle', PAYEE)).toBe("Send it with Zelle in your bank's app to (555) 010-0100.");
    expect(payInstruction('deposit', PAYEE)).toBe('Deposit at any Chase branch to Poe Properties LLC');
    expect(methodsOffered(PAYEE).map((m) => m.id)).toEqual(['cashapp', 'zelle', 'deposit', 'cash']);
  });
  it('what is due counts reported and confirmed, never disputed or void', () => {
    const rent = [
      { for_period: '2026-10', status: 'confirmed', amount: 200 },
      { for_period: '2026-10', status: 'reported', amount: 100 },
      { for_period: '2026-10', status: 'disputed', amount: 999 },
      { for_period: '2026-09', status: 'confirmed', amount: 680 },
    ];
    expect(rentDue({ monthlyRent: 680, rent, period: '2026-10' })).toEqual({ due: 680, paid: 300, remaining: 380 });
  });
  it('a part payment must say when the rest comes; a past date is refused; full payment needs no date', () => {
    const base = { period: '2026-10', method: 'cashapp', remainingBefore: 680, today: '2026-10-10' };
    expect(buildRentReport({ ...base, amount: 300 }).errors.promisedOn).toBe('Say when you will pay the rest.');
    expect(buildRentReport({ ...base, amount: 300, promisedOn: '2026-10-01' }).errors.promisedOn).toMatch(/passed/);
    const ok = buildRentReport({ ...base, amount: 300, promisedOn: '2026-10-20', note: 'payday', deviceAt: '2026-10-10T12:00:00Z' });
    expect(ok.ok).toBe(true);
    expect(ok.row).toEqual({ amount: 300, for_period: '2026-10', method: 'cashapp', memo: 'payday', due_amount: 680, remaining_after: 380, rest_promised_on: '2026-10-20', reported_on_device_at: '2026-10-10T12:00:00Z' });
    expect(buildRentReport({ ...base, amount: 680 }).ok).toBe(true);
    expect(rentLine(ok.row)).toBe('$300.00 for 2026-10 by Cash App. Part payment: $380.00 still owed, promised by 2026-10-20.');
  });
  it('the history carries every change to the second, and part payments say what is owed', () => {
    const h = buildHistory({
      requests: [{ id: 'w1', title: 'Fan', created_at: '2026-10-10T12:00:00Z' }],
      rent: [{ id: 'r1', amount: 300, for_period: '2026-10', status: 'reported', reported_at: '2026-10-10T12:01:00Z', remaining_after: 380, rest_promised_on: '2026-10-20' }],
      changes: [
        { id: 'e0', subject: 'work', subject_id: 'w1', event: 'filed', at: '2026-10-10T12:00:00Z' },
        { id: 'e1', subject: 'work', subject_id: 'w1', event: 'status', from_value: 'submitted', to_value: 'scheduled', at: '2026-10-10T12:02:03.456Z' },
        { id: 'e2', subject: 'rent', subject_id: 'r1', event: 'status', from_value: 'reported', to_value: 'confirmed', at: '2026-10-11T09:15:00.001Z' },
      ],
    });
    expect(h.map((x) => x.summary)).toEqual([
      'Fan',
      'Payment reported: $300.00 for 2026-10 (part payment: $380.00 still owed, promised by 2026-10-20)',
      'Work order "Fan" moved from submitted to scheduled',
      'Payment moved from reported to confirmed',
    ]);
    expect(h[2].at).toBe('2026-10-10T12:02:03.456Z');
    expect(changeSummary({ subject: 'work', event: 'assigned', to_value: 'Mike' })).toBe('Work order assigned to Mike');
  });
});

describe('the tenant pays', () => {
  const TENANCY = { id: 't1', monthly_rent: 680 };
  it('part by Cash App: the record is written first, with the promise, then Cash App opens with the amount', async () => {
    H.payee = PAYEE;
    const opened = [];
    const onReport = async (row) => { H.order.push(['record', row]); return { ok: true }; };
    await mount(createElement(PayRent, { tenancy: TENANCY, rent: [], onReport, openUrl: (u) => { H.order.push(['open', u]); opened.push(u); } }));
    expect(container.querySelector('[data-testid="rent-due"]').textContent).toBe(`${thisMonth()}: $680.00 due, $0.00 recorded, $680.00 left.`);
    await setValue('Amount', '300');
    await click(/^Cash App$/);
    expect(container.querySelector('[data-testid="part-payment"]').textContent).toContain('$380.00 will still be owed');
    await click(/^Record it and open Cash App$/);
    expect(H.order).toHaveLength(0);
    expect(text()).toContain('Say when you will pay the rest.');
    await setValue('When will you pay the rest', later());
    await setValue('A note', 'The rest on payday');
    await click(/^Record it and open Cash App$/);
    expect(H.order.map((x) => x[0])).toEqual(['record', 'open']);
    expect(H.order[0][1]).toMatchObject({ amount: 300, method: 'cashapp', due_amount: 680, remaining_after: 380, rest_promised_on: later(), memo: 'The rest on payday' });
    expect(H.order[0][1].reported_on_device_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(opened).toEqual(['https://cash.app/$PoeProperties/300.00']);
    expect(text()).toContain('$380.00 still owed');
  });
  it('by Zelle in full: the landlord\'s own words are shown, and nothing is opened', async () => {
    H.payee = PAYEE;
    const opened = [];
    const rows = [];
    await mount(createElement(PayRent, { tenancy: TENANCY, rent: [], onReport: async (r) => { rows.push(r); return { ok: true }; }, openUrl: (u) => opened.push(u) }));
    await click(/^Zelle$/);
    expect(container.querySelector('[data-testid="pay-instruction"]').textContent).toBe("Send it with Zelle in your bank's app to (555) 010-0100.");
    await click(/^Record it$/);
    expect(rows[0]).toMatchObject({ amount: 680, method: 'zelle', remaining_after: 0, rest_promised_on: null });
    expect(opened).toEqual([]);
    expect(text()).toContain("Send it with Zelle in your bank's app to (555) 010-0100.");
  });
  it('with nothing written by the landlord, the tenant can still record how they paid', async () => {
    H.payee = null;
    await mount(createElement(PayRent, { tenancy: TENANCY, rent: [], onReport: async () => ({ ok: true }) }));
    expect(text()).toContain('has not written how to pay in the app yet');
    expect([...container.querySelectorAll('button')].some((b) => b.textContent === 'Cash')).toBe(true);
  });
});

// SQUARE (Darrell, 2026-10-10: "Christina already has a square account we can
// use that for payment options"). Her own Square payment link, opened only
// after the payment is recorded; never a key, never anything but Square.
describe('Square, the family\'s own payment link', () => {
  const TENANCY = { id: 't1', monthly_rent: 680 };
  it('PROVEN-TO-CATCH: only a Square address is ever opened', () => {
    expect(isSquareLink('https://square.link/u/PoeRent1')).toBe(true);
    expect(isSquareLink('https://checkout.square.site/merchant/abc/checkout/XYZ')).toBe(true);
    expect(isSquareLink('https://poe-properties.square.site/s/shop')).toBe(true);
    expect(isSquareLink('https://evil.example/pay')).toBe(false);
    expect(isSquareLink('http://square.link/u/PoeRent1')).toBe(false);
    expect(isSquareLink('https://square.link.evil.example/u/x')).toBe(false);
    expect(payLink('square', { square_link: 'https://evil.example/pay' }, 680)).toBeNull();
    expect(payLink('square', { square_link: 'https://square.link/u/PoeRent1' }, 680)).toBe('https://square.link/u/PoeRent1');
    expect(methodsOffered({ square_link: 'https://square.link/u/PoeRent1' }).map((m) => m.id)).toEqual(['square']);
  });
  it('the tenant records first, then Square opens', async () => {
    H.payee = { ...PAYEE, square_link: 'https://square.link/u/PoeRent1' };
    const onReport = async (row) => { H.order.push(['record', row]); return { ok: true }; };
    await mount(createElement(PayRent, { tenancy: TENANCY, rent: [], onReport, openUrl: (u) => H.order.push(['open', u]) }));
    await click(/^Square \(card\)$/);
    await click(/^Record it and open Square \(card\)$/);
    expect(H.order.map((x) => x[0])).toEqual(['record', 'open']);
    expect(H.order[0][1]).toMatchObject({ amount: 680, method: 'square' });
    expect(H.order[1][1]).toBe('https://square.link/u/PoeRent1');
  });
  it('the family saves Christina\'s Square link with the other ways', async () => {
    H.payee = {};
    await mount(createElement(PayeeCard, { instanceId: 'i1' }));
    await setValue('Square payment link (from your Square dashboard)', 'https://square.link/u/PoeRent1');
    await click(/^Save$/);
    expect(H.saved[0][1]).toMatchObject({ square_link: 'https://square.link/u/PoeRent1' });
  });
});

describe('the family writes how it is paid', () => {
  it('saves the seven ways, blank meaning not offered', async () => {
    H.payee = { cashtag: '$PoeProperties' };
    await mount(createElement(PayeeCard, { instanceId: 'i1' }));
    expect(container.querySelector('input[aria-label="Cash App $cashtag"]').value).toBe('$PoeProperties');
    await setValue('Bank deposit (your words, never an account number)', 'Deposit at any Chase branch to Poe Properties LLC');
    await click(/^Save$/);
    expect(H.saved[0][0]).toBe('i1');
    expect(H.saved[0][1]).toMatchObject({ cashtag: '$PoeProperties', deposit_note: 'Deposit at any Chase branch to Poe Properties LLC', zelle_to: '' });
    expect(text()).toContain('Tenants see these choices on their Rent tab.');
  });
});
