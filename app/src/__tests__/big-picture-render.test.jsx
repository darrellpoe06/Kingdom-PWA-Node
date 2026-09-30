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

  // Darrell 2026-09-11: "dashboard debt tracker all subtabs!!!!!!!" — Now was a
  // 265-line read-down, so it carries a third row (SectionTabs variant="sub").
  // The capacity meter therefore lives in its own lazily-mounted panel: this
  // test OPENS it before asserting, because the strip's "Capacity" LABEL would
  // otherwise satisfy a /capacity/i match with the meter nowhere on the page.
  function openSub(label) {
    const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => b.textContent.trim() === label);
    if (!tab) throw new Error(`no tab "${label}" — tabs: ${[...container.querySelectorAll('[role="tab"]')].map((b) => b.textContent.trim()).join(', ')}`);
    act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  }

  it('Now carries a third row, so neither half is a long read-down', () => {
    mount({ welcomeDismissed: true });
    const labels = [...container.querySelectorAll('[role="tab"]')].map((b) => b.textContent.trim());
    expect(labels).toContain('What needs you');
    expect(labels).toContain('Capacity');
    // The Action Queue opens by default — it is what "Now" means.
    expect(container.textContent).toMatch(/Action Queue/i);
  });

  it('capacity meter reads from real project + skill-profile hours', () => {
    mount({
      welcomeDismissed: true,
      projects: [{ id: 'p1', title: 'Deck rebuild', status: 'active', hoursPerWeek: 10, startDate: '2026-06-01', endDate: '2026-08-01' }],
      skillProfiles: [{ id: 's1', person: 'Adam', hoursPerWeek: 20 }],
    });
    openSub('Capacity');
    // The METER, not the tab label: the heading, the hrs/wk read-out and the
    // real numbers computed from the rows above.
    expect(container.textContent).toMatch(/Family Capacity/i);
    expect(container.textContent).toMatch(/hrs\/wk/);
    expect(container.textContent).toMatch(/10 \/ 20/);
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
  });

  // DR-0690 — Darrell 2026-09-30, over a phone screenshot of an EMPTY Capacity
  // tab: "Capacity workflows work?" The tab must never be blank: each state
  // below says what it measures, what is missing, and traces its number to
  // real project rows. Reverting CapacityPanel to the old conditional meter
  // fails the two empty-state tests (nothing renders under the tab).
  const PROJECTS = [
    { id: 'p1', title: 'Deck rebuild', status: 'active', hoursPerWeek: 10 },
    { id: 'p2', title: 'Rental turnover', status: 'planning', hoursPerWeek: 6 },
    { id: 'p3', title: 'Old job', status: 'complete', hoursPerWeek: 40 },
    { id: 'p4', title: 'Idea parked', status: 'tbd', hoursPerWeek: 8 },
    { id: 'p5', title: 'No hours yet', status: 'active' },
  ];
  const panel = () => container.querySelector('section[aria-labelledby="capacity-h"]');

  it('no skill profiles: the tab says capacity is not checked, shows committed hours from real rows, and links to where hours are set', () => {
    const views = [];
    mount({ welcomeDismissed: true, projects: PROJECTS, skillProfiles: [], setView: (v) => views.push(v) });
    openSub('Capacity');
    const p = panel();
    expect(p).toBeTruthy();
    expect(p.getAttribute('data-capacity-state')).toBe('no-profiles');
    const t = p.textContent;
    expect(t).toMatch(/weekly hours are set yet, so capacity isn't being checked/);
    expect(t).toMatch(/What it measures/);
    // 10 + 6 from active/planning; complete (40) and tbd (8) do not count.
    expect(t).toMatch(/16hrs\/wk committed/);
    expect(t).toMatch(/Deck rebuild/);
    expect(t).toMatch(/Rental turnover/);
    expect(t).not.toMatch(/Old job/);
    expect(t).not.toMatch(/Idea parked/);
    expect(t).toMatch(/1 active project has no hrs\/wk set/);
    expect(t).toMatch(/Action Queue/);
    expect(p.querySelector('[role="progressbar"]')).toBeNull();
    const btn = [...p.querySelectorAll('button')].find((b) => /Set weekly hours/.test(b.textContent));
    expect(btn).toBeTruthy();
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(views).toEqual(['opportunities']);
  });

  it('profiles with zero hours: says which is missing instead of painting 0%', () => {
    mount({ welcomeDismissed: true, projects: PROJECTS, skillProfiles: [{ id: 's1', name: 'Adam', hoursPerWeek: 0 }, { id: 's2', name: 'Eve', hoursPerWeek: '' }] });
    openSub('Capacity');
    const p = panel();
    expect(p).toBeTruthy();
    expect(p.getAttribute('data-capacity-state')).toBe('no-hours');
    expect(p.textContent).toMatch(/2 skill profiles exist, but none has weekly hours set/);
    expect(p.textContent).not.toMatch(/0%/);
    expect(p.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('with hours set: keeps the meter and lists the projects the number is summed from, largest first', () => {
    mount({ welcomeDismissed: true, projects: PROJECTS, skillProfiles: [{ id: 's1', name: 'Adam', hoursPerWeek: 20 }] });
    openSub('Capacity');
    const p = panel();
    expect(p.getAttribute('data-capacity-state')).toBe('measured');
    expect(p.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('80');
    expect(p.textContent).toMatch(/16 \/ 20 hrs\/wk/);
    const rows = [...p.querySelectorAll('[data-testid="capacity-contributors"] li')].map((li) => li.textContent);
    expect(rows).toEqual(['Deck rebuild10 hrs/wk', 'Rental turnover6 hrs/wk']);
    expect(p.textContent).not.toMatch(/Tenant-as-Project/);
  });
});
