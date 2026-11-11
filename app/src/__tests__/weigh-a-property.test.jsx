// weigh-a-property — a property we are looking to buy is named, kept with its
// figures, brought back from the drop-down, and never counted as ours. DR-1415.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MoneyLoanCalculator from '../components/money/MoneyLoanCalculator.jsx';
import RealEstateDoor from '../components/RealEstateDoor.jsx';
import { prospectsOf, toProspect, upsertProspect, removeProspect, missingForSave, MAX_PROSPECTS } from '../lib/purchase-prospects.js';
import { loanGroups } from '../lib/mortgage-sources.js';
import { deriveDebts } from '../lib/financial-engineering.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 10);

function world() {
  return {
    entities: [
      { id: 'e-p', name: 'Personal', type: 'personal' },
      { id: 'e-pp', name: 'Poe Properties LLC', type: 'business' },
    ],
    accounts: [],
    transactions: [],
    inflows: { rentals: [{ id: 'r1', name: '1402 Maple St', entityId: 'e-pp', mortgage: { balance: 80000, rate: 6.5, monthlyPI: 596.46, escrow: 0 } }] },
  };
}

let root;
let host;
let latest;
function Shell({ initial, readOnly = false }) {
  const [data, setData] = useState(initial);
  latest = data;
  return createElement(MoneyLoanCalculator, {
    money: { data, setData: readOnly ? undefined : setData, derivedDebts: deriveDebts(data, TODAY), currentDate: TODAY, visibleEntities: data.entities },
  });
}
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
  latest = null;
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
const options = () => [...q('mc-pick').querySelectorAll('option')].map((o) => o.value);

describe('purchase-prospects: the list', () => {
  it('keeps only the figures entered, replaces by id, and removes', () => {
    const a = toProspect({ id: 'a', name: '  12 Elm St ', entityId: 'e-pp', figures: { value: '95000', down: '', rate: '7', junk: 'x' } }, TODAY);
    expect(a).toMatchObject({ id: 'a', name: '12 Elm St', entityId: 'e-pp', figures: { value: '95000', rate: '7' } });
    expect(Object.keys(a.figures)).toEqual(['value', 'rate']);
    const list = upsertProspect(upsertProspect([], a), { ...a, name: '12 Elm Street' });
    expect(list.map((p) => p.name)).toEqual(['12 Elm Street']);
    expect(removeProspect(list, 'a')).toEqual([]);
  });
  it('will not save a property with no name or no price, and says which', () => {
    expect(missingForSave({ name: '', figures: {} })).toEqual(['a name or address for the property', 'the price or the amount borrowed']);
    expect(missingForSave({ name: 'x', figures: { value: '1' } })).toEqual([]);
  });
  it('is capped, and ignores a malformed stored row', () => {
    let list = [];
    for (let i = 0; i < MAX_PROSPECTS + 5; i += 1) list = upsertProspect(list, toProspect({ id: `p${i}`, name: `n${i}`, figures: { value: '1' } }, TODAY));
    expect(list.length).toBe(MAX_PROSPECTS);
    expect(prospectsOf({ moneyPlan: { prospects: [null, { id: 'x' }, { id: 'y', name: 'Kept' }] } }).map((p) => p.id)).toEqual(['y']);
  });
  it('is listed first, in its own group, and hidden with an entity the person may not see', () => {
    const p = [
      toProspect({ id: 'a', name: '12 Elm St', entityId: 'e-pp', figures: { value: '95000', down: '19000' } }, TODAY),
      toProspect({ id: 'b', name: 'Secret', entityId: 'e-hidden', figures: { value: '1' } }, TODAY),
    ];
    const s = loanGroups({ rentals: world().inflows.rentals, entities: world().entities, prospects: p });
    expect(s.groups[0].label).toBe('Properties we are weighing');
    expect(s.groups[0].options.map((o) => [o.id, o.label, o.principal])).toEqual([['prospect:a', '12 Elm St · Poe Properties LLC', 76000]]);
    expect(s.groups[1].label).toBe('Properties and their mortgages · Poe Properties LLC');
  });
});

describe('weighing a property in the calculator', () => {
  it('names it, saves it, brings it back with its figures, and counts it nowhere', () => {
    const initial = world();
    mount(createElement(Shell, { initial }));
    click('mc-toggle');
    expect(options()).toEqual(['', 'property:r1']);
    type('mc-value', '95000');
    type('mc-down', '19000');
    type('mc-rate', '7');
    type('mc-years', '20');
    type('mc-tax', '1800');
    type('mc-rent', '1100');
    expect(val('mc-principal')).toBe('76000');
    expect(q('mc-result').textContent).toMatch(/Left from the rent\$360\.77 a month/);
    tab('keep');
    click('mc-keep-save');
    expect(q('mc-keep-needs').textContent).toMatch(/a name or address/);
    expect(prospectsOf(latest)).toEqual([]);
    type('mc-keep-name', '12 Elm St');
    type('mc-keep-entity', 'e-pp');
    click('mc-keep-save');
    const saved = prospectsOf(latest);
    expect(saved.length).toBe(1);
    expect(saved[0]).toMatchObject({
      name: '12 Elm St',
      entityId: 'e-pp',
      figures: { value: '95000', down: '19000', principal: '76000', rate: '7', years: '20', tax: '1800', rent: '1100' },
    });
    expect(q('mc-note').textContent).toMatch(/Saved/);
    expect(options()).toEqual(['', `prospect:${saved[0].id}`, 'property:r1']);
    expect(q('mc-pick').value).toBe(`prospect:${saved[0].id}`);
    // Not a property, not a debt, not in any record but its own list.
    expect(latest.inflows).toEqual(initial.inflows);
    expect(deriveDebts(latest, TODAY).length).toBe(deriveDebts(initial, TODAY).length);
    // Leave it, come back: the figures return.
    type('mc-pick', 'property:r1');
    expect(tabs()).not.toContain('keep');
    expect(val('mc-principal')).toBe('80000');
    type('mc-pick', `prospect:${saved[0].id}`);
    expect([val('mc-value'), val('mc-down'), val('mc-rate'), val('mc-years'), val('mc-rent'), val('mc-keep-name')]).toEqual([
      '95000',
      '19000',
      '7',
      '20',
      '1100',
      '12 Elm St',
    ]);
    // Change it: the same row is updated, never a second one.
    type('mc-rate', '6.5');
    tab('keep');
    click('mc-keep-save');
    expect(prospectsOf(latest).map((p) => p.figures.rate)).toEqual(['6.5']);
    click('mc-keep-remove');
    expect(prospectsOf(latest)).toEqual([]);
    expect(options()).toEqual(['', 'property:r1']);
  });
  it('says the rent falls short when it does', () => {
    mount(createElement(Shell, { initial: world() }));
    click('mc-toggle');
    type('mc-principal', '200000');
    type('mc-rate', '7');
    type('mc-years', '15');
    type('mc-rent', '900');
    expect(q('mc-result').textContent).toMatch(/Short of the rent/);
  });
  it('a seat that cannot write sees the list and no save', () => {
    const initial = {
      ...world(),
      moneyPlan: { prospects: [toProspect({ id: 'a', name: '12 Elm St', figures: { value: '95000', rate: '7', years: '20' } }, TODAY)] },
    };
    mount(createElement(Shell, { initial, readOnly: true }));
    click('mc-toggle');
    expect(options()).toEqual(['', 'prospect:a', 'property:r1']);
    type('mc-pick', 'prospect:a');
    expect(q('mc-result')).not.toBeNull();
    expect(tabs()).not.toContain('keep');
  });
  it('Real Estate keeps the same list through the plan it is handed', () => {
    let data = world();
    const setData = (fn) => {
      data = fn(data);
    };
    const state = {
      doors: 1,
      properties: 1,
      label: 'Poe Properties',
      collected: { known: false, note: 'No lease ledger yet.' },
      holds: [],
      attention: [],
      allClear: false,
      clear: null,
      personal: 0,
      service: null,
    };
    const el = () =>
      createElement(RealEstateDoor, {
        state,
        calc: { rentals: data.inflows.rentals, entities: data.entities, currentDate: TODAY, plan: { moneyPlan: data.moneyPlan, setData } },
      });
    mount(el());
    click('mc-toggle');
    type('mc-value', '60000');
    type('mc-rate', '7');
    type('mc-keep-name', 'Corner lot');
    click('mc-keep-save');
    expect(prospectsOf(data).map((p) => p.name)).toEqual(['Corner lot']);
    act(() => root.render(el()));
    expect(options()).toEqual(['', `prospect:${prospectsOf(data)[0].id}`, 'property:r1']);
  });
});
