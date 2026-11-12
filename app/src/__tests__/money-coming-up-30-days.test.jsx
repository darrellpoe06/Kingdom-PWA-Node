// money-coming-up-30-days.test.jsx — Coming Up shows bills and income in 7-, 14-
// and 30-day windows, keeps the $10,000 emergency-reserve GOAL apart from the
// money actually set aside (Christina, 2026-11-11: "The $10,000 reserve is my
// SAVINGS GOAL, not my current reserve balance... Only protect money I have
// actually designated as reserved"), and says WHY each account reads what it
// reads, rendered at phone width through the real panel.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildSafeToSpend, extraDebtCapacity, reserveStatus, resolveScope, DEFAULT_PERSONAL_RESERVE_GOAL } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import { patchMoneyPlan } from '../lib/money-plan.js';
import MoneyComingUp from '../components/money/MoneyComingUp.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 11, 12);
const show = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`;

function her({ reserve = undefined, designations = undefined, goal = undefined, cushion = undefined } = {}) {
  const settings = { incomeSchedule: { s1: { frequency: 'biweekly', nextDate: '2026-11-14', amount: 2000 } } };
  if (reserve !== undefined) settings.reserveByEntity = { personal: reserve };
  if (goal !== undefined) settings.reserveGoalByEntity = { personal: goal };
  if (cushion !== undefined) settings.minCushion = cushion;
  const moneyPlan = { settings };
  if (designations) moneyPlan.reserveDesignations = designations;
  return {
    meta: { bufferTarget: 2000 },
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-props', name: 'Poe Properties', type: 'business' },
    ],
    accounts: [
      { id: 'a-7206', name: 'Chase Personal', fragment: '...7206', type: 'checking', entityId: 'e-personal', balance: 0, isPrimary: true },
      { id: 'a-3322', name: 'Chase Poe Properties', fragment: '...3322', type: 'checking', entityId: 'e-props', balance: 0 },
    ],
    transactions: [
      { id: 'cp1', ...balanceCheckpointRow('a-7206', 3183.1, '2026-11-09', { basis: 'available', source: 'screenshot chase7206.png' }) },
      { id: 'cp2', ...balanceCheckpointRow('a-3322', 4479.53, '2026-11-09', { basis: 'available', source: 'screenshot chase3322.png' }) },
      { id: 'r1', date: '2026-11-10', accountId: 'a-3322', amount: -1200, description: 'FIRST STATE BANK LOAN 5312', category: 'mortgage' },
      { id: 'r2', date: '2026-11-10', accountId: 'a-3322', amount: -739.53, description: 'EVERGY', category: 'utilities' },
    ],
    recurringObligations: [
      {
        id: 'ro-bg',
        name: 'BG & Mom',
        amount: 750,
        frequency: 'monthly',
        nextDue: '2026-11-18',
        entityId: 'e-personal',
        accountId: 'a-7206',
        category: 'other',
        enabled: true,
      },
      {
        id: 'ro-ins',
        name: 'Car insurance',
        amount: 180,
        frequency: 'monthly',
        nextDue: '2026-12-05',
        entityId: 'e-personal',
        accountId: 'a-7206',
        category: 'insurance',
        enabled: true,
      },
    ],
    inflows: { salaries: [{ id: 's1', source: 'State Payroll', who: 'Christina', expected: 4000, entityId: 'e-personal' }], rentals: [] },
    moneyPlan,
  };
}
const personal = (d, period = '14d') => buildSafeToSpend(d, { currentDate: TODAY, period, scope: 'personal' });

describe('the engine: 7 / 14 / 30-day windows', () => {
  it('the three windows are cuts of one walk: 7 ⊆ 14 ⊆ 30, and the 30-day window holds the December bill', () => {
    const W = personal(her()).windows;
    expect(W.next7.total).toBe(750); // BG & Mom 11-18 is the seventh day, inside the window
    expect(W.next14.total).toBe(750);
    expect(W.next30.total).toBe(750 + 180); // + Car insurance 12-05
    expect(W.next30.items.map((i) => i.label)).toEqual(['BG & Mom', 'Car insurance']);
    expect(W.income14.total).toBe(2000); // 11-14
    expect(W.income30.total).toBe(4000); // 11-14, 11-28
    expect(W.next14.items.every((i) => W.next30.items.some((j) => j.label === i.label && j.date === i.date))).toBe(true);
  });
});

describe('the goal is not the cushion (PROVEN TO CATCH)', () => {
  it('with nothing set aside, Personal protects $0, tracks the $10,000 goal with $10,000 still to save, and Safe to Spend is what the walk allows', () => {
    const r = personal(her());
    expect(r.lines.minCushion).toBe(0);
    expect(r.windows.reserveSource).toBe('none');
    expect(r.lines.reserve).toMatchObject({ goal: DEFAULT_PERSONAL_RESERVE_GOAL, designated: 0, remaining: 10000, pct: 0, goalSource: 'default' });
    // the old default subtracted the whole goal: $3,183 of cash could never clear $10,000, so safe read $0
    expect(r.safeToSpendNow).toBeGreaterThan(0);
    expect(r.assumptions.some((a) => /nothing is set aside as a reserve yet.*goal is tracked, not subtracted/.test(a))).toBe(true);
    // the buffer target on file ($2,000) is a target too: never protected for Personal
    expect(r.lines.minCushion).not.toBe(2000);
  });
  it('money set aside by designation is protected to the cent, and the goal remaining falls by it', () => {
    const d = her({
      designations: [
        { id: 'rd1', scope: 'personal', date: '2026-11-07', amount: 1500, note: 'from the Nov 6 paycheck' },
        { id: 'rd2', scope: 'personal', date: '2026-11-10', amount: -200, note: 'car repair' },
      ],
    });
    const r = personal(d);
    expect(r.lines.minCushion).toBe(1300);
    expect(r.windows.reserveSource).toBe('designated');
    expect(r.lines.reserve).toMatchObject({ designated: 1300, remaining: 8700, pct: 13 });
    expect(r.lines.reserve.designations.map((x) => x.id)).toEqual(['rd1', 'rd2']);
    const none = personal(her());
    expect(none.safeToSpendNow - r.safeToSpendNow).toBe(1300); // never counted twice: the cushion rose by exactly what was set aside
  });
  it('a reserve typed by hand counts as set aside, on top of the designations; a saved goal replaces the default', () => {
    const d = her({ reserve: 500, designations: [{ id: 'rd1', scope: 'personal', date: '2026-11-07', amount: 1500 }], goal: 12000 });
    const r = personal(d);
    expect(r.lines.minCushion).toBe(2000);
    expect(r.lines.reserve).toMatchObject({ goal: 12000, designated: 2000, remaining: 10000, goalSource: 'saved', typed: 500 });
  });
  it('an explicit household cushion still holds for Personal when nothing is set aside; a business pocket is unchanged', () => {
    expect(personal(her({ cushion: 400 })).lines.minCushion).toBe(400);
    expect(personal(her({ cushion: 400 })).windows.reserveSource).toBe('household');
    const biz = buildSafeToSpend(her(), { currentDate: TODAY, period: '14d', scope: 'e-props' });
    expect(biz.lines.minCushion).toBe(2000); // the buffer target, as before
    expect(biz.lines.reserve.goal).toBe(0); // the Personal goal never leaks into a business pocket
  });
  it('a designation for one pocket never reaches another, in the combined view too', () => {
    const d = her({ designations: [{ id: 'rd1', scope: 'e-props', date: '2026-11-07', amount: 900 }] });
    expect(personal(d).lines.minCushion).toBe(0);
    expect(buildSafeToSpend(d, { currentDate: TODAY, period: '14d', scope: 'e-props' }).lines.minCushion).toBe(900);
    const all = buildSafeToSpend(d, { currentDate: TODAY, period: '14d', scope: 'consolidated' });
    expect(all.byEntity.find((r) => r.scope.id === 'e-props').lines.minCushion).toBe(900);
    expect(all.byEntity.find((r) => r.scope.kind === 'personal').lines.minCushion).toBe(0);
    expect(reserveStatus(d, d.moneyPlan.settings, resolveScope(d, 'personal')).designations).toEqual([]);
  });
  it('one pool for the reserve and extra debt: the suggestion fills the goal first, and setting money aside lowers the pool by that amount', () => {
    const x = extraDebtCapacity(her(), { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(x.amount).toBeGreaterThan(0);
    expect(x.reserve.remaining).toBe(10000);
    expect(x.reserve.suggested).toBe(Math.min(x.amount, 10000));
    expect(x.reserve.debtAfter).toBe(Math.round((x.amount - x.reserve.suggested) * 100) / 100);
    const after = extraDebtCapacity(her({ designations: [{ id: 'rd1', scope: 'personal', date: '2026-11-11', amount: 300 }] }), {
      currentDate: TODAY,
      period: '14d',
      scope: 'personal',
    });
    expect(Math.round((x.amount - after.amount) * 100) / 100).toBe(300);
    expect(after.reserve.remaining).toBe(9700);
  });
  it('the plan keeps the designations and the goal: patchMoneyPlan carries both', () => {
    const p = patchMoneyPlan(null, {
      reserveDesignations: [{ id: 'rd1', scope: 'personal', date: '2026-11-11', amount: 300 }],
      settings: { reserveGoalByEntity: { personal: 10000 } },
    });
    expect(p.reserveDesignations).toHaveLength(1);
    expect(p.settings.reserveGoalByEntity.personal).toBe(10000);
    expect(patchMoneyPlan(p, { settings: { privacy: true } }).reserveDesignations).toHaveLength(1);
  });
});

let host = null;
let root = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});

async function render(data, scope = 'personal', handlers = {}) {
  const result = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope });
  const extra = extraDebtCapacity(data, { currentDate: TODAY, period: '14d', scope });
  host = document.createElement('div');
  host.style.width = '360px';
  document.body.appendChild(host);
  await act(async () => {
    root = createRoot(host);
    root.render(
      createElement(MoneyComingUp, { result, extra, show, entities: data.entities, settings: data.moneyPlan.settings, data, asOf: TODAY, ...handlers })
    );
  });
  return host;
}
async function setValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('Coming Up on the phone', () => {
  it('shows the 30-day bills line with its income note, the goal apart from the money set aside, and the reserve-or-debt pool', async () => {
    const h = await render(
      her({ designations: [{ id: 'rd1', scope: 'personal', date: '2026-11-07', amount: 1500, note: 'from the Nov 6 paycheck' }] }),
      'personal',
      { onDesignate: () => {} }
    );
    expect(h.querySelector('[data-testid="coming-up-next30-value"]').textContent).toBe('$930');
    expect(h.querySelector('[data-testid="coming-up-next30"]').textContent).toMatch(/income expected before these are due: \$4,000/);
    expect(h.querySelector('[data-testid="coming-up-reserve-value"]').textContent).toBe('$1,500');
    expect(h.querySelector('[data-testid="coming-up-reserve"]').textContent).toMatch(/Personal’s own money set aside/);
    expect(h.querySelector('[data-testid="coming-up-reserve-goal-value"]').textContent).toBe('$10,000');
    expect(h.querySelector('[data-testid="coming-up-reserve-goal"]').textContent).toMatch(
      /\$1,500 set aside · \$8,500 still to save · the \$10,000 target, until you save another/
    );
    expect(h.querySelector('[data-testid="coming-up-reserve-remaining"]').textContent).toBe('$8,500');
    expect(h.querySelector('[data-testid="coming-up-designations"]').textContent).toMatch(/2026-11-07.*from the Nov 6 paycheck.*\+\$1,500/);
    expect(h.querySelector('[data-testid="coming-up-extra"]').textContent).toMatch(/Safe to put toward your reserve or extra debt today/);
    expect(h.querySelector('[data-testid="coming-up-extra"]').textContent).toMatch(/suggested: \$[\d,]+ to the reserve/);
  });
  it('with nothing set aside the panel says so and tracks the goal rather than subtracting it', async () => {
    const h = await render(her(), 'personal', { onDesignate: () => {} });
    expect(h.querySelector('[data-testid="coming-up-reserve-value"]').textContent).toBe('$0');
    expect(h.querySelector('[data-testid="coming-up-reserve"]').textContent).toMatch(/nothing set aside yet; the goal is tracked, not subtracted/);
    expect(h.querySelector('[data-testid="coming-up-reserve-remaining"]').textContent).toBe('$10,000');
    expect(h.querySelector('[data-testid="coming-up-safe-value"]').textContent).not.toBe('$0');
  });
  it('Set aside records a dated designation for the pocket in view, and Save goal records the goal', async () => {
    const designated = [];
    const goals = [];
    const h = await render(her(), 'personal', { onDesignate: (d) => designated.push(d), onSaveReserveGoal: (id, g) => goals.push([id, g]) });
    await setValue(h.querySelector('[data-testid="coming-up-designate-amount"]'), '250.5');
    await setValue(h.querySelector('[data-testid="coming-up-designate-note"]'), 'tax refund');
    await act(async () => {
      h.querySelector('[data-testid="coming-up-designate-save"]').click();
    });
    expect(designated).toEqual([{ scope: 'personal', date: '2026-11-11', amount: 250.5, note: 'tax refund' }]);
    expect(h.querySelector('[data-testid="coming-up-designate-amount"]').value).toBe(''); // cleared for the next one
    await setValue(h.querySelector('[data-testid="coming-up-reserve-goal-input"]'), '12000');
    await act(async () => {
      h.querySelector('[data-testid="coming-up-reserve-goal-save"]').click();
    });
    expect(goals).toEqual([['personal', 12000]]);
    // an empty amount cannot be set aside
    expect(h.querySelector('[data-testid="coming-up-designate-save"]').disabled).toBe(true);
  });
  it('explains Poe Properties 3322: bank check $4,480 on 11-09, then 2 rows dated after it = $2,540, naming both rows and the fix', async () => {
    const h = await render(her(), 'e-props');
    const trace = h.querySelector('[data-testid="trace-a-3322"]');
    expect(trace).not.toBeNull();
    expect(trace.textContent).toMatch(/Bank check \$4,480 on 2026-11-09, then 2 rows dated after it \(−\$1,940\) = \$2,540/);
    expect(trace.textContent).toMatch(/FIRST STATE BANK LOAN 5312/);
    expect(trace.textContent).toMatch(/EVERGY/);
    expect(trace.textContent).toMatch(/upload today's screenshot/);
  });
  it('an account with no rows after its bank check says the balance is the bank’s figure', async () => {
    const h = await render(her());
    expect(h.querySelector('[data-testid="trace-a-7206"]').textContent).toMatch(/No rows after the bank check on 2026-11-09; the balance is the bank's figure/);
  });
  it('PROVEN TO CATCH: without the data prop no trace is drawn, and without handlers no reserve editor is drawn, while the lines still render', async () => {
    const data = her();
    const result = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal' });
    const extra = extraDebtCapacity(data, { currentDate: TODAY, period: '14d', scope: 'personal' });
    host = document.createElement('div');
    document.body.appendChild(host);
    await act(async () => {
      root = createRoot(host);
      root.render(createElement(MoneyComingUp, { result, extra, show, entities: data.entities, settings: data.moneyPlan.settings }));
    });
    expect(host.querySelector('[data-testid="trace-a-7206"]')).toBeNull();
    expect(host.querySelector('[data-testid="coming-up-reserve-editor"]')).toBeNull();
    expect(host.querySelector('[data-testid="coming-up-next30-value"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="coming-up-reserve-goal-value"]').textContent).toBe('$10,000');
  });
});
