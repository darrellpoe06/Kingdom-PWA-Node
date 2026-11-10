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
const click = (id) => act(() => q(id).dispatchEvent(new MouseEvent('click', { bubbles: true })));
function type(id, value) {
  const el = q(id);
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

describe('mortgage-sources: the drop-down is the real records, by entity', () => {
  it('lists each property mortgage and each debt once, under its entity', () => {
    const data = world();
    const visible = data.entities.slice(0, 2);
    const s = loanGroups({ rentals: data.inflows.rentals, debts: deriveDebts(data, TODAY), entities: visible });
    expect(s.groups.map((g) => g.label)).toEqual(['Personal', 'Poe Properties LLC']);
    expect(s.groups[0].options.map((o) => o.id)).toEqual(['property:home', 'debt:debt-acct-card']);
    expect(s.groups[1].options.map((o) => o.id)).toEqual(['property:r1', 'property:r2']);
    expect(s.propertiesWithoutMortgage).toBe(1);
  });
  it('leaves out what this person may not see', () => {
    const data = world();
    const s = loanGroups({ rentals: data.inflows.rentals, debts: deriveDebts(data, TODAY), entities: data.entities.slice(0, 2) });
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

  it('is closed until a person opens it', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY }));
    expect(q('mc-pick')).toBeNull();
    click('mc-toggle');
    expect(q('mc-pick')).not.toBeNull();
    expect(q('mc-result')).toBeNull();
    expect(q('mc-reason')).toBeNull();
  });
  it('choosing a property fills in its record and shows the payoff', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY, defaultOpen: true }));
    expect([...q('mc-pick').querySelectorAll('optgroup')].map((g) => g.label)).toEqual(['Personal', 'Poe Properties LLC']);
    type('mc-pick', 'property:r1');
    expect(q('mc-principal').value).toBe('80000');
    expect(q('mc-rate').value).toBe('6.5');
    expect(q('mc-payment').value).toBe('596.46');
    expect(q('mc-monthly-cost').value).toBe('183.33');
    expect(q('mc-start').value).toBe('2026-12');
    expect(q('mc-filled').textContent).toMatch(/\$80,000\.00 owed at 6\.5%, \$596\.46 a month/);
    expect(q('mc-result').textContent).toMatch(/\$596\.46/);
    expect(q('mc-result').textContent).toMatch(/\$779\.79/);
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
    const text = q('mc-summary').textContent;
    expect(text).toMatch(/Last paymentApril 2030/);
    expect(text).toMatch(/Total interest\$19,601\.02/);
    expect(text).toMatch(/Interest saved\$43,549\.02/);
    expect(text).toMatch(/Paid off sooner by13 yr 0 mo/);
    click('mc-tab-schedule');
    expect(q('mc-schedule').textContent).toMatch(/2025\$3,845\.69\$10,511\.81/);
    click('mc-year-2023');
    expect(q('mc-month-2023-12').textContent).toMatch(/\$73,778\.00/);
    click('mc-tab-chart');
    expect(q('mc-balance-chart').querySelectorAll('path').length).toBe(2);
    expect(q('mc-split').textContent).toMatch(/Extra principal: 50%/);
  });
  it('a record with a figure missing says which, and draws nothing until it is entered', () => {
    mount(createElement(MortgageCalculator, { sources: sources(), currentDate: TODAY, defaultOpen: true }));
    type('mc-pick', 'property:r2');
    expect(q('mc-missing').textContent).toMatch(/the interest rate, the monthly payment/);
    expect(q('mc-result')).toBeNull();
    expect(q('mc-reason').textContent).toMatch(/term in years, or the monthly payment/);
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
  it('Debt Freedom: every visible loan, and the records are not changed', () => {
    const data = world();
    const before = JSON.stringify(data);
    let wrote = 0;
    mount(
      createElement(MoneyLoanCalculator, {
        money: {
          data,
          setData: () => {
            wrote += 1;
          },
          updateRental: () => {
            wrote += 1;
          },
          derivedDebts: deriveDebts(data, TODAY),
          currentDate: TODAY,
          visibleEntities: data.entities.slice(0, 2),
        },
      })
    );
    click('mc-toggle');
    expect([...q('mc-pick').querySelectorAll('option')].map((o) => o.value)).toEqual([
      '',
      'property:home',
      'debt:debt-acct-card',
      'property:r1',
      'property:r2',
    ]);
    type('mc-pick', 'debt:debt-acct-card');
    type('mc-x-monthly', '100');
    expect(q('mc-result')).not.toBeNull();
    expect(JSON.stringify(data)).toBe(before);
    expect(wrote).toBe(0);
  });
  it('Real Estate: the property mortgages under the band, and no calculator when none is handed in', () => {
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
    expect([...q('mc-pick').querySelectorAll('option')].map((o) => o.value)).toEqual(['', 'property:r1', 'property:r2']);
    act(() => root.unmount());
    host.remove();
    mount(createElement(RealEstateDoor, { state }));
    expect(q('real-estate-calculator')).toBeNull();
  });
});
