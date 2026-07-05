// =============================================================================
// BigPictureDashboard — extraction parity proof (Verification Doctrine).
// =============================================================================
// The Overview surface moved WHOLE out of the monolith shell into
// components/BigPictureDashboard.jsx (2026-07-03 modularization lane, second
// extraction). These renders prove the moved module still delivers the
// overview's load-bearing sections with the same behavior: the CompactHero
// strip (net cash flow / debt free / rentals free), the Action Queue with the
// ITSM urgency bands and manual add, the family capacity meter, and the
// welcome panel with its dismiss action. A cut section = a failed test.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BigPictureDashboard } from '../components/BigPictureDashboard.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const noop = () => {};
const baseProps = {
  data: { debts: [], accounts: [], transactions: [] },
  totals: { netCashFlow: 2500, totalDebt: 10000, collectionRate: 0.97, monthlyIn: 9000, monthlyOut: 6500 },
  pressure: 3,
  setPressure: noop,
  pressureCalc: { extraToDebt: 300 },
  projection: { debtFreeDate: 'Mar 2029', debtFreeYears: 2.7, interestSaved: 4200, monthsSaved: 14 },
  rentalSnowball: { allClearedDate: 'Jun 2033', allClearedYears: 7.0, order: [] },
  flaggedRentals: [],
  flaggedOpportunities: [],
  entityRollups: [],
  reserves: { recurringMonthly: 0, taxMonthly: 0, incidentMonthly: 0, totalMonthly: 0 },
  upcomingEvents: [],
  welcomeDismissed: false,
  dismissWelcome: noop,
  setView: noop,
  setFeedbackOpen: noop,
  snowballExtra: 0,
  bufferTarget: 5000,
  bufferCurrent: 1200,
  capexItems: [],
  watchlist: [],
  rentals: [],
  incidents: [],
  projects: [],
  resolveIncident: noop,
  skillProfiles: [],
  addIncident: noop,
  addProject: noop,
  entities: [],
  ingestData: null,
  setBooksView: null,
  contractors: [],
  workerOps: {},
  lifePhotos: [],
  addLifePhotos: noop,
  updateLifePhoto: noop,
  deleteLifePhoto: noop,
};

const mount = (props = {}) =>
  act(() => root.render(createElement(BigPictureDashboard, { ...baseProps, ...props })));

describe('BigPictureDashboard — the overview survived the extraction', () => {
  it('renders the hero strip from real prop values', () => {
    mount();
    // The overview is now a set of sliding SectionTabs; the hero strip lives in
    // the "Money" tab. Slide to it before asserting (only the active panel mounts).
    const moneyTab = [...container.querySelectorAll('[role="tab"]')].find((b) => /Money/i.test(b.textContent));
    expect(moneyTab).toBeTruthy();
    act(() => moneyTab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const text = container.textContent;
    expect(text).toMatch(/Net cash flow/i);
    expect(text).toMatch(/Consumer debt free/i);
    expect(text).toMatch(/Mar 2029/);
    expect(text).toMatch(/Rentals owned free/i);
    expect(text).toMatch(/Jun 2033/);
  });

  it('renders the Action Queue and opens the manual add form with the urgency bands', () => {
    mount();
    const addBtn = [...container.querySelectorAll('button')].find((b) => /add item/i.test(b.textContent));
    expect(addBtn).toBeTruthy();
    act(() => addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const text = container.textContent;
    // the ITSM taxonomy is the queue's spine — all three bands offered
    expect(text).toMatch(/Change/);
    expect(text).toMatch(/Incident/);
    expect(text).toMatch(/Project/);
  });

  it('shows open incidents as queue rows with overdue marking', () => {
    mount({
      incidents: [{
        id: 'i1', date: '2026-06-20', dueDate: '2026-06-23', status: 'open',
        urgency: 'incident', description: 'Water heater leaking', amount: 250, entityId: 'e-personal',
      }],
    });
    const text = container.textContent;
    expect(text).toMatch(/Water heater leaking/);
    expect(text).toMatch(/overdue/i); // due 2026-06-23 is past
  });

  it('welcome panel renders when not dismissed, and its dismiss fires', () => {
    let dismissed = 0;
    mount({ dismissWelcome: () => { dismissed += 1; } });
    expect(container.textContent).toMatch(/Things to try/i);
    // The tour list's icons are bundled SVGs, not device emoji (consistency
    // guard): each of the 7 tour cards renders an inline <svg> in its icon slot.
    const iconSlots = [...container.querySelectorAll('span.text-base')].filter((s) => s.querySelector('svg'));
    expect(iconSlots.length).toBeGreaterThanOrEqual(7);
    for (const slot of iconSlots) expect(/[\u{1F300}-\u{1FAFF}]/u.test(slot.textContent)).toBe(false);
    const btn = [...container.querySelectorAll('button')].find((b) => /Got it/i.test(b.textContent));
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(dismissed).toBe(1);
  });

  it('welcome panel does NOT render once dismissed', () => {
    mount({ welcomeDismissed: true });
    expect(container.textContent).not.toMatch(/Things to try/i);
  });

  it('capacity meter reads from real project + skill-profile hours', () => {
    mount({
      projects: [{ id: 'p1', title: 'Deck rebuild', status: 'active', hoursPerWeek: 10, startDate: '2026-06-01', endDate: '2026-08-01' }],
      skillProfiles: [{ id: 's1', person: 'Adam', hoursPerWeek: 20 }],
    });
    expect(container.textContent).toMatch(/capacity/i);
    expect(container.textContent).toMatch(/10/);
  });
});

describe('Money tab reconciliation note — orphaned inflow is named, never silent (2026-07-05)', () => {
  const openMoney = () => {
    const moneyTab = [...container.querySelectorAll('[role="tab"]')].find((b) => /Money/i.test(b.textContent));
    act(() => moneyTab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  };

  it('renders the why + the fix path when inflow rows point at entities that do not exist', () => {
    mount({
      welcomeDismissed: true,
      entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
      data: {
        debts: [], accounts: [], transactions: [],
        inflows: {
          // The incident row: demo-residue salary tagged to the demo-only
          // entity — counts in Net cash flow, shows on no entity card.
          salaries: [{ id: 'sal-1', source: 'Primary salary', actual: 3200, entityId: 'e-family' }],
          rentals: [],
        },
      },
    });
    openMoney();
    expect(container.textContent).toMatch(/don't reconcile/i);
    expect(container.textContent).toMatch(/\$3,200/);
    expect(container.textContent).toMatch(/Books → Entities/);
  });

  it('does not render when every inflow row resolves to a real entity', () => {
    mount({
      welcomeDismissed: true,
      entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
      data: {
        debts: [], accounts: [], transactions: [],
        inflows: { salaries: [{ id: 's1', source: 'Salary', actual: 4200, entityId: 'e-personal' }], rentals: [] },
      },
    });
    openMoney();
    expect(container.textContent).not.toMatch(/don't reconcile/i);
  });
});
