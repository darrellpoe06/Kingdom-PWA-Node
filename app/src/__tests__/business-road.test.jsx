// @vitest-environment jsdom
// =============================================================================
// Each business's own road to full time, from its own records (DR-1138).
// Darrell, 2026-10-20: "Road to full time for who? Is this a feature for
// everyone?" Then: "Their road to full-time?"
//
// PROVEN-TO-CATCH (DR-0076 §3): only this business's transactions count (an
// override counts, another business's do not); transfers between the family's
// own accounts are not income or cost; the month in progress is not a month;
// owner pay already in the costs is not counted twice; a blank is never zero;
// the hire is needed on the work and paid for on the money.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  entityTransactions, entityMonthsFromRecords, entityWorkHours, businessRoad,
} from '../lib/business-road.js';
import BusinessRoad from '../components/BusinessRoad.jsx';
import { BooksEntities } from '../components/BooksEntities.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = Date.parse('2026-10-20T12:00:00Z');
const accounts = [
  { id: 'a-biz', entityId: 'e-biz' },
  { id: 'a-home', entityId: 'e-home' },
];
const tx = (id, accountId, date, amount, extra = {}) => ({ id, accountId, date, amount, description: 'x', ...extra });
const transactions = [
  // July, August, September: $10,000 in and $4,000 out each.
  tx('j1', 'a-biz', '2026-07-03', 10000), tx('j2', 'a-biz', '2026-07-10', -3000), tx('j3', 'a-biz', '2026-07-20', -1000),
  tx('g1', 'a-biz', '2026-08-03', 9500), tx('g2', 'a-biz', '2026-08-10', -4000),
  // A sale paid into the home account but set on the business: it counts.
  tx('g3', 'a-home', '2026-08-12', 500, { entityOverride: 'e-biz' }),
  tx('s1', 'a-biz', '2026-09-03', 10000), tx('s2', 'a-biz', '2026-09-10', -4000),
  // Money moved to the home account: neither income nor cost.
  tx('t1', 'a-biz', '2026-09-15', -2000, { description: 'Online transfer to checking' }),
  tx('t2', 'a-home', '2026-09-16', 2000, { description: 'Online transfer from business' }),
  // The home's own pay: another entity.
  tx('h1', 'a-home', '2026-09-01', 7000),
  // June is older than the three most recent months with records.
  tx('u1', 'a-biz', '2026-06-05', 1000),
  // October is still in progress.
  tx('o1', 'a-biz', '2026-10-05', 50000),
];
const projects = [
  { id: 'p1', entityId: 'e-biz', status: 'active', hoursPerWeek: 30, title: 'Orders' },
  { id: 'p2', entityId: 'e-biz', status: 'tbd', hoursPerWeek: 40, title: 'Parked' },
  { id: 'p3', entityId: 'e-home', status: 'active', hoursPerWeek: 20, title: 'Home' },
  { id: 'p4', entityId: 'e-biz', status: 'planning', title: 'No hours yet' },
];

describe("a business's records", () => {
  it('takes the business its own transactions, an override included', () => {
    expect(entityTransactions(transactions, accounts, 'e-biz').map((t) => t.id)).toContain('g3');
    expect(entityTransactions(transactions, accounts, 'e-biz').map((t) => t.id)).not.toContain('h1');
  });

  it('averages the last three complete months with records, transfers left out', () => {
    const r = entityMonthsFromRecords({ transactions, accounts, entityId: 'e-biz', now: NOW });
    expect(r.months.map((m) => m.month)).toEqual(['2026-09', '2026-08', '2026-07']);
    expect(r.months.map((m) => [m.inCents, m.outCents])).toEqual([[1000000, 400000], [1000000, 400000], [1000000, 400000]]);
    expect(r.avgInCents).toBe(1000000);
    expect(r.avgOutCents).toBe(400000);
  });

  it('a business with no complete month says so', () => {
    const r = entityMonthsFromRecords({ transactions: [tx('o1', 'a-biz', '2026-10-05', 500)], accounts, entityId: 'e-biz', now: NOW });
    expect(r.monthsMeasured).toBe(0);
    expect(r.avgInCents).toBeNull();
  });

  it("the work is the business's active projects, in hours a month", () => {
    const w = entityWorkHours({ projects, entityId: 'e-biz' });
    expect(w.hoursPerMonth).toBe(130);
    expect(w.activeCount).toBe(2);
    expect(w.unhoured).toBe(1);
  });
});

describe('the road', () => {
  const base = (over = {}) => ({
    incomeCents: 1000000, costCents: 400000, monthsMeasured: 3, workHoursPerMonth: 130,
    ownerPayInCostsCents: 100000, employerCostPct: 0, reservePct: 20,
    people: [{ role: 'Owner', monthlyPayCents: 500000, hoursPerMonth: 160 }],
    nextHire: { kind: '1099', monthlyPayCents: 300000, hoursPerMonth: 160 },
    ...over,
  });

  it('nothing is claimed without records or entries', () => {
    const r = businessRoad(base({ monthsMeasured: 0, ownerPayInCostsCents: '', employerCostPct: '' }));
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(["a complete month of this business's transactions", 'owner pay already in these costs', 'employer costs (%)']);
  });

  it('owner pay already in the costs is not counted twice', () => {
    const r = businessRoad(base());
    // $10,000 in, $2,000 reserve, $3,000 to run it (the $1,000 the owner already takes is moved to pay), $5,000 left.
    expect(r.runCents).toBe(300000);
    expect(r.forPeopleCents).toBe(500000);
    expect(r.allCovered).toBe(true);
    expect(r.eachFullTimeAtCents).toEqual([1000000]);
    expect(businessRoad(base({ ownerPayInCostsCents: 0 })).allCovered).toBe(false);
  });

  it('answers in revenue a month for each owner, in order', () => {
    const r = businessRoad(base({ people: [
      { role: 'A', monthlyPayCents: 500000, hoursPerMonth: 160 },
      { role: 'B', monthlyPayCents: 400000, hoursPerMonth: 160 },
    ] }));
    expect(r.fullTimeCovered).toBe(1);
    expect(r.eachFullTimeAtCents).toEqual([1000000, 1500000]);
    expect(r.shortCents).toBe(400000);
  });

  it('the hire is needed on the work and paid for on the money', () => {
    const r = businessRoad(base());
    // 130 of 160 hours now; 80% is 128, so the work reaches it a little below today's revenue.
    expect(r.hireNeededAtCents).toBe(984616);
    // $3,000 run + $5,000 owner + $3,000 hire, over 80% kept.
    expect(r.hireAffordableAtCents).toBe(1375000);
    expect(r.hireGapCents).toBe(390384);
    const w2 = businessRoad(base({ employerCostPct: 10, nextHire: { kind: 'w2', monthlyPayCents: 300000, hoursPerMonth: 160 } }));
    expect(w2.hireAffordableAtCents).toBeGreaterThan(businessRoad(base({ employerCostPct: 10 })).hireAffordableAtCents);
  });

  it('without project hours the hire timing is said to be unknown, not guessed', () => {
    expect(businessRoad(base({ workHoursPerMonth: 0 })).hireNeededAtCents).toBeNull();
  });
});

describe('the screen', () => {
  let host; let root;
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const mount = (el) => {
    host = document.createElement('div'); document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(el));
  };
  const type = (id, v) => act(() => {
    const el = host.querySelector(`#${id}`);
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  const data = { transactions, accounts, projects };
  const entity = { id: 'e-biz', name: 'Moore Divahs LLC', type: 'business' };

  it("shows the business's months and its work, then asks only what it cannot read", () => {
    mount(createElement(BusinessRoad, { entity, data, now: NOW }));
    expect(host.querySelector('[data-testid=br-e-biz-months]').textContent).toContain('September 2026');
    expect(host.querySelector('[data-testid=br-e-biz-months]').textContent).toContain('$10,000.00');
    expect(host.querySelector('[data-testid=br-e-biz-work]').textContent).toContain('130 hours a month across 2 active projects, 1 with no hours set');
    expect(host.querySelector('[role=status]').textContent).toBe("Not yet known: enter owner pay already in these costs, employer costs (%), Owner's full-time pay, Owner's hours a month, the next hire's pay, the next hire's hours a month.");
    type('br-e-biz-incosts', '1000'); type('br-e-biz-employer', '0');
    type('br-e-biz-pay-0', '5000'); type('br-e-biz-hours-0', '160');
    type('br-e-biz-hire-pay', '3000'); type('br-e-biz-hire-hours', '160');
    expect(host.querySelector('[role=status]').textContent).toBe('Today this business can pay everyone listed full time, with $0.00 a month left over.');
    expect(host.querySelector('[data-testid=br-e-biz-hire]').textContent).toMatch(/needed at \$9,846\.16 a month coming in .* paid for at \$13,750\.00\. For \$3,903\.84 of revenue the work outruns the money/);
  });

  it('a business with no records is told how to fill the road in', () => {
    mount(createElement(BusinessRoad, { entity, data: { transactions: [], accounts, projects: [] }, now: NOW }));
    expect(host.querySelector('[data-testid=br-e-biz-norecords]').textContent).toMatch(/^No complete month of transactions for this business yet/);
  });

  it('Books -> Entities carries it under each business, not under the household', () => {
    const rollup = (e) => ({ entity: e, cashBalance: 0, creditBalance: 0, inflow: 0, debtBalance: 0, accounts: [] });
    const home = { id: 'e-home', name: 'Personal', type: 'personal' };
    mount(createElement(BooksEntities, {
      entityRollups: [rollup(home), rollup(entity)], entityFilter: 'all', setEntityFilter: () => {},
      data: { ...data, entities: [home, entity] },
    }));
    expect(host.querySelector('[data-testid=business-road-e-biz]')).not.toBeNull();
    expect(host.querySelector('[data-testid=business-road-e-home]')).toBeNull();
  });
});
