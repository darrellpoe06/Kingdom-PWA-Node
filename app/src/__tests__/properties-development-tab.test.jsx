// =============================================================================
// The Development tab (DR-1158) on the screen, over a fake api: the owner picks
// a project and sees the engine's verdicts in words — the TI allowance, the
// contingency, the phases, the value and the deal — from Daniil Kleyman's own
// Richmond figures. The arithmetic is proven in properties-development.test.js;
// this proves the surface reads the records and says what the engine says.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { DevelopmentTab } from '../modules/properties/DevelopmentTab.jsx';
import { MANAGER_TABS, TENANT_TABS, WORKER_TABS } from '../modules/properties/model.js';

let host;
let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const settle = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 10)); }); };
async function mount(api) {
  await act(async () => { root.render(createElement(DevelopmentTab, { api })); });
  await settle();
}
const byId = (id) => host.querySelector(`#${id}`);
const byTest = (id) => host.querySelector(`[data-testid="${id}"]`);
async function setValue(el, v) {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  await act(async () => { el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
  await settle();
}
async function pickProject(api) {
  await mount(api);
  await setValue(byId('dev-project'), 'p1');
}

const PROJECT = {
  id: 'p1', instance_id: 'i1', name: 'Richmond 40', kind: 'mixed-use', has_elevator: true, project_ref: null,
  units: 40, gross_sq_ft: 45000,
  residential_noi_cents: 67800000, residential_cap_bp: 550,
  commercial_noi_cents: 15768000, commercial_cap_bp: 600,
};
const DATA = {
  lines: [
    { id: 'l1', kind: 'land', grp: null, label: 'Land', budget_cents: 127000000, actual_cents: null },
    { id: 'l2', kind: 'hard', grp: null, label: 'Construction', budget_cents: 800000000, actual_cents: null },
    { id: 'l3', kind: 'contingency', grp: null, label: 'Contingency', budget_cents: 50000000, actual_cents: null },
  ],
  changeOrders: [
    { id: 'c1', label: 'Site work', amount_cents: 6600000, source: 'contingency', status: 'approved', decided_on: '2025-03-01' },
  ],
  bays: [{ id: 'b1', name: 'Bay 1', sq_ft: 8000, tenant: null, ti_cents: 52000000, ti_drawn_cents: 0 }],
  checks: [],
  capital: [],
};

const fakeApi = (over = {}) => ({
  instanceId: vi.fn(async () => 'i1'),
  loadProjects: vi.fn(async () => ({ ok: true, projects: [PROJECT] })),
  loadProject: vi.fn(async () => ({ ok: true, ...DATA })),
  createProject: vi.fn(async () => ({ ok: true, project: PROJECT })),
  patchProject: vi.fn(async () => ({ ok: true })),
  addRow: vi.fn(async () => ({ ok: true })),
  patchRow: vi.fn(async () => ({ ok: true })),
  deleteRow: vi.fn(async () => ({ ok: true })),
  setCheck: vi.fn(async () => ({ ok: true })),
  ...over,
});

describe('the Development tab (DR-1158)', () => {
  it('is an owner tab in Poe Properties, never a tenant\'s or a worker\'s', () => {
    expect(MANAGER_TABS.map((t) => t.id)).toContain('development');
    expect(TENANT_TABS.map((t) => t.id)).not.toContain('development');
    expect(WORKER_TABS.map((t) => t.id)).not.toContain('development');
  });

  it('PROVEN TO CATCH: a mixed-use project with no TI line is named underfunded, on the screen', async () => {
    const api = fakeApi();
    await pickProject(api);
    expect(api.loadProject).toHaveBeenCalledWith('p1');
    expect(byTest('dev-ti').textContent).toMatch(/^Not funded: a building with commercial/);
  });

  it('says what the contingency has spent, and what the retail is worth at its own cap rate', async () => {
    await pickProject(fakeApi());
    const c = byTest('dev-contingency').textContent;
    expect(c).toMatch(/\$66,000/);
    expect(c).toMatch(/\$434,000/);
    expect(byTest('dev-value').textContent).toMatch(/commercial \$2,628,000/);
  });

  it('a value with the apartments\' income missing says what is missing, never a number', async () => {
    const api = fakeApi({ loadProjects: vi.fn(async () => ({ ok: true, projects: [{ ...PROJECT, residential_noi_cents: null }] })) });
    await pickProject(api);
    expect(byTest('dev-value').textContent).toMatch(/^Not valued yet: enter /);
    expect(byTest('dev-value').textContent).not.toMatch(/\$/);
  });

  it('counts the phases for this kind of building, the commercial shell included', async () => {
    await pickProject(fakeApi());
    expect(byTest('dev-phase-count').textContent).toBe('0 of 8 complete');
  });

  it('a database without the tables says so, not "no projects"', async () => {
    await mount(fakeApi({ loadProjects: vi.fn(async () => ({ ok: false, reason: 'not-enabled-yet' })) }));
    expect(host.querySelector('[role="alert"]').textContent).toMatch(/not on this database yet/);
  });

  it('the PoeTech project is saved once, when the field is left, not on every key', async () => {
    const api = fakeApi();
    await pickProject(api);
    const ref = byId('dev-project-ref');
    await setValue(ref, 'Rich');
    await setValue(ref, 'Richmond build');
    expect(api.patchProject).not.toHaveBeenCalled();
    await act(async () => { ref.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); });
    await settle();
    expect(api.patchProject).toHaveBeenCalledTimes(1);
    expect(api.patchProject).toHaveBeenCalledWith('p1', { project_ref: 'Richmond build' });
  });

  it('the build-to-rent comparison ranks Kleyman\'s duplex above his large house', async () => {
    await mount(fakeApi());
    for (const [k, v] of Object.entries({ lot: '60000', units: '1', sqft: '2400', perft: '145', rent: '2700' })) await setValue(byId(`btr-${k}-0`), v);
    for (const [k, v] of Object.entries({ lot: '60000', units: '2', sqft: '1200', perft: '160', rent: '2000' })) await setValue(byId(`btr-${k}-1`), v);
    const items = byTest('btr-ranked').querySelectorAll('li');
    expect(items[0].textContent).toMatch(/^Option B: 10\.81% gross yield/);
    expect(items[1].textContent).toMatch(/^Option A: 7\.94% gross yield/);
  });

  it('each line says its budget, what it cost and its variance; the forecast never counts spent money back down', async () => {
    const lines = [
      { id: 'f1', kind: 'hard', grp: null, label: 'Framing material', budget_cents: 108000000, actual_cents: 112500000, done: true },
      { id: 'f2', kind: 'hard', grp: null, label: 'Roof', budget_cents: 20000000, actual_cents: 25000000, done: false },
      { id: 'f3', kind: 'hard', grp: null, label: 'Landscaping', budget_cents: null, actual_cents: null, done: false },
    ];
    await pickProject(fakeApi({ loadProject: vi.fn(async () => ({ ok: true, ...DATA, lines })) }));
    const f = byTest('dev-forecast').textContent;
    expect(f).toMatch(/Forecast to finish: \$1,375,000\.00, \$95,000\.00 over the budget/);
    expect(f).toMatch(/Not counted, because they have no budget yet: Landscaping/);
    expect(byTest('dev-unit-costs').textContent).toMatch(/Framing material \$25/);
    expect(byTest('dev-tracking').textContent).toMatch(/over \$50,000\.00 so far/);
  });

  it('marking a line done and typing what it cost each save once, to that line', async () => {
    const api = fakeApi({ loadProject: vi.fn(async () => ({ ok: true, ...DATA })) });
    await pickProject(api);
    const box = host.querySelector('input[aria-label="Construction is done"]');
    await act(async () => { box.click(); });
    await settle();
    expect(api.patchRow).toHaveBeenCalledWith('dev_budget_lines', 'l2', { done: true });
    const spent = byId('dev-spent-l2');
    await setValue(spent, '8100000');
    expect(api.patchRow).toHaveBeenCalledTimes(1);
    await act(async () => { spent.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); });
    await settle();
    expect(api.patchRow).toHaveBeenLastCalledWith('dev_budget_lines', 'l2', { actual_cents: 810000000 });
  });

  it('the BRRRR card runs Kleyman\'s deal and names which of his rules fail', async () => {
    await mount(fakeApi());
    expect(byTest('brrrr-result').textContent).toMatch(/^Enter Purchase/);
    const deal = { purchase: '50000', closing: '1500', rehab: '20000', holding: '1000', shortRate: '8', shortMonths: '3',
      arv: '100000', rent: '1000', insurance: '600', taxes: '1200', repairs: '100', refiRate: '5.5', mgmt: '8' };
    for (const [k, v] of Object.entries(deal)) await setValue(byId(`brrrr-${k}`), v);
    const r = byTest('brrrr-result').textContent;
    expect(r).toMatch(/All in \$73,950/);
    expect(r).toMatch(/debt coverage 1\.08/);
    expect(r).toMatch(/Fails: Debt coverage 1\.08/);
    await setValue(byId('brrrr-rent'), '1200');
    expect(byTest('brrrr-result').textContent).not.toMatch(/Fails:/);
  });

  it('the land card splits the lot and tells how much cash the bank leaves to bring, from Kleyman\'s duplex', async () => {
    await mount(fakeApi());
    for (const [k, v] of Object.entries({ paid: '220000', close: '3000', soft: '12000', lot: '115000', sold: '2', kept: '1' })) await setValue(byId(`lab-${k}`), v);
    expect(byTest('lab-split').textContent).toMatch(/\$5,000\.00 still out of pocket/);
    await setValue(byId('lab-lot'), '100000');
    for (const [k, v] of Object.entries({ build: '325000', asbuilt: '550000', rent: '4000', exp: '1200', rate: '6.5', amort: '20' })) await setValue(byId(`lab-${k}`), v);
    expect(byTest('lab-bank').textContent).toMatch(/debt coverage 1\.16\. Cash to bring:/);
    await setValue(byId('lab-amort'), '25');
    expect(byTest('lab-bank').textContent).toMatch(/debt coverage 1\.28\. The bank can fund all of it\./);
  });
});
