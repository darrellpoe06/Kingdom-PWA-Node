// money-entities.test.jsx — PERSONAL, POE PROPERTIES and TLC THERAPY kept apart
// (Christina, 2026-11-03): every bill labeled, filterable, never assumed
// personal because the personal Chase paid it; Safe to Spend per entity, with
// the cash counted where it actually leaves; each entity its own reserve.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { suggestBills, missingForConfirm, toObligation, propertyNamedIn } from '../lib/bill-review.js';
import { buildSafeToSpend } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import { entityLabel, entityKind } from '../lib/entity-labels.js';
import MoneyBillReview from '../components/money/MoneyBillReview.jsx';
import MoneyComingUp from '../components/money/MoneyComingUp.jsx';
import { extraDebtCapacity } from '../lib/safe-to-spend.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 3); // 2026-11-03
const opts = (scope, period = '14d') => ({ currentDate: TODAY, period, scope });

// Her three entities by their real ids, plus PoeTech (kept, shown by name).
function world() {
  return {
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-poeprops', name: 'Poe Properties', type: 'business' },
      { id: 'e-tlc', name: 'TLC Therapy Solutions', type: 'business' },
      { id: 'e-poetech', name: 'PoeTech LLC', type: 'business' },
    ],
    accounts: [
      { id: 'chase', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 },
      { id: 'poe-chk', name: 'Poe Properties checking', type: 'checking', entityId: 'e-poeprops', balance: 0 },
      { id: 'tlc-chk', name: 'TLC checking', type: 'checking', entityId: 'e-tlc', balance: 0 },
    ],
    transactions: [
      { id: 'c1', ...balanceCheckpointRow('chase', 6236.18, '2026-11-03', { basis: 'available' }) },
      { id: 'c2', ...balanceCheckpointRow('poe-chk', 3000, '2026-11-03', { basis: 'available' }) },
      { id: 'c3', ...balanceCheckpointRow('tlc-chk', 4000, '2026-11-03', { basis: 'available' }) },
    ],
    recurringObligations: [],
    inflows: { salaries: [], rentals: [
      { id: 'r-709', name: '709 Commercial St', status: 'paying', entityId: 'e-poeprops', rent: 0, mortgage: { balance: 0, monthlyPI: 0 } },
      { id: 'r-1213', name: '1213 Koehn Dr', status: 'paying', entityId: 'e-poeprops', rent: 0, mortgage: { balance: 0, monthlyPI: 0 } },
      { id: 'r-home', name: '2111 Talans Dr', status: 'owner-occupied', entityId: 'e-personal', rent: 0, mortgage: { balance: 0, monthlyPI: 0 } },
    ] },
    moneyPlan: { settings: { minCushion: 1000, includeInferredBills: false } },
  };
}
const bill = (id, extra) => ({ id, enabled: true, ...toObligation({ group: 'household', frequency: 'monthly', nextDue: '2026-11-10', ...extra }, TODAY) });
const labels = (r) => r.windows.next14.items.map((i) => i.label);

describe('the three labels', () => {
  it('match her entities by id, and name anything else by its own name', () => {
    const w = world();
    expect(entityLabel(w.entities, 'e-personal')).toMatchObject({ kind: 'personal', icon: '🏠', label: 'PERSONAL' });
    expect(entityLabel(w.entities, 'e-poeprops')).toMatchObject({ kind: 'poe', icon: '🏘️', label: 'POE PROPERTIES' });
    expect(entityLabel(w.entities, 'e-tlc')).toMatchObject({ kind: 'tlc', icon: '💼', label: 'TLC THERAPY' });
    expect(entityLabel(w.entities, 'e-poetech')).toMatchObject({ kind: 'other', label: 'POETECH LLC' });
    expect(entityLabel(w.entities, null)).toMatchObject({ kind: 'review', label: 'NEEDS REVIEW' });
    expect(entityLabel(w.entities, 'e-gone')).toMatchObject({ kind: 'review' }); // an id with no entity is not guessed
    expect(entityKind({ id: 'x', name: 'Poe Properties LLC', type: 'business' })).toBe('poe');
  });
});

describe('who owes a bill is never read off the account that paid it', () => {
  it('a suggestion paid from the personal Chase is NEEDS REVIEW, not personal', () => {
    const w = world();
    for (const m of ['08', '09', '10']) w.transactions.push({ id: `a${m}`, date: `2026-${m}-12`, accountId: 'chase', amount: -89.5, description: 'ACME PEST CONTROL', category: 'utilities' });
    const s = suggestBills(w, TODAY).find((x) => /ACME/.test(x.name));
    expect(s.entityId).toBeNull();
    expect(s.paidFromEntityId).toBe('e-personal');
    expect(missingForConfirm({ ...s, nextDue: '2026-11-12' }, w.entities)).toEqual(['who it belongs to']);
  });
  it('a payee that names a property on file carries that property and its entity', () => {
    const w = world();
    expect(propertyNamedIn(w, 'Online Payment To 709 COMMERCIAL ST WATER 10/05')).toEqual({ entityId: 'e-poeprops', rentalId: 'r-709' });
    expect(propertyNamedIn(w, 'Online Payment To COMCAST')).toBeNull();
  });
  it('a TLC bill must say operating expense, therapist compensation or business debt', () => {
    const w = world();
    const row = { name: 'Therapist pay', amount: 1200, nextDue: '2026-11-15', entityId: 'e-tlc' };
    expect(missingForConfirm(row, w.entities)).toEqual(['TLC expense type']);
    expect(missingForConfirm({ ...row, tlcKind: 'therapist-pay' }, w.entities)).toEqual([]);
    expect(toObligation({ ...row, tlcKind: 'therapist-pay' }, TODAY).tlcKind).toBe('therapist-pay');
    expect(toObligation({ ...row, tlcKind: 'made-up' }, TODAY).tlcKind).toBeNull();
  });
});

describe('Safe to Spend per entity — the cash is counted where it leaves', () => {
  it('a Poe Properties bill paid from the personal Chase lowers PERSONAL Safe to Spend, not Poe\'s (PROVEN TO CATCH)', () => {
    const w = world();
    w.recurringObligations.push(bill('water', { name: '709 Water', amount: 300, entityId: 'e-poeprops', rentalId: 'r-709', accountId: 'chase' }));
    const personal = buildSafeToSpend(w, opts('personal'));
    const poe = buildSafeToSpend(w, opts('e-poeprops'));
    expect(labels(personal)).toContain('709 Water');
    expect(labels(poe)).not.toContain('709 Water');
    expect(personal.windows.next14.items.find((i) => i.label === '709 Water')).toMatchObject({ entityId: 'e-poeprops', paidByEntityId: 'e-personal' });
    expect(personal.lines.projectedLowest.amount).toBe(6236.18 - 300);
    expect(poe.lines.projectedLowest.amount).toBe(3000);
  });
  it('each entity has its own cash, bills and reserve; business cash is never personal spending money', () => {
    const w = world();
    w.recurringObligations.push(bill('tlc-rent', { name: 'Office rent', amount: 900, entityId: 'e-tlc', tlcKind: 'operating', accountId: 'tlc-chk' }));
    w.moneyPlan.settings.reserveByEntity = { personal: 2000, 'e-poeprops': 500, 'e-tlc': 1500 };
    const p = buildSafeToSpend(w, opts('personal'));
    const poe = buildSafeToSpend(w, opts('e-poeprops'));
    const tlc = buildSafeToSpend(w, opts('e-tlc'));
    expect([p.lines.availableCash, poe.lines.availableCash, tlc.lines.availableCash]).toEqual([6236.18, 3000, 4000]);
    expect([p.lines.minCushion, poe.lines.minCushion, tlc.lines.minCushion]).toEqual([2000, 500, 1500]);
    expect([p.windows.reserveSource, tlc.windows.reserveSource]).toEqual(['entity', 'entity']);
    expect(tlc.safeToSpendNow).toBe(4000 - 900 - 1500);
    expect(labels(p)).not.toContain('Office rent');
    // Without a reserve of its own, an entity uses the household reserve, as before.
    delete w.moneyPlan.settings.reserveByEntity['e-tlc'];
    expect(buildSafeToSpend(w, opts('e-tlc')).lines.minCushion).toBe(1000);
  });
  it('the combined view lists every entity\'s bills, tagged, and never drops a NEEDS REVIEW bill', () => {
    const w = world();
    w.recurringObligations.push(bill('unk', { name: 'Unknown payee', amount: 75 })); // no entity, no account
    w.recurringObligations.push(bill('tlc-rent', { name: 'Office rent', amount: 900, entityId: 'e-tlc', tlcKind: 'operating', accountId: 'tlc-chk' }));
    const all = buildSafeToSpend(w, opts('consolidated'));
    const items = all.windows.next14.items;
    expect(items.find((i) => i.label === 'Unknown payee')).toMatchObject({ entityId: null, scopeId: 'e-personal' });
    expect(items.find((i) => i.label === 'Office rent')).toMatchObject({ scopeId: 'e-tlc' });
    expect(all.windows.next14.total).toBe(975);
    expect(all.byEntity.map((r) => r.scope.id).sort()).toEqual(['e-personal', 'e-poeprops', 'e-tlc']);
    expect(all.balanceSources).toHaveLength(3);
  });
});

let host; let root;
async function mount(el) {
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => { root.render(el); });
  return host;
}
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
const setValue = async (input, value) => {
  const proto = input.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value);
  await act(async () => { input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
};
const chipOf = (li) => li.querySelector('[data-testid^="bill-review-entity-chip-"]').textContent;
const rows = (el) => [...el.querySelectorAll('li[data-testid^="bill-review-row-"]')];

describe('the Bills Review screen shows the label on every bill and filters by entity', () => {
  function saved() {
    const w = world();
    w.recurringObligations.push(bill('mtg', { name: 'WF Home Mortgage', amount: 2622.83, entityId: 'e-personal', accountId: 'chase' }));
    w.recurringObligations.push(bill('water', { name: '709 Water', amount: 300, entityId: 'e-poeprops', rentalId: 'r-709', accountId: 'chase' }));
    w.recurringObligations.push(bill('pay', { name: 'Therapist pay', amount: 1200, entityId: 'e-tlc', tlcKind: 'therapist-pay', accountId: 'tlc-chk' }));
    w.recurringObligations.push(bill('unk', { name: 'Unknown payee', amount: 75 }));
    return w;
  }
  it('every card carries its chip in the summary line, with the property or TLC type beside it', async () => {
    const el = await mount(createElement(MoneyBillReview, { money: { data: saved(), setData: () => {}, currentDate: TODAY, addRecurring: vi.fn(), updateRecurring: vi.fn() } }));
    const byName = Object.fromEntries(rows(el).map((li) => [li.querySelector('[data-testid^="bill-review-name-"]').value, li]));
    expect(chipOf(byName['WF Home Mortgage'])).toMatch(/🏠\s*PERSONAL/);
    expect(chipOf(byName['709 Water'])).toMatch(/🏘️\s*POE PROPERTIES/);
    expect(byName['709 Water'].querySelector('[data-testid^="bill-review-summary-"]').textContent).toMatch(/709 Commercial St/);
    expect(byName['709 Water'].querySelector('[data-testid^="bill-review-crosspaid-"]').textContent).toMatch(/Paid from Chase 7206/);
    expect(chipOf(byName['Therapist pay'])).toMatch(/💼\s*TLC THERAPY/);
    expect(byName['Therapist pay'].querySelector('[data-testid^="bill-review-summary-"]').textContent).toMatch(/Therapist compensation/);
    expect(chipOf(byName['Unknown payee'])).toMatch(/NEEDS REVIEW/);
    // The Poe property picker lists Poe's properties only, never the home.
    const picker = byName['709 Water'].querySelector('[data-testid^="bill-review-rental-"]');
    expect([...picker.options].map((o) => o.textContent)).toEqual(['Not tied to one property', '709 Commercial St', '1213 Koehn Dr']);
  });
  it('the filter row shows ALL / PERSONAL / POE PROPERTIES / TLC THERAPY / NEEDS REVIEW, each with its count', async () => {
    const el = await mount(createElement(MoneyBillReview, { money: { data: saved(), setData: () => {}, currentDate: TODAY, addRecurring: vi.fn(), updateRecurring: vi.fn() } }));
    const tab = (id) => el.querySelector(`[data-testid="bill-review-entity-tab-${id}"]`);
    expect(['all', 'personal', 'poe', 'tlc', 'review'].map((id) => tab(id).textContent)).toEqual(['ALL (4)', '🏠 PERSONAL (1)', '🏘️ POE PROPERTIES (1)', '💼 TLC THERAPY (1)', '⚠️ NEEDS REVIEW (1)']);
    await act(async () => { tab('poe').click(); });
    expect(rows(el).map(chipOf)).toEqual([expect.stringMatching(/POE PROPERTIES/)]);
    await act(async () => { tab('review').click(); });
    expect(rows(el).map(chipOf)).toEqual([expect.stringMatching(/NEEDS REVIEW/)]);
    await act(async () => { tab('all').click(); });
    expect(rows(el)).toHaveLength(4);
  });
  it('the Overview names who owes each bill, and where the cash leaves when another pocket pays', async () => {
    const w = saved();
    const result = buildSafeToSpend(w, opts('personal'));
    const show = (n) => `$${Number(n || 0).toFixed(2)}`;
    const el = await mount(createElement(MoneyComingUp, { result, extra: extraDebtCapacity(w, opts('personal')), show, entities: w.entities }));
    const next14 = el.querySelector('[data-testid="coming-up-next14"]').textContent;
    expect(next14).toMatch(/709 Water · 🏘️ POE PROPERTIES, paid from personal cash/);
    expect(next14).toMatch(/Unknown payee · ⚠️ NEEDS REVIEW/);
    expect(next14).not.toMatch(/Therapist pay/); // TLC's own bill, paid from TLC cash
    expect(el.querySelector('[data-testid="coming-up-reserve"]').textContent).toMatch(/the household reserve/);
  });
  it('the combined view shows one row per entity, and a reserve set for one entity is saved for that entity only', async () => {
    const w = saved();
    const show = (n) => `$${Number(n || 0).toFixed(2)}`;
    const all = buildSafeToSpend(w, opts('consolidated'));
    let el = await mount(createElement(MoneyComingUp, { result: all, extra: extraDebtCapacity(w, opts('consolidated')), show, entities: w.entities }));
    const table = el.querySelector('[data-testid="coming-up-entities"]');
    expect(table.textContent).toMatch(/never counted as personal spending money/);
    expect(el.querySelector('[data-testid="coming-up-entity-e-tlc"]').textContent).toMatch(/💼 TLC THERAPY\$4000\.00\$1200\.00/);
    expect(el.querySelector('[data-testid="coming-up-reserve-editor"]')).toBeNull(); // set per entity, not on the total
    act(() => root.unmount()); host.remove();
    const onSaveReserve = vi.fn();
    const tlc = buildSafeToSpend(w, opts('e-tlc'));
    el = await mount(createElement(MoneyComingUp, { result: tlc, extra: extraDebtCapacity(w, opts('e-tlc')), show, entities: w.entities, settings: w.moneyPlan.settings, onSaveReserve }));
    await setValue(el.querySelector('[data-testid="coming-up-reserve-input"]'), '1500');
    await act(async () => { el.querySelector('[data-testid="coming-up-reserve-save"]').click(); });
    expect(onSaveReserve).toHaveBeenCalledWith('e-tlc', 1500);
  });
  it('choosing TLC asks for the TLC type before the bill can be saved; the record is untouched until then', async () => {
    const w = saved();
    const updateRecurring = vi.fn();
    const el = await mount(createElement(MoneyBillReview, { money: { data: w, setData: () => {}, currentDate: TODAY, addRecurring: vi.fn(), updateRecurring } }));
    const li = rows(el).find((x) => x.querySelector('[data-testid^="bill-review-name-"]').value === 'Unknown payee');
    const save = li.querySelector('[data-testid^="bill-review-save-"]');
    expect(save.disabled).toBe(true);
    await setValue(li.querySelector('select[data-testid^="bill-review-entity-"]'), 'e-tlc');
    expect(chipOf(li)).toMatch(/TLC THERAPY/);
    expect(save.disabled).toBe(true);
    await setValue(li.querySelector('[data-testid^="bill-review-tlckind-"]'), 'business-debt');
    expect(save.disabled).toBe(false);
    expect(updateRecurring).not.toHaveBeenCalled();
    await act(async () => { save.click(); });
    expect(updateRecurring.mock.calls[0]).toEqual(['unk', expect.objectContaining({ entityId: 'e-tlc', tlcKind: 'business-debt' })]);
  });
});
