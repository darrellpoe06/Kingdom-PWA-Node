// mortgage-calculator-render — the calculator as a person meets it: closed
// until opened, a drop-down of the real loans by entity, the record's figures
// filled in, the reference result on screen, and no record changed. DR-1413.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import MortgageCalculator from '../components/MortgageCalculator.jsx';
import MoneyLoanCalculator from '../components/money/MoneyLoanCalculator.jsx';
import RealEstateDoor from '../components/RealEstateDoor.jsx';
import { loanGroups, findLoan } from '../lib/mortgage-sources.js';
import { deriveDebts } from '../lib/financial-engineering.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 10);

function world() {
  return {
    entities: [
      { id: 'e-p', name: 'Personal', type: 'personal' },
      { id: 'e-pp', name: 'Poe Properties LLC', type: 'business' },
      { id: 'e-hidden', name: 'Hidden Co', type: 'business' },
    ],
    accounts: [
      { id: 'card', name: 'Visa', type: 'credit', entityId: 'e-p', balance: -2500, rate: 24, minPayment: 75 },
      { id: 'secret', name: 'Hidden card', type: 'credit', entityId: 'e-hidden', balance: -900 },
    ],
    transactions: [],
    inflows: {
      rentals: [
        {
          id: 'home',
          name: 'Our home',
          status: 'owner-occupied',
          entityId: 'e-p',
          estimatedValue: 250000,
          mortgage: { balance: 150000, rate: 6, monthlyPI: 1100, escrow: 300 },
        },
        {
          id: 'r1',
          name: '1402 Maple St',
          entityId: 'e-pp',
          rent: 1100,
          market: { marketValue: 120000 },
          mortgage: { balance: 80000, rate: 6.5, monthlyPI: 596.46, escrow: 183.33 },
        },
        { id: 'r2', name: '312 Willow Ln', entityId: 'e-pp', mortgage: { balance: 40000, rate: 0, monthlyPI: 0, escrow: 0 } },
        { id: 'r3', name: 'Paid-off lot', entityId: 'e-pp', mortgage: { balance: 0, rate: 0, monthlyPI: 0, escrow: 0 } },
      ],
    },
  };
}

let root;
let host;
function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(el));
  return host;
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const tab = (id) => act(() => host.querySelector(`[role="tab"][id$="-tab-${id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })));
const tabs = () => [...host.querySelectorAll('[role="tab"]')].map((b) => b.id.replace(/^.*-tab-/, ''));
const click = (id) => act(() => q(id).dispatchEvent(new MouseEvent('click', { bubbles: true })));
// One panel is on screen at a time, so a field is reached through its tab.
const TAB_OF = (id) =>
  id === 'mc-pick' ? null : /^mc-x-/.test(id) ? 'extra' : /^mc-keep-/.test(id) ? 'keep' : /^mc-(insurance|tax|monthly-cost|rent)$/.test(id) ? 'costs' : 'loan';
function type(id, value) {
  if (TAB_OF(id)) tab(TAB_OF(id));
  const el = q(id);
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}
const val = (id) => {
  if (TAB_OF(id)) tab(TAB_OF(id));
  return q(id).value;
};

describe('mortgage-sources: the drop-down is the real records', () => {
  const visible = () => world().entities.slice(0, 2);
  it('lists every property first, by entity, then every other debt', () => {
    const data = world();
    const s = loanGroups({ rentals: data.inflows.rentals, debts: deriveDebts(data, TODAY), entities: visible() });
    expect(s.groups.map((g) => g.label)).toEqual([
      'Properties and their mortgages · Personal',
      'Properties and their mortgages · Poe Properties LLC',
      'Other debt · Personal',
    ]);
    expect(s.groups.map((g) => g.options.map((o) => o.id))).toEqual([
      ['property:home'],
      ['property:r1', 'property:r2', 'property:r3'],
      ['debt:debt-acct-card'],
    ]);
  });
  it('PROVEN TO CATCH: a property with no mortgage entered is still in the list, and says so', () => {
    const data = world();
    const s = loanGroups({ rentals: data.inflows.rentals, entities: data.entities });
    const lot = findLoan(s.groups, 'property:r3');
    expect(lot).toMatchObject({ hasMortgage: false, label: 'Paid-off lot · no mortgage on file', principal: 0 });
    expect(s.propertiesWithoutMortgage).toBe(1);
  });
  it('a mortgage is never below a run of cards: twenty-four cards, and the property group still comes first', () => {
    const data = world();
    const cards = Array.from({ length: 24 }, (_, i) => ({
      id: `debt-acct-c${i}`,
      name: `Card ${i}`,
      balance: 1000 + i,
      rate: 20,
      minPayment: 30,
      entityId: 'e-p',
      source: 'account',
    }));
    const s = loanGroups({ rentals: data.inflows.rentals, debts: cards, entities: visible() });
    const flat = s.groups.flatMap((g) => g.options.map((o) => o.kind));
    expect(flat.lastIndexOf('property')).toBeLessThan(flat.indexOf('debt'));
    expect(flat.filter((k) => k === 'debt').length).toBe(24);
  });
  it('leaves out what this person may not see', () => {
    const data = world();
    const s = loanGroups({ rentals: data.inflows.rentals, debts: deriveDebts(data, TODAY), entities: visible() });
    expect(JSON.stringify(s)).not.toMatch(/Hidden/);
  });
  it('carries the figures on file and names what is missing, never a guess', () => {
    const data = world();
    const s = loanGroups({ rentals: data.inflows.rentals, entities: data.entities });
    expect(findLoan(s.groups, 'property:r1')).toMatchObject({
      principal: 80000,
      ratePct: 6.5,
      payment: 596.46,
      propertyValue: 120000,
      escrowMonthly: 183.33,
      rent: 1100,
      missing: [],
    });
    expect(findLoan(s.groups, 'property:r2').missing).toEqual(['the interest rate', 'the monthly payment']);
  });
});

describe('MortgageCalculator: on the screen', () => {
  const sources = () => {
    const d = world();
    return loanGroups({ rentals: d.inflows.rentals, debts: deriveDebts(d, TODAY), entities: d.entities.slice(0, 2) });
  };

  it('is closed until a person opens it, and then is one row of sub-tabs with one panel', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY }));
    expect(q('mc-pick')).toBeNull();
    click('mc-toggle');
    expect(q('mc-pick')).not.toBeNull();
    expect(tabs()).toEqual(['loan', 'costs', 'extra', 'asset', 'summary', 'schedule', 'chart']);
    expect(host.querySelectorAll('[role="tabpanel"]').length).toBe(1);
    expect(q('mc-result')).toBeNull();
    expect(q('mc-reason')).toBeNull();
    tab('asset');
    expect(q('mc-need-answer').textContent).toMatch(/Choose a loan above/);
  });
  it('choosing a property fills in its record and opens on what paying it down does', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY, defaultOpen: true }));
    type('mc-pick', 'property:r1');
    expect(q('mc-filled').textContent).toMatch(/\$80,000\.00 owed at 6\.5%, \$596\.46 a month/);
    expect(q('mc-result').textContent).toMatch(/\$596\.46/);
    expect(q('mc-result').textContent).toMatch(/\$779\.79 with costs/);
    expect(q('mc-result').textContent).toMatch(/Left from the rent\$320\.21 a month/);
    // It opened on the Asset tab, with nothing to scroll past.
    const asset = q('mc-asset-rows').textContent;
    expect(asset).toMatch(/Value on file\$120,000\.00/);
    expect(asset).toMatch(/Owed today\$80,000\.00/);
    expect(asset).toMatch(/Owned today\$40,000\.00/);
    expect(asset).toMatch(/33\.3% of the value/);
    expect(asset).toMatch(/Freed every month after that\$596\.46/);
    expect(asset).toMatch(/Rent kept once it is paid off\$916\.67 a month/);
    expect(asset).not.toMatch(/Payments never made/);
    expect([val('mc-principal'), val('mc-rate'), val('mc-payment'), val('mc-start')]).toEqual(['80000', '6.5', '596.46', '2026-12']);
    expect([val('mc-monthly-cost'), val('mc-rent')]).toEqual(['183.33', '1100']);
    type('mc-x-monthly', '600');
    tab('asset');
    expect(q('mc-asset-rows').textContent).toMatch(/Owned outright sooner by13 yr/);
    expect(q('mc-asset-rows').textContent).toMatch(/Interest never paid\$43,5/);
  });
  it('a new loan gives the reference result, and extra principal shows what it saves', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY, defaultOpen: true }));
    type('mc-value', '80000');
    type('mc-rate', '6.5');
    type('mc-years', '20');
    type('mc-start', '2023-05');
    expect(q('mc-principal').value).toBe('80000');
    expect(q('mc-result').textContent).toMatch(/\$596\.46/);
    type('mc-x-monthly', '600');
    tab('summary');
    const text = q('mc-summary').textContent;
    expect(text).toMatch(/Last paymentApril 2030/);
    expect(text).toMatch(/Total interest\$19,601\.02/);
    expect(text).toMatch(/Interest saved\$43,549\.02/);
    expect(text).toMatch(/Paid off sooner by13 yr 0 mo/);
    tab('asset');
    expect(q('mc-asset-rows').textContent).toMatch(/Payments never made\$93,047\.76/);
    tab('schedule');
    expect(q('mc-schedule').textContent).toMatch(/2025\$3,845\.69\$10,511\.81/);
    click('mc-year-2023');
    expect(q('mc-month-2023-12').textContent).toMatch(/\$73,778\.00/);
    tab('chart');
    expect(q('mc-balance-chart').querySelectorAll('path').length).toBe(2);
    expect(q('mc-split').textContent).toMatch(/Extra principal: 50%/);
  });
  it('a record with a figure missing says which, lands on the Loan tab, and draws nothing until it is entered', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY, defaultOpen: true }));
    type('mc-pick', 'property:r2');
    expect(q('mc-missing').textContent).toMatch(/the interest rate, the monthly payment/);
    expect(q('mc-result')).toBeNull();
    expect(q('mc-reason').textContent).toMatch(/term in years, or the monthly payment/);
    expect(q('mc-rate')).not.toBeNull();
  });
  it('a property with no mortgage entered says so in words', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY, defaultOpen: true }));
    type('mc-pick', 'property:r3');
    expect(q('mc-filled').textContent).toMatch(/No mortgage has been entered for Paid-off lot yet/);
    expect(q('mc-result')).toBeNull();
  });
  it('says so in words when a payment would never pay the loan off', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY, defaultOpen: true }));
    type('mc-principal', '100000');
    type('mc-rate', '12');
    type('mc-mode', 'payment');
    type('mc-payment', '900');
    expect(q('mc-reason').textContent).toMatch(/never be paid off/);
    expect(q('mc-result')).toBeNull();
  });
  it('with nothing on file it still works out a new loan', () => {
    mount(createElement(MortgageCalculator, { sources: loanGroups({}), currentDate: TODAY, defaultOpen: true }));
    expect(q('mc-none')).not.toBeNull();
  });
});

describe('where it is mounted', () => {
  const money = (data, over = {}) => ({
    data,
    setData: () => {},
    derivedDebts: deriveDebts(data, TODAY),
    currentDate: TODAY,
    visibleEntities: data.entities.slice(0, 2),
    ...over,
  });
  it('Debt Freedom: every property and every debt, and looking changes no record', () => {
    const data = world();
    const before = JSON.stringify(data);
    let wrote = 0;
    mount(createElement(MoneyLoanCalculator, { money: money(data, { setData: () => (wrote += 1), updateRental: () => (wrote += 1) }) }));
    click('mc-toggle');
    expect([...q('mc-pick').querySelectorAll('option')].map((o) => o.value)).toEqual([
      '',
      'property:home',
      'property:r1',
      'property:r2',
      'property:r3',
      'debt:debt-acct-card',
    ]);
    type('mc-pick', 'debt:debt-acct-card');
    type('mc-x-monthly', '100');
    expect(q('mc-result')).not.toBeNull();
    for (const t of tabs()) tab(t);
    expect(JSON.stringify(data)).toBe(before);
    expect(wrote).toBe(0);
  });
  it('a property with no mortgage on file: enter the figures, press the button, and the record has them', () => {
    const data = world();
    const calls = [];
    mount(createElement(MoneyLoanCalculator, { money: money(data, { updateRental: (id, patch) => calls.push([id, patch]) }) }));
    click('mc-toggle');
    type('mc-pick', 'property:r2');
    expect(tabs()).toContain('record');
    tab('record');
    click('mc-record-save');
    expect(q('mc-record-needs')).not.toBeNull();
    expect(calls).toEqual([]);
    type('mc-rate', '6.25');
    type('mc-mode', 'term');
    type('mc-years', '15');
    tab('record');
    expect(q('mc-record-rows').textContent).toMatch(/on the record: not entered/);
    click('mc-record-save');
    expect(calls).toEqual([['r2', { mortgage: { balance: 40000, rate: 6.25, monthlyPI: 342.97, escrow: 0, estimated: false } }]]);
    expect(q('mc-note').textContent).toMatch(/Saved to the record for 312 Willow Ln/);
  });
  it('a record that already matches offers nothing to save, and a debt has no record tab', () => {
    const data = world();
    const calls = [];
    mount(createElement(MoneyLoanCalculator, { money: money(data, { updateRental: (id, patch) => calls.push([id, patch]) }) }));
    click('mc-toggle');
    type('mc-pick', 'property:r1');
    tab('record');
    click('mc-record-save');
    expect(calls).toEqual([]);
    type('mc-pick', 'debt:debt-acct-card');
    expect(tabs()).not.toContain('record');
  });
  it('Real Estate: every property under the band, and no calculator when none is handed in', () => {
    const data = world();
    const state = {
      doors: 3,
      properties: 3,
      label: 'Poe Properties',
      collected: { known: false, note: 'No lease ledger yet.' },
      holds: [],
      attention: [],
      allClear: false,
      clear: null,
      personal: 0,
      service: null,
    };
    mount(createElement(RealEstateDoor, { state, calc: { rentals: data.inflows.rentals.slice(1), entities: data.entities, currentDate: TODAY } }));
    expect(q('real-estate-calculator')).not.toBeNull();
    expect(q('real-estate-door-scope').contains(q('mortgage-calculator'))).toBe(false);
    click('mc-toggle');
    expect([...q('mc-pick').querySelectorAll('option')].map((o) => o.value)).toEqual(['', 'property:r1', 'property:r2', 'property:r3']);
    expect(tabs()).not.toContain('keep');
    act(() => root.unmount());
    host.remove();
    mount(createElement(RealEstateDoor, { state }));
    expect(q('real-estate-calculator')).toBeNull();
  });
});
