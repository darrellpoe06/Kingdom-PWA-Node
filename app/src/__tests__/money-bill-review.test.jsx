// money-bill-review.test.jsx — the bill-review screen, what Safe to Spend does
// with confirmed bills, the Overview's "what is due" panel, and the personal
// home mortgage payoff (Christina, 2026-11-03).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { suggestBills, reviewRows, missingForConfirm, toObligation, BILL_GROUPS } from '../lib/bill-review.js';
import { buildSafeToSpend, extraDebtCapacity } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import { homeMortgage, amortize, payoffScenarios, extraForGoal } from '../lib/mortgage-payoff.js';
import MoneyBillReview from '../components/money/MoneyBillReview.jsx';
import MoneyComingUp from '../components/money/MoneyComingUp.jsx';
import MoneyHomeMortgage from '../components/money/MoneyHomeMortgage.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 3); // 2026-11-03

// A household in small: one verified checking account, one unverified, a
// creditor paid twice a month, a monthly utility, a transfer to the business
// and a payment to family. Nothing saved as a bill yet.
function world() {
  const tx = [];
  let n = 0;
  const pay = (date, amount, description, category = 'other', accountId = 'chk') => tx.push({ id: `t${n++}`, date, accountId, amount, description, category });
  for (const m of ['07', '08', '09', '10']) {
    pay(`2026-${m}-05`, -313.55, 'ZWICKER & ASSOCI PHONE CHK TDB', 'debt-payment');
    pay(`2026-${m}-19`, -313.55, 'ZWICKER & ASSOCI PHONE CHK TDB', 'debt-payment');
    pay(`2026-${m}-29`, -100, 'Online Payment To I3 BROADBAND', 'utilities');
    pay(`2026-${m}-02`, -750, 'Zelle payment to BG & Mom', 'transfer');
    pay(`2026-${m}-20`, -500, 'Zelle payment to TLC', 'transfer');
  }
  return {
    entities: [{ id: 'e-p', name: 'Personal', type: 'personal' }, { id: 'e-tlc', name: 'TLC Therapy Solutions', type: 'business' }],
    accounts: [
      { id: 'chk', name: 'Chase 7206', type: 'checking', entityId: 'e-p', balance: 0 },
      { id: 'old', name: 'Chase 3322', type: 'checking', entityId: 'e-p', balance: 55.91 },
    ],
    transactions: [...tx, { id: 'cp', ...balanceCheckpointRow('chk', 6236.18, '2026-11-03', { basis: 'available' }) }],
    recurringObligations: [],
    inflows: { salaries: [], rentals: [{ id: 'home', name: '2111 Talans Dr', status: 'owner-occupied', entityId: 'e-p', rent: 0, mortgage: { balance: 0, rate: 6.5, monthlyPI: 0, escrow: 0 } }] },
    moneyPlan: { settings: { minCushion: 1000 } },
  };
}

describe('suggestions come from the records, and are never counted until confirmed', () => {
  it('one creditor paid twice a month is ONE suggestion, an arrangement, with no due date filled in', () => {
    const s = suggestBills(world(), TODAY);
    const zw = s.filter((x) => /ZWICKER/.test(x.name));
    expect(zw).toHaveLength(1);
    expect(zw[0].group).toBe('arrangement');
    expect(zw[0].nextDue).toBe('');
    expect(zw[0].evidence.payments).toBe(7); // the 120-day window starts 2026-07-06, so July 5 is outside
  });
  it('BG is suggested as a family obligation, TLC as a transfer between accounts', () => {
    const s = suggestBills(world(), TODAY);
    expect(s.find((x) => /BG/.test(x.name)).group).toBe('family');
    expect(s.find((x) => /TLC/.test(x.name)).group).toBe('transfer');
  });
  it('suggestions do not reach Safe to Spend; confirming one does', () => {
    const w = world(); w.moneyPlan.settings.includeInferredBills = false;
    const before = buildSafeToSpend(w, { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(before.windows.next14.total).toBe(0);
    const zw = suggestBills(w, TODAY).find((x) => /ZWICKER/.test(x.name));
    expect(zw.entityId).toBeNull(); // paid from the personal Chase, but never assumed personal
    expect(zw.paidFromEntityId).toBe('e-p');
    expect(missingForConfirm(zw, w.entities)).toEqual(['actual due date', 'who it belongs to']);
    w.recurringObligations.push({ id: 'ro1', enabled: true, ...toObligation({ ...zw, nextDue: '2026-11-05', frequency: 'semimonthly' }, TODAY) });
    const after = buildSafeToSpend(w, { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(after.windows.arrangements.items.map((i) => i.date)).toEqual(['2026-11-05']);
    expect(after.windows.next7.total).toBe(313.55);
  });
  it('a saved row is listed as saved and its suggestion disappears; a dismissed one too', () => {
    const w = world();
    const zw = suggestBills(w, TODAY).find((x) => /ZWICKER/.test(x.name));
    w.recurringObligations.push({ id: 'ro1', enabled: true, ...toObligation({ ...zw, nextDue: '2026-11-05' }, TODAY) });
    const { saved, suggested } = reviewRows(w, TODAY, { [suggestBills(w, TODAY).find((x) => /TLC/.test(x.name)).key]: 'x' });
    expect(saved).toHaveLength(1);
    expect(saved[0].verified).toBe(true);
    expect(suggested.some((x) => /ZWICKER/.test(x.name))).toBe(false);
    expect(suggested.some((x) => /TLC/.test(x.name))).toBe(false);
  });
  it('the eight groups plus the personal home mortgage are offered', () => {
    expect(BILL_GROUPS.map(([g]) => g)).toEqual(['home-mortgage', 'household', 'rental', 'business', 'arrangement', 'past-due', 'transfer', 'family', 'one-time']);
  });
});

describe('Safe to Spend with confirmed bills', () => {
  it('counts only bank-checked cash once any account is checked, and reports the rest as left out', () => {
    const r = buildSafeToSpend(world(), { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(r.lines.availableCash).toBe(6236.18);
    expect(r.lines.unverifiedExcluded).toBe(55.91);
    expect(r.assumptions.join(' ')).toMatch(/Left out of available cash until checked against the bank: Chase 3322/);
  });
  it('a past-due balance is due today and shows as overdue; a past-due amount on a regular bill too', () => {
    const w = world(); w.moneyPlan.settings.includeInferredBills = false;
    w.recurringObligations.push({ id: 'pd', enabled: true, ...toObligation({ name: 'Midland Credit', group: 'past-due', amount: 412, nextDue: '2026-10-15' }, TODAY) });
    w.recurringObligations.push({ id: 'ut', enabled: true, ...toObligation({ name: 'Ameren', group: 'household', amount: 176, nextDue: '2026-11-25', pastDue: 90 }, TODAY) });
    const r = buildSafeToSpend(w, { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(r.windows.overdue.total).toBe(502);
    expect(r.windows.overdue.items.every((i) => i.date === '2026-11-03')).toBe(true);
  });
  it('extra debt capacity is never more than Safe to Spend, and is held to the next 30 days', () => {
    const w = world(); w.moneyPlan.settings.includeInferredBills = false;
    w.recurringObligations.push({ id: 'big', enabled: true, ...toObligation({ name: 'Property tax', group: 'one-time', amount: 4000, nextDue: '2026-11-25' }, TODAY) });
    const opts = { currentDate: TODAY, period: '14d', scope: 'personal', settings: w.moneyPlan.settings };
    const chosen = buildSafeToSpend(w, opts);
    const extra = extraDebtCapacity(w, opts);
    expect(chosen.safeToSpendNow).toBe(5236.18); // 6,236.18 − 1,000 cushion, nothing due in 14 days
    expect(extra.amount).toBe(1236.18);           // the $4,000 tax on 11-25 is inside 30 days
  });
  it('the personal home mortgage is counted once: the confirmed bill, not the record a second time', () => {
    const w = world(); w.moneyPlan.settings.includeInferredBills = false;
    w.inflows.rentals[0].mortgage = { balance: 180000, rate: 6.5, monthlyPI: 1600, escrow: 400 };
    const recordOnly = buildSafeToSpend(w, { currentDate: TODAY, period: '30d', scope: 'personal', settings: { ...w.moneyPlan.settings, mortgageDueDay: 15 } });
    expect(recordOnly.windows.next14.items.filter((i) => /Talans/.test(i.label))).toHaveLength(1);
    w.recurringObligations.push({ id: 'mtg', enabled: true, ...toObligation({ name: 'Wells Fargo Home Mortgage', group: 'home-mortgage', amount: 2622.83, nextDue: '2026-11-15', linkedMortgageId: 'home' }, TODAY) });
    const linked = buildSafeToSpend(w, { currentDate: TODAY, period: '30d', scope: 'personal', settings: { ...w.moneyPlan.settings, mortgageDueDay: 15 } });
    const mortgageItems = linked.windows.next14.items.filter((i) => /Talans|Wells Fargo/.test(i.label));
    expect(mortgageItems).toEqual([expect.objectContaining({ label: 'Wells Fargo Home Mortgage', amount: 2622.83, date: '2026-11-15' })]);
  });
});

describe('the personal home mortgage payoff', () => {
  it('names what is missing and draws no projection without balance, rate and P&I', () => {
    const rec = homeMortgage(world());
    expect(rec.found).toBe(true);
    expect(rec.property).toBe('2111 Talans Dr');
    expect(rec.missing).toEqual(expect.arrayContaining(['current balance', 'principal and interest payment']));
    expect(payoffScenarios(rec, TODAY)).toBeNull();
    expect(extraForGoal(rec, TODAY)).toBeNull();
  });
  it('amortization matches the textbook case: $200,000 at 6% with $1,199.11 P&I pays off in 360 months', () => {
    const r = amortize(200000, 6, 1199.11, 0, new Date(2026, 10, 1));
    expect(r.months).toBe(360);
    expect(r.totalInterest).toBeGreaterThan(231000);
    expect(r.totalInterest).toBeLessThan(231800);
  });
  it('each extra amount pays it off sooner and saves interest; the December 2030 goal finds the smallest extra that does it', () => {
    const rec = { complete: true, balance: 150000, rate: 6.5, monthlyPI: 1200 };
    const s = payoffScenarios(rec, TODAY);
    expect(s.rows.map((r) => r.extra)).toEqual([100, 250, 500, 1000, 2500]);
    for (let i = 1; i < s.rows.length; i++) {
      expect(s.rows[i].months).toBeLessThan(s.rows[i - 1].months);
      expect(s.rows[i].interestSaved).toBeGreaterThan(s.rows[i - 1].interestSaved);
    }
    const g = extraForGoal(rec, TODAY);
    expect(g.payoffDate <= '2030-12').toBe(true);
    expect(amortize(150000, 6.5, 1200, g.extra - 1, TODAY).payoffDate > '2030-12').toBe(true); // one dollar less misses it
  });
});

let host; let root;
async function mount(el) {
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => { root.render(el); });
  return host;
}
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
const rowNamed = (el, re) => [...el.querySelectorAll('li')].find((li) => re.test((li.querySelector('[data-testid^="bill-review-name-"]') || {}).value || ''));
const setValue = async (input, value) => {
  const proto = input.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value);
  await act(async () => { input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
};

describe('the bill-review screen', () => {
  it('shows suggestions as needing confirmation, and will not add one without an actual due date', async () => {
    const addRecurring = vi.fn();
    const el = await mount(createElement(MoneyBillReview, { money: { data: world(), setData: () => {}, currentDate: TODAY, addRecurring, updateRecurring: vi.fn() } }));
    const row = rowNamed(el, /ZWICKER/);
    expect(row.textContent).toMatch(/Needs confirmation/);
    expect(row.textContent).toMatch(/A payment day is not a due date/);
    const save = row.querySelector('[data-testid^="bill-review-save-"]');
    expect(save.disabled).toBe(true);
    await setValue(row.querySelector('[data-testid^="bill-review-due-"]'), '2026-11-05');
    // Paid from the personal Chase, yet NOT assumed personal: it waits on an owner.
    expect(row.querySelector('[data-testid^="bill-review-entity-chip-"]').textContent).toMatch(/NEEDS REVIEW/);
    expect(save.disabled).toBe(true);
    expect(row.querySelector('[data-testid^="bill-review-missing-"]').textContent).toMatch(/who it belongs to/);
    await setValue(row.querySelector('select[data-testid^="bill-review-entity-"]'), 'e-p');
    expect(row.querySelector('[data-testid^="bill-review-entity-chip-"]').textContent).toMatch(/PERSONAL/);
    expect(save.disabled).toBe(false);
    await act(async () => { save.click(); });
    expect(addRecurring).toHaveBeenCalledTimes(1);
    expect(addRecurring.mock.calls[0][0]).toMatchObject({ verified: true, nextDue: '2026-11-05', group: 'arrangement', type: 'arrangement', entityId: 'e-p' });
  });
  it('"Not a bill" hides a suggestion through the plan, touching no transaction', async () => {
    let state = world();
    const setData = (fn) => { state = fn(state); };
    const el = await mount(createElement(MoneyBillReview, { money: { data: state, setData, currentDate: TODAY, addRecurring: vi.fn(), updateRecurring: vi.fn() } }));
    const before = state.transactions;
    const row = rowNamed(el, /TLC/);
    await act(async () => { row.querySelector('[data-testid^="bill-review-dismiss-"]').click(); });
    expect(Object.keys(state.moneyPlan.billReview.dismissed)).toHaveLength(1);
    expect(state.transactions).toBe(before);
  });
});

describe('the Overview panel and the mortgage section render what the engine computed', () => {
  it('lists the nine numbers, each one opening to how it was worked out', async () => {
    const w = world();
    const result = buildSafeToSpend(w, { currentDate: TODAY, period: '14d', scope: 'personal' });
    const extra = extraDebtCapacity(w, { currentDate: TODAY, period: '14d', scope: 'personal' });
    const el = await mount(createElement(MoneyComingUp, { result, extra, show: (n) => `$${Number(n || 0).toFixed(2)}` }));
    for (const id of ['cash', 'next7', 'next14', 'overdue', 'arrangements', 'income', 'reserve', 'safe', 'extra']) {
      expect(el.querySelector(`[data-testid="coming-up-${id}"]`)).not.toBeNull();
    }
    expect(el.querySelector('[data-testid="coming-up-cash-value"]').textContent).toBe('$6236.18');
    expect(el.querySelector('[data-testid="coming-up-cash"]').textContent).toMatch(/Chase 3322.*left out until checked/);
    expect(el.querySelector('[data-testid="coming-up-cash"] summary').textContent).toMatch(/Current verified cash/);
  });
  it('never calls cash "verified" when no account has been checked against the bank', async () => {
    const w = world();
    w.transactions = w.transactions.filter((t) => t.category !== 'balance-checkpoint');
    const result = buildSafeToSpend(w, { currentDate: TODAY, period: '14d', scope: 'personal' });
    const el = await mount(createElement(MoneyComingUp, { result, extra: extraDebtCapacity(w, { currentDate: TODAY, period: '14d', scope: 'personal' }), show: (n) => `$${Number(n || 0).toFixed(2)}` }));
    const head = el.querySelector('[data-testid="coming-up-cash"] summary').textContent;
    expect(head).not.toMatch(/verified/i);
    expect(head).toMatch(/not bank-checked/);
  });
  it('the mortgage section names the home, says what is missing, and draws no table', async () => {
    const el = await mount(createElement(MoneyHomeMortgage, { money: { data: world(), currentDate: TODAY, updateRental: vi.fn() } }));
    expect(el.textContent).toMatch(/2111 Talans Dr/);
    expect(el.querySelector('[data-testid="home-mortgage-missing"]').textContent).toMatch(/current balance/);
    expect(el.querySelector('[data-testid="home-mortgage-scenarios"]')).toBeNull();
  });
});

// Christina 2026-11-03: two Britt & Gaines accounts, told apart only by "and" vs "&".
describe('two accounts at one collection agency stay two', () => {
  function britt() {
    const w = world();
    const add = (date, amount, payee, category = 'other') => w.transactions.push({ id: `b${w.transactions.length}`, date, accountId: 'chk', amount, description: `Online Payment 3${date.replace(/-/g, '')} To ${payee} ${date.slice(5, 7)}/${date.slice(8)}`, category });
    for (const d of ['2026-09-09', '2026-09-14', '2026-09-24', '2026-10-07', '2026-10-22']) add(d, -300, 'Britt and Gaines', 'debt-payment');
    add('2026-09-14', -500, 'Britt & Gaines'); add('2026-10-07', -375, 'Britt & Gaines'); add('2026-10-22', -375, 'Britt & Gaines');
    return w;
  }
  it('suggests TWO arrangements, one per spelling, each with only its own payments', () => {
    const s = suggestBills(britt(), TODAY).filter((x) => /Britt/.test(x.name));
    expect(s.map((x) => x.name).sort()).toEqual(['Britt & Gaines', 'Britt and Gaines']);
    expect(s.find((x) => x.name === 'Britt and Gaines').evidence.total).toBe(1500);
    expect(s.find((x) => x.name === 'Britt & Gaines').evidence.total).toBe(1250);
    expect(s.every((x) => x.group === 'arrangement')).toBe(true);
  });
  it('both confirmed arrangements count in Safe to Spend, once each, even with guessed bills on', () => {
    const w = britt();
    const [a, b] = suggestBills(w, TODAY).filter((x) => /Britt/.test(x.name)).sort((x, y) => x.name.localeCompare(y.name));
    w.recurringObligations.push({ id: 'b-amp', enabled: true, ...toObligation({ ...a, nextDue: '2026-11-07', frequency: 'semimonthly', originalCreditor: 'Capital One', accountLast4: 'acct 99-12345678' }, TODAY) });
    w.recurringObligations.push({ id: 'b-and', enabled: true, ...toObligation({ ...b, nextDue: '2026-11-07', frequency: 'semimonthly', originalCreditor: 'Synchrony' }, TODAY) });
    const r = buildSafeToSpend(w, { currentDate: TODAY, period: '14d', scope: 'personal' });
    const brittItems = r.windows.next14.items.filter((i) => /Britt/.test(i.label));
    expect(brittItems.map((i) => `${i.label}:${i.amount}`).sort()).toEqual(['Britt & Gaines:375', 'Britt and Gaines:300']);
    expect(w.recurringObligations[0].accountLast4).toBe('5678'); // only the last four are kept
  });
  it('the Debt Freedom list shows each account with only the payments made to its exact spelling', async () => {
    const MoneyArrangements = (await import('../components/money/MoneyArrangements.jsx')).default;
    const w = britt();
    const [a, b] = suggestBills(w, TODAY).filter((x) => /Britt/.test(x.name)).sort((x, y) => x.name.localeCompare(y.name));
    w.recurringObligations.push({ id: 'b-amp', enabled: true, ...toObligation({ ...a, nextDue: '2026-11-07', balance: 3000 }, TODAY) });
    w.recurringObligations.push({ id: 'b-and', enabled: true, ...toObligation({ ...b, nextDue: '2026-11-07' }, TODAY) });
    const el = await mount(createElement(MoneyArrangements, { money: { data: w, currentDate: TODAY } }));
    expect(el.querySelector('[data-testid="arrangement-b-amp"]').textContent).toMatch(/3 payments.*\$1,250/);
    expect(el.querySelector('[data-testid="arrangement-b-and"]').textContent).toMatch(/5 payments.*\$1,500/);
  });
});

describe('look-alike names are flagged, never merged or split on their own', () => {
  function sanitary() {
    const w = world();
    let i = 0;
    for (const m of ['08', '09', '10']) {
      w.transactions.push({ id: `s${i++}`, date: `2026-${m}-28`, accountId: 'chk', amount: -25, category: 'utilities', description: `Online Payment 3${m}1 To URBANA AND CHAMPAIGN SANITARY DISTRICT ${m}/28` });
      w.transactions.push({ id: `s${i++}`, date: `2026-${m}-29`, accountId: 'chk', amount: -25, category: 'utilities', description: `Online Payment 3${m}2 To URBANA & CHAMPAIGN SANITARY DIST ${m}/29` });
    }
    return w;
  }
  it('two spellings of one payee are two suggestions, each flagged as similar to the other', () => {
    const s = suggestBills(sanitary(), TODAY).filter((x) => /SANITARY/.test(x.name));
    expect(s).toHaveLength(2);
    expect(s[0].similarTo).toEqual([s[1].name]);
    expect(s[1].similarTo).toEqual([s[0].name]);
  });
  it('when the family says they are the SAME account, one bill takes both spellings and the other suggestion goes away', () => {
    const w = sanitary(); w.moneyPlan.settings.includeInferredBills = false;
    const [a, b] = suggestBills(w, TODAY).filter((x) => /SANITARY/.test(x.name));
    w.recurringObligations.push({ id: 'san', enabled: true, ...toObligation({ ...a, nextDue: '2026-11-28', alsoPaidAs: [b.name] }, TODAY) });
    expect(reviewRows(w, TODAY).suggested.some((x) => /SANITARY/.test(x.name))).toBe(false);
  });
  it('PROVEN TO CATCH: a confirmed bill silences its own guessed twin, so the payment is counted once', () => {
    const w = world();
    for (const m of ['08', '09', '10']) w.transactions.push({ id: `g${m}`, date: `2026-${m}-12`, accountId: 'chk', amount: -273.12, category: 'subscription', description: `POS DEBIT GOOGLE *Claude by Anth 855-836-3987 CA ${m}/12` });
    const count = (r) => r.items.filter((x) => /Claude/i.test(x.label)).length;
    expect(count(buildSafeToSpend(w, { currentDate: TODAY, period: '30d', scope: 'personal' }))).toBe(1); // guessed
    const sub = suggestBills(w, TODAY).find((x) => /Claude/.test(x.name));
    w.recurringObligations.push({ id: 'cl', enabled: true, ...toObligation({ ...sub, nextDue: '2026-11-12' }, TODAY) });
    expect(count(buildSafeToSpend(w, { currentDate: TODAY, period: '30d', scope: 'personal' }))).toBe(1); // confirmed, guess gone
  });
});
