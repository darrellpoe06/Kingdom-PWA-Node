// =============================================================================
// Calendar + calendar-shared — proof for the third monolith extraction
// (hybrid-modular cutover, Stage 3). Pins the behavior the shell relied on so
// the extraction is provably loss-free (DR-0076: verify, don't claim):
//   • lib/calendar-shared: relativeWhen labels, the reminder + category configs.
//   • components/Calendar: renders its four sections from props; the event form
//     exposes every reminder option and event category.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import Calendar from '../components/Calendar.jsx';
import { relativeWhen, REMINDER_OPTIONS, EVENT_CATEGORIES } from '../lib/calendar-shared.js';

describe('calendar-shared — hoisted core helpers/config', () => {
  it('relativeWhen labels future and past relative to now', () => {
    expect(relativeWhen(new Date(Date.now() + 30 * 60000))).toBe('in 30m');
    expect(relativeWhen(new Date(Date.now() + 2 * 3600000))).toBe('in 2h');
    expect(relativeWhen(new Date(Date.now() - 3 * 3600000))).toBe('3h ago');
  });
  it('REMINDER_OPTIONS carries the nine offset choices', () => {
    expect(REMINDER_OPTIONS).toHaveLength(9);
    expect(REMINDER_OPTIONS.map(o => o.key)).toContain('1d-before');
  });
  it('EVENT_CATEGORIES includes the expected categories', () => {
    expect(EVENT_CATEGORIES).toContain('church');
    expect(EVENT_CATEGORIES).toContain('appointment');
  });
});

let container, root;
const minimalData = { taxCalendar: [], recurringObligations: [], incidents: [], contractors1099: [] };
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Calendar, props));
  });
}
const findButton = (re) =>
  [...document.body.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
async function click(el) { await act(async () => { el.click(); }); }
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('Calendar — renders its sections from props', () => {
  const baseProps = {
    data: minimalData, reserves: {}, addRecurring: () => {}, addIncident: () => {},
    addEvent: () => {}, completeEvent: () => {}, deleteRecurring: () => {},
    deleteIncident: () => {}, deleteEvent: () => {}, updateRecurring: () => {},
    updateEvent: () => {}, notifPermission: 'default', requestNotif: () => {},
    upcomingEvents: [],
  };

  it('shows the four calendar sections', async () => {
    await mount(baseProps);
    expect(container.textContent).toContain('Recurring Obligations');
    expect(container.textContent).toContain('Incident Log');
    expect(container.textContent).toContain('Events');
    expect(container.textContent).toContain('Tax & Compliance Calendar');
  });

  it('event form exposes the reminder options and event categories', async () => {
    await mount(baseProps);
    const addEvent = findButton(/\+ Add event/);
    expect(addEvent).toBeTruthy();
    await click(addEvent);
    // reminder option labels (from REMINDER_OPTIONS)
    expect(container.textContent).toContain('At event time');
    expect(container.textContent).toContain('1 day before');
    // event category <option>s (from EVENT_CATEGORIES)
    const options = [...container.querySelectorAll('option')].map(o => o.value);
    expect(options).toContain('appointment');
    expect(options).toContain('church');
  });
});

// Review fixes (2026-07-18): the preloaded tax calendar now carries all four
// quarterly estimated-tax dates (was missing 3 of 4 — ANXIETY-CLARITY), and the
// create forms no longer no-op silently.
import { TAX_CALENDAR_SEED } from '../lib/tax-calendar-seed.js';

describe('tax-calendar-seed — all four quarterly estimated-tax dates are preloaded', () => {
  it('carries Q1-Q4 (1040-ES) so a busy parent is not forced to know them', () => {
    const ids = TAX_CALENDAR_SEED.map(t => t.id);
    expect(ids).toContain('tx-est-q1');
    expect(ids).toContain('tx-est-q2');
    expect(ids).toContain('tx-est-q3');
    expect(ids).toContain('tx-est-q4-prior');
  });
  it('does not state a stale 1099 threshold ($600 only) — the copy is year-aware', () => {
    const nec = TAX_CALENDAR_SEED.find(t => t.id === 'tx-1099-nec');
    expect(nec.desc).toContain('2,000'); // names the 2026 figure, not just $600
  });
});

describe('Calendar — create forms surface WHY nothing happened (no silent no-op)', () => {
  const baseProps = {
    data: minimalData, reserves: {}, addRecurring: () => {}, addIncident: () => {},
    addEvent: () => {}, completeEvent: () => {}, deleteRecurring: () => {},
    deleteIncident: () => {}, deleteEvent: () => {}, updateRecurring: () => {},
    updateEvent: () => {}, notifPermission: 'default', requestNotif: () => {},
    upcomingEvents: [],
  };
  it('adding a recurring obligation with no amount alerts instead of silently doing nothing', async () => {
    let added = 0; const alerts = [];
    const orig = globalThis.alert; globalThis.alert = (m) => alerts.push(m);
    try {
      await mount({ ...baseProps, addRecurring: () => { added += 1; } });
      const addToggle = findButton(/\+ Add/);
      await click(addToggle);
      const submit = findButton(/^Add$/);
      await click(submit); // name + amount blank
      expect(added).toBe(0);            // NOT silently added
      expect(alerts.length).toBeGreaterThan(0); // a reason was surfaced
    } finally { globalThis.alert = orig; }
  });
});
